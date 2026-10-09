import {admin,db,bucket,field,validDate,mutationGuard,response,failure,ApiError} from '@/lib/portal-server';
import {today} from '@/lib/portal-shared';
export async function POST(req:Request){try{
  mutationGuard(req);await admin();if(Number(req.headers.get('content-length')||0)>11*1024*1024)throw new ApiError(413,'O PDF deve ter até 10 MB.');
  const data=await req.formData();const equipmentId=field(data.get('equipmentId'),'equipamento',100);const number=field(data.get('number'),'número do certificado',80);const calibratedAt=validDate(data.get('calibratedAt'),'calibração');const nextAt=validDate(data.get('nextAt')||'','próxima calibração',false);const notes=field(data.get('notes')||'','observações',2000,false);
  if(calibratedAt>today())throw new ApiError(400,'A calibração não pode estar no futuro.');if(nextAt&&nextAt<=calibratedAt)throw new ApiError(400,'A próxima calibração deve ser posterior à realizada.');
  const equipment=await db().prepare('SELECT id,company_id FROM equipment WHERE id=?').bind(equipmentId).first<{id:string,company_id:string}>();if(!equipment)throw new ApiError(400,'Selecione um equipamento cadastrado.');
  const file=data.get('file');if(!(file instanceof File)||file.size===0||file.size>10*1024*1024)throw new ApiError(400,'Selecione um PDF com até 10 MB.');const buffer=await file.arrayBuffer();if(!new TextDecoder().decode(buffer.slice(0,5)).startsWith('%PDF-'))throw new ApiError(400,'O arquivo selecionado não é um PDF válido.');
  const id=crypto.randomUUID();const key=`certificates/${equipment.company_id}/${id}.pdf`;const filename=file.name.replace(/[\r\n\u0000-\u001f]/g,'').slice(0,200)||'certificado.pdf';
  await bucket().put(key,buffer,{httpMetadata:{contentType:'application/pdf'}});
  try{await db().prepare('INSERT INTO certificates (id,equipment_id,number,calibrated_at,next_at,notes,file_name,object_key,created_at) VALUES (?,?,?,?,?,?,?,?,?)').bind(id,equipmentId,number,calibratedAt,nextAt,notes,filename,key,new Date().toISOString()).run();}catch(e){await bucket().delete(key);throw e;}
  return response({id},201);
}catch(e){return failure(e);}}
