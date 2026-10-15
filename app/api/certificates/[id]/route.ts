import {principal,db,bucket,failure,ApiError} from '@/lib/portal-server';
export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){try{
  const p=await principal();const {id}=await params;if(p.role==='pending')throw new ApiError(403,'Seu acesso ainda não foi vinculado a um cliente.');
  const cert=await db().prepare('SELECT c.object_key,c.number,e.company_id FROM certificates c JOIN equipment e ON e.id=c.equipment_id WHERE c.id=?').bind(id).first<{object_key:string,number:string,company_id:string}>();if(!cert||(p.role!=='admin'&&cert.company_id!==p.companyId))throw new ApiError(404,'Certificado não encontrado.');
  const object=await bucket().get(cert.object_key);if(!object)throw new ApiError(404,'O arquivo não está disponível. Contate a Central Brasil.');const disposition=new URL(req.url).searchParams.get('download')==='1'?'attachment':'inline';
  return new Response(object.body,{headers:{'Content-Type':'application/pdf','Content-Disposition':`${disposition}; filename="certificado-${cert.number.replace(/[^a-zA-Z0-9_-]/g,'_')}.pdf"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"sandbox; default-src 'none'; frame-ancestors 'self'"}});
}catch(e){return failure(e);}}
