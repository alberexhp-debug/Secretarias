"use client";

import { useEffect, useState } from "react";

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
        <div className="space-y-4">
          {[
            {
              icon: "📱",
              name: "WhatsApp",
              connected: config.whatsappConnected,
              color: "green",
              detail: config.whatsappNumber || "No conectado",
            },
            {
              icon: "📧",
              name: "Email",
              connected: config.emailConnected,
              color: "blue",
              detail: config.emailAddress || "No conectado",
            },
            {
              icon: "📅",
              name: "Google Calendar",
              connected: config.calendarConnected,
              color: "indigo",
              detail: "Gestión de citas",
            },
          ].map((channel) => (
            <div key={channel.name} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 bg-${channel.color}-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0`}>
                    {channel.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{channel.name}</h3>
                    <p className="text-sm text-gray-500">{channel.detail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${channel.connected ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {channel.connected ? "✓ Conectado" : "No conectado"}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50">
                  {channel.connected ? "Reconectar" : `Conectar ${channel.name}`}
                </button>
                <button className="px-4 py-2 bg-gray-50 text-gray-500 rounded-xl text-sm hover:bg-gray-100">
                  Ejecutar diagnóstico
                </button>
              </div>
            </div>
          ))}
          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5 opacity-60">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">📞</div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-700">Llamadas</h3>
                  <span className="text-xs bg-gray-200 text-gray-400 px-2 py-0.5 rounded-full">Próximamente Q3 2026</span>
                </div>
                <p className="text-sm text-gray-400">Tu secretario va a atender llamadas con voz natural</p>
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
