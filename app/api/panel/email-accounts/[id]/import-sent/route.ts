import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/imap";
import { randomBytes } from "crypto";
function createId() { return randomBytes(12).toString("hex"); }

// POST — import sent emails from IMAP "Sent" folder as style learning examples
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth().catch(() => null);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const account = await prisma.connectedEmailAccount.findFirst({ where: { id, userId: user.id } });
  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!account.imapPassword || !account.imapHost) {
    return NextResponse.json({ error: "Cuenta sin credenciales IMAP" }, { status: 400 });
  }

  const { ImapFlow } = await import("imapflow");
  const password = decrypt(account.imapPassword);

  const client = new ImapFlow({
    host: account.imapHost,
    port: account.imapPort || 993,
    secure: true,
    auth: { user: account.email, pass: password },
    logger: false,
  });

  let imported = 0;

  try {
    await client.connect();

    // Try common "Sent" folder names
    const sentFolderCandidates = ["Sent", "Sent Items", "Sent Messages", "[Gmail]/Sent Mail", "Enviados", "INBOX.Sent"];
    let sentFolder: string | null = null;

    for (const folder of sentFolderCandidates) {
      try {
        const status = await client.status(folder, { messages: true });
        if (status) { sentFolder = folder; break; }
      } catch { /* try next */ }
    }

    if (!sentFolder) {
      await client.logout();
      return NextResponse.json({ error: "No se encontró la carpeta de enviados" }, { status: 400 });
    }

    const lock = await client.getMailboxLock(sentFolder);
    try {
      // Fetch last 100 sent emails (most recent first)
      const mailbox = client.mailbox;
      const total = mailbox && "exists" in mailbox ? (mailbox as { exists: number }).exists : 0;
      if (total === 0) return NextResponse.json({ ok: true, imported: 0 });

      const start = Math.max(1, total - 99);
      const messages: Array<{ text: string }> = [];

      for await (const msg of client.fetch(`${start}:*`, { source: true })) {
        const raw = msg.source?.toString() || "";
        // Extract body (text after double newline, strip HTML tags)
        const bodyMatch = raw.match(/\r?\n\r?\n([\s\S]+)/);
        const body = bodyMatch?.[1]
          ?.replace(/<[^>]+>/g, " ")
          .replace(/=\r?\n/g, "")
          .replace(/\r?\n/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 1500) || "";

        if (body.length > 30) messages.push({ text: body });
      }

      // Bulk insert as approved style examples (not edited — they are the user's own writing)
      if (messages.length > 0) {
        const examples = messages.map((m) => ({
          id: createId(),
          userId: user.id,
          category: "",
          originalDraft: m.text,
          editedVersion: m.text,
          wasEdited: false as boolean,
          createdAt: new Date(),
        }));

        // Insert in batches of 20 to avoid query size limits
        for (let i = 0; i < examples.length; i += 20) {
          await prisma.emailStyleExample.createMany({ data: examples.slice(i, i + 20) });
        }
        imported = examples.length;
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }

  return NextResponse.json({ ok: true, imported });
}
