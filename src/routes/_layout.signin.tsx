import { LoginForm } from "#/components/login-form";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/signin")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex justify-center">
      <LoginForm className="w-1/2"> </LoginForm>{" "}
    </div>
  );
  return;
}
