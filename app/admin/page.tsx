"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface AdminStats {
  users: {
    total: number;
    trial: number;
    pro: number;
    business: number;
    expiredTrials: number;
  };
  activity: {
    trialsExpiringSoon: number;
    newUsersThisMonth: number;
    totalMessages: number;
    totalTickets: number;
    totalAppointments: number;
  };
  mrr: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => {
        if (!r.ok) throw new Error("Forbidden");
        return r.json();
      })
      .then((d) => { setStats(d); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) return <PageShell><Skeleton /></PageShell>;
  if (error) return <PageShell><div className="text-red-400 text-center py-20">Error: {error}</div></PageShell>;
  if (!stats) return null;

  const { users, activity, mrr } = stats;

  return (
    <PageShell>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Resumen del sistema</p>
      </div>

      {/* Alerts */}
      {activity.trialsExpiringSoon > 0 && (
        <div className="bg-amber-900/40 border border-amber-700 rounded-xl px-4 py-3 mb-6 flex items-center justify-between">
          <span className="text-amber-300 text-sm">
            ⏳ {activity.trialsExpiringSoon} prueba{activity.trialsExpiringSoon > 1 ? "s" : ""} vence{activity.trialsExpiringSoon === 1 ? "" : "n"} en los próximos 7 días
          </span>
          <Link href="/admin/usuarios?plan=trial" className="text-xs text-amber-400 hover:underline">Ver →</Link>
        </div>
      )}

      {/* MRR highlight */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 rounded-2xl p-6 mb-6 flex items-center justify-between">
        <div>
          <div className="text-indigo-300 text-sm mb-1">MRR estimado</div>
          <div className="text-4xl font-bold">${mrr.toLocaleString("es-MX")} MXN</div>
          <div className="text-indigo-300 text-xs mt-1">{users.pro} pro × $499 + {users.business} business × $999</div>
        </div>
        <div className="text-5xl opacity-30">💰</div>
      </div>

      {/* User plan breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total usuarios" value={users.total} icon="👥" color="indigo" />
        <StatCard label="En prueba" value={users.trial} icon="🧪" color="amber" />
        <StatCard label="Pro" value={users.pro} icon="⭐" color="green" />
        <StatCard label="Business" value={users.business} icon="🏢" color="purple" />
      </div>

      {/* Activity */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Nuevos este mes" value={activity.newUsersThisMonth} icon="🆕" color="sky" />
        <StatCard label="Pruebas expiradas" value={users.expiredTrials} icon="🚫" color="red" />
        <StatCard label="Total mensajes" value={activity.totalMessages} icon="💬" color="teal" />
        <StatCard label="Total tickets" value={activity.totalTickets} icon="🎫" color="orange" />
        <StatCard label="Total citas" value={activity.totalAppointments} icon="📅" color="violet" />
      </div>

      <div className="mt-6">
        <Link
          href="/admin/usuarios"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
        >
          👥 Ver todos los usuarios
        </Link>
      </div>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return <div className="p-6 md:p-10 max-w-5xl mx-auto">{children}</div>;
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  const colors: Record<string, string> = {
    indigo: "bg-indigo-900/40 border-indigo-800",
    amber: "bg-amber-900/40 border-amber-800",
    green: "bg-green-900/40 border-green-800",
    purple: "bg-purple-900/40 border-purple-800",
    sky: "bg-sky-900/40 border-sky-800",
    red: "bg-red-900/40 border-red-800",
    teal: "bg-teal-900/40 border-teal-800",
    orange: "bg-orange-900/40 border-orange-800",
    violet: "bg-violet-900/40 border-violet-800",
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color] || colors.indigo}`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold">{value.toLocaleString()}</div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-800 rounded w-40"></div>
      <div className="h-32 bg-gray-800 rounded-2xl"></div>
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-gray-800 rounded-xl"></div>)}
      </div>
    </div>
  );
}
