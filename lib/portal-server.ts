import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import type {PortalData} from './portal-shared';
export class ApiError extends Error {constructor(public status:number,message:string){super(message);}}
export function db(){if(!env.DB)throw new ApiError(503,'Os dados estão temporariamente indisponíveis. Tente novamente.');return env.DB;}
export function bucket(){if(!env.BUCKET)throw new ApiError(503,'O armazenamento de arquivos está temporariamente indisponível.');return env.BUCKET;}
export async function principal(initialize = false){
  const user=await getChatGPTUser();
  if(!user)throw new ApiError(401,'Entre na sua conta para continuar.');
  // Initial deployment is owner-private. Initialize the immutable owner before changing the platform audience.
  if(initialize)await db().prepare('INSERT OR IGNORE INTO portal_owner (id,user_id) VALUES (1,?)').bind(user.userId).run();
  const owner=await db().prepare('SELECT user_id FROM portal_owner WHERE id=1').first<{user_id:string}>();
  const member=await db().prepare('SELECT company_id FROM members WHERE user_id=?').bind(user.userId).first<{company_id:string}>();
  return {...user,role:owner?.user_id===user.userId?'admin' as const:member?'client' as const:'pending' as const,companyId:member?.company_id};
}
export async function admin(){const p=await principal();if(p.role!=='admin')throw new ApiError(403,'Esta ação é exclusiva da administração.');return p;}
export function mutationGuard(req:Request){const origin=req.headers.get('origin');if((origin&&origin!==new URL(req.url).origin)||req.headers.get('sec-fetch-site')==='cross-site')throw new ApiError(403,'Origem da solicitação não permitida.');}
export async function readJson(req:Request):Promise<Record<string,unknown>>{let value:unknown;try{value=await req.json();}catch{throw new ApiError(400,'Dados inválidos. Confira o formulário.');}if(!value||typeof value!=='object'||Array.isArray(value))throw new ApiError(400,'Dados inválidos. Confira o formulário.');return value as Record<string,unknown>;}
export function response(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
export function failure(err:unknown){
  if(err instanceof ApiError)return response({error:err.message},err.status);
  console.error('Portal request failed',err);
  if(err instanceof Error&&/UNIQUE constraint/i.test(err.message))return response({error:'Já existe um cadastro com esse número. Confira os dados.'},409);
  return response({error:'Não foi possível concluir. Seus dados preenchidos foram preservados; tente novamente.'},503);
}
export function field(value:unknown,label:string,max=200,required=true){if(typeof value!=='string')throw new ApiError(400,`Confira o campo ${label}.`);const text=value.trim();if((required&&!text)||text.length>max)throw new ApiError(400,`Confira o campo ${label}.`);return text;}
export function validDate(value:unknown,label:string,required=true){const text=field(value,label,10,required);if(!text&&!required)return '';if(!/^\d{4}-\d{2}-\d{2}$/.test(text)||!Number.isFinite(Date.parse(text))||new Date(text).toISOString().slice(0,10)!==text)throw new ApiError(400,`Informe uma data válida para ${label}.`);return text;}
export async function hash(value:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(x=>x.toString(16).padStart(2,'0')).join('');}
export async function getPortal():Promise<PortalData>{
  const p=await principal(true);if(p.role==='pending')return {role:p.role,companies:[],equipment:[],certificates:[],members:[]};
  const scoped=(sql:string)=>p.role==='admin'?db().prepare(sql):db().prepare(sql).bind(p.companyId!);
  const result = await env.DB.prepare(query).all() as MyType;
    scoped('SELECT id,name,cnpj,contact FROM companies'+(p.role==='admin'?'':' WHERE id=?')+' ORDER BY name'),
    scoped('SELECT id,company_id AS companyId,name,category,brand,model,serial,tag,location FROM equipment'+(p.role==='admin'?'':' WHERE company_id=?')+' ORDER BY name'),
    scoped('SELECT c.id,c.equipment_id AS equipmentId,c.number,c.calibrated_at AS calibratedAt,c.next_at AS nextAt,c.notes,c.file_name AS fileName,c.created_at AS createdAt FROM certificates c JOIN equipment e ON e.id=c.equipment_id'+(p.role==='admin'?'':' WHERE e.company_id=?')+' ORDER BY c.calibrated_at DESC,c.created_at DESC'),
    p.role==='admin'?db().prepare('SELECT user_id AS userId,company_id AS companyId,name,email FROM members ORDER BY name'):db().prepare('SELECT user_id AS userId,company_id AS companyId,name,email FROM members WHERE user_id=?').bind(p.userId),
  ]);
  return {role:p.role,companies:result[0].results,equipment:result[1].results,certificates:result[2].results,members:result[3].results} as PortalData;
}
