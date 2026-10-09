export type Company = { id: string; name: string; cnpj: string; contact: string };
export type Equipment = { id: string; companyId: string; name: string; category: string; brand: string; model: string; serial: string; tag: string; location: string };
export type Certificate = { id: string; equipmentId: string; number: string; calibratedAt: string; nextAt: string; notes: string; fileName: string; createdAt: string };
export type Member = { userId: string; companyId: string; name: string; email: string };
export type PortalData = { role: 'admin' | 'client' | 'pending'; companies: Company[]; equipment: Equipment[]; certificates: Certificate[]; members: Member[] };
export const categories = ['Detector de gás', 'Bafômetro', 'Termômetro', 'Dosímetro', 'Sonômetro', 'Dinamômetro', 'Outros'];
export const emptyData: PortalData = {role:'pending',companies:[],equipment:[],certificates:[],members:[]};
export const today = () => new Date().toISOString().slice(0,10);
export const dateLabel = (value: string) => value ? new Date(value+'T12:00:00Z').toLocaleDateString('pt-BR',{timeZone:'UTC'}) : 'Não informada';
export const daysUntil = (value: string, base = today()) => Math.ceil((Date.parse(value+'T12:00:00Z') - Date.parse(base+'T12:00:00Z')) / 86400000);
export function statusFor(cert?: Certificate) {
  if(!cert) return {key:'none',label:'Sem certificado',tone:'neutral'};
  if(!cert.nextAt) return {key:'unscheduled',label:'Sem programação',tone:'neutral'};
  const days = daysUntil(cert.nextAt);
  if(days < 0) return {key:'overdue',label:'Pendente',tone:'red'};
  if(days <= 30) return {key:'soon',label:'Em até 30 dias',tone:'amber'};
  return {key:'ok',label:'Em dia',tone:'green'};
}
export function latestFor(id: string, certificates: Certificate[]) {
  return certificates.filter(c=>c.equipmentId===id).sort((a,b)=>b.calibratedAt.localeCompare(a.calibratedAt)||b.createdAt.localeCompare(a.createdAt))[0];
}
export function normalize(value: string) {return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();}
export function makeDemo(): PortalData {
  const date = (offset: number) => new Date(Date.now()+offset*86400000).toISOString().slice(0,10);
  const equipment: Equipment[] = [
    ['gas-01','Detector multigás','Detector de gás','MSA','ALTAIR 4XR','DG-240187','SEG-001','Unidade industrial'],
    ['baf-01','Bafômetro digital','Bafômetro','Central Brasil','CB Digital','BA-230452','SEG-002','Portaria principal'],
    ['ter-01','Termômetro infravermelho','Termômetro','Fluke','62 MAX','TI-250089','LAB-003','Laboratório'],
    ['dos-01','Dosímetro de ruído','Dosímetro','Instrutherm','DOS-600','DR-220316','HIG-004','Higiene ocupacional'],
    ['gas-02','Detector de gás portátil','Detector de gás','Honeywell','BW MicroClip','DG-240291','SEG-005','Unidade industrial'],
    ['son-01','Medidor de nível sonoro','Sonômetro','Instrutherm','DEC-500','SN-230128','HIG-006','Higiene ocupacional'],
    ['din-01','Dinamômetro digital','Dinamômetro','Ancoseg','3 toneladas','DN-240067','MAN-007','Manutenção'],
    ['ter-02','Termômetro de contato','Termômetro','Minipa','MT-525','TC-230654','LAB-008','Laboratório'],
  ].map(([id,name,category,brand,model,serial,tag,location])=>({id,companyId:'demo',name,category,brand,model,serial,tag,location}));
  const next = [220,12,310,-8,25,18,160,270];
  const certificates: Certificate[] = equipment.map((e,i)=>({id:'demo-'+i,equipmentId:e.id,number:'CB-'+new Date().getUTCFullYear()+'-'+String(1842-i*17).padStart(5,'0'),calibratedAt:date(next[i]-365),nextAt:date(next[i]),notes:'Registro fictício para demonstração. A próxima calibração segue a programação informada pelo cliente.',fileName:'demonstracao.pdf',createdAt:date(next[i]-365)}));
  equipment.slice(0,4).forEach((e,i)=>certificates.push({id:'demo-history-'+i,equipmentId:e.id,number:'CB-'+(new Date().getUTCFullYear()-1)+'-'+String(918+i*13).padStart(5,'0'),calibratedAt:date(next[i]-730),nextAt:date(next[i]-365),notes:'Histórico fictício para demonstração.',fileName:'demonstracao.pdf',createdAt:date(next[i]-730)}));
  return {role:'admin',companies:[{id:'demo',name:'Indústria Exemplo',cnpj:'Empresa de demonstração',contact:''}],equipment,certificates,members:[]};
}
