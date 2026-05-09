"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow, differenceInHours } from "date-fns";
import { es } from "date-fns/locale";

interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  channel: string;
  reason: string;
  internalNotes: string;
  createdAt: string;
  updatedAt: string;
  contact: { id: string; name: string } | null;
  messages: Array<{ id: string; sender: string; content: string; createdAt: string }>;
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-400",
  normal: "bg-blue-400",
  low: "bg-gray-300",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  in_progress: "En progreso",
  resolved: "Resuelto",
  postponed: "Pospuesto",
};

const CHANNEL_ICONS: Record<string, string> = {
  whatsapp: "📱", email: "📧", phone: "📞",
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [replyText, setReplyText] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({ title: "", description: "", priority: "normal", channel: "whatsapp" });

  useEffect(() => {
    loadTickets();
  }, [filter]);

  async function loadTickets() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== "all") {
      if (["pending", "resolved"].includes(filter)) params.set("status", filter);
      else if (filter === "urgent") params.set("priority", "urgent");
    }
    const res = await fetch(`/api/panel/tickets?${params}`);
    const data = await res.json();
    setTickets(data.tickets || []);
    setLoading(false);
  }

  async function openTicket(ticket: Ticket) {
    const res = await fetch(`/api/panel/tickets/${ticket.id}`);
    const data = await res.json();
    setSelected(data.ticket);
    setNotes(data.ticket.internalNotes || "");
    setReplyText("");
  }

  async function handleAction(status: string, sendReply = false) {
    if (!selected) return;
    setSaving(true);

    await fetch(`/api/panel/tickets/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        internalNotes: notes,
        message: sendReply && replyText ? replyText : undefined,
      }),
    });

    await loadTickets();
    setSelected(null);
    setSaving(false);
  }

  async function createTicket() {
    await fetch("/api/panel/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTicket),
    });
    setShowNewTicket(false);
    setNewTicket({ title: "", description: "", priority: "normal", channel: "whatsapp" });
    loadTickets();
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* List */}
      <div className={`${selected ? "hidden md:flex" : "flex"} flex-col w-full md:w-96 border-r border-gray-100 bg-white`}>
        <div className="p-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-gray-900">Tickets</h1>
            <button onClick={() => setShowNewTicket(true)} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
              + Nuevo
            </button>
          </div>
          <div className="flex gap-1 flex-wrap">
            {["all", "pending", "urgent", "resolved"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-medium ${filter === f ? "bg-indigo-100 text-indigo-700" : "text-gray-500 hover:bg-gray-100"}`}
              >
                {f === "all" ? "Todos" : f === "pending" ? "Pendientes" : f === "urgent" ? "Urgentes" : "Resueltos"}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {loading ? (
            <div className="p-4 text-center text-gray-400">Cargando...</div>
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <div className="text-3xl mb-2">🎉</div>
              <p className="font-medium text-gray-600">Sin tickets pendientes</p>
              <p className="text-sm">Tu secretario está manejando todo</p>
            </div>
          ) : (
            tickets.map((ticket) => {
              const hoursOld = differenceInHours(new Date(), new Date(ticket.createdAt));
              const isStale = hoursOld > 4;
              const isVeryStale = hoursOld > 24;
              return (
                <button
                  key={ticket.id}
                  onClick={() => openTicket(ticket)}
                  className={`w-full text-left p-4 hover:bg-gray-50 ${isVeryStale ? "border-l-2 border-red-500" : ""} ${selected?.id === ticket.id ? "bg-indigo-50" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-1 h-full min-h-[40px] rounded-full ${PRIORITY_COLORS[ticket.priority]} flex-shrink-0 mt-1`} style={{ width: "3px" }}></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900 truncate">{ticket.title}</span>
                        {ticket.priority === "urgent" && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Urgente</span>}
                      </div>
                      {ticket.contact && <p className="text-xs text-gray-500">{ticket.contact.name}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs">{CHANNEL_ICONS[ticket.channel]}</span>
                        <span className={`text-xs ${isStale ? "text-red-500 font-medium" : "text-gray-400"}`}>
                          {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true, locale: es })}
                        </span>
                        <span className="text-xs text-gray-400">· {STATUS_LABELS[ticket.status]}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Detail */}
      {selected ? (
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-start gap-3">
              <button onClick={() => setSelected(null)} className="md:hidden text-gray-400 hover:text-gray-600 mt-1">←</button>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[selected.priority]}`}></div>
                  <h2 className="font-semibold text-gray-900">{selected.title}</h2>
                </div>
                <div className="flex gap-3 text-sm text-gray-500">
                  {selected.contact && <span>{selected.contact.name}</span>}
                  <span>{CHANNEL_ICONS[selected.channel]} {selected.channel}</span>
                  <span>{STATUS_LABELS[selected.status]}</span>
                </div>
                {selected.reason && (
                  <div className="mt-2 text-xs bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg">
                    Razón de escalación: {selected.reason}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {selected.description && (
              <div className="text-sm bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                <span className="text-gray-400 text-xs">Descripción:</span>
                <p className="text-gray-700 mt-1">{selected.description}</p>
              </div>
            )}
            {selected.messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === "owner" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl text-sm ${msg.sender === "owner" ? "bg-indigo-600 text-white rounded-tr-sm" : msg.sender === "secretary" ? "bg-blue-100 text-blue-900 rounded-tl-sm" : "bg-white text-gray-800 shadow-sm rounded-tl-sm"}`}>
                  <p>{msg.content}</p>
                  <p className={`text-xs mt-1 ${msg.sender === "owner" ? "text-indigo-200" : "text-gray-400"}`}>
                    {msg.sender === "owner" ? "Tú" : msg.sender === "secretary" ? "Secretario" : "Cliente"} ·{" "}
                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: es })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Reply + Actions */}
          <div className="p-4 border-t border-gray-100 flex-shrink-0 space-y-3">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Escribe tu respuesta al cliente..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />

            <div>
              <label className="block text-xs text-gray-400 mb-1">Notas internas (solo tu equipo)</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas privadas..."
                className="w-full px-3 py-2 border border-gray-100 bg-yellow-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <button onClick={() => handleAction("resolved", true)} disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                {replyText ? "Enviar y resolver" : "Resolver"}
              </button>
              <button onClick={() => handleAction("in_progress")} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                En progreso
              </button>
              <button onClick={() => handleAction("postponed")} disabled={saving} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50">
                Posponer 24h
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-gray-400 bg-gray-50">
          <div className="text-center">
            <div className="text-4xl mb-3">🎫</div>
            <p className="font-medium">Selecciona un ticket</p>
            <p className="text-sm mt-1">para ver el detalle y responder</p>
          </div>
        </div>
      )}

      {/* New ticket modal */}
      {showNewTicket && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Nuevo ticket</h3>
            <input
              placeholder="Título del ticket"
              value={newTicket.title}
              onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <textarea
              placeholder="Descripción..."
              value={newTicket.description}
              onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
            <div className="flex gap-3">
              <select
                value={newTicket.priority}
                onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm"
              >
                <option value="low">Baja</option>
                <option value="normal">Normal</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
              <select
                value={newTicket.channel}
                onChange={(e) => setNewTicket({ ...newTicket, channel: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm"
              >
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
                <option value="phone">Teléfono</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowNewTicket(false)} className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium">
                Cancelar
              </button>
              <button onClick={createTicket} disabled={!newTicket.title} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
                Crear ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
