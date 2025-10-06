import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { config } from "dotenv";

// Load environment variables
config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

const sqlClient = neon(connectionString);
const db = drizzle(sqlClient);

async function migrateContestSchema() {
  try {
    console.log("🔄 Starting contest schema migration...");

    // Add new columns to contests table
    await db.execute(sql`
      ALTER TABLE contests 
      ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) NOT NULL DEFAULT 'public',
      ADD COLUMN IF NOT EXISTS invite_code VARCHAR(10) UNIQUE,
      ADD COLUMN IF NOT EXISTS allow_friends BOOLEAN NOT NULL DEFAULT true
    `);

    console.log("✅ Added new columns to contests table");

    // Create contest_invitations table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS contest_invitations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
        inviter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        invitee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        message TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(contest_id, invitee_id)
      )
    `);

    console.log("✅ Created contest_invitations table");

    // Create indexes for better performance
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_contests_created_by ON contests(created_by);
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_contests_visibility ON contests(visibility);
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_contest_invitations_contest_id ON contest_invitations(contest_id);
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_contest_invitations_invitee_id ON contest_invitations(invitee_id);
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_contest_invitations_inviter_id ON contest_invitations(inviter_id);
    `);

    console.log("✅ Created indexes");

    console.log("🎉 Contest schema migration completed successfully!");
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateContestSchema()
    .then(() => {
      console.log("Migration completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}

export { migrateContestSchema };
