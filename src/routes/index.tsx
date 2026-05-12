import { createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "#/components/login-form";

export const Route = createFileRoute("/")({ component: App });
function App() {
	return <main className="page-wrap px-4 pb-8 pt-14"></main>;
}
