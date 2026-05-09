"use client";

import { useEffect, useState } from "react";

interface MetricsData {
  summary: {
    totalMessages: number;
    totalAppointments: number;
    totalTickets: number;
    resolvedTickets: number;
    resolutionRate: number;
  };
  dailyActivity: Array<{ date: string; count: number }>;
  channelBreakdown: Array<{ channel: string; count: number }>;
}

const CHANNEL_LABELS: Record<string, string> = { whatsapp: "📱 WhatsApp", email: "📧 Email", phone: "📞 Llamadas" };
const PERIOD_LABELS: Record<string, string> = {
  today: "Hoy",
  week: "Esta semana",
  month: "Este mes",
  "3months": "Últimos 3 meses",
};

export default function MetricasPage() {
  const [data, setData] = useState<MetricsData | null>(null);
  const [period, setPeriod] = useState("week");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/panel/metrics?period=${period}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, [period]);

  const maxActivity = data ? Math.max(...data.dailyActivity.map((d) => d.count), 1) : 1;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-900">Métricas</h1>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {Object.entries(PERIOD_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${period === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando métricas...</div>
      ) : data ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="text-2xl mb-1">📱</div>
              <div className="text-2xl font-bold text-gray-900">{data.summary.totalMessages}</div>
              <div className="text-sm text-gray-500">Mensajes atendidos</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="text-2xl mb-1">📅</div>
              <div className="text-2xl font-bold text-gray-900">{data.summary.totalAppointments}</div>
              <div className="text-sm text-gray-500">Citas agendadas</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="text-2xl mb-1">🎫</div>
              <div className="text-2xl font-bold text-gray-900">{data.summary.totalTickets}</div>
              <div className="text-sm text-gray-500">Tickets creados</div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="text-2xl mb-1">✅</div>
              <div className={`text-2xl font-bold ${data.summary.resolutionRate >= 70 ? "text-green-600" : data.summary.resolutionRate >= 40 ? "text-yellow-600" : "text-red-600"}`}>
                {data.summary.resolutionRate}%
              </div>
              <div className="text-sm text-gray-500">Tasa de resolución</div>
            </div>
          </div>

          {/* Daily activity chart */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">Actividad diaria</h2>
            {data.dailyActivity.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No hay datos para este período</div>
            ) : (
              <div className="flex items-end gap-1 h-32">
                {data.dailyActivity.map((d) => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-indigo-200 rounded-t hover:bg-indigo-400 transition-colors relative group"
                      style={{ height: `${(d.count / maxActivity) * 100}%`, minHeight: d.count > 0 ? "4px" : "2px" }}
                    >
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                        {d.count}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400" style={{ fontSize: "9px" }}>
                      {d.date.slice(8)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Channel breakdown */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Por canal</h2>
            {data.channelBreakdown.length === 0 ? (
              <div className="text-center py-8 text-gray-400">Sin datos de canales</div>
            ) : (
              <div className="space-y-3">
                {data.channelBreakdown.map((c) => {
                  const total = data.channelBreakdown.reduce((s, x) => s + x.count, 0);
                  const pct = total > 0 ? Math.round((c.count / total) * 100) : 0;
                  return (
                    <div key={c.channel}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700">{CHANNEL_LABELS[c.channel] || c.channel}</span>
                        <span className="text-sm font-medium text-gray-900">{c.count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
