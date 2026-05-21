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
      <ResizablePanel defaultSize="60%">
        <div className="h-screen w-screen">
          <div className="flex  flex-col">
            <form>
              <label> select your sesssions </label>
              <select
                value={selectedHistory}
                onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                  setSelectedHistory(event.target.value);
                  console.log(selectedHistory);
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
              onClick={async () =>
                createLlmHistoryFn({ data: { projId: parseInt(prjId) } }).then(
                  () =>
                    queryClient.invalidateQueries({
                      queryKey: ["histories", prjId],
                    }),
                )
              }
            >
              New HISTORY IMMEDIATELY
            </Button>
            {/*OK THIS IS WHERE THE DAMN MESSAGES GONNA BE DISPLAYED*/}
            <ol>
              {loadedHistory
                ? loadedHistory[0]?.content?.map((msg) => (
                    <li>
                      <strong>{msg.role}: </strong>
                      {/*<div>THINKING: {JSON.stringify(msg)}</div>*/}
                      <Markdown remarkPlugins={[remarkGfm]}>
                        {msg.content?.toString() || "<no reply> "}
                      </Markdown>
                    </li>
                  ))
                : "LOADING !!!!"}
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
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      {/* Middle: code-server */}
      <ResizablePanel defaultSize="20%">
        <div className="relative h-full w-full space-x-1">
          <iframe
            className="h-full w-full"
            src={`${accessURL}/code-server/?folder=/home/gem`}
            title="code-server"
          />
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Right: VNC browser */}
      <ResizablePanel defaultSize="20%">
        <div className="relative h-full w-full">
          <iframe
            className="h-full w-full"
            src={`${accessURL}//vnc/index.html?autoconnect=true`}
            title="browser"
          />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
