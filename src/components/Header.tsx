import { Link, redirect } from "@tanstack/react-router";
import ThemeToggle from "./ThemeToggle";
import { Button } from "./ui/button";
import { authClient } from "#/lib/auth-client";
import { useNavigate } from "@tanstack/react-router";

export default function Header() {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 backdrop-blur-lg">
      <nav className="page-wrap flex flex-wrap items-center gap-x-3 gap-y-2 py-3 sm:py-4">
        <div className="order-3 flex w-full flex-wrap items-center gap-x-4 gap-y-1 pb-1 text-sm font-semibold sm:order-2 sm:w-auto sm:flex-nowrap sm:pb-0">
          <Link
            to="/dashboard"
            className="nav-link"
            activeProps={{ className: "nav-link is-active" }}
          >
            Dashboard
          </Link>
          <Link
            to="/projects"
            className="nav-link"
            activeProps={{ className: "nav-link is-active" }}
          >
            My projects
          </Link>

          <Link
            to="/signin"
            className="nav-link"
            activeProps={{ className: "nav-link is-active" }}
          >
            Sign in
          </Link>

          <Link
            to="/signup"
            className="nav-link"
            activeProps={{ className: "nav-link is-active" }}
          >
            Sign up
          </Link>

          <Button
            onClick={() => {
              authClient.signOut();
              navigate({ to: "/" });
            }}
          >
            Sign out
          </Button>
        </div>
      </nav>
    </header>
  );
}
