import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

function getClient() {
  if (!client) {
    client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || "",
    });
  }
  return client;
}

export interface SecretaryConfig {
  name: string;
  tone: string;
  businessName: string;
  businessDesc: string;
  city: string;
  schedule: Record<string, unknown>;
  faqs: Array<{ q: string; a: string }>;
  rules: string[];
}

export function buildSystemPrompt(config: SecretaryConfig): string {
  const toneDesc = {
    profesional: "formal, respetuoso y profesional. Usa usted cuando te dirijas a los clientes.",
    amigable: "amigable y cálido, pero siempre profesional. Usa tú al dirigirte a los clientes.",
    cercano: "muy cercano y relajado, como si fuera un amigo. Usa tú y lenguaje casual pero sin perder el respeto.",
  }[config.tone] || "profesional";

  const faqsText = config.faqs.map((f, i) => `${i + 1}. P: ${f.q}\n   R: ${f.a}`).join("\n");
  const rulesText = config.rules.map((r, i) => `${i + 1}. ${r}`).join("\n");

  return `Eres ${config.name}, el secretario virtual de ${config.businessName}.

DESCRIPCIÓN DEL NEGOCIO:
${config.businessDesc}
Ubicación: ${config.city}

TU PERSONALIDAD Y TONO:
Eres ${toneDesc}

PREGUNTAS FRECUENTES QUE DEBES RESPONDER:
${faqsText || "No hay FAQs configuradas aún."}

REGLAS QUE DEBES SEGUIR SIEMPRE:
${rulesText || "No hay reglas especiales configuradas."}

REGLAS GENERALES:
- Nunca inventes información que no está en tu configuración
- Si no sabes algo, dilo honestamente y ofrece escalarlo al dueño
- Mantén respuestas cortas y directas (máximo 3-4 oraciones)
- Si el cliente pregunta si eres un robot, dí honestamente que eres un asistente virtual
- Nunca reveals que usas Secretario IA como plataforma
- Ayuda con citas, preguntas sobre el negocio, y atención general
- Si detectas urgencia o insatisfacción, escala al dueño`;
}

function smartFallbackReply(
  userMessage: string,
  systemPrompt: string
): string {
  const msg = userMessage.toLowerCase();

  // Extract FAQs from the system prompt
  const faqMatch = systemPrompt.match(/PREGUNTAS FRECUENTES[\s\S]*?(?=REGLAS QUE|$)/);
  if (faqMatch) {
    const faqText = faqMatch[0];
    const faqLines = faqText.split("\n").filter((l) => l.includes("P:") || l.includes("R:"));
    let currentQ = "";
    for (let i = 0; i < faqLines.length; i++) {
      const line = faqLines[i];
      if (line.includes("P:")) {
        currentQ = line.replace(/.*P:\s*/, "").trim().toLowerCase();
      } else if (line.includes("R:") && currentQ) {
        const answer = line.replace(/.*R:\s*/, "").trim();
        const qWords = currentQ.split(/\s+/).filter((w) => w.length > 3);
        const matches = qWords.filter((w) => msg.includes(w)).length;
        if (matches >= 2 || (qWords.length === 1 && matches === 1)) {
          return answer;
        }
        currentQ = "";
      }
    }
  }

  // Extract secretary name from prompt
  const nameMatch = systemPrompt.match(/^Eres (\w+)/m);
  const name = nameMatch ? nameMatch[1] : "tu secretario";

  if (msg.includes("hola") || msg.includes("buenos") || msg.includes("buen")) {
    return `¡Hola! Soy ${name}. ¿En qué puedo ayudarte hoy?`;
  }
  if (msg.includes("cita") || msg.includes("agendar") || msg.includes("disponible")) {
    return `Claro, puedo ayudarte a agendar una cita. ¿Para qué día y hora te sería conveniente?`;
  }
  if (msg.includes("ubicaci") || msg.includes("donde") || msg.includes("dónde")) {
    return `Para la ubicación exacta del negocio, te recomiendo llamarnos directamente o visitarnos durante nuestro horario de atención.`;
  }
  if (msg.includes("precio") || msg.includes("costo") || msg.includes("cuesta") || msg.includes("cobran")) {
    return `Para información sobre precios, puedo conectarte con nuestro equipo que te dará el detalle completo. ¿Tienes alguna pregunta específica?`;
  }
  if (msg.includes("gracias")) {
    return `¡Con gusto! ¿Hay algo más en lo que pueda ayudarte?`;
  }
  if (msg.includes("horario") || msg.includes("cuando") || msg.includes("cuándo")) {
    return `Podría darte el horario de atención. ¿Necesitas información de un día específico?`;
  }

  return `Entendido. Te ayudo con eso en un momento. ¿Hay algo más específico que necesites saber?`;
}

