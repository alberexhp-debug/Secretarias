"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

const AVATARS = [
  { id: "avatar-1", emoji: "👩", label: "Ana" },
  { id: "avatar-2", emoji: "👨", label: "Carlos" },
  { id: "avatar-3", emoji: "👩‍💼", label: "Sofía" },
  { id: "avatar-4", emoji: "👨‍💼", label: "Luis" },
  { id: "avatar-5", emoji: "🧑‍💼", label: "Ale" },
  { id: "avatar-6", emoji: "👩‍🔬", label: "Elena" },
  { id: "avatar-7", emoji: "👨‍🔬", label: "Pedro" },
  { id: "avatar-8", emoji: "🧑‍🎨", label: "Sam" },
  { id: "avatar-9", emoji: "👩‍🏫", label: "María" },
  { id: "avatar-10", emoji: "👨‍🏫", label: "Roberto" },
  { id: "avatar-11", emoji: "🧑‍🔧", label: "Mónica" },
  { id: "avatar-12", emoji: "👩‍🍳", label: "Diana" },
];

const TONES = [
  {
    id: "profesional",
    label: "Profesional",
    desc: "Formal y respetuoso",
    example: "Estimado cliente, el costo de la consulta es de $500 MXN. ¿Desea que le agende una cita?",
  },
  {
    id: "amigable",
    label: "Amigable",
    desc: "Cálido y cercano",
    example: "¡Hola! La consulta cuesta $500. ¿Te agendo una cita? Tengo varios horarios disponibles.",
  },
  {
    id: "cercano",
    label: "Cercano",
    desc: "Relajado y casual",
    example: "¡Qué tal! La consulta son $500. ¿Cuándo te viene bien? Te busco un horario ahora.",
  },
];

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [chatStep, setChatStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [secretaryName, setSecretaryName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("avatar-1");
  const [selectedTone, setSelectedTone] = useState("amigable");
  const [hoveredTone, setHoveredTone] = useState("");
  const [onboardingData, setOnboardingData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (step === 2 && messages.length === 0) {
      startChat();
    }
  }, [step]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function startChat() {
    setLoading(true);
    const res = await fetch("/api/onboarding/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [], step: 1 }),
    });
    const data = await res.json();
    setMessages([{ role: "assistant", content: data.reply }]);
    setLoading(false);
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");

    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    // Extract data from conversation
    const newData = { ...onboardingData };
    if (chatStep === 1) newData.businessInfo = userMessage;
    if (chatStep === 2) newData.city = userMessage;
    if (chatStep === 3) newData.schedule = userMessage;
    if (chatStep === 4) newData.faqs = userMessage;
    if (chatStep === 5) newData.services = userMessage;
    if (chatStep === 6) newData.restrictions = userMessage;
    if (chatStep === 7) newData.appointments = userMessage;
    if (chatStep === 8) newData.additional = userMessage;
    setOnboardingData(newData);

    const nextStep = Math.min(chatStep + 1, 9);

    const res = await fetch("/api/onboarding/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newMessages, step: nextStep }),
    });
    const data = await res.json();

    setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    setChatStep(nextStep);
    setLoading(false);

    // Auto advance after step 8 summary
    if (chatStep >= 8) {
      await fetch("/api/onboarding/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: 2,
          data: {
            onboardingData: JSON.stringify(newData),
            businessName: extractBusinessName(newData.businessInfo || ""),
            businessDesc: newData.businessInfo || "",
            city: newData.city || "",
          },
        }),
      });
    }
  }

  function extractBusinessName(text: string): string {
    const patterns = [/(?:se llama|llamo|negocio es|empresa es|me llamo)\s+["']?([^,"'.!?]+)/i, /^([^,.\n]+)/];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1].trim().slice(0, 50);
    }
    return "Mi Negocio";
  }

  async function completeOnboarding() {
    setSaving(true);
    const avatar = AVATARS.find((a) => a.id === selectedAvatar);
    const name = secretaryName || avatar?.label || "Ana";

    await fetch("/api/onboarding/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secretaryData: {
          name,
          avatarId: selectedAvatar,
          tone: selectedTone,
          businessName: onboardingData.businessInfo ? extractBusinessName(onboardingData.businessInfo) : "Mi Negocio",
          businessDesc: onboardingData.businessInfo || "",
          city: onboardingData.city || "",
          onboardingData: JSON.stringify(onboardingData),
        },
      }),
    });

    router.push("/panel");
  }

  const steps = [
    { n: 1, label: "Bienvenida" },
    { n: 2, label: "Tu negocio" },
    { n: 3, label: "Personalidad" },
    { n: 4, label: "Canales" },
    { n: 5, label: "Prueba" },
    { n: 6, label: "Plan" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">S</span>
              </div>
              <span className="font-bold text-gray-900">Secretario IA</span>
            </div>
            <span className="text-sm text-gray-400">Paso {step} de {steps.length}</span>
          </div>
          {/* Progress */}
          <div className="flex gap-1">
            {steps.map((s) => (
              <div
                key={s.n}
                className={`flex-1 h-1.5 rounded-full ${s.n <= step ? "bg-indigo-600" : "bg-gray-200"}`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            {steps.map((s) => (
              <span key={s.n} className={`text-xs ${s.n === step ? "text-indigo-600 font-medium" : "text-gray-400"}`}>
                {s.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="text-center">
            <div className="text-6xl mb-6">🎉</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              ¡Bienvenido a Secretario IA!
            </h1>
            <p className="text-gray-500 text-lg mb-8 max-w-md mx-auto">
              En los próximos minutos vamos a configurar a tu secretario virtual.
              Te haré algunas preguntas sobre tu negocio, como si hablaras con una persona nueva.
            </p>
            <div className="bg-indigo-50 rounded-2xl p-6 mb-8 text-left">
              <h3 className="font-semibold text-indigo-900 mb-3">¿Qué vamos a hacer?</h3>
              <ul className="space-y-2">
                {["Cuéntame de tu negocio en una conversación", "Dale nombre y personalidad a tu secretario", "Conecta WhatsApp o email", "Pruébalo antes de activarlo"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-indigo-700">
                    <span className="w-5 h-5 bg-indigo-200 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => setStep(2)}
              className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-semibold text-lg hover:bg-indigo-700"
            >
              Comenzar →
            </button>
          </div>
        )}

        {/* Step 2: Chat */}
        {step === 2 && (
          <div>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Cuéntame de tu negocio</h2>
              <p className="text-gray-500 mt-1">Habla conmigo como si le explicaras a alguien nuevo</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Chat header */}
              <div className="bg-green-600 px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-lg">🤖</div>
                <div>
                  <div className="text-white font-semibold text-sm">Asistente de configuración</div>
                  <div className="text-green-200 text-xs">En línea</div>
                </div>
              </div>

              {/* Messages */}
              <div className="h-96 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${m.role === "user" ? "bg-green-500 text-white rounded-tr-sm" : "bg-white text-gray-800 shadow-sm rounded-tl-sm"}`}>
                      {m.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white text-gray-400 px-4 py-2 rounded-2xl rounded-tl-sm shadow-sm text-sm">
                      <span className="animate-pulse">Escribiendo...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-gray-100 bg-white flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Escribe tu respuesta..."
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 disabled:opacity-50"
                >
                  Enviar
                </button>
              </div>
            </div>

            {chatStep >= 9 && (
              <div className="mt-6 text-center">
                <p className="text-gray-500 mb-4">¡Perfecto! Ya tengo toda la información que necesito.</p>
                <button
                  onClick={() => setStep(3)}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700"
                >
                  Siguiente: dale personalidad →
                </button>
              </div>
            )}

            {chatStep < 9 && messages.length > 0 && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setStep(3)}
                  className="text-sm text-gray-400 hover:text-gray-600 underline"
                >
                  Saltar y configurar después
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Name + Personality */}
        {step === 3 && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Dale vida a tu secretario</h2>
              <p className="text-gray-500 mt-1">Elige cómo va a llamarse y cómo va a hablar con tus clientes</p>
            </div>

            {/* Name */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">¿Cómo se va a llamar?</h3>
              <div className="flex gap-2 mb-3">
                {["Ana", "Carlos", "Sofía"].map((name) => (
                  <button
                    key={name}
                    onClick={() => setSecretaryName(name)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border ${secretaryName === name ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-200 text-gray-600 hover:border-indigo-300"}`}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={secretaryName}
                onChange={(e) => setSecretaryName(e.target.value)}
                placeholder="O escribe un nombre personalizado..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
              />
              {secretaryName && (
                <div className="mt-3 p-3 bg-indigo-50 rounded-xl text-indigo-700 text-sm">
                  ¡Hola! Soy {secretaryName}, el asistente de tu negocio. Encantado de conocerte.
                </div>
              )}
            </div>

            {/* Avatar */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Elige el avatar</h3>
              <div className="grid grid-cols-6 gap-3">
                {AVATARS.map((avatar) => (
                  <button
                    key={avatar.id}
                    onClick={() => setSelectedAvatar(avatar.id)}
                    className={`flex flex-col items-center p-2 rounded-xl border-2 ${selectedAvatar === avatar.id ? "border-indigo-500 bg-indigo-50" : "border-gray-100 hover:border-gray-200"}`}
                  >
                    <span className="text-2xl">{avatar.emoji}</span>
                    <span className="text-xs text-gray-500 mt-1">{avatar.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tone */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
              <h3 className="font-semibold text-gray-900 mb-2">¿Cómo va a hablar?</h3>
              <p className="text-sm text-gray-500 mb-4">Pasa el cursor sobre cada opción para ver un ejemplo real</p>
              <div className="space-y-3">
                {TONES.map((tone) => (
                  <button
                    key={tone.id}
                    onClick={() => setSelectedTone(tone.id)}
                    onMouseEnter={() => setHoveredTone(tone.id)}
                    onMouseLeave={() => setHoveredTone("")}
                    className={`w-full text-left p-4 rounded-xl border-2 ${selectedTone === tone.id ? "border-indigo-500 bg-indigo-50" : "border-gray-100 hover:border-gray-200"}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">{tone.label}</span>
                      <span className="text-xs text-gray-400">{tone.desc}</span>
                    </div>
                    {(hoveredTone === tone.id || selectedTone === tone.id) && (
                      <div className="text-sm text-gray-600 bg-white rounded-lg p-2 mt-2 border border-gray-100">
                        {tone.example}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(4)}
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-semibold text-lg hover:bg-indigo-700"
            >
              Siguiente: conectar canales →
            </button>
          </div>
        )}

        {/* Step 4: Channels */}
        {step === 4 && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Conecta tus canales</h2>
              <p className="text-gray-500 mt-1">Por donde van a escribirte tus clientes</p>
            </div>

            <div className="space-y-4 mb-8">
              {/* WhatsApp */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">📱</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">WhatsApp</h3>
                    <p className="text-sm text-gray-500 mb-3">Recomendado para la mayoría de negocios</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-200 cursor-pointer">
                        <span className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="w-2 h-2 bg-white rounded-full"></span>
                        </span>
                        <div>
                          <div className="text-sm font-medium text-green-800">Número de prueba (recomendado para empezar)</div>
                          <div className="text-xs text-green-600">Prueba antes de conectar tu número real</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer opacity-60">
                        <span className="w-4 h-4 border-2 border-gray-300 rounded-full"></span>
                        <div>
                          <div className="text-sm font-medium text-gray-700">Meta Cloud API (tu número real)</div>
                          <div className="text-xs text-gray-500">Requiere cuenta de Meta Business</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">📧</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Email</h3>
                    <p className="text-sm text-gray-500 mb-3">Gmail y Outlook con un solo click</p>
                    <div className="flex gap-2">
                      <button className="flex-1 py-2 px-4 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
                        📬 Conectar Gmail
                      </button>
                      <button className="flex-1 py-2 px-4 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
                        📨 Conectar Outlook
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Calendar */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">📅</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Google Calendar</h3>
                    <p className="text-sm text-gray-500 mb-3">Para agendar citas automáticamente</p>
                    <button className="w-full py-2 px-4 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
                      📅 Conectar Calendar
                    </button>
                  </div>
                </div>
              </div>

              {/* Calls - Coming soon */}
              <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6 opacity-60">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">📞</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-700">Llamadas</h3>
                      <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">Próximamente — Q3 2026</span>
                    </div>
                    <p className="text-sm text-gray-400">Tu secretario va a atender llamadas entrantes con voz natural</p>
                    <button className="mt-2 text-xs text-indigo-500 hover:underline">Avisarme cuando esté disponible</button>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(5)}
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-semibold text-lg hover:bg-indigo-700"
            >
              Siguiente: prueba en vivo →
            </button>
            <p className="text-center text-sm text-gray-400 mt-2">Puedes conectar canales más tarde desde Configuración</p>
          </div>
        )}

        {/* Step 5: Live test */}
        {step === 5 && (
          <div>
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">
                {AVATARS.find((a) => a.id === selectedAvatar)?.emoji || "🤖"}
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Prueba a {secretaryName || "tu secretario"}</h2>
              <p className="text-gray-500 mt-1">Habla con él como si fueras un cliente</p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-2 mb-4 text-center">
              <span className="text-orange-600 text-sm font-medium">MODO PRUEBA — Los mensajes no se envían a clientes reales</span>
            </div>

            <SecretaryTestChat
              secretaryName={secretaryName || "Ana"}
              avatarEmoji={AVATARS.find((a) => a.id === selectedAvatar)?.emoji || "🤖"}
            />

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setStep(4)}
                className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50"
              >
                ← Ajustar algo
              </button>
              <button
                onClick={() => setStep(6)}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700"
              >
                ¡Se ve perfecto! →
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Plan */}
        {step === 6 && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Elige tu plan</h2>
              <p className="text-gray-500 mt-1">14 días gratis en cualquier plan. Cancela cuando quieras.</p>
            </div>

            <div className="space-y-4 mb-8">
              {[
                { name: "Básico", price: "499", features: ["500 interacciones/mes", "WhatsApp o Email", "Panel de control"], popular: false },
                { name: "Pro", price: "999", features: ["2,000 interacciones/mes", "WhatsApp + Email + Calendar", "Tickets y métricas avanzadas"], popular: true },
                { name: "Business", price: "1,999", features: ["Ilimitadas", "Todos los canales", "Soporte dedicado + CFDI"], popular: false },
              ].map((plan) => (
                <div key={plan.name} className={`p-5 rounded-2xl border-2 ${plan.popular ? "border-indigo-500 bg-indigo-50" : "border-gray-200 bg-white"}`}>
                  {plan.popular && <div className="text-xs font-bold text-indigo-600 mb-1">MÁS POPULAR</div>}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">{plan.name}</div>
                      <div className="text-sm text-gray-500">{plan.features.join(" · ")}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">${plan.price}</div>
                      <div className="text-xs text-gray-400">MXN/mes</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={completeOnboarding}
              disabled={saving}
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-semibold text-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "Activando tu secretario..." : "Empezar 14 días gratis →"}
            </button>
            <p className="text-center text-sm text-gray-400 mt-2">
              Sin tarjeta de crédito. Sin compromiso.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SecretaryTestChat({ secretaryName, avatarEmoji }: { secretaryName: string; avatarEmoji: string }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `¡Hola! Soy ${secretaryName}. ¿En qué puedo ayudarte hoy?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const suggestions = ["¿Cuánto cuesta una consulta?", "¿Tienen cita disponible mañana?", "Quiero cancelar mi cita"];

  async function sendMessage(text?: string) {
    const content = text || input.trim();
    if (!content || loading) return;
    setInput("");

    const newMessages: Message[] = [...messages, { role: "user", content }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/secretary/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, testMode: true }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Disculpa, hubo un error. Intenta de nuevo." }]);
    }
    setLoading(false);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="bg-indigo-600 px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-lg">{avatarEmoji}</div>
        <div>
          <div className="text-white font-semibold text-sm">{secretaryName}</div>
          <div className="text-indigo-200 text-xs">Asistente virtual · En línea</div>
        </div>
      </div>

      <div className="h-64 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${m.role === "user" ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-white text-gray-800 shadow-sm rounded-tl-sm"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white px-4 py-2 rounded-2xl rounded-tl-sm shadow-sm text-sm text-gray-400 animate-pulse">
              Escribiendo...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-gray-100 bg-white space-y-2">
        <div className="flex gap-1 flex-wrap">
          {suggestions.map((s) => (
            <button key={s} onClick={() => sendMessage(s)} className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200">
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Escribe como si fueras un cliente..."
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
