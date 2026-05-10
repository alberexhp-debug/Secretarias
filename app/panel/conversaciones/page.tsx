"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Message {
  id: string;
  sender: string;
  content: string;
  createdAt: string;
  channel: string;
  status: string;
  metadata?: string;
}

interface Conversation {
  id: string;
  channel: string;
  status: string;
  subject?: string;
  lastMessage: string;
  lastMessageAt: string;
  contact: { id: string; name: string; phone?: string; email?: string } | null;
  messages: Message[];
}

const CHANNEL_ICONS: Record<string, string> = { whatsapp: "📱", email: "📧", phone: "📞", web: "🌐" };
const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500", closed: "bg-gray-300", escalated: "bg-orange-400", archived: "bg-gray-200",
};
const CATEGORY_COLORS: Record<string, string> = {
  solicitud_cita: "bg-blue-100 text-blue-700",
  presupuesto: "bg-green-100 text-green-700",
  queja_reclamacion: "bg-red-100 text-red-700",
  cancelacion: "bg-orange-100 text-orange-700",
  seguimiento: "bg-purple-100 text-purple-700",
  consulta_general: "bg-gray-100 text-gray-600",
  otro: "bg-gray-100 text-gray-500",
};

export default function ConversacionesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  // For email pending reply editing
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => { loadConversations(); }, [filter]);

  async function loadConversations() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== "all") params.set("channel", filter);
    const res = await fetch(`/api/panel/conversations?${params}`);
    const data = await res.json();
    setConversations(data.conversations || []);
    setLoading(false);
  }

  async function openConversation(conv: Conversation) {
    const res = await fetch(`/api/panel/conversations/${conv.id}`);
    const data = await res.json();
    setSelected(data.conversation);
    setReplyText("");
    setEditingMessageId(null);
  }

  async function sendManualReply() {
    if (!selected || !replyText.trim() || sending) return;
    setSending(true);
    await fetch(`/api/panel/conversations/${selected.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: replyText }),
    });
    const res = await fetch(`/api/panel/conversations/${selected.id}`);
    const data = await res.json();
    setSelected(data.conversation);
    setReplyText("");
    setSending(false);
    loadConversations();
  }

  async function handleEmailReply(messageId: string, action: "confirm" | "cancel", edited?: string) {
    setSending(true);
    await fetch("/api/panel/conversations/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, action, editedContent: edited }),
    });
    // Refresh conversation
    const res = await fetch(`/api/panel/conversations/${selected!.id}`);
    const data = await res.json();
    setSelected(data.conversation);
    setEditingMessageId(null);
    setSending(false);
    loadConversations();
  }

  function startEditing(msg: Message) {
    setEditingMessageId(msg.id);
    setEditContent(msg.content);
  }

  const pendingCount = conversations.reduce((n, c) => {
    return n; // We don't have messages at list level, handled in detail
  }, 0);
  void pendingCount;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* List */}
      <div className={`${selected ? "hidden md:flex" : "flex"} flex-col w-full md:w-96 border-r border-gray-100 bg-white`}>
        <div className="p-4 border-b border-gray-100 flex-shrink-0">
          <h1 className="text-lg font-bold text-gray-900 mb-3">Conversaciones</h1>
          <div className="flex gap-1 flex-wrap">
            {["all", "email", "whatsapp", "web"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-medium ${filter === f ? "bg-indigo-100 text-indigo-700" : "text-gray-500 hover:bg-gray-100"}`}
              >
                {f === "all" ? "Todas" : CHANNEL_ICONS[f] + " " + f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {loading ? (
            <div className="p-4 text-center text-gray-400">Cargando...</div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <div className="text-3xl mb-2">💬</div>
              <p className="font-medium text-gray-600">Sin conversaciones aún</p>
              <p className="text-sm mt-1">Cuando lleguen mensajes aparecerán aquí</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => openConversation(conv)}
                className={`w-full text-left p-4 hover:bg-gray-50 ${selected?.id === conv.id ? "bg-indigo-50" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-semibold text-indigo-600">
                      {conv.contact?.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${STATUS_COLORS[conv.status] || "bg-gray-300"}`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {conv.contact?.name || "Contacto desconocido"}
                      </span>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false, locale: es })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs">{CHANNEL_ICONS[conv.channel] || "💬"}</span>
                      {conv.subject && (
                        <p className="text-xs text-gray-700 font-medium truncate">{conv.subject}</p>
                      )}
                      {!conv.subject && (
                        <p className="text-xs text-gray-500 truncate">{conv.lastMessage || "Sin mensajes"}</p>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Detail */}
      {selected ? (
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setSelected(null)} className="md:hidden text-gray-400 hover:text-gray-600 text-lg">←</button>
              <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-semibold text-indigo-600 flex-shrink-0">
                {selected.contact?.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="min-w-0">
                <div className="font-semibold text-gray-900">{selected.contact?.name || "Contacto"}</div>
                <div className="text-xs text-gray-500 truncate">
                  {CHANNEL_ICONS[selected.channel]} {selected.channel}
                  {selected.contact?.email && ` · ${selected.contact.email}`}
                  {selected.contact?.phone && ` · ${selected.contact.phone}`}
                </div>
                {selected.subject && (
                  <div className="text-xs text-gray-700 font-medium mt-0.5 truncate">📨 {selected.subject}</div>
                )}
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {selected.messages.length === 0 ? (
              <div className="text-center text-gray-400 py-8">Sin mensajes en esta conversación</div>
            ) : (
              selected.messages.map((msg) => {
                let meta: Record<string, unknown> = {};
                try { meta = JSON.parse(msg.metadata || "{}"); } catch { meta = {}; }
                const isPending = msg.status === "pending" && msg.sender === "secretary";
                const isCancelled = msg.status === "cancelled";
                const isSuggestion = meta.isSuggestion as boolean;
                const category = meta.category as string;
                const categoryLabel = meta.categoryLabel as string;
                const isEditing = editingMessageId === msg.id;

                // Pending email suggestion — show full card with actions
                if (isPending && isSuggestion) {
                  return (
                    <div key={msg.id} className="bg-white border-2 border-amber-200 rounded-2xl shadow-sm overflow-hidden">
                      <div className="bg-amber-50 px-4 py-2.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-amber-800">✉️ Respuesta sugerida — pendiente de envío</span>
                          {category && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[category] || CATEGORY_COLORS.otro}`}>
                              {categoryLabel || category}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-amber-600 flex-shrink-0">Para: {meta.toEmail as string}</span>
                      </div>

                      {isEditing ? (
                        <div className="p-4">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={6}
                            className="w-full text-sm text-gray-800 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                          />
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handleEmailReply(msg.id, "confirm", editContent)}
                              disabled={sending || !editContent.trim()}
                              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-xl transition-colors"
                            >
                              {sending ? "Enviando…" : "✅ Enviar"}
                            </button>
                            <button
                              onClick={() => setEditingMessageId(null)}
                              className="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50"
                            >
                              Cancelar edición
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4">
                          <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">{msg.content}</p>
                          <div className="flex gap-2 mt-4">
                            <button
                              onClick={() => handleEmailReply(msg.id, "confirm")}
                              disabled={sending}
                              className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-xl transition-colors"
                            >
                              {sending ? "Enviando…" : "✅ Confirmar y enviar"}
                            </button>
                            <button
                              onClick={() => startEditing(msg)}
                              className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                            >
                              ✏️ Editar
                            </button>
                            <button
                              onClick={() => handleEmailReply(msg.id, "cancel")}
                              disabled={sending}
                              className="px-4 py-2 text-red-500 border border-red-100 text-sm rounded-xl hover:bg-red-50 transition-colors"
                            >
                              ✕ Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                // Cancelled suggestion
                if (isCancelled && isSuggestion) {
                  return (
                    <div key={msg.id} className="text-center">
                      <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">Respuesta cancelada</span>
                    </div>
                  );
                }

                // Sent secretary message (confirmed)
                if (msg.sender === "secretary" && msg.status === "sent" && isSuggestion) {
                  return (
                    <div key={msg.id} className="flex justify-end">
                      <div className="max-w-xs md:max-w-md">
                        <div className="bg-blue-100 text-blue-900 px-4 py-2 rounded-2xl rounded-tr-sm text-sm whitespace-pre-line">
                          {msg.content}
                        </div>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-xs text-gray-400">Secretario · enviado ✓</span>
                          {!!meta.edited && <span className="text-xs text-gray-400">(editado)</span>}
                        </div>
                      </div>
                    </div>
                  );
                }

                // Regular message bubble
                return (
                  <div key={msg.id} className={`flex ${msg.sender === "client" ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-xs md:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                      msg.sender === "client"
                        ? "bg-white text-gray-800 shadow-sm rounded-tl-sm"
                        : msg.sender === "owner"
                        ? "bg-indigo-600 text-white rounded-tr-sm"
                        : "bg-blue-100 text-blue-900 rounded-tr-sm"
                    }`}>
                      <p className="whitespace-pre-line">{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.sender === "client" ? "text-gray-400" : msg.sender === "owner" ? "text-white/70" : "text-blue-600/70"}`}>
                        {msg.sender === "owner" ? "Tú (manual)" : msg.sender === "secretary" ? "Secretario" : ""}
                        {" · "}{formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: es })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Manual reply bar (always available) */}
          <div className="p-4 border-t border-gray-100 flex-shrink-0 bg-white">
            <div className="flex gap-2">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendManualReply()}
                placeholder="Intervenir y responder manualmente..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={sendManualReply}
                disabled={sending || !replyText.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                Enviar
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              Respuesta manual como dueño · el secretario pausará 30 min al intervenir
            </p>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-gray-400 bg-gray-50">
          <div className="text-center">
            <div className="text-4xl mb-3">💬</div>
            <p className="font-medium text-gray-600">Selecciona una conversación</p>
            <p className="text-sm mt-1 text-gray-400">Los emails pendientes aparecen con botones de confirmación</p>
          </div>
        </div>
      )}
    </div>
  );
}
