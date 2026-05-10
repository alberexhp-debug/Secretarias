import { createClient } from "@libsql/client";
import "dotenv/config";

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

await client.execute(`
  CREATE TABLE IF NOT EXISTS "EmailStyleExample" (
    "id"            TEXT PRIMARY KEY NOT NULL,
    "userId"        TEXT NOT NULL,
    "category"      TEXT NOT NULL DEFAULT '',
    "originalDraft" TEXT NOT NULL,
    "editedVersion" TEXT NOT NULL,
    "createdAt"     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
  )
`);

await client.execute(`CREATE INDEX IF NOT EXISTS "EmailStyleExample_userId_createdAt_idx" ON "EmailStyleExample"("userId", "createdAt")`);

console.log("✅ EmailStyleExample table created");
