"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Conversation {
  id: string;
  channel: string;
  status: string;
  lastMessage: string;
  lastMessageAt: string;
  contact: { id: string; name: string; phone?: string; email?: string } | null;
  messages: Array<{ id: string; sender: string; content: string; createdAt: string; channel: string }>;
}

const CHANNEL_ICONS: Record<string, string> = { whatsapp: "📱", email: "📧", phone: "📞" };
const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500",
  closed: "bg-gray-300",
  escalated: "bg-orange-400",
  archived: "bg-gray-200",
};

export default function ConversacionesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadConversations();
  }, [filter]);

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
  }

  async function sendReply() {
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

  return (
    <div className="flex h-screen overflow-hidden">
      {/* List */}
      <div className={`${selected ? "hidden md:flex" : "flex"} flex-col w-full md:w-96 border-r border-gray-100 bg-white`}>
        <div className="p-4 border-b border-gray-100 flex-shrink-0">
          <h1 className="text-lg font-bold text-gray-900 mb-3">Conversaciones</h1>
          <div className="flex gap-1">
            {["all", "whatsapp", "email"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-medium ${filter === f ? "bg-indigo-100 text-indigo-700" : "text-gray-500 hover:bg-gray-100"}`}
              >
                {f === "all" ? "Todas" : f.charAt(0).toUpperCase() + f.slice(1)}
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
                  <div className="relative">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-semibold text-indigo-600">
                      {conv.contact?.name?.[0] || "?"}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${STATUS_COLORS[conv.status]}`}></div>
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
                      <span className="text-xs">{CHANNEL_ICONS[conv.channel]}</span>
                      <p className="text-xs text-gray-500 truncate">{conv.lastMessage || "Sin mensajes"}</p>
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
          <div className="p-4 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-3">
              <button onClick={() => setSelected(null)} className="md:hidden text-gray-400 hover:text-gray-600">←</button>
              <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-semibold text-indigo-600">
                {selected.contact?.name?.[0] || "?"}
              </div>
              <div>
                <div className="font-semibold text-gray-900">{selected.contact?.name || "Contacto"}</div>
                <div className="text-xs text-gray-500">
                  {CHANNEL_ICONS[selected.channel]} {selected.channel}
                  {selected.contact?.phone && ` · ${selected.contact.phone}`}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {selected.messages.length === 0 ? (
              <div className="text-center text-gray-400 py-8">Sin mensajes en esta conversación</div>
            ) : (
              selected.messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === "client" ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl text-sm ${
                    msg.sender === "client"
                      ? "bg-white text-gray-800 shadow-sm rounded-tl-sm"
                      : msg.sender === "owner"
                      ? "bg-indigo-600 text-white rounded-tr-sm"
                      : "bg-blue-100 text-blue-900 rounded-tr-sm"
                  }`}>
                    <p>{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.sender === "client" ? "text-gray-400" : "text-white/70"}`}>
                      {msg.sender === "owner" ? "[Dueño] respondió manualmente" : msg.sender === "secretary" ? "Secretario" : ""}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t border-gray-100 flex-shrink-0">
            <div className="flex gap-2">
              <input
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendReply()}
                placeholder="Intervenir y responder como dueño..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={sendReply}
                disabled={sending || !replyText.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              >
                Enviar
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">El secretario pausará esta conversación 30 min cuando intervengas</p>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-gray-400 bg-gray-50">
          <div className="text-center">
            <div className="text-4xl mb-3">💬</div>
            <p className="font-medium">Selecciona una conversación</p>
          </div>
        </div>
      )}
    </div>
  );
}