export async function chatWithSecretary(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  systemPrompt: string
): Promise<string> {
  const anthropic = getClient();

  if (!process.env.ANTHROPIC_API_KEY) {
    const lastMsg = messages[messages.length - 1];
    return smartFallbackReply(lastMsg?.content || "", systemPrompt);
  }

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    system: systemPrompt,
    messages,
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
}

export async function runOnboardingChat(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  step: number
): Promise<string> {
  const anthropic = getClient();

  const systemPrompt = `Eres un asistente amigable que está ayudando a un dueño de PYME a configurar su secretario virtual.
Tu trabajo es hacer las siguientes 8 preguntas, UNA A LA VEZ, en este orden exacto:
1. ¿Cómo se llama tu negocio y a qué se dedica?
2. ¿En qué ciudad o zona están ubicados?
3. ¿Cuál es tu horario de atención? (días y horas)
4. ¿Qué preguntas te hacen más seguido tus clientes?
5. ¿Cuáles son tus servicios o productos principales y sus precios?
6. ¿Hay algo que tu secretario NUNCA debería hacer o decir?
7. ¿Agendas citas con tus clientes? ¿Cómo funciona ese proceso?
8. ¿Hay algo más que tu secretario deba saber?

Actualmente estás en la pregunta ${step} de 8.
- Haz UNA sola pregunta a la vez
- Si la respuesta es vaga, pide amigablemente más detalles
- Si ya respondieron, confirma brevemente y pasa a la siguiente
- Al llegar a la pregunta 8, después de la respuesta, genera un resumen amigable
- Sé cálido, alentador y usa emojis ocasionalmente`;

  if (!process.env.ANTHROPIC_API_KEY) {
    const questions = [
      "¡Hola! Estoy aquí para ayudarte a configurar tu secretario virtual. Para empezar, cuéntame: ¿cómo se llama tu negocio y a qué se dedica?",
      "¡Perfecto! Ahora dime, ¿en qué ciudad o zona están ubicados?",
      "Excelente. ¿Cuál es tu horario de atención? Por ejemplo: lunes a viernes de 9am a 6pm.",
      "Muy bien. ¿Qué preguntas te hacen más seguido tus clientes?",
      "¿Cuáles son tus servicios o productos principales? Si manejas precios, puedes compartirlos.",
      "¿Hay algo que tu secretario NUNCA debería hacer o decir? Por ejemplo, temas que prefieres manejar tú directamente.",
      "¿Agendas citas con tus clientes? Si es así, ¿cómo funciona ese proceso normalmente?",
      "¡Ya casi terminamos! ¿Hay algo más que tu secretario deba saber para atender bien a tus clientes?",
    ];
    return questions[Math.min(step - 1, questions.length - 1)];
  }

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    system: systemPrompt,
    messages,
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
}

export async function extractOnboardingData(
  conversation: string
): Promise<Record<string, string>> {
  const anthropic = getClient();

  if (!process.env.ANTHROPIC_API_KEY) {
    return {};
  }

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1000,
    system: `Extrae la información de la conversación de onboarding y devuelve un JSON con estas claves:
businessName, businessType, city, schedule, frequentQuestions, services, restrictions, appointmentsInfo, additionalInfo
Si algún dato no está claro, usa una cadena vacía.`,
    messages: [
      {
        role: "user",
        content: `Conversación:\n${conversation}\n\nDevuelve solo el JSON, sin explicaciones.`,
      },
    ],
  });

  try {
    const text = response.content[0].type === "text" ? response.content[0].text : "{}";
    return JSON.parse(text);
  } catch {
    return {};
  }
}

export async function generateSecretaryNames(businessType: string): Promise<string[]> {
  const defaults: Record<string, string[]> = {
    clinica: ["Ana", "Carmen", "Sofía"],
    dental: ["Ana", "Carlos", "Sofía"],
    taller: ["Luis", "Pedro", "Mónica"],
    restaurante: ["María", "Roberto", "Elena"],
    salon: ["Valeria", "Diana", "Miguel"],
  };

  for (const key of Object.keys(defaults)) {
    if (businessType.toLowerCase().includes(key)) {
      return defaults[key];
    }
  }
  return ["Ana", "Carlos", "Sofía"];
}
