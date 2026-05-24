import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import {
  createLlmHistoryFn,
  getAllLlmHistoryFn,
  getSingleLlmHistoryFn,
  userSendMsgFn,
} from "#/lib/crud/llmHistory";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

export const Route = createFileRoute("/projects/$prjId")({
  component: RouteComponent,
});

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "#/components/ui/resizable";
import { getContainerAcessURLFn } from "#/lib/crud/project";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

function RouteComponent() {
  const { prjId } = Route.useParams();
  const queryClient = useQueryClient();
  const getAllLlmHistory = useServerFn(getAllLlmHistoryFn);
  const { data: histories } = useQuery({
    queryKey: ["histories", prjId],
    queryFn: () => getAllLlmHistory({ data: { projId: parseInt(prjId) } }),
  });
  //todo: damn, how else would i handle this
  const [selectedHistory, setSelectedHistory] = useState<string>("");
  const getSingleLlmHistory = useServerFn(getSingleLlmHistoryFn);
  const { data: loadedHistory } = useQuery({
    queryKey: ["loadedHistory"],
    queryFn: () =>
      getSingleLlmHistory({ data: { historyId: parseInt(selectedHistory) } }),
  });

  const getContainerAcessURLIn = useServerFn(getContainerAcessURLFn);
  const { data: accessURL } = useQuery({
    queryKey: ["accessurl"],
    queryFn: () =>
      getContainerAcessURLIn({ data: { projId: parseInt(prjId) } }),
  });

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className="h-screen w-full rounded-lg border"
    >
      {/* Left: chat/history panel */}
      <ResizablePanel defaultSize="40%">
        <div className="flex h-full flex-col overflow-auto">
          <form>
            <label> select your sesssions </label>
            <select
              value={selectedHistory}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                setSelectedHistory(event.target.value);
                console.log("selected history" + selectedHistory);
                queryClient.invalidateQueries({
                  queryKey: ["loadedHistory"],
                });
              }}
            >
              {histories?.map((history) => (
                <option key={history.id} value={history.id}>
                  {history.name}
                </option>
              ))}
            </select>
            {/*<Button type="submit"> launch </Button>*/}
          </form>
          <Button
            onClick={async () => {
              createLlmHistoryFn({ data: { projId: parseInt(prjId) } }).then(
                (createdSessionId) => {
                  queryClient.invalidateQueries({
                    queryKey: ["histories", prjId],
                  });
                  setSelectedHistory(createdSessionId.toString());
                },
              );
            }}
          >
            New HISTORY IMMEDIATELY
          </Button>
          {/*OK THIS IS WHERE THE DAMN MESSAGES GONNA BE DISPLAYED*/}
          <ol className="flex-1 overflow-auto">
            {loadedHistory ? (
              loadedHistory[0]?.content?.map((msg) => (
                <li>
                  <strong>{msg.role}: </strong>
                  <Markdown remarkPlugins={[remarkGfm]}>
                    {msg.content?.toString() || "<no reply> "}
                  </Markdown>
                </li>
              ))
            ) : (
              <div className=" flex items-center h-full">
                <div>No chat Session loaded, select or start new</div>
              </div>
            )}
          </ol>

          <form
            className=" flex gap-2 border-t p-4"
            action={async (formData: FormData) => {
              console.log(selectedHistory);
              await userSendMsgFn({
                data: {
                  msg: formData.get("msg")?.toString() || "No message",
                  historyId: parseInt(selectedHistory),
                },
              });
              queryClient.invalidateQueries({
                queryKey: ["loadedHistory"],
              });
            }}
          >
            <Input name="msg" placeholder="message here" />
            <Button type="submit"> Send msg</Button>
          </form>
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="60%">
        <ResizablePanelGroup orientation="vertical" className="h-full">
          {/* top: code-server */}
          {/* bottom: VNC browser */}
          <ResizablePanel defaultSize="50%">
            <iframe
              className="h-full w-full"
              src={`${accessURL}//vnc/index.html?autoconnect=true`}
              title="browser"
            />
          </ResizablePanel>

          <ResizableHandle withHandle />
          <ResizablePanel defaultSize="50%">
            <iframe
              className="h-full w-full"
              src={`${accessURL}/code-server/?folder=/home/gem`}
              title="code-server"
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
