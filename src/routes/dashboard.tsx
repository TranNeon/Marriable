import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client"; // import the auth client

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
  context: async () => await authClient.getSession(),
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
