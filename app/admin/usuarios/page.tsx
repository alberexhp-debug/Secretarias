"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";

interface User {
  id: string;
  email: string;
  name: string | null;
  planType: string;
  trialEnd: string | null;
  planExpiry: string | null;
  onboardingDone: boolean;
  createdAt: string;
  secretary: { name: string | null; businessName: string | null; whatsappConnected: boolean } | null;
  conversations: number;
  tickets: number;
}

interface ListResponse {
  users: User[];
  total: number;
  page: number;
  pages: number;
}

const PLAN_COLORS: Record<string, string> = {
  trial: "bg-amber-900/40 text-amber-300 border-amber-700",
  pro: "bg-green-900/40 text-green-300 border-green-700",
  business: "bg-purple-900/40 text-purple-300 border-purple-700",
  enterprise: "bg-indigo-900/40 text-indigo-300 border-indigo-700",
  free: "bg-gray-800 text-gray-400 border-gray-700",
};

function UsersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [plan, setPlan] = useState(searchParams.get("plan") || "");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (plan) params.set("plan", plan);
    params.set("page", String(page));

    fetch(`/api/admin/users?${params}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, [search, plan, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`¿Eliminar la cuenta de ${email}? Esta acción no se puede deshacer.`)) return;
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    fetchUsers();
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-gray-400 text-sm mt-1">{data?.total ?? "..."} usuarios en total</p>
        </div>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-6 flex-wrap">
        <input
          type="text"
          placeholder="Buscar por email o nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={plan}
          onChange={(e) => { setPlan(e.target.value); setPage(1); }}
          className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Todos los planes</option>
          <option value="trial">Prueba</option>
          <option value="pro">Pro</option>
          <option value="business">Business</option>
          <option value="free">Gratis</option>
        </select>
        <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm transition-colors">
          Buscar
        </button>
      </form>

      {/* Table */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 animate-pulse">Cargando...</div>
        ) : !data?.users.length ? (
          <div className="p-8 text-center text-gray-500">No se encontraron usuarios</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Usuario</th>
                  <th className="text-left px-4 py-3">Plan</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Secretario</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">Conv.</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">Tickets</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Registro</th>
                  <th className="text-right px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {data.users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-white truncate max-w-48">{user.email}</div>
                      {user.name && <div className="text-gray-400 text-xs">{user.name}</div>}
                      {!user.onboardingDone && (
                        <span className="text-xs text-orange-400">Sin onboarding</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <PlanBadge planType={user.planType} trialEnd={user.trialEnd} planExpiry={user.planExpiry} />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {user.secretary ? (
                        <div>
                          <div className="text-white">{user.secretary.name || "—"}</div>
                          <div className="text-gray-400 text-xs">{user.secretary.businessName || ""}</div>
                          {user.secretary.whatsappConnected && (
                            <span className="text-xs text-green-400">📱 WA</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-gray-300">{user.conversations}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-gray-300">{user.tickets}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-400 text-xs">
                      {new Date(user.createdAt).toLocaleDateString("es-MX")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/usuarios/${user.id}`}
                          className="text-indigo-400 hover:text-indigo-300 text-xs px-2 py-1 rounded hover:bg-indigo-900/30 transition-colors"
                        >
                          Ver
                        </Link>
                        <button
                          onClick={() => handleDelete(user.id, user.email)}
                          className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded hover:bg-red-900/30 transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-400">
          <span>Página {data.page} de {data.pages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 bg-gray-800 rounded-lg disabled:opacity-40 hover:bg-gray-700 transition-colors"
            >
              ← Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
              disabled={page === data.pages}
              className="px-3 py-1 bg-gray-800 rounded-lg disabled:opacity-40 hover:bg-gray-700 transition-colors"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PlanBadge({ planType, trialEnd, planExpiry }: { planType: string; trialEnd: string | null; planExpiry: string | null }) {
  const now = new Date();
  let expired = false;
  let daysLeft: number | null = null;

  if (planType === "trial" && trialEnd) {
    const end = new Date(trialEnd);
    expired = end < now;
    if (!expired) daysLeft = Math.ceil((end.getTime() - now.getTime()) / 86400000);
  } else if (planExpiry) {
    expired = new Date(planExpiry) < now;
  }

  return (
    <div>
      <span className={`inline-block text-xs px-2 py-0.5 rounded-full border font-medium ${PLAN_COLORS[planType] || PLAN_COLORS.free}`}>
        {planType}
      </span>
      {expired && <div className="text-xs text-red-400 mt-0.5">Expirado</div>}
      {!expired && daysLeft !== null && <div className="text-xs text-amber-400 mt-0.5">{daysLeft}d</div>}
    </div>
  );
}

export default function UsuariosPage() {
  return (
    <Suspense fallback={<div className="p-10 text-gray-400">Cargando...</div>}>
      <UsersContent />
    </Suspense>
  );
}
