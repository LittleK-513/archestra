import { and, eq, sql } from "drizzle-orm";
import db, { schema } from "@/database";
import type { Memory, InsertMemory, UpdateMemory } from "@/types";

class MemoryModel {
  static async create(data: InsertMemory): Promise<Memory> {
    const [memory] = await db
      .insert(schema.memoriesTable)
      .values(data)
      .returning();
    return memory;
  }

  /**
   * Find a memory by its ID.
   */
  static async findById(id: string): Promise<Memory | null> {
    const [memory] = await db
      .select()
      .from(schema.memoriesTable)
      .where(eq(schema.memoriesTable.id, id));
    return memory ?? null;
  }

  /**
   * Get all memories for a specific actor (user, team, or organization).
   * Optionally filter by key prefix.
   */
  static async findByActor(
    actorId: string,
    actorType: "user" | "team" | "organization",
    keyPrefix?: string,
  ): Promise<Memory[]> {
    const conditions = [
      eq(schema.memoriesTable.actorId, actorId),
      eq(schema.memoriesTable.actorType, actorType),
      // Filter out expired memories
      sql`${schema.memoriesTable.expiresAt} IS NULL OR ${schema.memoriesTable.expiresAt} > NOW()`,
    ];

    if (keyPrefix) {
      conditions.push(
        sql`${schema.memoriesTable.key} LIKE ${`${keyPrefix}%`}`,
      );
    }

    return db
      .select()
      .from(schema.memoriesTable)
      .where(and(...conditions))
      .orderBy(schema.memoriesTable.createdAt);
  }

  /**
   * Get a single memory value by actor + exact key.
   */
  static async findByKey(
    actorId: string,
    actorType: "user" | "team" | "organization",
    key: string,
  ): Promise<Memory | null> {
    const [memory] = await db
      .select()
      .from(schema.memoriesTable)
      .where(
        and(
          eq(schema.memoriesTable.actorId, actorId),
          eq(schema.memoriesTable.actorType, actorType),
          eq(schema.memoriesTable.key, key),
          sql`${schema.memoriesTable.expiresAt} IS NULL OR ${schema.memoriesTable.expiresAt} > NOW()`,
        ),
      );
    return memory ?? null;
  }

  /**
   * Update an existing memory by ID.
   */
  static async update(
    id: string,
    data: UpdateMemory,
  ): Promise<Memory | null> {
    const [memory] = await db
      .update(schema.memoriesTable)
      .set(data)
      .where(eq(schema.memoriesTable.id, id))
      .returning();
    return memory ?? null;
  }

  /**
   * Delete a memory by ID.
   */
  static async delete(id: string): Promise<void> {
    await db
      .delete(schema.memoriesTable)
      .where(eq(schema.memoriesTable.id, id));
  }

  /**
   * Build prompt-context friendly memory objects for injection.
   * Returns memories grouped by scope for the given actor hierarchy:
   * user → team → organization (with increasing breadth, decreasing specificity).
   */
  static async buildPromptContextMemories(params: {
    userId: string;
    teamIds?: string[];
    organizationId?: string;
  }): Promise<{
    user: Array<{ key: string; value: string }>;
    team: Array<{ key: string; value: string }>;
    organization: Array<{ key: string; value: string }>;
  }> {
    const { userId, teamIds = [], organizationId } = params;

    const userMemories = await MemoryModel.findByActor(userId, "user");
    const teamMemories = (
      await Promise.all(
        teamIds.map((tid) => MemoryModel.findByActor(tid, "team")),
      )
    ).flat();
    const orgMemories = organizationId
      ? await MemoryModel.findByActor(organizationId, "organization")
      : [];

    return {
      user: userMemories.map((m) => ({ key: m.key, value: m.value })),
      team: teamMemories.map((m) => ({ key: m.key, value: m.value })),
      organization: orgMemories.map((m) => ({ key: m.key, value: m.value })),
    };
  }
}

export default MemoryModel;
