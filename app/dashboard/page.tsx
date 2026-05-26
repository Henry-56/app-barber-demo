import { auth } from '@/src/lib/auth';
import { db } from '@/src/lib/drizzle';
import { clients, appointments, barbers, whatsappMessages } from '@/src/lib/schema';
import { eq, and, gte, lte, count, sum, sql } from 'drizzle-orm';
import { Users, CalendarDays, TrendingUp, MessageSquare, Zap, ChevronRight } from 'lucide-react';
import Link from 'next/link';

async function getDashboardData(barbershopId: string) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [clientsCount] = await db
    .select({ total: count() })
    .from(clients)
    .where(eq(clients.barbershopId, barbershopId));

  const [inactiveCount] = await db
    .select({ total: count() })
    .from(clients)
    .where(and(eq(clients.barbershopId, barbershopId), eq(clients.isInactive, true)));

  const todayCitas = await db
    .select({
      id: appointments.id,
      scheduledAt: appointments.scheduledAt,
      status: appointments.status,
      service: appointments.service,
      clientId: appointments.clientId,
    })
    .from(appointments)
    .where(and(
      eq(appointments.barbershopId, barbershopId),
      gte(appointments.scheduledAt, todayStart),
      lte(appointments.scheduledAt, todayEnd),
    ))
    .orderBy(appointments.scheduledAt);

  const [monthRevenue] = await db
    .select({ total: sum(appointments.price) })
    .from(appointments)
    .where(and(
      eq(appointments.barbershopId, barbershopId),
      eq(appointments.status, 'completed'),
      gte(appointments.scheduledAt, monthStart),
    ));

  const [msgCount] = await db
    .select({ total: count() })
    .from(whatsappMessages)
    .where(and(
      eq(whatsappMessages.barbershopId, barbershopId),
      gte(whatsappMessages.sentAt, monthStart),
    ));

  return {
    totalClients: clientsCount.total,
    inactiveClients: inactiveCount.total,
    todayCitas,
    monthRevenue: Number(monthRevenue.total ?? 0),
    msgCount: msgCount.total,
  };
}

function KpiCard({ icon: Icon, label, value, sub, href, color }: {
  icon: React.ElementType; label: string; value: string | number;
  sub?: string; href?: string; color: string;
}) {
  const content = (
    <div className="p-5 rounded-2xl border transition-all" style={{ backgroundColor: '#161616', borderColor: '#2a2a2a' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {href && <ChevronRight className="w-4 h-4" style={{ color: '#555555' }} />}
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="text-sm font-medium mt-0.5" style={{ color: '#a0a0a0' }}>{label}</p>
      {sub && <p className="text-xs mt-1" style={{ color: '#555555' }}>{sub}</p>}
    </div>
  );
  return href ? <Link href={href} className="block hover:scale-[1.01] transition-transform">{content}</Link> : content;
}

export default async function DashboardPage() {
  const session = await auth();
  const barbershopId = session!.user.barbershopId;
  const data = await getDashboardData(barbershopId);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

  const nextCita = data.todayCitas.find(c => c.status === 'scheduled');

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{greeting} 👋</h1>
        <p className="text-sm mt-1" style={{ color: '#a0a0a0' }}>Aquí está el resumen de hoy.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <KpiCard icon={Users} label="Clientes totales" value={data.totalClients}
          sub={data.inactiveClients > 0 ? `${data.inactiveClients} inactivos` : undefined}
          href="/dashboard/clientes" color="#C9A84C" />
        <KpiCard icon={CalendarDays} label="Citas hoy" value={data.todayCitas.length}
          sub={nextCita ? `Próxima: ${new Date(nextCita.scheduledAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}` : 'Sin citas pendientes'}
          href="/dashboard/agenda" color="#3b82f6" />
        <KpiCard icon={TrendingUp} label="Ingresos del mes"
          value={`S/ ${data.monthRevenue.toLocaleString('es-PE')}`}
          href="/dashboard/caja" color="#22c55e" />
        <KpiCard icon={MessageSquare} label="Mensajes enviados"
          value={data.msgCount} sub="Este mes"
          href="/dashboard/whatsapp" color="#a855f7" />
      </div>

      {/* Citas de hoy */}
      <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: '#161616', borderColor: '#2a2a2a' }}>
        <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: '#2a2a2a' }}>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" style={{ color: '#C9A84C' }} />
            <h2 className="font-semibold text-white text-sm">Agenda de hoy</h2>
          </div>
          <Link href="/dashboard/agenda" className="text-xs font-medium hover:underline" style={{ color: '#C9A84C' }}>
            Ver todo
          </Link>
        </div>

        {data.todayCitas.length === 0 ? (
          <div className="py-10 text-center">
            <CalendarDays className="w-8 h-8 mx-auto mb-2" style={{ color: '#2a2a2a' }} />
            <p className="text-sm" style={{ color: '#555555' }}>No hay citas agendadas para hoy.</p>
            <Link href="/dashboard/agenda" className="inline-block mt-2 text-sm font-medium hover:underline" style={{ color: '#C9A84C' }}>
              Agregar cita
            </Link>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: '#2a2a2a' }}>
            {data.todayCitas.slice(0, 5).map(cita => {
              const statusColor =
                cita.status === 'completed' ? '#22c55e' :
                cita.status === 'cancelled' ? '#ef4444' :
                cita.status === 'no_show' ? '#f59e0b' : '#3b82f6';
              return (
                <div key={cita.id} className="px-5 py-3 flex items-center gap-3">
                  <div className="text-sm font-mono font-bold w-14 shrink-0" style={{ color: '#C9A84C' }}>
                    {new Date(cita.scheduledAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{cita.service ?? 'Corte'}</p>
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: `${statusColor}20`, color: statusColor }}>
                    {cita.status === 'scheduled' ? 'Pendiente' :
                     cita.status === 'completed' ? 'Completada' :
                     cita.status === 'cancelled' ? 'Cancelada' : 'No asistió'}
                  </span>
                </div>
              );
            })}
            {data.todayCitas.length > 5 && (
              <div className="px-5 py-3 text-center">
                <Link href="/dashboard/agenda" className="text-xs font-medium hover:underline" style={{ color: '#C9A84C' }}>
                  +{data.todayCitas.length - 5} citas más
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
