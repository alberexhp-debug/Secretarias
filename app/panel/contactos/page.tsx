"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  channel: string;
  notes: string;
  isBlocked: boolean;
  firstContactAt: string;
  lastInteraction: string;
  _count: { conversations: number; tickets: number; appointments: number };
}

const CHANNEL_ICONS: Record<string, string> = { whatsapp: "📱", email: "📧", phone: "📞" };

export default function ContactosPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showNew, setShowNew] = useState(false);
  const [newContact, setNewContact] = useState({ name: "", phone: "", email: "", channel: "whatsapp", notes: "" });

  useEffect(() => {
    loadContacts();
  }, [search, page]);

  async function loadContacts() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("q", search);
    const res = await fetch(`/api/panel/contacts?${params}`);
    const data = await res.json();
    setContacts(data.contacts || []);
    setTotal(data.total || 0);
    setLoading(false);
  }

  async function createContact() {
    await fetch("/api/panel/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newContact),
    });
    setShowNew(false);
    setNewContact({ name: "", phone: "", email: "", channel: "whatsapp", notes: "" });
    loadContacts();
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* List */}
      <div className={`${selected ? "hidden md:flex" : "flex"} flex-col w-full md:w-96 border-r border-gray-100 bg-white`}>
        <div className="p-4 border-b border-gray-100 flex-shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-gray-900">Contactos</h1>
            <button onClick={() => setShowNew(true)} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
              + Nuevo
            </button>
          </div>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar por nombre, teléfono o email..."
            className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-xs text-gray-400">{total} contacto{total !== 1 ? "s" : ""}</p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {loading ? (
            <div className="p-4 text-center text-gray-400">Cargando...</div>
          ) : contacts.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <div className="text-3xl mb-2">👥</div>
              <p className="font-medium text-gray-600">Sin contactos aún</p>
              <p className="text-sm">Aparecerán automáticamente cuando lleguen mensajes</p>
            </div>
          ) : (
            contacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => setSelected(contact)}
                className={`w-full text-left p-4 hover:bg-gray-50 ${selected?.id === contact.id ? "bg-indigo-50" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-semibold text-indigo-600 flex-shrink-0">
                    {contact.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">{contact.name}</span>
                      {contact.isBlocked && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Bloqueado</span>}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                      <span>{CHANNEL_ICONS[contact.channel]}</span>
                      <span>{contact.phone || contact.email || "Sin datos"}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="p-3 border-t border-gray-100 flex gap-2 justify-center">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            >
              ←
            </button>
            <span className="px-3 py-1 text-sm text-gray-600">Pág {page}</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page * 20 >= total}
              className="px-3 py-1 text-sm text-gray-500 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            >
              →
            </button>
          </div>
        )}
      </div>

      {/* Detail */}
      {selected ? (
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          <div className="max-w-xl mx-auto">
            <button onClick={() => setSelected(null)} className="md:hidden text-gray-400 hover:text-gray-600 mb-4">← Volver</button>

            {/* Profile header */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-2xl font-bold text-indigo-600">
                  {selected.name[0]}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selected.name}</h2>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{CHANNEL_ICONS[selected.channel]}</span>
                    <span>Primer contacto: {format(new Date(selected.firstContactAt), "d 'de' MMMM yyyy", { locale: es })}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                {selected.phone && (
                  <div>
                    <span className="text-xs text-gray-400 block mb-0.5">Teléfono</span>
                    <span className="font-medium text-gray-800">{selected.phone}</span>
                  </div>
                )}
                {selected.email && (
                  <div>
                    <span className="text-xs text-gray-400 block mb-0.5">Email</span>
                    <span className="font-medium text-gray-800">{selected.email}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{selected._count.conversations}</div>
                <div className="text-xs text-gray-500">Conversaciones</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{selected._count.appointments}</div>
                <div className="text-xs text-gray-500">Citas</div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{selected._count.tickets}</div>
                <div className="text-xs text-gray-500">Tickets</div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Notas sobre este contacto</h3>
              <textarea
                defaultValue={selected.notes}
                placeholder="Agrega notas privadas sobre este cliente (solo las ves tú)..."
                rows={4}
                className="w-full px-3 py-2 bg-yellow-50 border border-yellow-100 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-yellow-300"
              />
              <div className="flex gap-2 mt-3">
                {selected.isBlocked ? (
                  <button className="px-4 py-2 text-sm bg-green-100 text-green-700 rounded-xl hover:bg-green-200">
                    Desbloquear contacto
                  </button>
                ) : (
                  <button className="px-4 py-2 text-sm bg-red-50 text-red-600 rounded-xl hover:bg-red-100">
                    Bloquear contacto
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center text-gray-400 bg-gray-50">
          <div className="text-center">
            <div className="text-4xl mb-3">👥</div>
            <p className="font-medium">Selecciona un contacto</p>
          </div>
        </div>
      )}

      {/* New contact modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Nuevo contacto</h3>
            <input placeholder="Nombre" value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm" />
            <input placeholder="Teléfono (opcional)" value={newContact.phone} onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm" />
            <input placeholder="Email (opcional)" value={newContact.email} onChange={(e) => setNewContact({ ...newContact, email: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm" />
            <select value={newContact.channel} onChange={(e) => setNewContact({ ...newContact, channel: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm">
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
              <option value="phone">Teléfono</option>
            </select>
            <textarea placeholder="Notas (opcional)..." value={newContact.notes} onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })} rows={2} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none" />
            <div className="flex gap-3">
              <button onClick={() => setShowNew(false)} className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium">Cancelar</button>
              <button onClick={createContact} disabled={!newContact.name} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">Crear</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
