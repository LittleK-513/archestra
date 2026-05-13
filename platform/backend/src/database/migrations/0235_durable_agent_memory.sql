-- Add durable memory table for user, team, and organization scoped facts
CREATE TABLE IF NOT EXISTS "memory" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "actor_id" text NOT NULL,
  "actor_type" text NOT NULL,
  "key" text NOT NULL,
  "value" text NOT NULL,
  "expires_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Composite index for fast actor-scoped lookups
CREATE INDEX IF NOT EXISTS "memory_actor_id_actor_type_idx" ON "memory" ("actor_id", "actor_type");
-- Index for key lookups within an actor
CREATE INDEX IF NOT EXISTS "memory_actor_id_key_idx" ON "memory" ("actor_id", "key");
