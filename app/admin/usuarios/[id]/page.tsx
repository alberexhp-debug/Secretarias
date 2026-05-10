"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface UserDetail {
  id: string;
  email: string;
  name: string | null;
  planType: string;
  trialEnd: string | null;
  planExpiry: string | null;
  onboardingDone: boolean;
  createdAt: string;
  secretary: {
    name: string | null;
    businessName: string | null;
    whatsappConnected: boolean;
    avatarId: string | null;
    industry: string | null;
    timezone: string | null;
  } | null;
  _count: { conversations: number; tickets: number; contacts: number };
}

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  createdAt: string;
}

interface DetailResponse {
  user: UserDetail;
  recentActivity: ActivityLog[];
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // Form state
  const [planType, setPlanType] = useState("");
  const [planExpiry, setPlanExpiry] = useState("");
  const [extendDays, setExtendDays] = useState("");

  useEffect(() => {
    fetch(`/api/admin/users/${id}`)
      .then((r) => r.json())
      .then((d: DetailResponse) => {
        setData(d);
        setPlanType(d.user.planType);
        setPlanExpiry(d.user.planExpiry ? d.user.planExpiry.split("T")[0] : "");
        setLoading(false);
      });
  }, [id]);

  const save = async () => {
    setSaving(true);
    setMsg("");
    const body: Record<string, unknown> = { planType };
    if (planExpiry) body.planExpiry = planExpiry;
    if (extendDays && parseInt(extendDays) > 0) body.extendTrialDays = parseInt(extendDays);

    const r = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (r.ok) {
      const updated = await r.json();
      setData((prev) => prev ? { ...prev, user: updated.user } : prev);
      setExtendDays("");
      setMsg("Guardado correctamente");
    } else {
      setMsg("Error al guardar");
    }
    setSaving(false);
  };

  const deleteUser = async () => {
    if (!confirm(`¿Eliminar la cuenta de ${data?.user.email}? Esta acción no se puede deshacer.`)) return;
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    router.push("/admin/usuarios");
  };

  if (loading) {
    return (
      <div className="p-10 animate-pulse">
        <div className="h-8 bg-gray-800 rounded w-64 mb-4"></div>
        <div className="h-4 bg-gray-800 rounded w-40"></div>
      </div>
    );
  }

  if (!data) return <div className="p-10 text-red-400">Usuario no encontrado</div>;

  const { user, recentActivity } = data;
  const now = new Date();
  const trialActive = user.planType === "trial" && user.trialEnd && new Date(user.trialEnd) > now;
  const trialDaysLeft = trialActive ? Math.ceil((new Date(user.trialEnd!).getTime() - now.getTime()) / 86400000) : null;

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      {/* Back */}
      <Link href="/admin/usuarios" className="text-gray-400 hover:text-white text-sm flex items-center gap-1 mb-6">
        ← Volver a usuarios
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">{user.email}</h1>
          {user.name && <p className="text-gray-400 mt-1">{user.name}</p>}
          <p className="text-gray-500 text-xs mt-1">ID: {user.id}</p>
        </div>
        <button
          onClick={deleteUser}
          className="text-red-400 hover:text-red-300 border border-red-800 hover:border-red-600 px-4 py-2 rounded-lg text-sm transition-colors"
        >
          Eliminar cuenta
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Stats */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="font-semibold text-gray-300 mb-4 text-sm uppercase tracking-wider">Estadísticas</h2>
          <div className="grid grid-cols-3 gap-4">
            <Stat label="Conversaciones" value={user._count.conversations} />
            <Stat label="Tickets" value={user._count.tickets} />
            <Stat label="Contactos" value={user._count.contacts} />
          </div>
          <div className="mt-4 pt-4 border-t border-gray-800 text-xs text-gray-500">
            Registrado el {new Date(user.createdAt).toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}
          </div>
          <div className="mt-2 text-xs">
            <span className={`inline-block px-2 py-0.5 rounded-full border text-xs ${user.onboardingDone ? "border-green-700 text-green-400" : "border-orange-700 text-orange-400"}`}>
              {user.onboardingDone ? "✓ Onboarding completado" : "⚠ Sin completar onboarding"}
            </span>
          </div>
        </div>

