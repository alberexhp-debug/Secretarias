import { Resend } from "resend";

let resend: Resend | null = null;

function getResend() {
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

const FROM = "Secretario IA <onboarding@resend.dev>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://secretarias-ia.vercel.app";

// ─── Send helper ──────────────────────────────────────────────────────────────

async function send(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    await getResend().emails.send({ from: FROM, to, subject, html });
  } catch (err) {
    console.error("[email] send error:", err);
  }
}

// ─── Base layout ──────────────────────────────────────────────────────────────

function layout(content: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px 40px;text-align:center">
            <div style="font-size:28px;margin-bottom:8px">🤖</div>
            <div style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px">Secretario IA</div>
            <div style="color:#c7d2fe;font-size:13px;margin-top:4px">Tu secretario virtual inteligente</div>
          </td>
        </tr>
        <!-- Content -->
        <tr><td style="padding:40px">${content}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center">
            <p style="margin:0;color:#9ca3af;font-size:12px">© 2026 Secretario IA · <a href="${APP_URL}/privacidad" style="color:#6b7280;text-decoration:none">Privacidad</a> · <a href="${APP_URL}/terminos" style="color:#6b7280;text-decoration:none">Términos</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btn(url: string, label: string, color = "#4f46e5") {
  return `<div style="text-align:center;margin:28px 0">
    <a href="${url}" style="display:inline-block;background:${color};color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:600">${label}</a>
  </div>`;
}

function h1(text: string) {
  return `<h1 style="margin:0 0 16px;color:#111827;font-size:24px;font-weight:700;line-height:1.3">${text}</h1>`;
}

function p(text: string) {
  return `<p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.6">${text}</p>`;
}

// ─── Templates ────────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, name: string) {
  const html = layout(`
    ${h1(`¡Bienvenido/a a Secretario IA, ${name}! 🎉`)}
    ${p("Tu cuenta está lista. Tienes <strong>14 días de prueba gratuita</strong> para configurar tu secretario virtual y empezar a atender a tus clientes automáticamente.")}
    ${p("Sigue estos pasos para sacarle el máximo provecho:")}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px">
      ${[
        ["1", "Personaliza a tu secretario", "Dale nombre, personalidad y tono"],
        ["2", "Configura tu negocio", "Horarios, servicios y preguntas frecuentes"],
        ["3", "Conecta tus canales", "Email y WhatsApp para atender clientes"],
      ].map(([n, title, desc]) => `
        <tr>
          <td width="40" valign="top" style="padding:8px 0">
            <div style="width:28px;height:28px;background:#eef2ff;border-radius:50%;text-align:center;line-height:28px;font-size:13px;font-weight:700;color:#4f46e5">${n}</div>
          </td>
          <td style="padding:8px 0 8px 12px">
            <div style="font-size:14px;font-weight:600;color:#111827">${title}</div>
            <div style="font-size:13px;color:#6b7280">${desc}</div>
          </td>
        </tr>
      `).join("")}
    </table>
    ${btn(`${APP_URL}/onboarding`, "Configurar mi secretario →")}
    ${p('<span style="color:#9ca3af;font-size:13px">¿Tienes dudas? Responde a este email y te ayudamos.</span>')}
  `);
  await send(to, "¡Bienvenido/a a Secretario IA! Tu prueba gratuita ha comenzado 🚀", html);
}

