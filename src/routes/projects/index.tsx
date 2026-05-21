import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { Button } from "#/components/ui/button";
import {
  createProjectFn,
  delProjectFn,
  getProjectsFn,
} from "#/lib/crud/project";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "#/components/ui/input";
import { useServerFn } from "@tanstack/react-start";
import { MoreVertical } from "lucide-react";

export const Route = createFileRoute("/projects/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
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
      {/* Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {projects?.map((project) => (
          <div
            onClick={() =>
              navigate({
                to: "/projects/$prjId",
                params: { prjId: project.id.toString() },
              })
            }
            key={project.id}
            className="group flex flex-col border border-gray-200 rounded-md bg-white hover:border-blue-400 cursor-pointer transition-colors"
          >
            <div className="h-64 bg-gray-50 border-b border-gray-200 flex justify-center p-4 overflow-hidden rounded-t-md">
              <div className="w-full h-full bg-white shadow-sm border border-gray-100 p-2 text-gray-300 text-xs">
                [ TODO: Preview]
              </div>
            </div>

            {/* Document Metadata Footer */}
            <div className="p-3">
              <h3 className="text-sm font-medium text-gray-800 truncate mb-2">
                {project.name}
              </h3>

              <div className="flex items-center justify-between text-gray-500">
                <div className="flex items-center gap-2">
                  {/*{getFileIcon(project.type)}*/}
                  {/* Mock Avatar for shared users */}
                  <div className="flex -space-x-1">
                    <div className="w-5 h-5 rounded-full bg-gray-300 border border-white"></div>
                    <div className="w-5 h-5 rounded-full bg-gray-400 border border-white"></div>
                  </div>
                  {/*<span className="text-xs">{project.date}</span>*/}
                </div>

                {/*<button className="p-1 hover:bg-gray-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-4 h-4 text-gray-600" />
                </button>*/}
                <Button
                  className="p-1  opacity-0 group-hover:opacity-100 "
                  onClick={() =>
                    delProjectFn({ data: { id: project.id } }).then(() =>
                      queryClient.invalidateQueries({ queryKey: ["posts"] }),
                    )
                  }
                >
                  delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

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
