import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
function cuid() {
  return "c" + Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
  // Check if demo user exists
  const existing = await client.execute({
    sql: "SELECT id FROM User WHERE email = ?",
    args: ["demo@secretarioia.mx"],
  });
  if (existing.rows.length > 0) {
    console.log("Demo user already exists:", existing.rows[0][0]);
    client.close();
    return;
  }

  const now = new Date().toISOString();
  const trialEnd = new Date(Date.now() + 14 * 86400000).toISOString();
  const password = await bcrypt.hash("demo1234", 10);

  const userId = cuid();
  await client.execute({
    sql: `INSERT INTO User (id, email, name, password, createdAt, updatedAt, onboardingStep, onboardingDone, planType, trialEnd)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [userId, "demo@secretarioia.mx", "Carlos Mendoza", password, now, now, 6, 1, "trial", trialEnd],
  });
  console.log("✓ User created:", userId);

  const faqs = JSON.stringify([
    { q: "¿Cuánto cuesta la consulta?", a: "La consulta tiene un costo de $500 MXN. Incluye revisión completa y diagnóstico." },
    { q: "¿Tienen citas disponibles?", a: "Sí, tenemos disponibilidad. ¿Para qué día te acomoda? Tenemos horarios de lunes a viernes de 9am a 6pm." },
    { q: "¿Dónde están ubicados?", a: "Estamos en Av. Insurgentes 456, Col. Roma Norte, CDMX. A 2 cuadras del metro Insurgentes." },
    { q: "¿Aceptan seguros médicos?", a: "Sí, trabajamos con la mayoría de seguros mayores. ¿Con qué seguro cuentas para verificar?" },
  ]);

  const rules = JSON.stringify([
    "Nunca dar diagnósticos médicos específicos, solo orientar a que vengan a consulta",
    "No confirmar precios de procedimientos complejos sin consultar primero con el médico",
    "Si el paciente menciona dolor severo o emergencia, dar el número de emergencias: 55-1234-5678",
  ]);

  const schedule = JSON.stringify({
    Lunes: { active: true, from: "09:00", to: "18:00" },
    Martes: { active: true, from: "09:00", to: "18:00" },
    Miércoles: { active: true, from: "09:00", to: "18:00" },
    Jueves: { active: true, from: "09:00", to: "18:00" },
    Viernes: { active: true, from: "09:00", to: "17:00" },
    Sábado: { active: true, from: "10:00", to: "14:00" },
    Domingo: { active: false, from: "09:00", to: "18:00" },
  });

  const systemPrompt = `Eres Ana, el secretario virtual de Clínica Dental Mendoza.

DESCRIPCIÓN DEL NEGOCIO:
Clínica dental especializada en ortodoncia, implantes y limpieza. 15 años de experiencia. Atendemos adultos y niños.
Ubicación: CDMX

TU PERSONALIDAD Y TONO:
Eres amigable y cálido, pero siempre profesional. Usa tú al dirigirte a los clientes.

PREGUNTAS FRECUENTES QUE DEBES RESPONDER:
1. P: ¿Cuánto cuesta la consulta?
   R: La consulta tiene un costo de $500 MXN. Incluye revisión completa y diagnóstico.
2. P: ¿Tienen citas disponibles?
   R: Sí, tenemos disponibilidad. ¿Para qué día te acomoda? Tenemos horarios de lunes a viernes de 9am a 6pm.
3. P: ¿Dónde están ubicados?
   R: Estamos en Av. Insurgentes 456, Col. Roma Norte, CDMX. A 2 cuadras del metro Insurgentes.
4. P: ¿Aceptan seguros médicos?
   R: Sí, trabajamos con la mayoría de seguros mayores. ¿Con qué seguro cuentas para verificar?

REGLAS QUE DEBES SEGUIR SIEMPRE:
1. Nunca dar diagnósticos médicos específicos, solo orientar a que vengan a consulta
2. No confirmar precios de procedimientos complejos sin consultar primero con el médico
3. Si el paciente menciona dolor severo o emergencia, dar el número de emergencias: 55-1234-5678`;

  const secId = cuid();
  await client.execute({
    sql: `INSERT INTO Secretary (id, userId, name, avatarId, tone, businessName, businessType, businessDesc, city, faqs, rules, schedule, systemPrompt, onboardingData, isActive, createdAt, updatedAt, whatsappConnected, emailConnected, calendarConnected, appointmentDuration, appointmentBuffer, appointmentMinAdvance)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [secId, userId, "Ana", "avatar-1", "amigable", "Clínica Dental Mendoza", "Clínica dental", "Clínica dental especializada en ortodoncia, implantes y limpieza.", "CDMX", faqs, rules, schedule, systemPrompt, "{}", 1, now, now, 0, 0, 0, 30, 10, 2],
  });
  console.log("✓ Secretary created");

  // Contacts
  const c1 = cuid(), c2 = cuid(), c3 = cuid(), c4 = cuid(), c5 = cuid();
  const contacts = [
    [c1, userId, "María García", "+52 55 1234 5678", null, "whatsapp"],
    [c2, userId, "Luis Pérez", "+52 55 9876 5432", null, "whatsapp"],
    [c3, userId, "Carlos González", null, "carlos@empresa.com", "email"],
    [c4, userId, "Ana Rodríguez", "+52 55 5555 4444", null, "whatsapp"],
    [c5, userId, "Pedro Sánchez", "+52 55 6666 7777", null, "whatsapp"],
  ];
  for (const [id, uid, name, phone, email, channel] of contacts) {
    await client.execute({
      sql: `INSERT INTO Contact (id, userId, name, phone, email, channel, notes, isBlocked, firstContactAt, lastInteraction, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, '', 0, ?, ?, ?, ?)`,
      args: [id, uid, name, phone, email, channel, now, now, now, now],
    });
  }
  console.log("✓ 5 contacts created");

  // Conversations
  const conv1 = cuid();
  await client.execute({
    sql: `INSERT INTO Conversation (id, userId, contactId, channel, status, lastMessage, lastMessageAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [conv1, userId, c1, "whatsapp", "active", "¿Cuánto cuesta una limpieza dental?", now, now, now],
  });
  const msgs1 = [
    [cuid(), conv1, "client", "Hola, buenos días", "whatsapp", "read"],
    [cuid(), conv1, "secretary", "¡Buenos días! Soy Ana, la asistente de Clínica Dental Mendoza. ¿En qué puedo ayudarte?", "whatsapp", "read"],
    [cuid(), conv1, "client", "¿Cuánto cuesta una limpieza dental?", "whatsapp", "read"],
    [cuid(), conv1, "secretary", "La limpieza dental tiene un costo de $800 MXN. Incluye ultrasonido y pulido. ¿Te gustaría agendar una cita?", "whatsapp", "read"],
  ];
  for (const [id, convId, sender, content, channel, status] of msgs1) {
    await client.execute({
      sql: `INSERT INTO Message (id, conversationId, sender, content, channel, status, isOutOfHours, createdAt) VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
      args: [id, convId, sender, content, channel, status, now],
    });
  }

  const conv2 = cuid();
  await client.execute({
    sql: `INSERT INTO Conversation (id, userId, contactId, channel, status, lastMessage, lastMessageAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [conv2, userId, c3, "email", "active", "Información sobre implantes dentales", now, now, now],
  });
  await client.execute({
    sql: `INSERT INTO Message (id, conversationId, sender, content, channel, status, isOutOfHours, createdAt) VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
    args: [cuid(), conv2, "client", "Buenos días, me interesa información sobre implantes dentales. ¿Cuánto tiempo toma el proceso?", "email", "read", now],
  });
  await client.execute({
    sql: `INSERT INTO Message (id, conversationId, sender, content, channel, status, isOutOfHours, createdAt) VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
    args: [cuid(), conv2, "secretary", "Estimado Carlos, el proceso de implante dental toma entre 3 y 6 meses. Le recomiendo agendar una consulta de valoración.", "email", "read", now],
  });
  console.log("✓ 2 conversations + messages created");

  // Tickets
  const t1 = cuid();
  await client.execute({
    sql: `INSERT INTO Ticket (id, userId, contactId, title, description, priority, status, channel, reason, internalNotes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '', ?, ?)`,
    args: [t1, userId, c2, "Queja por tiempo de espera", "El paciente esperó 45 minutos sin ser atendido.", "urgent", "pending", "whatsapp", "Insatisfacción del cliente", now, now],
  });
  await client.execute({
    sql: `INSERT INTO TicketMessage (id, ticketId, sender, content, createdAt) VALUES (?, ?, ?, ?, ?)`,
    args: [cuid(), t1, "client", "Esto es una falta de respeto, esperé casi una hora.", now],
  });

  const t2 = cuid();
  await client.execute({
    sql: `INSERT INTO Ticket (id, userId, contactId, title, description, priority, status, channel, reason, internalNotes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '', ?, ?)`,
    args: [t2, userId, c4, "Pregunta sobre garantía de implante", "Paciente pregunta sobre garantía de su implante instalado hace 2 años.", "normal", "pending", "whatsapp", "Información no disponible", now, now],
  });
  await client.execute({
    sql: `INSERT INTO TicketMessage (id, ticketId, sender, content, createdAt) VALUES (?, ?, ?, ?, ?)`,
    args: [cuid(), t2, "client", "Hola, me pusieron un implante hace 2 años y siento algo raro. ¿Cuánto tiempo tiene garantía?", now],
  });
  console.log("✓ 2 tickets created");

  // Appointments
  const tomorrow = new Date(Date.now() + 86400000);
  tomorrow.setHours(10, 0, 0, 0);
  const dayAfter = new Date(Date.now() + 2 * 86400000);
  dayAfter.setHours(14, 30, 0, 0);

  await client.execute({
    sql: `INSERT INTO Appointment (id, secretaryId, contactId, title, description, startTime, endTime, channel, status, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '', ?, ?)`,
    args: [cuid(), secId, c1, "Limpieza dental — María García", "Primera visita, limpieza completa con ultrasonido", tomorrow.toISOString(), new Date(tomorrow.getTime() + 30 * 60000).toISOString(), "whatsapp", "confirmed", now, now],
  });
  await client.execute({
    sql: `INSERT INTO Appointment (id, secretaryId, contactId, title, description, startTime, endTime, channel, status, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '', ?, ?)`,
    args: [cuid(), secId, c2, "Revisión de ortodoncia — Luis Pérez", "", dayAfter.toISOString(), new Date(dayAfter.getTime() + 30 * 60000).toISOString(), "whatsapp", "confirmed", now, now],
  });
  console.log("✓ 2 appointments created");

  // Activity logs
  const activities = [
    [cuid(), userId, "responded", "Respondió a María García en WhatsApp", "María García", "whatsapp"],
    [cuid(), userId, "scheduled", "Agendó cita de limpieza dental para María García — mañana a las 10am", "María García", "whatsapp"],
    [cuid(), userId, "ticket_created", "Creó ticket: Queja por tiempo de espera de Luis Pérez", "Luis Pérez", "whatsapp"],
    [cuid(), userId, "responded", "Respondió correo de carlos@empresa.com sobre implantes", "Carlos González", "email"],
    [cuid(), userId, "out_of_hours", "Fuera de horario: mensaje de Pedro Sánchez en espera", "Pedro Sánchez", "whatsapp"],
  ];
  for (const [id, uid, action, desc, contactName, channel] of activities) {
    await client.execute({
      sql: `INSERT INTO ActivityLog (id, userId, action, description, contactName, channel, entityType, entityId, createdAt) VALUES (?, ?, ?, ?, ?, ?, '', '', ?)`,
      args: [id, uid, action, desc, contactName, channel, now],
    });
  }
  console.log("✓ 5 activity logs created");

  console.log("\n✅ Demo data ready! Login with: demo@secretarioia.mx / demo1234");
  client.close();
}

run().catch(e => { console.error(e); client.close(); });
