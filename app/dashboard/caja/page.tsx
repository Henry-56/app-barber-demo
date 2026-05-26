import { auth } from '@/src/lib/auth';
import { db } from '@/src/lib/drizzle';
import { appointments, barbers } from '@/src/lib/schema';
import { eq, and, gte, lte, count, sum, sql } from 'drizzle-orm';
import { TrendingUp, TrendingDown, Banknote, CalendarCheck, UserX, XCircle } from 'lucide-react';

async function getCajaData(barbershopId: string) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const weekStart = new Date(todayStart.getTime() - (todayStart.getDay() || 7) * 86400000 + 86400000);
  const prevWeekStart = new Date(weekStart.getTime() - 7 * 86400000);
  const prevWeekEnd = weekStart;

  const [todayStats] = await db
    .select({
      completed: sql<number>`COUNT(*) FILTER (WHERE status = 'completed')`,
      cancelled: sql<number>`COUNT(*) FILTER (WHERE status = 'cancelled')`,
      no_show: sql<number>`COUNT(*) FILTER (WHERE status = 'no_show')`,
      revenue: sql<number>`COALESCE(SUM(price) FILTER (WHERE status = 'completed'), 0)`,
    })
    .from(appointments)
    .where(and(
      eq(appointments.barbershopId, barbershopId),
      gte(appointments.scheduledAt, todayStart),
      lte(appointments.scheduledAt, todayEnd),
    ));

  const [monthStats] = await db
    .select({
      completed: sql<number>`COUNT(*) FILTER (WHERE status = 'completed')`,
      revenue: sql<number>`COALESCE(SUM(price) FILTER (WHERE status = 'completed'), 0)`,
    })
    .from(appointments)
    .where(and(
      eq(appointments.barbershopId, barbershopId),
      gte(appointments.scheduledAt, monthStart),
    ));

  const [thisWeekRevenue] = await db
    .select({ revenue: sql<number>`COALESCE(SUM(price), 0)` })
    .from(appointments)
    .where(and(
      eq(appointments.barbershopId, barbershopId),
      eq(appointments.status, 'completed'),
      gte(appointments.scheduledAt, weekStart),
      lte(appointments.scheduledAt, todayEnd),
    ));

  const [prevWeekRevenue] = await db
    .select({ revenue: sql<number>`COALESCE(SUM(price), 0)` })
    .from(appointments)
    .where(and(
      eq(appointments.barbershopId, barbershopId),
      eq(appointments.status, 'completed'),
      gte(appointments.scheduledAt, prevWeekStart),
      lte(appointments.scheduledAt, prevWeekEnd),
    ));

  // Servicios ranking
  const serviceRanking = await db
    .select({
      service: appointments.service,
      count: count(),
      revenue: sql<number>`COALESCE(SUM(price), 0)`,
    })
    .from(appointments)
    .where(and(
      eq(appointments.barbershopId, barbershopId),
      eq(appointments.status, 'completed'),
      gte(appointments.scheduledAt, monthStart),
    ))
    .groupBy(appointments.service)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(5);

  // Ingresos por barbero
  const barberRevenue = await db
    .select({
      barberId: appointments.barberId,
      count: count(),
      revenue: sql<number>`COALESCE(SUM(price), 0)`,
    })
    .from(appointments)
    .where(and(
      eq(appointments.barbershopId, barbershopId),
      eq(appointments.status, 'completed'),
      gte(appointments.scheduledAt, monthStart),
    ))
    .groupBy(appointments.barberId);

  const barberNames = await db
    .select({ id: barbers.id, name: barbers.name })
    .from(barbers)
    .where(eq(barbers.barbershopId, barbershopId));

  const barberMap = Object.fromEntries(barberNames.map(b => [b.id, b.name]));

  const daysInMonth = Math.max(1, now.getDate());
  const avgPerDay = monthStats.completed > 0 ? Number(monthStats.revenue) / daysInMonth : 0;

  const weekChange = prevWeekRevenue.revenue > 0
    ? Math.round(((Number(thisWeekRevenue.revenue) - Number(prevWeekRevenue.revenue)) / Number(prevWeekRevenue.revenue)) * 100)
    : null;

  return {
    today: {
      completed: Number(todayStats.completed),
      cancelled: Number(todayStats.cancelled),
      no_show: Number(todayStats.no_show),
      revenue: Number(todayStats.revenue),
    },
    month: {
      completed: Number(monthStats.completed),
      revenue: Number(monthStats.revenue),
      avgPerDay: Math.round(avgPerDay),
    },
    weekChange,
    thisWeekRevenue: Number(thisWeekRevenue.revenue),
    serviceRanking,
    barberRevenue: barberRevenue.map(b => ({
      name: barberMap[b.barberId ?? ''] ?? 'Sin asignar',
      count: b.count,
      revenue: Number(b.revenue),
    })).sort((a, b) => b.revenue - a.revenue),
  };
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="rounded-2xl border p-5" style={{ backgroundColor: '#161616', borderColor: '#2a2a2a' }}>
      <div className="p-2 rounded-lg w-fit mb-3" style={{ backgroundColor: `${color}15` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="text-sm font-medium mt-0.5" style={{ color: '#a0a0a0' }}>{label}</p>
      {sub && <p className="text-xs mt-1" style={{ color: '#555555' }}>{sub}</p>}
    </div>
  );
}

