import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import {
  createProjectFn,
  delProjectFn,
  getProjectsFn,
} from "#/lib/crud/project";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "#/components/ui/input";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/projects/")({
  component: RouteComponent,
});

function RouteComponent() {
  const queryClient = useQueryClient();
  const getProjects = useServerFn(getProjectsFn);
  const { data: projects } = useQuery({
    queryKey: ["posts"],
    queryFn: getProjects,
  });
  return (
    <div>
      <form
        action={(data: FormData) => {
          createProjectFn({
            data: {
              name: data.get("name")?.toString() || "Untitled",
            },
          }).then(() => queryClient.invalidateQueries({ queryKey: ["posts"] }));
        }}
      >
        <Input name="name" defaultValue="My great idea"></Input>
        <Button type="submit"> Create project </Button>
      </form>
      <ol>
        {projects?.map((project) => (
          <li key={project.id}>
            <Link
              to="/projects/$prjId"
              params={{ prjId: project.id.toString() }}
            >
              {project.id} --- {project.name}{" "}
            </Link>
            <Button
              onClick={() =>
                delProjectFn({ data: { id: project.id } }).then(() =>
                  queryClient.invalidateQueries({ queryKey: ["posts"] }),
                )
              }
            >
              delete
            </Button>
          </li>
        ))}
      </ol>
    </div>
  );
}
