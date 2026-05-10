import { createClient } from "@libsql/client";
import "dotenv/config";

const TURSO_URL = process.env.DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_URL || !TURSO_TOKEN) {
  console.error("Missing DATABASE_URL or TURSO_AUTH_TOKEN");
  process.exit(1);
}

const client = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

const migrations = [
  // Add subject to Conversation
  `ALTER TABLE "Conversation" ADD COLUMN "subject" TEXT`,
  // Add metadata to Message
  `ALTER TABLE "Message" ADD COLUMN "metadata" TEXT`,
];

for (const sql of migrations) {
  try {
    await client.execute(sql);
    console.log("✓", sql.slice(0, 60));
  } catch (e) {
    if (e.message?.includes("duplicate column")) {
      console.log("↷ Already exists:", sql.slice(0, 60));
    } else {
      console.error("✗ Error:", e.message, "\n  SQL:", sql);
    }
  }
}

console.log("\n✅ Migration complete");
