import { createTransport } from "nodemailer";
import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY = Buffer.from(process.env.ENCRYPTION_KEY || "0".repeat(64), "hex");

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decrypt(encoded: string): string {
  const [ivHex, tagHex, dataHex] = encoded.split(":");
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return decipher.update(Buffer.from(dataHex, "hex")).toString("utf8") + decipher.final("utf8");
}

export interface ImapAccount {
  email: string;
  imapHost: string;
  imapPort: number;
  password: string; // decrypted
  smtpHost: string;
  smtpPort: number;
}

// Known IMAP/SMTP presets per provider
export function getPreset(email: string): Partial<ImapAccount> | null {
  const domain = email.split("@")[1]?.toLowerCase();
  const presets: Record<string, Partial<ImapAccount>> = {
    "gmail.com": { imapHost: "imap.gmail.com", imapPort: 993, smtpHost: "smtp.gmail.com", smtpPort: 587 },
    "googlemail.com": { imapHost: "imap.gmail.com", imapPort: 993, smtpHost: "smtp.gmail.com", smtpPort: 587 },
    "outlook.com": { imapHost: "outlook.office365.com", imapPort: 993, smtpHost: "smtp.office365.com", smtpPort: 587 },
    "hotmail.com": { imapHost: "outlook.office365.com", imapPort: 993, smtpHost: "smtp.office365.com", smtpPort: 587 },
    "live.com": { imapHost: "outlook.office365.com", imapPort: 993, smtpHost: "smtp.office365.com", smtpPort: 587 },
    "yahoo.com": { imapHost: "imap.mail.yahoo.com", imapPort: 993, smtpHost: "smtp.mail.yahoo.com", smtpPort: 587 },
    "yahoo.es": { imapHost: "imap.mail.yahoo.com", imapPort: 993, smtpHost: "smtp.mail.yahoo.com", smtpPort: 587 },
    "icloud.com": { imapHost: "imap.mail.me.com", imapPort: 993, smtpHost: "smtp.mail.me.com", smtpPort: 587 },
  };
  return presets[domain || ""] || null;
}

// Fetch new emails since lastUid. Returns array of parsed messages + new lastUid.
export async function fetchNewEmails(account: ImapAccount, lastUid: string | null): Promise<{
  emails: Array<{ uid: string; subject: string; from: string; fromName: string; body: string; messageId: string }>;
  newLastUid: string | null;
}> {
  // Dynamically import imapflow to avoid edge-runtime issues
  const { ImapFlow } = await import("imapflow");

  const client = new ImapFlow({
    host: account.imapHost,
    port: account.imapPort,
    secure: true,
    auth: { user: account.email, pass: account.password },
    logger: false,
  });

  const emails: Array<{ uid: string; subject: string; from: string; fromName: string; body: string; messageId: string }> = [];
  let newLastUid: string | null = lastUid;

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    try {
      const searchCriteria = lastUid ? { uid: `${parseInt(lastUid) + 1}:*` } : { seen: false };
      const messages = await client.search(searchCriteria, { uid: true });

      if (messages && messages.length > 0) {
        for await (const msg of client.fetch(messages.slice(-20), { envelope: true, bodyStructure: true, source: true }, { uid: true })) {
          const uid = String(msg.uid);
          const envelope = msg.envelope;
          const from = envelope?.from?.[0];
          const fromEmail = from?.address || "";
          const fromName = [from?.name, fromEmail].filter(Boolean).join(" ").trim() || fromEmail;

          // Extract plain text body
          const rawSource = msg.source?.toString() || "";
          const bodyMatch = rawSource.match(/\r?\n\r?\n([\s\S]+)/);
          const body = bodyMatch?.[1]?.replace(/=\r?\n/g, "").replace(/\r?\n/g, " ").trim().slice(0, 2000) || "";

          emails.push({
            uid,
            subject: envelope?.subject || "(Sin asunto)",
            from: fromEmail,
            fromName,
            body,
            messageId: envelope?.messageId || uid,
          });

          if (!newLastUid || parseInt(uid) > parseInt(newLastUid)) {
            newLastUid = uid;
          }
        }
      }
    } finally {
      lock.release();
    }
  } finally {
    await client.logout();
  }

  return { emails, newLastUid };
}

// Send email via SMTP using IMAP account credentials
export async function sendViaSmtp(account: ImapAccount, opts: {
  to: string;
  subject: string;
  html: string;
  fromName: string;
}) {
  const transport = createTransport({
    host: account.smtpHost,
    port: account.smtpPort,
    secure: false,
    auth: { user: account.email, pass: account.password },
    tls: { rejectUnauthorized: false },
  });

  await transport.sendMail({
    from: `${opts.fromName} <${account.email}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
}
