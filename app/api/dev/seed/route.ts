import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { buildSystemPrompt } from "@/lib/ai";

export async function POST(req: Request) {
  const secret = new URL(req.url).searchParams.get("secret");
  if (process.env.NODE_ENV === "production" && secret !== process.env.SEED_SECRET) {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }

  // Check if demo user exists
  const existing = await prisma.user.findUnique({ where: { email: "demo@secretarioia.mx" } });
  if (existing) {
    return NextResponse.json({ message: "Demo user already exists", userId: existing.id });
  }

  const password = await hashPassword("demo1234");
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + 14);

  const user = await prisma.user.create({
    data: {
      email: "demo@secretarioia.mx",
      name: "Carlos Mendoza",
      password,
      trialEnd,
      onboardingDone: true,
      onboardingStep: 6,
    },
  });

  const faqs = [
    { q: "¿Cuánto cuesta la consulta?", a: "La consulta tiene un costo de $500 MXN. Incluye revisión completa y diagnóstico." },
    { q: "¿Tienen citas disponibles?", a: "Sí, tenemos disponibilidad. ¿Para qué día te acomoda? Tenemos horarios de lunes a viernes de 9am a 6pm." },
    { q: "¿Dónde están ubicados?", a: "Estamos en Av. Insurgentes 456, Col. Roma Norte, CDMX. A 2 cuadras del metro Insurgentes." },
    { q: "¿Aceptan seguros médicos?", a: "Sí, trabajamos con la mayoría de seguros mayores. ¿Con qué seguro cuentas para verificar?" },
  ];

  const rules = [
    "Nunca dar diagnósticos médicos específicos, solo orientar a que vengan a consulta",
    "No confirmar precios de procedimientos complejos sin consultar primero con el médico",
    "Si el paciente menciona dolor severo o emergencia, dar el número de emergencias: 55-1234-5678",
  ];

  const schedule = {
    Lunes: { active: true, from: "09:00", to: "18:00" },
    Martes: { active: true, from: "09:00", to: "18:00" },
    Miércoles: { active: true, from: "09:00", to: "18:00" },
    Jueves: { active: true, from: "09:00", to: "18:00" },
    Viernes: { active: true, from: "09:00", to: "17:00" },
    Sábado: { active: true, from: "10:00", to: "14:00" },
    Domingo: { active: false, from: "09:00", to: "18:00" },
  };

  const secretaryConfig = {
    name: "Ana",
    tone: "amigable",
    businessName: "Clínica Dental Mendoza",
    businessDesc: "Clínica dental especializada en ortodoncia, implantes y limpieza. 15 años de experiencia. Atendemos adultos y niños.",
    city: "CDMX",
    schedule: {},
    faqs,
    rules,
  };

  const secretary = await prisma.secretary.create({
    data: {
      userId: user.id,
      name: "Ana",
      avatarId: "avatar-1",
      tone: "amigable",
      businessName: "Clínica Dental Mendoza",
      businessType: "Clínica dental",
      businessDesc: "Clínica dental especializada en ortodoncia, implantes y limpieza.",
      city: "CDMX",
      faqs: JSON.stringify(faqs),
      rules: JSON.stringify(rules),
      schedule: JSON.stringify(schedule),
      systemPrompt: buildSystemPrompt(secretaryConfig),
      whatsappConnected: false,
      emailConnected: false,
      calendarConnected: false,
      appointmentDuration: 30,
      appointmentBuffer: 10,
      appointmentMinAdvance: 2,
    },
  });

  // Create demo contacts
  const contacts = await Promise.all([
    prisma.contact.create({ data: { userId: user.id, name: "María García", phone: "+52 55 1234 5678", channel: "whatsapp", lastInteraction: new Date() } }),
    prisma.contact.create({ data: { userId: user.id, name: "Luis Pérez", phone: "+52 55 9876 5432", channel: "whatsapp", lastInteraction: new Date(Date.now() - 3600000) } }),
    prisma.contact.create({ data: { userId: user.id, name: "Carlos González", email: "carlos@empresa.com", channel: "email", lastInteraction: new Date(Date.now() - 7200000) } }),
    prisma.contact.create({ data: { userId: user.id, name: "Ana Rodríguez", phone: "+52 55 5555 4444", channel: "whatsapp", lastInteraction: new Date(Date.now() - 86400000) } }),
    prisma.contact.create({ data: { userId: user.id, name: "Pedro Sánchez", phone: "+52 55 6666 7777", channel: "whatsapp", lastInteraction: new Date(Date.now() - 172800000) } }),
  ]);

  // Create demo conversations
  const conv1 = await prisma.conversation.create({
    data: {
      userId: user.id,
      contactId: contacts[0].id,
      channel: "whatsapp",
      status: "active",
      lastMessage: "¿Cuánto cuesta una limpieza dental?",
      lastMessageAt: new Date(Date.now() - 1800000),
    },
  });

  await prisma.message.createMany({
    data: [
      { conversationId: conv1.id, sender: "client", content: "Hola, buenos días", createdAt: new Date(Date.now() - 1900000), channel: "whatsapp", status: "read" },
      { conversationId: conv1.id, sender: "secretary", content: "¡Buenos días! Soy Ana, la asistente de Clínica Dental Mendoza. ¿En qué puedo ayudarte?", createdAt: new Date(Date.now() - 1880000), channel: "whatsapp", status: "read" },
      { conversationId: conv1.id, sender: "client", content: "¿Cuánto cuesta una limpieza dental?", createdAt: new Date(Date.now() - 1800000), channel: "whatsapp", status: "read" },
      { conversationId: conv1.id, sender: "secretary", content: "La limpieza dental tiene un costo de $800 MXN. Incluye ultrasonido y pulido. ¿Te gustaría agendar una cita?", createdAt: new Date(Date.now() - 1780000), channel: "whatsapp", status: "read" },
    ],
  });

  const conv2 = await prisma.conversation.create({
    data: {
      userId: user.id,
      contactId: contacts[2].id,
      channel: "email",
      status: "active",
      lastMessage: "Información sobre implantes dentales",
      lastMessageAt: new Date(Date.now() - 7200000),
    },
  });

  await prisma.message.createMany({
    data: [
      { conversationId: conv2.id, sender: "client", content: "Buenos días, me interesa información sobre implantes dentales. ¿Cuánto tiempo toma el proceso?", createdAt: new Date(Date.now() - 7400000), channel: "email", status: "read" },
      { conversationId: conv2.id, sender: "secretary", content: "Estimado Carlos, gracias por contactarnos. El proceso de implante dental generalmente toma entre 3 y 6 meses dependiendo del caso. Le recomiendo agendar una consulta de valoración para que el Dr. Mendoza evalúe su caso específicamente. ¿Cuándo podría venir?", createdAt: new Date(Date.now() - 7200000), channel: "email", status: "read" },
    ],
  });

  // Create demo tickets
  const ticket1 = await prisma.ticket.create({
    data: {
      userId: user.id,
      contactId: contacts[1].id,
      title: "Queja por tiempo de espera",
      description: "El paciente esperó 45 minutos sin ser atendido y solicita explicación y compensación.",
      priority: "urgent",
      status: "pending",
      channel: "whatsapp",
      reason: "Insatisfacción del cliente",
    },
  });

  await prisma.ticketMessage.create({
    data: {
      ticketId: ticket1.id,
      sender: "client",
      content: "Esto es una falta de respeto, esperé casi una hora. Exijo que me expliquen qué pasó y quiero que me devuelvan el dinero.",
    },
  });

  const ticket2 = await prisma.ticket.create({
    data: {
      userId: user.id,
      contactId: contacts[3].id,
      title: "Pregunta sobre garantía de implante",
      description: "Paciente pregunta sobre garantía de su implante instalado hace 2 años.",
      priority: "normal",
      status: "pending",
      channel: "whatsapp",
      reason: "Información no disponible",
    },
  });

  await prisma.ticketMessage.create({
    data: {
      ticketId: ticket2.id,
      sender: "client",
      content: "Hola, me pusieron un implante hace 2 años y siento algo raro. ¿Cuánto tiempo tiene garantía y qué cubre?",
    },
  });

  // Create demo appointments
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  await prisma.appointment.create({
    data: {
      secretaryId: secretary.id,
      contactId: contacts[0].id,
      title: "Limpieza dental — María García",
      description: "Primera visita, limpieza completa con ultrasonido",
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + 30 * 60000),
      channel: "whatsapp",
      status: "confirmed",
    },
  });

  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  dayAfter.setHours(14, 30, 0, 0);

  await prisma.appointment.create({
    data: {
      secretaryId: secretary.id,
      contactId: contacts[1].id,
      title: "Revisión de ortodoncia — Luis Pérez",
      startTime: dayAfter,
      endTime: new Date(dayAfter.getTime() + 30 * 60000),
      channel: "whatsapp",
      status: "confirmed",
    },
  });

  // Activity logs
  await prisma.activityLog.createMany({
    data: [
      { userId: user.id, action: "responded", description: "Respondió a María García en WhatsApp", contactName: "María García", channel: "whatsapp", createdAt: new Date(Date.now() - 1780000) },
      { userId: user.id, action: "scheduled", description: "Agendó cita de limpieza dental para María García — mañana a las 10am", contactName: "María García", channel: "whatsapp", createdAt: new Date(Date.now() - 1700000) },
      { userId: user.id, action: "ticket_created", description: "🎫 Creó ticket: Queja por tiempo de espera de Luis Pérez", contactName: "Luis Pérez", channel: "whatsapp", createdAt: new Date(Date.now() - 3600000) },
      { userId: user.id, action: "responded", description: "Respondió correo de carlos@empresa.com sobre implantes", contactName: "Carlos González", channel: "email", createdAt: new Date(Date.now() - 7200000) },
      { userId: user.id, action: "out_of_hours", description: "⚡ Fuera de horario: mensaje de Pedro Sánchez en espera", contactName: "Pedro Sánchez", channel: "whatsapp", createdAt: new Date(Date.now() - 172800000) },
    ],
  });

  // Update conversations with message counts
  await prisma.message.createMany({
    data: Array.from({ length: 12 }, (_, i) => ({
      conversationId: conv1.id,
      sender: i % 2 === 0 ? "client" : "secretary",
      content: `Mensaje ${i + 1}`,
      channel: "whatsapp",
      status: "read",
      createdAt: new Date(Date.now() - (i + 10) * 60000),
    })),
  });

  return NextResponse.json({ success: true, userId: user.id, message: "Demo data created! Login with demo@secretarioia.mx / demo1234" });
}
