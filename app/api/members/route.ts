import {readJson,admin,db,field,mutationGuard,response,failure} from '@/lib/portal-server';
export async function DELETE(req:Request){try{
  mutationGuard(req);await admin();const data=await readJson(req);const id=field(data.userId,'usuário',200);await db().batch([db().prepare('DELETE FROM invitations WHERE used_by=?').bind(id),db().prepare('DELETE FROM members WHERE user_id=?').bind(id)]);return response({ok:true});
}catch(e){return failure(e);}}
