import {getPortal,response,failure} from '@/lib/portal-server';
export const dynamic='force-dynamic';
export async function GET(){try{return response(await getPortal());}catch(e){return failure(e);}}
