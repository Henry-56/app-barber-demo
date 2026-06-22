import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAdminToken, ADMIN_COOKIE } from '@/src/lib/admin-auth';

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;

  if (!token || !verifyAdminToken(token)) {
    redirect('/admin/login');
  }

  return <>{children}</>;
}
