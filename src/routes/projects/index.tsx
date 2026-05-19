import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import { createProjectFn, listProjectFn } from "#/lib/project";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "#/components/ui/input";

export const Route = createFileRoute("/projects/")({
  component: RouteComponent,
});

function RouteComponent() {
  const queryClient = useQueryClient();

  const { data: projects } = useQuery({
    queryKey: ["posts"],
    queryFn: listProjectFn,
  });
  return (
    <div>
      <form
        action={async (data: FormData) => {
          createProjectFn({
            data: {
              name: data.get("name")?.toString() || "Untitled",
            },
          }).then(() => queryClient.invalidateQueries({ queryKey: ["posts"] }));
        }}
      >
        <Input name="name"></Input>
        <Button type="submit"> Create project </Button>
      </form>
      <ol>
        {projects?.map((project) => (
          <li key={project.id}>
            <Link
              to="/projects/$projectId"
              params={{ projectId: project.id.toString() }}
            >
              {project.id} --- {project.name}{" "}
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
