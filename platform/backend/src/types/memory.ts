import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod";
import { schema } from "@/database";

export const SelectMemorySchema = createSelectSchema(schema.memoriesTable);

export const InsertMemorySchema = createInsertSchema(schema.memoriesTable)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    expiresAt: z.string().datetime().nullable().optional(),
  });

export const UpdateMemorySchema = createUpdateSchema(schema.memoriesTable)
  .pick({
    key: true,
    value: true,
    expiresAt: true,
  })
  .extend({
    expiresAt: z.string().datetime().nullable().optional(),
  });

export type Memory = z.infer<typeof SelectMemorySchema>;
export type InsertMemory = z.infer<typeof InsertMemorySchema>;
export type UpdateMemory = z.infer<typeof UpdateMemorySchema>;
