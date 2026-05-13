'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Zap, Gift, Star, BarChart3 } from 'lucide-react';

type Stats = {
  thisMonth: {
    recovered: number;
    contacted: number;
    responded: number;
    noResponse: number;
    recoveryRate: number;
    revenue: number;
    roi: number;
  };
  allTime: {
    recovered: number;
    contacted: number;
    revenue: number;
  };
  retention: {
    total: number;
    active: number;
    atRisk: number;
    inactive: number;
    rate: number;
  };
  loyalty: {
    freeAvailable: number;
    closeToFree: number;
  };
  pricePerCut: number;
  subscriptionPrice: number;
};

function RoiBadge({ roi }: { roi: number }) {
  if (roi === 0) return null;
  const { bg, text, label } =
    roi >= 3 ? { bg: 'bg-emerald-500', text: 'text-white', label: `${roi}x 🔥` } :
    roi >= 2 ? { bg: 'bg-blue-500',    text: 'text-white', label: `${roi}x ✓`  } :
    roi >= 1 ? { bg: 'bg-slate-600',   text: 'text-white', label: `${roi}x ✓`  } :
               { bg: 'bg-amber-400',   text: 'text-slate-900', label: `${roi}x` };
  return (
    <span className={`${bg} ${text} text-xs font-black px-2.5 py-1 rounded-full self-end mb-2`}>
      {label} retorno
    </span>
  );
}

function RetentionBar({ retention }: { stats: Stats; retention: Stats['retention'] }) {
  const { total, active, atRisk, inactive } = retention;
  if (total === 0) return <div className="h-3 bg-slate-100 rounded-full" />;
  const activePct  = Math.round((active  / total) * 100);
  const atRiskPct  = Math.round((atRisk  / total) * 100);
  const inactivePct= Math.round((inactive/ total) * 100);
  return (
    <div className="h-3 rounded-full overflow-hidden flex gap-0.5">
      {activePct  > 0 && <div className="bg-emerald-500 h-full rounded-l-full transition-all" style={{ width: `${activePct}%` }} />}
      {atRiskPct  > 0 && <div className="bg-amber-400 h-full transition-all"                  style={{ width: `${atRiskPct}%` }} />}
      {inactivePct> 0 && <div className="bg-rose-400 h-full rounded-r-full transition-all"    style={{ width: `${inactivePct}%` }} />}
    </div>
  );
}