export async function sendTrialExpiryWarningEmail(to: string, name: string, daysLeft: number) {
  const html = layout(`
    ${h1(`${name}, tu prueba vence en ${daysLeft} día${daysLeft !== 1 ? "s" : ""} ⏳`)}
    ${p(`Has estado usando Secretario IA durante tu período de prueba. <strong>Quedan solo ${daysLeft} día${daysLeft !== 1 ? "s" : ""}</strong> para que expire.`)}
    ${p("Si quieres seguir con tu secretario virtual atendiendo clientes automáticamente, activa tu plan ahora.")}
    <table width="100%" cellpadding="12" cellspacing="0" style="margin:0 0 24px;border-collapse:collapse">
      ${[
        ["Básico", "€9,99/mes", "500 interacciones, 1 canal"],
        ["Pro ⭐", "€19,99/mes", "2.000 interacciones, todos los canales"],
        ["Business", "€39,99/mes", "Ilimitado, soporte prioritario"],
      ].map(([plan, price, feat]) => `
        <tr style="border-bottom:1px solid #f3f4f6">
          <td style="font-weight:600;color:#111827;font-size:14px">${plan}</td>
          <td style="color:#4f46e5;font-weight:700;font-size:14px">${price}</td>
          <td style="color:#6b7280;font-size:13px">${feat}</td>
        </tr>
      `).join("")}
    </table>
    ${btn(`${APP_URL}/panel/configuracion#billing`, "Activar mi plan →", "#059669")}
    ${p('<span style="color:#9ca3af;font-size:13px">Si no activas un plan, tu cuenta pasará al modo gratuito con funcionalidades limitadas.</span>')}
  `);
  await send(to, `⏳ Tu prueba de Secretario IA vence en ${daysLeft} día${daysLeft !== 1 ? "s" : ""}`, html);
}

export async function sendTrialExpiredEmail(to: string, name: string) {
  const html = layout(`
    ${h1(`${name}, tu período de prueba ha finalizado`)}
    ${p("Tu prueba gratuita de Secretario IA ha expirado. Tu secretario virtual ha dejado de atender clientes automáticamente.")}
    ${p("Activa un plan para reactivarlo y no perder más oportunidades de negocio.")}
    ${btn(`${APP_URL}/panel/configuracion#billing`, "Reactivar mi secretario →", "#dc2626")}
    ${p('<span style="color:#9ca3af;font-size:13px">Todos tus datos, configuración y conversaciones siguen guardados.</span>')}
  `);
  await send(to, "Tu prueba de Secretario IA ha expirado", html);
}

export async function sendSecretaryEmailReply(opts: {
  to: string;
  toName: string;
  fromName: string;
  businessName: string;
  replyText: string;
  originalSubject: string;
}) {
  const html = layout(`
    <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6">${opts.replyText.replace(/\n/g, "<br>")}</p>
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
    <p style="margin:0;color:#9ca3af;font-size:13px">
      ${opts.fromName} · ${opts.businessName}<br>
      <span style="font-size:11px">Asistente virtual gestionado por <a href="${APP_URL}" style="color:#6b7280;text-decoration:none">Secretario IA</a></span>
    </p>
  `);
  await send(opts.to, `Re: ${opts.originalSubject}`, html);
}

export async function sendDailySummaryEmail(opts: {
  to: string;
  name: string;
  secretaryName: string;
  stats: { messages: number; appointments: number; tickets: number };
  date: string;
}) {
  const { stats } = opts;
  const html = layout(`
    ${h1(`Resumen de ${opts.date} 📊`)}
    ${p(`Aquí tienes lo que hizo <strong>${opts.secretaryName}</strong> hoy:`)}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px">
      ${[
        ["💬", "Mensajes atendidos", stats.messages],
        ["📅", "Citas agendadas", stats.appointments],
        ["🎫", "Tickets creados", stats.tickets],
      ].map(([icon, label, val]) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #f3f4f6">
            <span style="font-size:20px;margin-right:12px">${icon}</span>
            <span style="color:#374151;font-size:15px">${label}</span>
          </td>
          <td style="text-align:right;padding:12px 0;border-bottom:1px solid #f3f4f6;font-size:20px;font-weight:700;color:#111827">${val}</td>
        </tr>
      `).join("")}
    </table>
    ${btn(`${APP_URL}/panel`, "Ver panel completo →")}
  `);
  await send(opts.to, `Resumen de actividad · ${opts.date}`, html);
}
