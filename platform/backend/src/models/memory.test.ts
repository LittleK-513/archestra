import { beforeAll, describe, expect, it } from "vitest";
import db, { schema } from "@/database";
import MemoryModel from "@/models/memory";

describe("MemoryModel", () => {
  beforeAll(async () => {
    // Clean slate
    await db.delete(schema.memoriesTable);
  });

  it("creates a user-scoped memory", async () => {
    const memory = await MemoryModel.create({
      actorId: "user-1",
      actorType: "user",
      key: "preference.theme",
      value: "dark",
    });

    expect(memory.id).toBeDefined();
    expect(memory.actorId).toBe("user-1");
    expect(memory.key).toBe("preference.theme");
    expect(memory.value).toBe("dark");
  });

  it("finds memories by actor", async () => {
    await MemoryModel.create({
      actorId: "user-2",
      actorType: "user",
      key: "preference.lang",
      value: "en",
    });

    const memories = await MemoryModel.findByActor("user-2", "user");
    expect(memories).toHaveLength(1);
    expect(memories[0].key).toBe("preference.lang");
  });

  it("filters by key prefix", async () => {
    await MemoryModel.create({
      actorId: "user-3",
      actorType: "user",
      key: "preference.font",
      value: "mono",
    });
    await MemoryModel.create({
      actorId: "user-3",
      actorType: "user",
      key: "history.last-project",
      value: "archestra",
    });

    const prefs = await MemoryModel.findByActor("user-3", "user", "preference.");
    expect(prefs).toHaveLength(1);
    expect(prefs[0].key).toBe("preference.font");
  });

  it("finds memory by exact key", async () => {
    await MemoryModel.create({
      actorId: "user-4",
      actorType: "user",
      key: "exact-match",
      value: "yes",
    });

    const found = await MemoryModel.findByKey("user-4", "user", "exact-match");
    expect(found).not.toBeNull();
    expect(found?.value).toBe("yes");
  });

  it("updates a memory", async () => {
    const created = await MemoryModel.create({
      actorId: "user-5",
      actorType: "user",
      key: "update-test",
      value: "old",
    });

    const updated = await MemoryModel.update(created.id, { value: "new" });
    expect(updated).not.toBeNull();
    expect(updated?.value).toBe("new");
  });

  it("deletes a memory", async () => {
    const created = await MemoryModel.create({
      actorId: "user-6",
      actorType: "user",
      key: "delete-test",
      value: "temp",
    });

    await MemoryModel.delete(created.id);
    const found = await MemoryModel.findById(created.id);
    expect(found).toBeNull();
  });

  it("excludes expired memories from findByActor", async () => {
    const past = new Date(Date.now() - 1000).toISOString();
    await MemoryModel.create({
      actorId: "user-7",
      actorType: "user",
      key: "expired",
      value: "gone",
      expiresAt: past,
    });
    await MemoryModel.create({
      actorId: "user-7",
      actorType: "user",
      key: "alive",
      value: "here",
    });

    const memories = await MemoryModel.findByActor("user-7", "user");
    expect(memories).toHaveLength(1);
    expect(memories[0].key).toBe("alive");
  });

  it("builds prompt context hierarchically", async () => {
    await MemoryModel.create({
      actorId: "user-8",
      actorType: "user",
      key: "user-fact",
      value: "u1",
    });
    await MemoryModel.create({
      actorId: "team-1",
      actorType: "team",
      key: "team-fact",
      value: "t1",
    });
    await MemoryModel.create({
      actorId: "org-1",
      actorType: "organization",
      key: "org-fact",
      value: "o1",
    });

    const ctx = await MemoryModel.buildPromptContextMemories({
      userId: "user-8",
      teamIds: ["team-1"],
      organizationId: "org-1",
    });

    expect(ctx.user).toHaveLength(1);
    expect(ctx.user[0].key).toBe("user-fact");
    expect(ctx.team).toHaveLength(1);
    expect(ctx.team[0].key).toBe("team-fact");
    expect(ctx.organization).toHaveLength(1);
    expect(ctx.organization[0].key).toBe("org-fact");
  });
});
