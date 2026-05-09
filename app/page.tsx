import Link from "next/link";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const user = await getSession();
  if (user) {
    if (!user.onboardingDone) redirect("/onboarding");
    else redirect("/panel");
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-gray-900 text-lg">Secretario IA</span>
          </div>
          <div className="flex gap-3">
            <Link href="/login" className="px-4 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium">
              Iniciar sesión
            </Link>
            <Link href="/registro" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
              Comenzar gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-medium mb-8">
            <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
            14 días gratis · Sin tarjeta de crédito
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Tu negocio nunca<br />
            <span className="text-indigo-600">deja de atender</span>
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
            Secretario IA atiende WhatsApp, email y agenda citas por ti,
            las 24 horas, exactamente como lo haría tu mejor secretario.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/registro" className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-semibold text-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200">
              Contratar a mi secretario →
            </Link>
            <a href="#como-funciona" className="px-8 py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold text-lg hover:bg-gray-200">
              Ver cómo funciona
            </a>
          </div>
          <p className="text-sm text-gray-400 mt-4">Listo en 10 minutos · Sin conocimiento técnico</p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center text-gray-400 text-sm mb-8">Miles de PYMEs ya usan su secretario virtual</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { stat: "18,000+", label: "Mensajes atendidos hoy" },
              { stat: "3,200+", label: "Negocios activos" },
              { stat: "98%", label: "Satisfacción" },
              { stat: "< 30 seg", label: "Tiempo de respuesta" },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="text-3xl font-bold text-indigo-600">{item.stat}</div>
                <div className="text-sm text-gray-500 mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Listo en 3 pasos</h2>
          <p className="text-center text-gray-500 mb-12">Sin configuraciones técnicas. Sin manuales.</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Cuéntame de tu negocio", desc: "En una conversación de chat, le explicas a tu secretario cómo funciona tu negocio.", icon: "💬" },
              { step: "2", title: "Dale nombre y personalidad", desc: "Elige el nombre, el tono y el avatar de tu secretario. Desde hoy, es un miembro de tu equipo.", icon: "✨" },
              { step: "3", title: "Conecta y activa", desc: "Conecta WhatsApp y/o email. Tu secretario empieza a atender de inmediato.", icon: "🚀" },
            ].map((step) => (
              <div key={step.step} className="text-center p-8 rounded-2xl bg-gray-50">
                <div className="text-5xl mb-4">{step.icon}</div>
                <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold mx-auto mb-3">{step.step}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Todo lo que hace un secretario excelente</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: "📱", title: "WhatsApp 24/7", desc: "Responde automáticamente. Lee imágenes y documentos. Agenda citas con botones de respuesta rápida." },
              { icon: "📧", title: "Email profesional", desc: "Lee y responde emails de clientes. Filtra spam. Mantiene tu bandeja de entrada limpia." },
              { icon: "📅", title: "Agenda inteligente", desc: "Integra con Google Calendar. Ofrece horarios disponibles. Envía recordatorios automáticos." },
              { icon: "🎫", title: "Sistema de tickets", desc: "Cuando algo supera al secretario, crea un ticket y te avisa. Tú respondes cuando puedas." },
              { icon: "📊", title: "Panel en tiempo real", desc: "Ve todo lo que hace tu secretario. Mensajes atendidos, citas agendadas, tiempo de respuesta." },
              { icon: "🔔", title: "Alertas inteligentes", desc: "Solo te molesta cuando realmente lo necesitas. Urgencias, quejas y tickets importantes." },
            ].map((f) => (
              <div key={f.title} className="p-6 bg-white rounded-xl border border-gray-100">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precios" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Planes simples, sin sorpresas</h2>
          <p className="text-center text-gray-500 mb-12">14 días gratis en cualquier plan. Cancela cuando quieras.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Básico", price: "499", popular: false,
                features: ["500 interacciones/mes", "WhatsApp o Email", "Agenda básica", "Panel de control", "Soporte por email"],
              },
              {
                name: "Pro", price: "999", popular: true,
                features: ["2,000 interacciones/mes", "WhatsApp + Email", "Agenda con Google Calendar", "Tickets y escalación", "Métricas avanzadas", "Soporte prioritario"],
              },
              {
                name: "Business", price: "1,999", popular: false,
                features: ["Interacciones ilimitadas", "Todos los canales", "Múltiples secretarios", "API personalizada", "Facturación CFDI", "Soporte dedicado"],
              },
            ].map((plan) => (
              <div key={plan.name} className={`p-8 rounded-2xl border-2 relative ${plan.popular ? "border-indigo-500 bg-indigo-50" : "border-gray-200 bg-white"}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full">MÁS POPULAR</div>
                )}
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold text-gray-900">${plan.price}</span>
                  <span className="text-gray-500">/mes MXN</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-green-500 mt-0.5">✓</span>{f}
                    </li>
                  ))}
                </ul>
                <Link href="/registro" className={`block text-center py-3 px-6 rounded-xl font-semibold ${plan.popular ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                  Empezar gratis
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-indigo-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Tu negocio merece un secretario que nunca descanse</h2>
          <p className="text-indigo-200 mb-8">Empieza hoy. En 10 minutos tu secretario ya estará atendiendo clientes.</p>
          <Link href="/registro" className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-bold text-lg hover:bg-indigo-50">
            Crear mi secretario gratis →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">S</span>
            </div>
            <span className="font-bold text-gray-900">Secretario IA</span>
          </div>
          <div className="text-sm text-gray-400">© 2024 Secretario IA · Para PYMEs de toda clase</div>
          <div className="flex gap-6 text-sm text-gray-400">
            <a href="#" className="hover:text-gray-600">Privacidad</a>
            <a href="#" className="hover:text-gray-600">Términos</a>
            <a href="#" className="hover:text-gray-600">Soporte</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
