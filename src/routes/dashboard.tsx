import {
  createFileRoute,
  Link,
  redirect,
  useRouteContext,
} from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client"; // import the auth client

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
  beforeLoad: async ({ location }) => {
    const { data, error } = await authClient.getSession();
    if (!data?.session) {
      throw redirect({
        to: "/signin",
        search: {
          // (Do not use `router.state.resolvedLocation` as it can
          // potentially lag behind the actual current location)
          redirect: location.href,
        },
      });
    }
  },
});

function RouteComponent() {
  const {
    data: session,
    // isPending, //loading state
    // error, //error object
    // refetch, //refetch the session
  } = authClient.useSession();

  return (
    <div>
      {" "}
      {session ? (
        "Welcome " + session?.user.name
      ) : (
        <div>
          You haven't signed in yet
          <Link to="/signin"> Sign in now </Link>{" "}
        </div>
      )}
    </div>
  );
}
