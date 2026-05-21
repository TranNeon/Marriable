import { createAuthClient } from "better-auth/react";
import { redirect } from "@tanstack/react-router";
export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: "http://localhost:3000",
});

export const ensureAuthenticated = async (ctx: { location: Location }) => {
  const session = await authClient.getSession();
  if (!session.data?.session) {
    throw redirect({
      to: "/signin",
      search: {
        redirect: ctx.location.href,
      },
    });
  }
};
