import {readJson,admin,db,field,mutationGuard,response,failure} from '@/lib/portal-server';
export async function POST(req:Request){try{
  mutationGuard(req);await admin();const data=await readJson(req);const id=crypto.randomUUID();const name=field(data.name,'razão social');const cnpj=field(data.cnpj,'CNPJ / CPF',30,false);const contact=field(data.contact,'contato',200,false);
  await db().prepare('INSERT INTO companies (id,name,cnpj,contact) VALUES (?,?,?,?)').bind(id,name,cnpj,contact).run();return response({id},201);
}catch(e){return failure(e);}}
