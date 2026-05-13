import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

const memoriesTable = pgTable(
  "memory",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // The entity this memory belongs to (user / team / organization)
    actorId: text("actor_id").notNull(),
    actorType: text("actor_type").notNull().$type<"user" | "team" | "organization">(),
    // Human-readable key for the memory fact
    key: text("key").notNull(),
    // The remembered value
    value: text("value").notNull(),
    // Optional expiration — null means forever
    expiresAt: timestamp("expires_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // Fast lookup by actor
    index("memory_actor_id_actor_type_idx").on(table.actorId, table.actorType),
    // Fast lookup by key within an actor
    index("memory_actor_id_key_idx").on(table.actorId, table.key),
  ],
);

export default memoriesTable;