export default function StatsPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4 animate-pulse">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-24 bg-slate-100 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center text-slate-500">
        Error al cargar estadísticas.
      </div>
    );
  }

  const { thisMonth, allTime, retention, loyalty, pricePerCut, subscriptionPrice } = stats;
  const hasActivity = thisMonth.contacted > 0;

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Panel de resultados</h1>
        <p className="text-slate-500 mt-1">Lo que el sistema generó para tu barbería este mes.</p>
      </div>

      {/* Hero card */}
      <div className="rounded-2xl p-6 text-white" style={{ backgroundColor: '#0A0A0A' }}>
        {hasActivity ? (
          <>
            <p className="text-slate-400 text-sm font-medium">Este mes el sistema generó</p>
            <div className="flex items-end gap-3 mt-2">
              <p className="text-5xl font-black" style={{ color: '#D4AF37' }}>
                S/ {thisMonth.revenue.toLocaleString()}
              </p>
              <RoiBadge roi={thisMonth.roi} />
            </div>
            <p className="text-slate-500 text-xs mt-3">
              {thisMonth.recovered} {thisMonth.recovered === 1 ? 'cliente recuperado' : 'clientes recuperados'} × S/{pricePerCut} por corte
              {thisMonth.roi >= 1 && (
                <span className="text-emerald-400 ml-2 font-medium">
                  · el sistema se pagó solo {thisMonth.roi >= 2 ? `(${thisMonth.roi}x)` : ''}
                </span>
              )}
            </p>
          </>
        ) : (
          <>
            <p className="text-slate-400 text-sm font-medium mb-2">Este mes el sistema generó</p>
            <p className="text-3xl font-black" style={{ color: '#D4AF37' }}>S/ 0</p>
            <p className="text-slate-500 text-xs mt-3">
              Usa la Cola de Hoy, envía WhatsApp y marca cuando vuelvan — los S/ aparecen aquí.
            </p>
          </>
        )}
      </div>

      {/* 3 métricas del mes */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-black text-emerald-600">{thisMonth.recovered}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Recuperados</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-black text-blue-600">
            {hasActivity ? `${thisMonth.recoveryRate}%` : '—'}
          </p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Tasa éxito</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm">
          <p className="text-2xl font-black text-amber-600">{thisMonth.contacted}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Contactados</p>
        </div>
      </div>

      {/* Desglose outreach */}
      {hasActivity && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-slate-500" />
            <h2 className="font-bold text-slate-900 text-sm">Resultados de mensajes enviados</h2>
          </div>
          <div className="divide-y divide-slate-100">
            <OutreachRow icon="🏆" label="Vinieron" value={thisMonth.recovered}   color="text-emerald-600" total={thisMonth.contacted} />
            <OutreachRow icon="💬" label="Respondieron" value={thisMonth.responded}  color="text-blue-600"    total={thisMonth.contacted} />
            <OutreachRow icon="🔇" label="Sin respuesta" value={thisMonth.noResponse} color="text-slate-400"   total={thisMonth.contacted} />
          </div>
        </div>
      )}

      {/* Retención */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-500" />
            <h2 className="font-bold text-slate-900 text-sm">Retención de clientes</h2>
          </div>
          <span className="text-2xl font-black text-slate-900">{retention.rate}%</span>
        </div>

        <RetentionBar stats={stats} retention={retention} />

        <div className="flex gap-4 mt-3 text-xs">
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            {retention.active} activos
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
            {retention.atRisk} en riesgo
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
            {retention.inactive} inactivos
          </span>
        </div>
      </div>

      {/* Pipeline de fidelización */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Gift className="w-4 h-4 text-slate-500" />
          <h2 className="font-bold text-slate-900 text-sm">Pipeline de fidelización</h2>
        </div>
        <div className="space-y-3">
          <LoyaltyRow
            count={loyalty.freeAvailable}
            icon="🎁"
            label="con corte gratis listo para canjear"
            sublabel="Contactarlos genera una visita segura"
            accent="emerald"
          />
          <LoyaltyRow
            count={loyalty.closeToFree}
            icon="⭐"
            label="a 1 corte de ganar el gratis"
            sublabel="El incentivo más fuerte para que regresen"
            accent="blue"
          />
        </div>
      </div>

      {/* All-time */}
      {allTime.recovered > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-slate-500" />
            <h2 className="font-bold text-slate-900 text-sm">Desde que usas el sistema</h2>
          </div>
          <div className="flex gap-6">
            <div>
              <p className="text-2xl font-black text-slate-900">{allTime.recovered}</p>
              <p className="text-xs text-slate-500">clientes recuperados</p>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">S/ {allTime.revenue.toLocaleString()}</p>
              <p className="text-xs text-slate-500">ingresos generados</p>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{allTime.contacted}</p>
              <p className="text-xs text-slate-500">mensajes enviados</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function OutreachRow({
  icon, label, value, color, total,
}: { icon: string; label: string; value: number; color: string; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="px-5 py-3 flex items-center gap-3">
      <span className="text-base">{icon}</span>
      <span className="text-sm text-slate-600 flex-1">{label}</span>
      <span className={`text-sm font-bold ${color}`}>{value}</span>
      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-current rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-400 w-8 text-right">{pct}%</span>
    </div>
  );
}

function LoyaltyRow({
  count, icon, label, sublabel, accent,
}: { count: number; icon: string; label: string; sublabel: string; accent: 'emerald' | 'blue' }) {
  const colors = {
    emerald: { num: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    blue:    { num: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-100'    },
  };
  const c = colors[accent];
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${c.bg} ${c.border}`}>
      <span className="text-xl">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700">
          <span className={`font-black text-lg ${c.num} mr-1`}>{count}</span>
          {label}
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">{sublabel}</p>
      </div>
    </div>
  );
}
