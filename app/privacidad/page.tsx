import Link from "next/link";

export const metadata = { title: "Política de Privacidad — Secretario IA" };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-indigo-600 text-sm hover:underline mb-8 block">← Volver al inicio</Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Privacidad</h1>
        <p className="text-gray-500 text-sm mb-10">Última actualización: enero 2025</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Información que recopilamos</h2>
            <p>Recopilamos la información que nos proporcionas al registrarte (nombre, correo electrónico, contraseña cifrada), la información de tu negocio que configuras en el Servicio, y los datos de conversaciones con tus clientes que procesa el asistente virtual.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Uso de la información</h2>
            <p>Usamos tu información para: proporcionar y mejorar el Servicio, personalizar tu experiencia, enviarte notificaciones relacionadas con tu cuenta, y cumplir con obligaciones legales. No vendemos tu información personal a terceros.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Almacenamiento y seguridad</h2>
            <p>Tus datos se almacenan en servidores seguros ubicados en la Unión Europea. Implementamos medidas de seguridad estándar de la industria: cifrado en tránsito (TLS), contraseñas hasheadas, y acceso restringido a la base de datos. Sin embargo, ningún sistema es 100% seguro.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Terceros</h2>
            <p>Usamos los siguientes proveedores de confianza para operar el Servicio: <strong>Anthropic</strong> (modelos de IA — los mensajes son procesados conforme a su política de privacidad), <strong>Turso</strong> (base de datos), y <strong>Vercel</strong> (infraestructura de hosting). Estos proveedores solo acceden a los datos necesarios para prestar el servicio.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Datos de clientes finales</h2>
            <p>Los mensajes e información de los clientes de tu negocio que son procesados por el asistente virtual son tratados como datos confidenciales. Solo tú, como titular de la cuenta, tienes acceso a esta información.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Tus derechos</h2>
            <p>Conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP), tienes derecho a acceder, rectificar, cancelar u oponerte al tratamiento de tus datos. Para ejercer estos derechos, contáctanos en <a href="mailto:privacidad@secretarioia.mx" className="text-indigo-600 hover:underline">privacidad@secretarioia.mx</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Cookies</h2>
            <p>Usamos únicamente una cookie esencial para mantener tu sesión iniciada (auth-token, httpOnly). No usamos cookies de rastreo ni publicidad.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Retención de datos</h2>
            <p>Conservamos tus datos mientras tu cuenta esté activa. Al cancelar tu cuenta, eliminaremos tus datos personales en un plazo máximo de 30 días, salvo que la ley nos obligue a conservarlos.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Contacto</h2>
            <p>Para consultas sobre privacidad, escríbenos a <a href="mailto:privacidad@secretarioia.mx" className="text-indigo-600 hover:underline">privacidad@secretarioia.mx</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
