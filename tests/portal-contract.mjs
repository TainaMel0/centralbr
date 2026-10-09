import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import ts from 'typescript';

// Exercise the real request handlers against SQLite and a temporary object store.
// No production data, server, authentication provider or browser is contacted.
const sqlite=new DatabaseSync(':memory:');
sqlite.exec(fs.readFileSync('drizzle/0000_flowery_stranger.sql','utf8'));
sqlite.exec('PRAGMA foreign_keys=ON');
const blobs=new Map();let currentUser=null;
const makeStatement=(sql,values=[])=>({
  bind(...args){return makeStatement(sql,args);},
  async first(){return sqlite.prepare(sql).get(...values)||null;},
  async run(){const result=sqlite.prepare(sql).run(...values);return {success:true,meta:{changes:Number(result.changes)}};},
  execute(){if(/^\s*SELECT/i.test(sql))return {results:sqlite.prepare(sql).all(...values),meta:{changes:0}};const result=sqlite.prepare(sql).run(...values);return {results:[],meta:{changes:Number(result.changes)}};}
});
const env={DB:{prepare:sql=>makeStatement(sql),async batch(statements){sqlite.exec('BEGIN');try{const results=statements.map(s=>s.execute());sqlite.exec('COMMIT');return results;}catch(e){sqlite.exec('ROLLBACK');throw e;}}},BUCKET:{async put(key,bytes){blobs.set(key,bytes);},async get(key){return blobs.has(key)?{body:blobs.get(key)}:null;},async delete(key){blobs.delete(key);}}};
const modules=new Map();
function load(file){
  file=path.resolve(file);if(modules.has(file))return modules.get(file);
  const source=fs.readFileSync(file,'utf8');const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  const module={exports:{}};
  const require=(name)=>{if(name==='cloudflare:workers')return {env};if(name==='@/app/chatgpt-auth')return {getChatGPTUser:async()=>currentUser};if(name.startsWith('@/'))return load(name.slice(2)+'.ts');if(name.startsWith('.'))return load(path.join(path.dirname(file),name)+'.ts');throw Error('Unexpected dependency '+name);};
  new Function('require','module','exports',compiled)(require,module,module.exports);modules.set(file,module.exports);return module.exports;
}
const shared=load('lib/portal-shared.ts');
const route=name=>load(`app/api/${name}/route.ts`);
const user=id=>({userId:id,email:`${id}@example.test`,fullName:id,displayName:id});
const request=(body,method='POST',origin='https://portal.example')=>new Request('https://portal.example/api/test',{method,headers:{'content-type':'application/json',origin},body:JSON.stringify(body)});
const responseBody=async(response,status=200)=>{assert.equal(response.status,status,await response.clone().text());return response.json();};
let checked=0;function check(name){checked++;process.stdout.write(`PASS ${name}\n`);}

await responseBody(await route('portal').GET(),401);assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM portal_owner').get().count,0);check('Anonymous visitors cannot read or become administrator');
currentUser=user('owner');const initial=await responseBody(await route('portal').GET());assert.equal(initial.role,'admin');check('Initial private owner can administer the portal');
const first=await responseBody(await route('companies').POST(request({name:'Client A',cnpj:'A',contact:''})),201);
const second=await responseBody(await route('companies').POST(request({name:'Client B',cnpj:'B',contact:''})),201);
const createEquipment=companyId=>route('equipment').POST(request({companyId,name:'Detector de gás',category:'Detector de gás',brand:'Test',model:'Model',serial:'SERIAL-001',tag:'EQ-1',location:'Lab'}));
const equipA=await responseBody(await createEquipment(first.id),201);const equipB=await responseBody(await createEquipment(second.id),201);check('Same serial can exist in different clients without merging histories');
await responseBody(await createEquipment(first.id),409);check('Duplicate equipment serial is rejected within one client');
await responseBody(await route('companies').POST(request(null)),400);check('Malformed request data returns a recoverable validation error');
await responseBody(await route('companies').POST(request({name:'Cross-site',cnpj:'',contact:''},'POST','https://other.example')),403);check('Cross-origin writes are refused');

