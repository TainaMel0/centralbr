import {readJson,principal,db,field,hash,mutationGuard,response,failure,ApiError} from '@/lib/portal-server';
export async function POST(req:Request){try{
  mutationGuard(req);const p=await principal();if(p.role==='admin')throw new ApiError(400,'Você já administra este portal.');const data=await readJson(req);const digest=await hash(field(data.code,'código de acesso',150));const now=new Date().toISOString();
  const result=await db().batch([
    db().prepare('UPDATE invitations SET used_by=? WHERE token_hash=? AND expires_at>? AND (used_by IS NULL OR used_by=?)').bind(p.userId,digest,now,p.userId),
    db().prepare('INSERT INTO members (user_id,company_id,name,email) SELECT ?,company_id,?,? FROM invitations WHERE token_hash=? AND used_by=? AND expires_at>? ON CONFLICT(user_id) DO UPDATE SET company_id=excluded.company_id,name=excluded.name,email=excluded.email').bind(p.userId,p.fullName||p.displayName,p.email,digest,p.userId,now),
  ]);if(!result[1].meta.changes)throw new ApiError(400,'Código inválido, expirado ou já utilizado. Solicite um novo à Central Brasil.');return response({ok:true});
}catch(e){return failure(e);}}
