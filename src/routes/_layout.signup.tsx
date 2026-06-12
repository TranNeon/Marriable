import { SignupForm } from "#/components/signup-form";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/signup")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex justify-center">
      <SignupForm className="w-1/2"> </SignupForm>
    </div>
  );
}
