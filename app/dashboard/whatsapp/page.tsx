import { auth } from '@/src/lib/auth';
import { db } from '@/src/lib/drizzle';
import { whatsappMessages, clients } from '@/src/lib/schema';
import { eq, and, gte, count, sql, desc } from 'drizzle-orm';
import { MessageSquare, CheckCircle, XCircle } from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  welcome: 'Bienvenida',
  reminder_24h: 'Recordatorio 24h',
  reminder_2h: 'Recordatorio 2h',
  recovery: 'Recuperación',
  loyalty_complete: 'Fidelización',
  trial_reminder: 'Trial',
  bot: 'Bot',
  manual: 'Manual',
};

async function getWhatsappData(barbershopId: string) {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const messages = await db
    .select({
      id: whatsappMessages.id,
      type: whatsappMessages.type,
      message: whatsappMessages.message,
      status: whatsappMessages.status,
      sentAt: whatsappMessages.sentAt,
      clientName: clients.name,
      clientPhone: clients.phone,
    })
    .from(whatsappMessages)
    .leftJoin(clients, eq(whatsappMessages.clientId, clients.id))
    .where(eq(whatsappMessages.barbershopId, barbershopId))
    .orderBy(desc(whatsappMessages.sentAt))
    .limit(100);

  const [monthStats] = await db
    .select({
      total: count(),
      sent: sql<number>`COUNT(*) FILTER (WHERE status = 'sent')`,
      failed: sql<number>`COUNT(*) FILTER (WHERE status = 'failed')`,
    })
    .from(whatsappMessages)
    .where(and(
      eq(whatsappMessages.barbershopId, barbershopId),
      gte(whatsappMessages.sentAt, monthStart),
    ));

  return { messages, monthStats };
}

export default async function WhatsappPage() {
  const session = await auth();
  const { messages, monthStats } = await getWhatsappData(session!.user.barbershopId);

  const deliveryRate = monthStats.total > 0
    ? Math.round((Number(monthStats.sent) / monthStats.total) * 100)
    : 0;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">WhatsApp</h1>
        <p className="text-sm mt-0.5" style={{ color: '#a0a0a0' }}>Historial de mensajes automáticos</p>
      </div>

      {/* Stats del mes */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border p-4 text-center" style={{ backgroundColor: '#161616', borderColor: '#2a2a2a' }}>
          <p className="text-2xl font-bold text-white">{monthStats.total}</p>
          <p className="text-xs font-medium mt-0.5" style={{ color: '#a0a0a0' }}>Enviados</p>
        </div>
        <div className="rounded-2xl border p-4 text-center" style={{ backgroundColor: '#161616', borderColor: '#2a2a2a' }}>
          <p className="text-2xl font-bold" style={{ color: '#ef4444' }}>{monthStats.failed}</p>
          <p className="text-xs font-medium mt-0.5" style={{ color: '#a0a0a0' }}>Fallidos</p>
        </div>
        <div className="rounded-2xl border p-4 text-center" style={{ backgroundColor: '#161616', borderColor: '#2a2a2a' }}>
          <p className="text-2xl font-bold" style={{ color: '#22c55e' }}>{deliveryRate}%</p>
          <p className="text-xs font-medium mt-0.5" style={{ color: '#a0a0a0' }}>Entregados</p>
        </div>
      </div>

      {/* Lista de mensajes */}
      {messages.length === 0 ? (
        <div className="rounded-2xl border py-16 text-center" style={{ backgroundColor: '#161616', borderColor: '#2a2a2a' }}>
          <MessageSquare className="w-8 h-8 mx-auto mb-2" style={{ color: '#2a2a2a' }} />
          <p className="text-sm" style={{ color: '#555555' }}>Aún no se han enviado mensajes automáticos.</p>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: '#161616', borderColor: '#2a2a2a' }}>
          <div className="divide-y" style={{ borderColor: '#2a2a2a' }}>
            {messages.map(m => (
              <div key={m.id} className="px-5 py-3 flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {m.status === 'sent'
                    ? <CheckCircle className="w-4 h-4" style={{ color: '#22c55e' }} />
                    : <XCircle className="w-4 h-4" style={{ color: '#ef4444' }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: '#2a2a2a', color: '#C9A84C' }}>
                      {TYPE_LABELS[m.type] ?? m.type}
                    </span>
                    <span className="text-xs" style={{ color: '#a0a0a0' }}>
                      {m.clientName ?? m.clientPhone ?? 'Desconocido'}
                    </span>
                  </div>
                  <p className="text-xs line-clamp-2" style={{ color: '#555555' }}>{m.message}</p>
                </div>
                <span className="text-[10px] shrink-0" style={{ color: '#555555' }}>
                  {new Date(m.sentAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
