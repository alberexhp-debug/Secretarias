import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt, decrypt, getPreset } from "@/lib/imap";

// GET — list all connected email accounts
export async function GET() {
  const user = await requireAuth().catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accounts = await prisma.connectedEmailAccount.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, provider: true, email: true, label: true, connected: true, lastChecked: true, createdAt: true },
  });

  return NextResponse.json({ accounts });
}

// POST — add IMAP account (Gmail app password, Outlook, custom)
export async function POST(req: NextRequest) {
  const user = await requireAuth().catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email, password, imapHost, imapPort, smtpHost, smtpPort, label } = await req.json();

  if (!email || !password) return NextResponse.json({ error: "Email y contraseña requeridos" }, { status: 400 });

  // Auto-fill server settings if not provided
  const preset = getPreset(email);
  const finalImapHost = imapHost || preset?.imapHost;
  const finalImapPort = imapPort || preset?.imapPort || 993;
  const finalSmtpHost = smtpHost || preset?.smtpHost;
  const finalSmtpPort = smtpPort || preset?.smtpPort || 587;

  if (!finalImapHost || !finalSmtpHost) {
    return NextResponse.json({ error: "No se reconoce el proveedor. Introduce el servidor IMAP y SMTP manualmente." }, { status: 400 });
  }

  // Test connection before saving
  try {
    const { ImapFlow } = await import("imapflow");
    const client = new ImapFlow({
      host: finalImapHost, port: finalImapPort, secure: true,
      auth: { user: email, pass: password },
      logger: false,
    });
    await client.connect();
    await client.logout();
  } catch {
    return NextResponse.json({ error: "No se pudo conectar. Verifica las credenciales o usa una contraseña de aplicación." }, { status: 400 });
  }

  const encryptedPassword = encrypt(password);

  const existing = await prisma.connectedEmailAccount.findFirst({ where: { userId: user.id, email, provider: "imap" } });
  if (existing) {
    await prisma.connectedEmailAccount.update({
      where: { id: existing.id },
      data: { imapPassword: encryptedPassword, imapHost: finalImapHost, imapPort: finalImapPort, smtpHost: finalSmtpHost, smtpPort: finalSmtpPort, label: label || email, connected: true },
    });
  } else {
    await prisma.connectedEmailAccount.create({
      data: { userId: user.id, provider: "imap", email, label: label || email, imapPassword: encryptedPassword, imapHost: finalImapHost, imapPort: finalImapPort, smtpHost: finalSmtpHost, smtpPort: finalSmtpPort, connected: true },
    });
  }

  return NextResponse.json({ ok: true });
}
