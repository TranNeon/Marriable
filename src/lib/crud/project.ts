import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { db } from "#/index";
import { project } from "#/db/schema";
import { and, eq } from "drizzle-orm";

import * as z from "zod";
import { authMiddleware } from "#/lib/authMiddleware";
import { createContainer, getDocker } from "../mcp-client.server";
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
    //remove the container first
    const containerId = await getAssociatedContainer(data.id);
    if (!containerId)
      throw "no container found for this project, this shouldn't happen";
    const docker = await getDocker();
    const container = docker.getContainer(containerId);
    const info = await container.inspect();
    if (info.State.Running) await container.stop();
    await container.remove();

    await db
      .delete(project)
      .where(and(eq(project.userId, context.user.id), eq(project.id, data.id)));

    return "ok";
  });

export const getAssociatedContainer = createServerOnlyFn(
  async (prjId: number) => {
    const result = await db
      .select({ containerId: project.attachedContainer })
      .from(project)
      .where(eq(project.id, prjId));
    return result[0].containerId;
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