        {/* Secretary */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h2 className="font-semibold text-gray-300 mb-4 text-sm uppercase tracking-wider">Secretario</h2>
          {user.secretary ? (
            <div className="space-y-2 text-sm">
              <Row label="Nombre" value={user.secretary.name || "—"} />
              <Row label="Empresa" value={user.secretary.businessName || "—"} />
              <Row label="Industria" value={user.secretary.industry || "—"} />
              <Row label="Zona horaria" value={user.secretary.timezone || "—"} />
              <Row
                label="WhatsApp"
                value={user.secretary.whatsappConnected ? "Conectado ✓" : "No conectado"}
                valueClass={user.secretary.whatsappConnected ? "text-green-400" : "text-gray-500"}
              />
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Sin secretario configurado</p>
          )}
        </div>

        {/* Plan management */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 md:col-span-2">
          <h2 className="font-semibold text-gray-300 mb-4 text-sm uppercase tracking-wider">Gestión de plan</h2>

          {/* Current plan info */}
          <div className="bg-gray-800 rounded-xl p-4 mb-5 flex items-center gap-4 flex-wrap">
            <div>
              <div className="text-xs text-gray-400 mb-1">Plan actual</div>
              <span className="text-lg font-bold capitalize">{user.planType}</span>
            </div>
            {user.trialEnd && (
              <div>
                <div className="text-xs text-gray-400 mb-1">Fin de prueba</div>
                <span className={`font-medium ${trialActive ? "text-amber-300" : "text-red-400"}`}>
                  {new Date(user.trialEnd).toLocaleDateString("es-MX")}
                  {trialActive && trialDaysLeft !== null && ` (${trialDaysLeft}d restantes)`}
                  {!trialActive && " (expirado)"}
                </span>
              </div>
            )}
            {user.planExpiry && (
              <div>
                <div className="text-xs text-gray-400 mb-1">Expiry de plan</div>
                <span className="font-medium text-gray-300">{new Date(user.planExpiry).toLocaleDateString("es-MX")}</span>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Change plan */}
            <div>
              <label className="text-xs text-gray-400 block mb-1">Cambiar plan</label>
              <select
                value={planType}
                onChange={(e) => setPlanType(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="trial">Prueba</option>
                <option value="pro">Pro</option>
                <option value="business">Business</option>
                <option value="enterprise">Enterprise</option>
                <option value="free">Gratis</option>
              </select>
            </div>

            {/* Plan expiry */}
            <div>
              <label className="text-xs text-gray-400 block mb-1">Expiry del plan</label>
              <input
                type="date"
                value={planExpiry}
                onChange={(e) => setPlanExpiry(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Extend trial */}
            <div>
              <label className="text-xs text-gray-400 block mb-1">Extender prueba (días)</label>
              <input
                type="number"
                min="1"
                max="365"
                placeholder="ej. 7"
                value={extendDays}
                onChange={(e) => setExtendDays(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={save}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
            {msg && <span className={`text-sm ${msg.includes("Error") ? "text-red-400" : "text-green-400"}`}>{msg}</span>}
          </div>
        </div>
      </div>

      {/* Activity log */}
      {recentActivity.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 mt-6">
          <h2 className="font-semibold text-gray-300 mb-4 text-sm uppercase tracking-wider">Actividad reciente</h2>
          <div className="space-y-2">
            {recentActivity.map((log) => (
              <div key={log.id} className="flex items-start gap-3 text-sm py-2 border-b border-gray-800 last:border-0">
                <span className="text-gray-500 text-xs mt-0.5 whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleDateString("es-MX")}
                </span>
                <div>
                  <span className="text-gray-400 font-medium">{log.action}</span>
                  {log.description && <span className="text-gray-500 ml-2">{log.description}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-gray-400 mt-0.5">{label}</div>
    </div>
  );
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between items-center gap-2">
      <span className="text-gray-500">{label}</span>
      <span className={valueClass || "text-gray-200"}>{value}</span>
    </div>
  );
}
