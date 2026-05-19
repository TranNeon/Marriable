import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { db } from "#/index.server";
import { project } from "#/db/schema";
import { auth } from "./auth";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";

export const createProjectFn = createServerFn({ method: "POST" })
  .inputValidator((data: { name: string }) => data)
  .handler(async ({ data }) => {
    const headers = getRequestHeaders();
    const session = await auth.api.getSession({ headers });
    if (!session) throw "non existent user session";
    await db
      .insert(project)
      .values({ name: data.name, userId: session.user.id });

    return "OK";
  });

export const listProjectFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const headers = getRequestHeaders();
    const session = await auth.api.getSession({ headers });
    if (!session) throw "non existent user session";
    return await db
      .select()
      .from(project)
      .where(eq(project.userId, session.user.id));
  },
);
