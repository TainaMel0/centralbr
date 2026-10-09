import {readJson,admin,db,field,hash,mutationGuard,response,failure,ApiError} from '@/lib/portal-server';
export async function POST(req:Request){try{
  mutationGuard(req);await admin();const data=await readJson(req);const companyId=field(data.companyId,'cliente',100);if(!await db().prepare('SELECT id FROM companies WHERE id=?').bind(companyId).first())throw new ApiError(404,'Cliente não encontrado.');const token=crypto.randomUUID()+crypto.randomUUID();const expiresAt=new Date(Date.now()+7*86400000).toISOString();
  await db().prepare('INSERT INTO invitations (token_hash,company_id,expires_at) VALUES (?,?,?)').bind(await hash(token),companyId,expiresAt).run();return response({code:token,expiresAt});
}catch(e){return failure(e);}}