export default async function CajaPage() {
  const session = await auth();
  const data = await getCajaData(session!.user.barbershopId);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Caja</h1>
        <p className="text-sm mt-0.5" style={{ color: '#a0a0a0' }}>Ingresos y actividad de la barbería</p>
      </div>

      {/* Hoy */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#555555' }}>Hoy</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={CalendarCheck} label="Completadas" value={data.today.completed} color="#22c55e" />
          <StatCard icon={Banknote} label="Cobrado hoy" value={`S/ ${data.today.revenue}`} color="#C9A84C" />
          <StatCard icon={XCircle} label="Canceladas" value={data.today.cancelled} color="#ef4444" />
          <StatCard icon={UserX} label="No asistieron" value={data.today.no_show} color="#f59e0b" />
        </div>
      </div>

      {/* Mes */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#555555' }}>Este mes</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard icon={Banknote} label="Ingresos totales" value={`S/ ${data.month.revenue.toLocaleString('es-PE')}`} color="#C9A84C" />
          <StatCard icon={CalendarCheck} label="Cortes realizados" value={data.month.completed} color="#22c55e" />
          <StatCard icon={TrendingUp} label="Promedio diario" value={`S/ ${data.month.avgPerDay}`} color="#3b82f6" />
        </div>
      </div>

      {/* Semana actual vs anterior */}
      {data.weekChange !== null && (
        <div className="rounded-2xl border p-5 flex items-center justify-between" style={{ backgroundColor: '#161616', borderColor: '#2a2a2a' }}>
          <div>
            <p className="text-sm font-semibold text-white">Semana actual vs anterior</p>
            <p className="text-xs mt-0.5" style={{ color: '#555555' }}>S/ {data.thisWeekRevenue} esta semana</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ backgroundColor: data.weekChange >= 0 ? '#22c55e15' : '#ef444415' }}>
            {data.weekChange >= 0
              ? <TrendingUp className="w-5 h-5" style={{ color: '#22c55e' }} />
              : <TrendingDown className="w-5 h-5" style={{ color: '#ef4444' }} />}
            <span className="text-lg font-bold" style={{ color: data.weekChange >= 0 ? '#22c55e' : '#ef4444' }}>
              {data.weekChange > 0 ? '+' : ''}{data.weekChange}%
            </span>
          </div>
        </div>
      )}

      {/* Ranking de servicios */}
      {data.serviceRanking.length > 0 && (
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: '#161616', borderColor: '#2a2a2a' }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: '#2a2a2a' }}>
            <h2 className="font-semibold text-white text-sm">Servicios más populares</h2>
          </div>
          <div className="divide-y" style={{ borderColor: '#2a2a2a' }}>
            {data.serviceRanking.map((s, i) => (
              <div key={i} className="px-5 py-3 flex items-center gap-3">
                <span className="text-xs font-bold w-5 shrink-0" style={{ color: '#555555' }}>#{i + 1}</span>
                <span className="flex-1 text-sm text-white">{s.service ?? 'Corte'}</span>
                <span className="text-xs" style={{ color: '#a0a0a0' }}>{s.count} veces</span>
                <span className="text-sm font-bold" style={{ color: '#C9A84C' }}>S/ {Number(s.revenue).toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ingresos por barbero */}
      {data.barberRevenue.length > 0 && (
        <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: '#161616', borderColor: '#2a2a2a' }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: '#2a2a2a' }}>
            <h2 className="font-semibold text-white text-sm">Ingresos por barbero este mes</h2>
          </div>
          <div className="divide-y" style={{ borderColor: '#2a2a2a' }}>
            {data.barberRevenue.map((b, i) => (
              <div key={i} className="px-5 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ backgroundColor: '#C9A84C20', color: '#C9A84C' }}>
                  {b.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{b.name}</p>
                  <p className="text-xs" style={{ color: '#555555' }}>{b.count} cortes</p>
                </div>
                <p className="text-sm font-bold" style={{ color: '#C9A84C' }}>S/ {b.revenue.toFixed(0)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
