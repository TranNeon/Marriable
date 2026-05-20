import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { db } from "#/index";
import { project } from "#/db/schema";
import { and, eq } from "drizzle-orm";

import * as z from "zod";
import { authMiddleware } from "#/lib/authMiddleware";
import { createContainer } from "../mcp-client.server";
import { getContainerAcessURL } from "../mcp-client.server";
const createProjectSchema = z.object({
  name: z.string(),
});

export const createProjectFn = createServerFn({ method: "POST" })
  .inputValidator(createProjectSchema)
  .middleware([authMiddleware])
  .handler(async ({ data, context }) => {
    const container = createContainer(data.name);
    await db.insert(project).values({
      name: data.name,
      userId: context.user.id,
      attachedContainer: (await container).id,
    });
    return "OK";
  });

export const getProjectsFn = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    return await db
      .select()
      .from(project)
      .where(eq(project.userId, context.user.id));
  });

const delProjectSchema = z.object({
  id: z.int().nonoptional(),
});

export const delProjectFn = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .inputValidator(delProjectSchema)
  .handler(async ({ data, context }) => {
    await db
      .delete(project)
      .where(and(eq(project.userId, context.user.id), eq(project.id, data.id)));
    return "ok";
  });

export const getAssociatedContainer = createServerOnlyFn(
  async (prjId: number) => {
    const result = await db
      .select({ cid: project.attachedContainer })
      .from(project)
      .where(eq(project.id, prjId));
    return result[0].cid;
  },
);

const getContainerAcessURLSchema = z.object({
  projId: z.int(),
});

export const getContainerAcessURLFn = createServerFn({ method: "GET" })
  .inputValidator(getContainerAcessURLSchema)
  .handler(async ({ data: { projId } }) => {
    return await getContainerAcessURL(projId);
  });