// Derive the demo PDF from the actual UI function and validate the PDF structure.
const parsed=ts.createSourceFile('portal.tsx',fs.readFileSync('app/portal.tsx','utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const pdfFunction=parsed.statements.find(s=>ts.isFunctionDeclaration(s)&&s.name?.text==='demoPDF');
const pdfCompiled=ts.transpileModule(pdfFunction.getText(parsed),{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
const pdfGenerator=new Function('dateLabel',pdfCompiled+'; return demoPDF;')(shared.dateLabel);
const demo=shared.makeDemo();const sample=pdfGenerator(demo.certificates[0],demo.equipment[0]);
const pdfText=await sample.text();assert.ok(pdfText.startsWith('%PDF-1.4'));assert.ok(pdfText.includes('SEM VALIDADE METROLOGICA'));const xref=Number(pdfText.match(/startxref\n(\d+)/)[1]);assert.equal(pdfText.slice(xref,xref+4),'xref');check('Demo PDF is structurally valid and explicitly not a metrological certificate');
const upload=async(equipmentId,number,calibratedAt='2026-01-01',nextAt='2027-01-01',file=sample)=>{
  const form=new FormData();form.set('equipmentId',equipmentId);form.set('number',number);form.set('calibratedAt',calibratedAt);form.set('nextAt',nextAt);form.set('notes','Uploaded original');form.set('file',new File([file],'original.pdf',{type:'application/pdf'}));
  return route('certificates').POST(new Request('https://portal.example/api/certificates',{method:'POST',headers:{origin:'https://portal.example'},body:form}));
};
const certA=await responseBody(await upload(equipA.id,'A-2026'),201);const certB=await responseBody(await upload(equipB.id,'B-2026'),201);await responseBody(await upload(equipA.id,'A-2025','2025-01-01','2026-01-01'),201);assert.equal(blobs.size,3);check('PDF bytes and metadata persist with multiple years on the same equipment');
await responseBody(await upload(equipA.id,'INVALID-PDF','2026-01-01','2027-01-01',new Blob(['bad data'])),400);
await responseBody(await upload(equipA.id,'INVALID-DATE','2026-02-30','2027-01-01'),400);
await responseBody(await upload(equipA.id,'FUTURE','2099-01-01','2100-01-01'),400);
await responseBody(await upload(equipA.id,'REVERSED','2026-01-01','2025-01-01'),400);check('Non-PDF files and invalid calibration dates are rejected');
await responseBody(await upload(equipA.id,'A-2026'),409);assert.equal(blobs.size,3);check('Failed duplicate certificate uploads leave no orphan files');
const invitationA=await responseBody(await route('invitations').POST(request({companyId:first.id})));const invitationB=await responseBody(await route('invitations').POST(request({companyId:second.id})));
currentUser=user('client-a');assert.equal((await responseBody(await route('portal').GET())).role,'pending');await responseBody(await route('access').POST(request({code:invitationA.code})));
const clientA=await responseBody(await route('portal').GET());assert.equal(clientA.role,'client');assert.deepEqual(clientA.companies.map(c=>c.id),[first.id]);assert.deepEqual(clientA.equipment.map(e=>e.id),[equipA.id]);assert.equal(clientA.certificates.length,2);check('Client A sees only its company, equipment and certificate history');
await responseBody(await route('companies').POST(request({name:'Unauthorized',cnpj:'',contact:''})),403);await responseBody(await route('equipment').POST(request({})),403);await responseBody(await route('certificates').POST(request({})),403);await responseBody(await route('invitations').POST(request({companyId:first.id})),403);await responseBody(await route('members').DELETE(request({userId:'owner'},'DELETE')),403);check('Clients cannot use administrative write endpoints');
const getPdf=id=>route('certificates/[id]').GET(new Request(`https://portal.example/api/certificates/${id}`),{params:Promise.resolve({id})});
const ownPdf=await getPdf(certA.id);assert.equal(ownPdf.status,200);assert.equal(ownPdf.headers.get('Cache-Control'),'private, no-store');assert.deepEqual(new Uint8Array(await ownPdf.arrayBuffer()),new Uint8Array(await sample.arrayBuffer()));await responseBody(await getPdf(certB.id),404);check('Direct PDF requests enforce tenant ownership and preserve original bytes');
currentUser=user('client-b');await responseBody(await route('access').POST(request({code:invitationA.code})),400);await responseBody(await route('access').POST(request({code:invitationB.code})));const clientB=await responseBody(await route('portal').GET());assert.deepEqual(clientB.companies.map(c=>c.id),[second.id]);assert.equal(clientB.certificates.length,1);check('Access codes are single-use and client B remains isolated');
currentUser=user('owner');await responseBody(await route('members').DELETE(request({userId:'client-a'},'DELETE')));currentUser=user('client-a');assert.equal((await responseBody(await route('portal').GET())).role,'pending');await responseBody(await getPdf(certA.id),403);await responseBody(await route('access').POST(request({code:invitationA.code})),400);check('Revoked accounts lose document access and cannot reuse their old code');
currentUser=user('owner');const expired=await responseBody(await route('invitations').POST(request({companyId:first.id})));sqlite.prepare('UPDATE invitations SET expires_at=? WHERE used_by IS NULL').run('2000-01-01T00:00:00.000Z');currentUser=user('new-client');await responseBody(await route('access').POST(request({code:expired.code})),400);check('Expired codes cannot grant access');
const newest=shared.latestFor(demo.equipment[0].id,demo.certificates);assert.equal(newest.id,demo.certificates[0].id);assert.equal(shared.statusFor(newest).key,'ok');assert.equal(demo.equipment.filter(e=>shared.statusFor(shared.latestFor(e.id,demo.certificates)).key==='soon').length,3);assert.equal(demo.equipment.filter(e=>shared.statusFor(shared.latestFor(e.id,demo.certificates)).key==='overdue').length,1);check('Calibration notices use latest equipment records, not superseded certificates');
const ownerRecords=sqlite.prepare('SELECT user_id FROM portal_owner').all();assert.deepEqual(ownerRecords.map(r=>r.user_id),['owner']);check('Subsequent visitors never replace the private owner');
sqlite.close();process.stdout.write(`${checked} contract checks passed.\n`);
