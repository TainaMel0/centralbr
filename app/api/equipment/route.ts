import {readJson,admin,db,field,mutationGuard,response,failure,ApiError} from '@/lib/portal-server';
import {categories} from '@/lib/portal-shared';
export async function POST(req:Request){try{
  mutationGuard(req);await admin();const data=await readJson(req);const companyId=field(data.companyId,'cliente',100);if(!await db().prepare('SELECT id FROM companies WHERE id=?').bind(companyId).first())throw new ApiError(400,'Selecione um cliente cadastrado.');
  const values=[field(data.name,'equipamento'),field(data.category,'categoria'),field(data.brand??'','marca',100,false),field(data.model??'','modelo',100,false),field(data.serial,'número de série',100),field(data.tag??'','patrimônio',100,false),field(data.location??'','localização',200,false)];
  if(!categories.includes(values[1]))throw new ApiError(400,'Selecione uma categoria válida.');
  const id=crypto.randomUUID();await db().prepare('INSERT INTO equipment (id,company_id,name,category,brand,model,serial,tag,location) VALUES (?,?,?,?,?,?,?,?,?)').bind(id,companyId,...values).run();return response({id},201);
}catch(e){return failure(e);}}
