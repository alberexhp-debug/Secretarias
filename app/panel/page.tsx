"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const AVATAR_EMOJIS: Record<string, string> = {
  "avatar-1": "👩", "avatar-2": "👨", "avatar-3": "👩‍💼", "avatar-4": "👨‍💼",
  "avatar-5": "🧑‍💼", "avatar-6": "👩‍🔬", "avatar-7": "👨‍🔬", "avatar-8": "🧑‍🎨",
  "avatar-9": "👩‍🏫", "avatar-10": "👨‍🏫", "avatar-11": "🧑‍🔧", "avatar-12": "👩‍🍳",
};

const CHANNEL_ICONS: Record<string, string> = {
  whatsapp: "📱", email: "📧", phone: "📞", system: "⚙️", manual: "✏️",
};

interface DashboardData {
  secretary: { name: string; avatarId: string } | null;
  stats: {
    messagesToday: number;
    appointmentsThisWeek: number;
    pendingTickets: number;
    urgentTickets: number;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    description: string;
    contactName: string;
    channel: string;
    createdAt: string;
  }>;
}

export default function PanelDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/panel/dashboard")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";

  if (loading) return <LoadingSkeleton />;

  const { secretary, stats, recentActivity } = data!;
  const emoji = secretary ? AVATAR_EMOJIS[secretary.avatarId] || "👩" : "🤖";
  const name = secretary?.name || "Tu secretario";

  const filteredActivity = filter === "all"
    ? recentActivity
    : recentActivity.filter((a) => {
        if (filter === "tickets") return a.action.includes("ticket");
        if (filter === "whatsapp") return a.channel === "whatsapp";
        if (filter === "email") return a.channel === "email";
        return true;
      });

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Urgent banner */}
      {stats.urgentTickets > 0 && (
        <div className="bg-orange-500 text-white rounded-xl px-4 py-3 mb-6 flex items-center justify-between">
          <span className="font-medium">⚠️ {stats.urgentTickets} ticket{stats.urgentTickets > 1 ? "s" : ""} urgente{stats.urgentTickets > 1 ? "s" : ""} esperan tu respuesta</span>
          <Link href="/panel/tickets?priority=urgent" className="bg-white text-orange-500 px-3 py-1 rounded-lg text-sm font-semibold hover:bg-orange-50">
            Ver ahora
          </Link>
        </div>
      )}

      {/* Greeting */}
      <div className="flex items-start gap-4 mb-8">
        <div className="text-4xl">{emoji}</div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{greeting}</h1>
          <p className="text-gray-500 mt-1">
            {name} atendió {stats.messagesToday} mensaje{stats.messagesToday !== 1 ? "s" : ""} hoy,
            agendó {stats.appointmentsThisWeek} cita{stats.appointmentsThisWeek !== 1 ? "s" : ""} esta semana
            {stats.pendingTickets > 0 && ` y tiene ${stats.pendingTickets} ticket${stats.pendingTickets !== 1 ? "s" : ""} pendiente${stats.pendingTickets !== 1 ? "s" : ""}`}.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link href="/panel/conversaciones" className="bg-white rounded-xl p-4 border border-gray-100 hover:border-indigo-200 hover:shadow-sm">
          <div className="text-2xl mb-1">📱</div>
          <div className="text-2xl font-bold text-gray-900">{stats.messagesToday}</div>
          <div className="text-sm text-gray-500">Mensajes hoy</div>
        </Link>
        <Link href="/panel/agenda" className="bg-white rounded-xl p-4 border border-gray-100 hover:border-indigo-200 hover:shadow-sm">
          <div className="text-2xl mb-1">📅</div>
          <div className="text-2xl font-bold text-gray-900">{stats.appointmentsThisWeek}</div>
          <div className="text-sm text-gray-500">Citas esta semana</div>
        </Link>
        <Link href="/panel/tickets" className="bg-white rounded-xl p-4 border border-gray-100 hover:border-indigo-200 hover:shadow-sm">
          <div className="text-2xl mb-1">🎫</div>
          <div className={`text-2xl font-bold ${stats.pendingTickets > 3 ? "text-red-600" : stats.urgentTickets > 0 ? "text-orange-600" : "text-gray-900"}`}>
            {stats.pendingTickets}
          </div>
          <div className="text-sm text-gray-500">Tickets pendientes</div>
        </Link>
        <Link href="/panel/metricas" className="bg-white rounded-xl p-4 border border-gray-100 hover:border-indigo-200 hover:shadow-sm">
          <div className="text-2xl mb-1">⚡</div>
          <div className="text-2xl font-bold text-green-600">&lt;1 min</div>
          <div className="text-sm text-gray-500">Tiempo de respuesta</div>
        </Link>
      </div>

      {/* Activity feed */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-semibold text-gray-900">Actividad reciente</h2>
          <div className="flex gap-1">
            {["all", "tickets", "whatsapp", "email"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-medium ${filter === f ? "bg-indigo-100 text-indigo-700" : "text-gray-500 hover:bg-gray-100"}`}
              >
                {f === "all" ? "Todos" : f === "tickets" ? "Tickets" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          {filteredActivity.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <div className="text-3xl mb-2">🤫</div>
              <p>No hay actividad reciente</p>
              <p className="text-sm mt-1">Cuando tu secretario actúe, aparecerá aquí</p>
            </div>
          ) : (
            filteredActivity.map((activity) => (
              <div key={activity.id} className={`px-4 py-3 flex items-start gap-3 hover:bg-gray-50 ${activity.action.includes("ticket") ? "bg-orange-50/50" : ""}`}>
                <span className="text-xl flex-shrink-0">{CHANNEL_ICONS[activity.channel] || "📌"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">{activity.description}</p>
                  {activity.contactName && (
                    <p className="text-xs text-gray-400">{activity.contactName}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: es })}
                </span>
              </div>
            ))
          )}
        </div>

        {recentActivity.length === 0 && (
          <div className="p-4 border-t border-gray-100 text-center">
            <Link href="/panel/configuracion" className="text-sm text-indigo-600 hover:underline">
              Conecta un canal para empezar →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
      <div className="h-4 bg-gray-100 rounded w-96 mb-8"></div>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-gray-100 rounded-xl"></div>)}
      </div>
      <div className="h-64 bg-gray-100 rounded-2xl"></div>
    </div>
  );
}
