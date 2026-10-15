import { requireChatGPTUser } from './chatgpt-auth';
import Portal from './portal';
export const dynamic = 'force-dynamic';
export default async function Home() {
  const user = await requireChatGPTUser('/');
  return <Portal user={{name: user.fullName || 'Minha conta', email: user.email}} />;
}
