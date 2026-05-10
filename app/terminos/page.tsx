import Link from "next/link";

export const metadata = { title: "Términos de Servicio — Secretario IA" };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-indigo-600 text-sm hover:underline mb-8 block">← Volver al inicio</Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Términos de Servicio</h1>
        <p className="text-gray-500 text-sm mb-10">Última actualización: enero 2025</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Aceptación de los términos</h2>
            <p>Al acceder y usar Secretario IA ("el Servicio"), aceptas quedar vinculado por estos Términos de Servicio. Si no estás de acuerdo con alguno de estos términos, no podrás usar el Servicio.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Descripción del servicio</h2>
            <p>Secretario IA es una plataforma SaaS que proporciona un asistente virtual con inteligencia artificial para pequeñas y medianas empresas (PYMEs). El Servicio permite configurar y gestionar un secretario virtual que puede atender mensajes de clientes, agendar citas y gestionar comunicaciones en múltiples canales.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Cuenta y registro</h2>
            <p>Para usar el Servicio debes crear una cuenta con información veraz y actualizada. Eres responsable de mantener la confidencialidad de tu contraseña y de todas las actividades que ocurran en tu cuenta. Notifícanos de inmediato ante cualquier uso no autorizado.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Período de prueba y pagos</h2>
            <p>Ofrecemos un período de prueba gratuito de 14 días. Pasado este período, deberás suscribirte a uno de nuestros planes de pago para continuar usando el Servicio. Los precios están en pesos mexicanos (MXN) e incluyen IVA. No realizamos reembolsos por períodos parciales.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Uso aceptable</h2>
            <p>Te comprometes a no usar el Servicio para: enviar spam, contenido ilegal, o cualquier actividad que viole las leyes aplicables de México. Nos reservamos el derecho de suspender cuentas que violen esta política.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Inteligencia artificial</h2>
            <p>El Servicio utiliza modelos de inteligencia artificial de terceros. Si bien nos esforzamos por ofrecer respuestas precisas, no garantizamos que el asistente virtual sea 100% exacto en todo momento. Eres responsable de revisar y aprobar las comunicaciones importantes con tus clientes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Propiedad intelectual</h2>
            <p>El Servicio y su contenido original son propiedad de Secretario IA. Los datos que introduces (información de tu negocio, conversaciones, contactos) son de tu propiedad. Te otorgamos una licencia limitada para usar el Servicio conforme a estos términos.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Limitación de responsabilidad</h2>
            <p>En la máxima medida permitida por la ley, Secretario IA no será responsable por daños indirectos, incidentales, especiales o consecuentes derivados del uso o la imposibilidad de uso del Servicio.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Modificaciones</h2>
            <p>Nos reservamos el derecho de modificar estos términos en cualquier momento. Te notificaremos los cambios sustanciales por correo electrónico. El uso continuado del Servicio tras las modificaciones implica tu aceptación.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Contacto</h2>
            <p>Para cualquier pregunta sobre estos términos, contáctanos en <a href="mailto:hola@secretarioia.mx" className="text-indigo-600 hover:underline">hola@secretarioia.mx</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
