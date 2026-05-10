"use client";

import { useEffect, useState, useCallback } from "react";

const AVATARS = [
  { id: "avatar-1", emoji: "👩" }, { id: "avatar-2", emoji: "👨" },
  { id: "avatar-3", emoji: "👩‍💼" }, { id: "avatar-4", emoji: "👨‍💼" },
  { id: "avatar-5", emoji: "🧑‍💼" }, { id: "avatar-6", emoji: "👩‍🔬" },
  { id: "avatar-7", emoji: "👨‍🔬" }, { id: "avatar-8", emoji: "🧑‍🎨" },
  { id: "avatar-9", emoji: "👩‍🏫" }, { id: "avatar-10", emoji: "👨‍🏫" },
  { id: "avatar-11", emoji: "🧑‍🔧" }, { id: "avatar-12", emoji: "👩‍🍳" },
];

const TABS = [
  { id: "secretary", label: "Mi Secretario" },
  { id: "business", label: "Mi Negocio" },
  { id: "schedule", label: "Horario" },
  { id: "rules", label: "Reglas y FAQs" },
  { id: "channels", label: "Canales" },
  { id: "notifications", label: "Notificaciones" },
  { id: "billing", label: "Plan y Facturación" },
];

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

interface SecretaryConfig {
  name: string;
  avatarId: string;
  tone: string;
  businessName: string;
  businessType: string;
  businessDesc: string;
  city: string;
  faqs: Array<{ q: string; a: string }>;
  rules: string[];
  schedule: Record<string, { active: boolean; from: string; to: string }>;
  appointmentDuration: number;
  appointmentBuffer: number;
  appointmentMinAdvance: number;
  whatsappNumber?: string;
  emailAddress?: string;
  whatsappConnected: boolean;
  emailConnected: boolean;
  calendarConnected: boolean;
}

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState("secretary");
  const [config, setConfig] = useState<SecretaryConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newRule, setNewRule] = useState("");
  const [newFaqQ, setNewFaqQ] = useState("");
  const [newFaqA, setNewFaqA] = useState("");

  // Email accounts state
  interface EmailAccount { id: string; provider: string; email: string; label: string; connected: boolean; lastChecked: string | null }
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [showAddEmail, setShowAddEmail] = useState(false);
  const [addEmailTab, setAddEmailTab] = useState<"gmail" | "outlook" | "imap">("gmail");
  const [imapEmail, setImapEmail] = useState("");
  const [imapPassword, setImapPassword] = useState("");
  const [imapHost, setImapHost] = useState("");
  const [imapPort, setImapPort] = useState("");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("");
  const [imapSaving, setImapSaving] = useState(false);
  const [imapMsg, setImapMsg] = useState("");
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importMsg, setImportMsg] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/panel/secretary")
      .then((r) => r.json())
      .then((d) => {
        const s = d.secretary;
        const defaultSchedule = DAYS.reduce((acc, day, i) => ({
          ...acc,
          [day]: { active: i < 5, from: "09:00", to: "18:00" },
        }), {});
        setConfig({
          ...s,
          schedule: s.schedule && Object.keys(s.schedule).length > 0 ? s.schedule : defaultSchedule,
          faqs: Array.isArray(s.faqs) ? s.faqs : [],
          rules: Array.isArray(s.rules) ? s.rules : [],
        });
      });
  }, []);

  const loadEmailAccounts = useCallback(() => {
    fetch("/api/panel/email-accounts").then((r) => r.json()).then((d) => setEmailAccounts(d.accounts || []));
  }, []);

  useEffect(() => { loadEmailAccounts(); }, [loadEmailAccounts]);

  async function connectImap() {
    setImapSaving(true); setImapMsg("");
    const r = await fetch("/api/panel/email-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: imapEmail, password: imapPassword, imapHost: imapHost || undefined, imapPort: imapPort ? parseInt(imapPort) : undefined, smtpHost: smtpHost || undefined, smtpPort: smtpPort ? parseInt(smtpPort) : undefined }),
    });
    const d = await r.json();
    if (r.ok) { setImapMsg("✓ Cuenta conectada"); loadEmailAccounts(); setShowAddEmail(false); setImapEmail(""); setImapPassword(""); }
    else setImapMsg(d.error || "Error al conectar");
    setImapSaving(false);
  }

  async function removeAccount(id: string) {
    await fetch(`/api/panel/email-accounts/${id}`, { method: "DELETE" });
    loadEmailAccounts();
  }

  async function toggleAccount(id: string, connected: boolean) {
    await fetch(`/api/panel/email-accounts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ connected }) });
    loadEmailAccounts();
  }

  async function importSent(id: string) {
    setImportingId(id); setImportMsg((m) => ({ ...m, [id]: "" }));
    const r = await fetch(`/api/panel/email-accounts/${id}/import-sent`, { method: "POST" });
    const d = await r.json();
    setImportMsg((m) => ({ ...m, [id]: r.ok ? `✓ ${d.imported} emails importados` : (d.error || "Error") }));
    setImportingId(null);
  }

  async function save(partial?: Partial<SecretaryConfig>) {
    if (!config) return;
    setSaving(true);
    const data = partial || config;
    await fetch("/api/panel/secretary", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function addRule() {
    if (!newRule.trim() || !config) return;
    const updated = { ...config, rules: [...config.rules, newRule.trim()] };
    setConfig(updated);
    setNewRule("");
    save({ rules: updated.rules });
  }

  function removeRule(i: number) {
    if (!config) return;
    const updated = { ...config, rules: config.rules.filter((_, idx) => idx !== i) };
    setConfig(updated);
    save({ rules: updated.rules });
  }

  function addFaq() {
    if (!newFaqQ.trim() || !newFaqA.trim() || !config) return;
    const updated = { ...config, faqs: [...config.faqs, { q: newFaqQ.trim(), a: newFaqA.trim() }] };
    setConfig(updated);
    setNewFaqQ("");
    setNewFaqA("");
    save({ faqs: updated.faqs });
  }

  function removeFaq(i: number) {
    if (!config) return;
    const updated = { ...config, faqs: config.faqs.filter((_, idx) => idx !== i) };
    setConfig(updated);
    save({ faqs: updated.faqs });
  }

  if (!config) return <div className="p-8 text-center text-gray-400">Cargando configuración...</div>;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Configuración</h1>
        {saved && <span className="text-green-600 text-sm font-medium">✓ Guardado</span>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${activeTab === tab.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Mi Secretario */}
      {activeTab === "secretary" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Nombre del secretario</h2>
            <input
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Avatar</h2>
            <div className="grid grid-cols-6 gap-3">
              {AVATARS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setConfig({ ...config, avatarId: a.id })}
                  className={`text-3xl p-2 rounded-xl border-2 ${config.avatarId === a.id ? "border-indigo-500 bg-indigo-50" : "border-gray-100 hover:border-gray-200"}`}
                >
                  {a.emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Tono de comunicación</h2>
            <div className="space-y-2">
              {[
                { id: "profesional", label: "Profesional", desc: "Formal y respetuoso" },
                { id: "amigable", label: "Amigable", desc: "Cálido y cercano" },
                { id: "cercano", label: "Cercano", desc: "Casual y relajado" },
              ].map((tone) => (
                <button
                  key={tone.id}
                  onClick={() => setConfig({ ...config, tone: tone.id })}
                  className={`w-full text-left p-4 rounded-xl border-2 ${config.tone === tone.id ? "border-indigo-500 bg-indigo-50" : "border-gray-100 hover:border-gray-200"}`}
                >
                  <span className="font-medium text-gray-900">{tone.label}</span>
                  <span className="text-sm text-gray-500 ml-2">— {tone.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => save()} disabled={saving} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50">
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      )}

      {/* Tab: Mi Negocio */}
      {activeTab === "business" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Información del negocio</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del negocio</label>
              <input value={config.businessName} onChange={(e) => setConfig({ ...config, businessName: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de negocio</label>
              <input value={config.businessType} onChange={(e) => setConfig({ ...config, businessType: e.target.value })} placeholder="Ej: Clínica dental, Taller mecánico..." className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad / Zona</label>
              <input value={config.city} onChange={(e) => setConfig({ ...config, city: e.target.value })} placeholder="Ej: CDMX, Guadalajara..." className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del negocio</label>
              <textarea value={config.businessDesc} onChange={(e) => setConfig({ ...config, businessDesc: e.target.value })} rows={4} placeholder="Describe qué hace tu negocio, servicios que ofreces, etc." className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            </div>
          </div>
          <button onClick={() => save()} disabled={saving} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50">
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      )}

      {/* Tab: Horario */}
      {activeTab === "schedule" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Horario de atención</h2>
            <div className="space-y-3">
              {DAYS.map((day) => {
                const dayConfig = config.schedule[day] || { active: false, from: "09:00", to: "18:00" };
                return (
                  <div key={day} className="flex items-center gap-4">
                    <div className="flex items-center gap-2 w-28">
                      <button
                        onClick={() => setConfig({ ...config, schedule: { ...config.schedule, [day]: { ...dayConfig, active: !dayConfig.active } } })}
                        className={`w-10 h-5 rounded-full relative transition-colors ${dayConfig.active ? "bg-indigo-500" : "bg-gray-200"}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${dayConfig.active ? "translate-x-5" : ""}`}></span>
                      </button>
                      <span className={`text-sm ${dayConfig.active ? "text-gray-800 font-medium" : "text-gray-400"}`}>{day}</span>
                    </div>
                    {dayConfig.active && (
                      <div className="flex items-center gap-2">
                        <input type="time" value={dayConfig.from} onChange={(e) => setConfig({ ...config, schedule: { ...config.schedule, [day]: { ...dayConfig, from: e.target.value } } })} className="border border-gray-200 rounded-lg px-2 py-1 text-sm" />
                        <span className="text-gray-400">—</span>
                        <input type="time" value={dayConfig.to} onChange={(e) => setConfig({ ...config, schedule: { ...config.schedule, [day]: { ...dayConfig, to: e.target.value } } })} className="border border-gray-200 rounded-lg px-2 py-1 text-sm" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Configuración de citas</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Duración default</label>
                <select value={config.appointmentDuration} onChange={(e) => setConfig({ ...config, appointmentDuration: parseInt(e.target.value) })} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
                  {[15, 30, 45, 60, 90, 120].map((d) => <option key={d} value={d}>{d} min</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Buffer entre citas</label>
                <select value={config.appointmentBuffer} onChange={(e) => setConfig({ ...config, appointmentBuffer: parseInt(e.target.value) })} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
                  {[0, 10, 15, 30].map((d) => <option key={d} value={d}>{d === 0 ? "Sin buffer" : `${d} min`}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Anticipación mínima</label>
                <select value={config.appointmentMinAdvance} onChange={(e) => setConfig({ ...config, appointmentMinAdvance: parseInt(e.target.value) })} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
                  <option value={0}>Sin mínimo</option>
                  <option value={2}>2 horas</option>
                  <option value={4}>4 horas</option>
                  <option value={24}>24 horas</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-sm text-indigo-700">
            <strong>Ahora mismo:</strong> {new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })} — {
              config.schedule[DAYS[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]]?.active ? "DENTRO de horario ✓" : "FUERA de horario"
            }
          </div>

          <button onClick={() => save()} disabled={saving} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50">
            {saving ? "Guardando..." : "Guardar horario"}
          </button>
        </div>
      )}

      {/* Tab: Reglas y FAQs */}
      {activeTab === "rules" && (
        <div className="space-y-6">
          {/* Rules */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-1">Reglas del secretario</h2>
            <p className="text-sm text-gray-500 mb-4">Instrucciones en lenguaje natural. Ej: &apos;Nunca dar precios por WhatsApp&apos;</p>
            <div className="space-y-2 mb-4">
              {config.rules.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Sin reglas. Agrega la primera.</p>
              ) : (
                config.rules.map((rule, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <span className="text-gray-400 text-sm">{i + 1}.</span>
                    <span className="flex-1 text-sm text-gray-800">{rule}</span>
                    <button onClick={() => removeRule(i)} className="text-gray-300 hover:text-red-500 text-sm">✕</button>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <input
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addRule()}
                placeholder="Escribe una regla nueva..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button onClick={addRule} disabled={!newRule.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                Agregar
              </button>
            </div>
          </div>

          {/* FAQs */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-1">Preguntas frecuentes</h2>
            <p className="text-sm text-gray-500 mb-4">El secretario reconocerá variaciones naturales de cada pregunta</p>
            <div className="space-y-3 mb-4">
              {config.faqs.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Sin FAQs. Agrega la primera.</p>
              ) : (
                config.faqs.map((faq, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800 mb-1">P: {faq.q}</p>
                        <p className="text-sm text-gray-600">R: {faq.a}</p>
                      </div>
                      <button onClick={() => removeFaq(i)} className="text-gray-300 hover:text-red-500 text-sm mt-1">✕</button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="space-y-2">
              <input
                value={newFaqQ}
                onChange={(e) => setNewFaqQ(e.target.value)}
                placeholder="Pregunta que hacen los clientes..."
                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <textarea
                value={newFaqA}
                onChange={(e) => setNewFaqA(e.target.value)}
                placeholder="Respuesta que debe dar tu secretario..."
                rows={2}
                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
              <button onClick={addFaq} disabled={!newFaqQ.trim() || !newFaqA.trim()} className="w-full py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
                Agregar FAQ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Canales */}
      {activeTab === "channels" && (
        <div className="space-y-5">

          {/* WhatsApp — coming soon */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">📱</div>
                <div>
                  <h3 className="font-semibold text-gray-900">WhatsApp</h3>
                  <p className="text-sm text-gray-500">Tu secretario responde mensajes de WhatsApp</p>
                </div>
              </div>
              <span className="text-xs bg-gray-100 text-gray-400 px-2 py-1 rounded-full">Próximamente</span>
            </div>
          </div>

          {/* Email — multi-account manager */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">📧</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Cuentas de email</h3>
                  <p className="text-sm text-gray-500">
                    {emailAccounts.length === 0 ? "Conecta Gmail, Outlook u otro proveedor" : `${emailAccounts.length} cuenta${emailAccounts.length > 1 ? "s" : ""} conectada${emailAccounts.length > 1 ? "s" : ""}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddEmail(!showAddEmail)}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
              >
                + Añadir cuenta
              </button>
            </div>

            {/* Connected accounts list */}
            {emailAccounts.length > 0 && (
              <div className="space-y-2 mb-4">
                {emailAccounts.map((acc) => (
                  <div key={acc.id} className={`flex items-center gap-3 p-3 rounded-xl border ${acc.connected ? "border-blue-100 bg-blue-50/50" : "border-gray-100 bg-gray-50"}`}>
                    <span className="text-xl flex-shrink-0">{acc.provider === "gmail" ? "🔴" : acc.provider === "outlook" ? "🔵" : "📧"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{acc.email}</div>
                      <div className="text-xs text-gray-400 capitalize">{acc.provider}{acc.lastChecked ? ` · revisado ${new Date(acc.lastChecked).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}` : ""}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {importMsg[acc.id] && <span className="text-xs text-green-600">{importMsg[acc.id]}</span>}
                      <button
                        onClick={() => importSent(acc.id)}
                        disabled={importingId === acc.id}
                        title="Importar enviados para que el secretario aprenda tu estilo"
                        className="text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50"
                      >
                        {importingId === acc.id ? "Importando…" : "📥 Importar enviados"}
                      </button>
                      <button onClick={() => toggleAccount(acc.id, !acc.connected)} className={`text-xs px-2 py-1 rounded-lg border transition-colors ${acc.connected ? "border-gray-200 text-gray-500 hover:bg-gray-50" : "border-blue-200 text-blue-600 hover:bg-blue-50"}`}>
                        {acc.connected ? "Pausar" : "Activar"}
                      </button>
                      <button onClick={() => removeAccount(acc.id)} className="text-xs text-red-400 hover:text-red-600 px-1.5 py-1 rounded hover:bg-red-50">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add account panel */}
            {showAddEmail && (
              <div className="border-t border-gray-100 pt-4 space-y-4">
                {/* Provider tabs */}
                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                  {(["gmail", "outlook", "imap"] as const).map((tab) => (
                    <button key={tab} onClick={() => setAddEmailTab(tab)}
                      className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${addEmailTab === tab ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
                      {tab === "gmail" ? "🔴 Gmail" : tab === "outlook" ? "🔵 Outlook" : "📧 Otro"}
                    </button>
                  ))}
                </div>

                {/* Gmail OAuth */}
                {addEmailTab === "gmail" && (
                  <div className="space-y-3">
                    <a href="/api/auth/gmail" className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                      <span className="text-lg">🔴</span> Conectar con Google
                    </a>
                    <p className="text-xs text-gray-400 text-center">Acceso seguro via OAuth · no almacenamos tu contraseña</p>
                    <div className="border-t border-gray-100 pt-3">
                      <p className="text-xs text-gray-500 mb-2 font-medium">O conectar con contraseña de aplicación:</p>
                      <ImapForm tab="gmail" {...{ imapEmail, setImapEmail, imapPassword, setImapPassword, imapHost, setImapHost, imapPort, setImapPort, smtpHost, setSmtpHost, smtpPort, setSmtpPort, imapSaving, imapMsg, connectImap }} />
                    </div>
                  </div>
                )}

                {/* Outlook OAuth */}
                {addEmailTab === "outlook" && (
                  <div className="space-y-3">
                    <a href="/api/auth/outlook" className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                      <span className="text-lg">🔵</span> Conectar con Microsoft
                    </a>
                    <p className="text-xs text-gray-400 text-center">Acceso seguro via OAuth · no almacenamos tu contraseña</p>
                    <div className="border-t border-gray-100 pt-3">
                      <p className="text-xs text-gray-500 mb-2 font-medium">O conectar con contraseña de aplicación:</p>
                      <ImapForm tab="outlook" {...{ imapEmail, setImapEmail, imapPassword, setImapPassword, imapHost, setImapHost, imapPort, setImapPort, smtpHost, setSmtpHost, smtpPort, setSmtpPort, imapSaving, imapMsg, connectImap }} />
                    </div>
                  </div>
                )}

                {/* IMAP manual */}
                {addEmailTab === "imap" && (
                  <ImapForm tab="imap" {...{ imapEmail, setImapEmail, imapPassword, setImapPassword, imapHost, setImapHost, imapPort, setImapPort, smtpHost, setSmtpHost, smtpPort, setSmtpPort, imapSaving, imapMsg, connectImap }} />
                )}

                <div className="bg-amber-50 rounded-xl p-3">
                  <p className="text-xs text-amber-700">
                    <strong>¿Cómo funciona?</strong> Cuando llegue un email, tu secretario lo clasifica y redacta una respuesta sugerida.
                    Tú la revisas en el panel de Conversaciones y decides <strong>confirmar, editar o cancelar</strong>. Nada se envía automáticamente.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Google Calendar — coming soon */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 opacity-70">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-2xl">📅</div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">Google Calendar</h3>
                  <span className="text-xs bg-indigo-100 text-indigo-500 px-2 py-0.5 rounded-full">Próximamente</span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">Sincroniza citas directamente con tu calendario</p>
              </div>
            </div>
          </div>

          {/* Calls */}
          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5 opacity-60">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">📞</div>
              <div>
                <h3 className="font-semibold text-gray-700">Llamadas</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs bg-gray-200 text-gray-400 px-2 py-0.5 rounded-full">Próximamente</span>
                  <p className="text-sm text-gray-400">Tu secretario atenderá llamadas con voz natural</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Notificaciones */}
      {activeTab === "notifications" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Configuración de notificaciones</h2>

            {[
              { label: "Ticket urgente", desc: "Cuando tu secretario escale algo urgente", defaultOn: true },
              { label: "Nuevo ticket", desc: "Cualquier escalación, no solo urgentes", defaultOn: true },
              { label: "Cita agendada", desc: "Cuando se agenda una nueva cita", defaultOn: false },
              { label: "Resumen diario", desc: "Email diario con el resumen de actividad", defaultOn: true },
            ].map((n) => (
              <div key={n.label} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50">
                <div>
                  <div className="text-sm font-medium text-gray-800">{n.label}</div>
                  <div className="text-xs text-gray-400">{n.desc}</div>
                </div>
                <button
                  className={`w-10 h-5 rounded-full relative transition-colors ${n.defaultOn ? "bg-indigo-500" : "bg-gray-200"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${n.defaultOn ? "translate-x-5" : ""}`}></span>
                </button>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-1">Horario de silencio</h3>
            <p className="text-sm text-gray-500 mb-4">No recibirás notificaciones en este horario (excepto urgentes)</p>
            <div className="flex items-center gap-3">
              <input type="time" defaultValue="22:00" className="border border-gray-200 rounded-xl px-3 py-2 text-sm" />
              <span className="text-gray-400">—</span>
              <input type="time" defaultValue="07:00" className="border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            </div>
          </div>

          <button onClick={() => save()} disabled={saving} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50">
            {saving ? "Guardando..." : "Guardar configuración"}
          </button>
        </div>
      )}

      {/* Tab: Plan y Facturación */}
      {activeTab === "billing" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Tu plan actual</h2>
            <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl mb-4">
              <div>
                <div className="font-semibold text-indigo-900">Plan Prueba Gratuita</div>
                <div className="text-sm text-indigo-600">14 días · Sin restricciones</div>
              </div>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700">
                Actualizar plan
              </button>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Interacciones usadas</span>
                <span className="font-medium text-gray-900">0 / ilimitadas</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: "0%" }}></div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { name: "Básico", price: "499", features: ["500 interacciones/mes", "WhatsApp o Email"] },
              { name: "Pro", price: "999", features: ["2,000 interacciones/mes", "WhatsApp + Email + Calendar"], popular: true },
              { name: "Business", price: "1,999", features: ["Ilimitadas", "Todos los canales + CFDI"] },
            ].map((plan) => (
              <div key={plan.name} className={`p-5 rounded-2xl border-2 ${plan.popular ? "border-indigo-500" : "border-gray-200"}`}>
                {plan.popular && <div className="text-xs font-bold text-indigo-600 mb-1">RECOMENDADO</div>}
                <div className="font-semibold text-gray-900 mb-1">{plan.name}</div>
                <div className="text-2xl font-bold text-gray-900 mb-3">${plan.price}<span className="text-sm font-normal text-gray-500">/mes</span></div>
                <ul className="space-y-1 mb-4">
                  {plan.features.map((f) => <li key={f} className="text-xs text-gray-600">✓ {f}</li>)}
                </ul>
                <button className={`w-full py-2 rounded-xl text-sm font-medium ${plan.popular ? "bg-indigo-600 text-white hover:bg-indigo-700" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                  Seleccionar
                </button>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Datos de facturación</h3>
            <div className="space-y-3">
              <input placeholder="RFC" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm" />
              <input placeholder="Razón social" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm" />
              <select className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm">
                <option>Selecciona uso de CFDI</option>
                <option>G03 - Gastos en general</option>
                <option>P01 - Por definir</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ImapFormProps {
  tab: "gmail" | "outlook" | "imap";
  imapEmail: string; setImapEmail: (v: string) => void;
  imapPassword: string; setImapPassword: (v: string) => void;
  imapHost: string; setImapHost: (v: string) => void;
  imapPort: string; setImapPort: (v: string) => void;
  smtpHost: string; setSmtpHost: (v: string) => void;
  smtpPort: string; setSmtpPort: (v: string) => void;
  imapSaving: boolean; imapMsg: string;
  connectImap: () => void;
}

function ImapForm({ tab, imapEmail, setImapEmail, imapPassword, setImapPassword, imapHost, setImapHost, imapPort, setImapPort, smtpHost, setSmtpHost, smtpPort, setSmtpPort, imapSaving, imapMsg, connectImap }: ImapFormProps) {
  const isManual = tab === "imap";
  const placeholder = tab === "gmail" ? "ej. tunombre@gmail.com" : tab === "outlook" ? "ej. tunombre@outlook.com" : "ej. info@tunegocio.com";
  const passLabel = tab === "imap" ? "Contraseña" : "Contraseña de aplicación";
  const passHelp = tab === "gmail"
    ? "Genera una contraseña de aplicación en myaccount.google.com → Seguridad → Verificación en 2 pasos → Contraseñas de aplicación"
    : tab === "outlook"
    ? "Genera una contraseña de aplicación en account.microsoft.com → Seguridad → Contraseñas de aplicación"
    : "";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3">
        <input type="email" placeholder={placeholder} value={imapEmail} onChange={(e) => setImapEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        <div>
          <input type="password" placeholder={passLabel} value={imapPassword} onChange={(e) => setImapPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          {passHelp && <p className="text-xs text-gray-400 mt-1">{passHelp}</p>}
        </div>
      </div>

      {isManual && (
        <div className="grid grid-cols-2 gap-2">
          <input placeholder="Servidor IMAP (ej. imap.tudominio.com)" value={imapHost} onChange={(e) => setImapHost(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-400" />
          <input placeholder="Puerto IMAP (993)" value={imapPort} onChange={(e) => setImapPort(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-400" />
          <input placeholder="Servidor SMTP (ej. smtp.tudominio.com)" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-400" />
          <input placeholder="Puerto SMTP (587)" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
      )}

      <button onClick={connectImap} disabled={imapSaving || !imapEmail || !imapPassword}
        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors">
        {imapSaving ? "Verificando conexión…" : "Conectar cuenta"}
      </button>
      {imapMsg && <p className={`text-xs text-center ${imapMsg.startsWith("✓") ? "text-green-600" : "text-red-500"}`}>{imapMsg}</p>}
    </div>
  );
}
