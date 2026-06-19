import { auth, signOut } from '@/src/lib/auth';
import { redirect } from 'next/navigation';
import { db } from '@/src/lib/drizzle';
import { barbershops } from '@/src/lib/schema';
import { eq } from 'drizzle-orm';
import { Scissors, MessageCircle, LogOut } from 'lucide-react';

export default async function TrialExpiredPage() {
  const session = await auth();
  if (!session?.user?.barbershopId) redirect('/login');

  const [shop] = await db
    .select({
      trialEndsAt: barbershops.trialEndsAt,
      subscriptionStatus: barbershops.subscriptionStatus,
    })
    .from(barbershops)
    .where(eq(barbershops.id, session.user.barbershopId))
    .limit(1);

  if (shop) {
    const isPaid = shop.subscriptionStatus === 'active' || shop.subscriptionStatus === 'paid';
    const trialStillActive = shop.trialEndsAt && new Date(shop.trialEndsAt) > new Date();
    if (isPaid || trialStillActive) redirect('/dashboard');
  }

  const waMessage = encodeURIComponent('Hola, quiero activar mi plan de BarberFlow');

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: '#0a0a0a' }}
    >
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          <div className="p-3 rounded-xl" style={{ backgroundColor: '#C9A84C' }}>
            <Scissors className="w-8 h-8" style={{ color: '#0a0a0a' }} />
          </div>
        </div>

        <div
          className="rounded-2xl p-8"
          style={{ backgroundColor: '#161616', border: '1px solid #2a2a2a' }}
        >
          <div className="text-5xl mb-4">⏰</div>
          <h1 className="text-2xl font-bold text-white mb-2">Tu prueba gratuita venció</h1>
          <p className="text-sm mb-8" style={{ color: '#a0a0a0' }}>
            Los <strong className="text-white">21 días gratis</strong> de BarberFlow han finalizado.
            Activa tu plan para seguir fidelizando clientes automáticamente.
          </p>

          <a
            href={`https://wa.me/51937776581?text=${waMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#C9A84C', color: '#0a0a0a' }}
          >
            <MessageCircle className="w-4 h-4" />
            Activar BarberFlow ahora
          </a>

          <p className="text-xs mt-4" style={{ color: '#555' }}>
            Escríbenos por WhatsApp y activamos tu cuenta en minutos.
          </p>
        </div>

        <form
          className="mt-5"
          action={async () => {
            'use server';
            await signOut({ redirectTo: '/login' });
          }}
        >
          <button
            type="submit"
            className="flex items-center gap-1.5 mx-auto text-xs transition-colors hover:text-white"
            style={{ color: '#555' }}
          >
            <LogOut className="w-3.5 h-3.5" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
