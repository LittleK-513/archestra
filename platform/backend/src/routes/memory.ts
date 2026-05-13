import {
  createPaginatedResponseSchema,
  PaginationQuerySchema,
  RouteId,
} from "@shared";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";
import { z } from "zod";
import { requireAuth } from "@/auth";
import logger from "@/logging";
import { MemoryModel } from "@/models";
import {
  ApiError,
  constructResponseSchema,
  DeleteObjectResponseSchema,
  InsertMemorySchema,
  SelectMemorySchema,
  UpdateMemorySchema,
  UuidIdSchema,
} from "@/types";

const memoryRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // GET /api/memory — list memories for the current user
  fastify.get(
    "/api/memory",
    {
      schema: {
        operationId: RouteId.GetMemories,
        description: "List durable memories for the current user",
        tags: ["Memory"],
        querystring: PaginationQuerySchema.extend({
          actorType: z.enum(["user", "team", "organization"]).optional(),
          keyPrefix: z.string().optional(),
        }),
        response: constructResponseSchema(
          createPaginatedResponseSchema(SelectMemorySchema),
        ),
      },
    },
    async (
      {
        query: { limit, offset, actorType, keyPrefix },
        user,
      },
      reply,
    ) => {
      try {
        const memories = await MemoryModel.findByActor(
          user.id,
          actorType ?? "user",
          keyPrefix,
        );

        const total = memories.length;
        const paginated = memories.slice(offset, offset + limit);

        return reply.send({
          data: paginated,
          pagination: {
            total,
            limit,
            offset,
            hasMore: offset + limit < total,
          },
        });
      } catch (error) {
        logger.error({ err: error }, "Failed to list memories");
        throw new ApiError("InternalServerError", "Failed to list memories");
      }
    },
  );

  // POST /api/memory — create a new memory
  fastify.post(
    "/api/memory",
    {
      schema: {
        operationId: RouteId.CreateMemory,
        description: "Create a durable memory fact",
        tags: ["Memory"],
        body: InsertMemorySchema,
        response: constructResponseSchema(SelectMemorySchema),
      },
    },
    async ({ body, user }, reply) => {
      try {
        // Default to user-scoped if actorType not specified
        const memory = await MemoryModel.create({
          ...body,
          actorId: body.actorId ?? user.id,
          actorType: body.actorType ?? "user",
        });
        return reply.status(201).send(memory);
      } catch (error) {
        logger.error({ err: error }, "Failed to create memory");
        throw new ApiError("InternalServerError", "Failed to create memory");
      }
    },
  );

  // PATCH /api/memory/:id — update a memory
  fastify.patch(
    "/api/memory/:id",
    {
      schema: {
        operationId: RouteId.UpdateMemory,
        description: "Update a durable memory fact",
        tags: ["Memory"],
        params: UuidIdSchema,
        body: UpdateMemorySchema,
        response: constructResponseSchema(SelectMemorySchema),
      },
    },
    async ({ params: { id }, body }, reply) => {
      try {
        const memory = await MemoryModel.update(id, body);
        if (!memory) {
          throw new ApiError("NotFound", "Memory not found");
        }
        return reply.send(memory);
      } catch (error) {
        if (error instanceof ApiError) throw error;
        logger.error({ err: error, id }, "Failed to update memory");
        throw new ApiError("InternalServerError", "Failed to update memory");
      }
    },
  );

  // DELETE /api/memory/:id — delete a memory
  fastify.delete(
    "/api/memory/:id",
    {
      schema: {
        operationId: RouteId.DeleteMemory,
        description: "Delete a durable memory fact",
        tags: ["Memory"],
        params: UuidIdSchema,
        response: constructResponseSchema(DeleteObjectResponseSchema),
      },
    },
    async ({ params: { id } }, reply) => {
      try {
        await MemoryModel.delete(id);
        return reply.send({ deleted: true });
      } catch (error) {
        logger.error({ err: error, id }, "Failed to delete memory");
        throw new ApiError("InternalServerError", "Failed to delete memory");
      }
    },
  );
};

export default memoryRoutes;
