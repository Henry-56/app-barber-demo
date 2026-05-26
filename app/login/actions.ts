'use server';

import { signIn } from '@/src/lib/auth';
import { AuthError } from 'next-auth';

export async function loginAction(_: { error: string } | undefined, formData: FormData): Promise<{ error: string } | undefined> {
  try {
    await signIn('credentials', {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      redirectTo: '/dashboard',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'Email o contraseña incorrectos' };
    }
    // NEXT_REDIRECT — dejar pasar (es la redirección correcta)
    throw error;
  }
}
