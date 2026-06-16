import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import {
  createLlmHistoryFn,
  getAllLlmHistoryFn,
  getSingleLlmHistoryFn,
} from "#/lib/crud/llmHistory.ts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";

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
import HoverSelect from "#/components/hover-select";

function RouteComponent() {
  const { prjId } = Route.useParams();
  const queryClient = useQueryClient();
  const getAllLlmHistory = useServerFn(getAllLlmHistoryFn);
  const { data: histories } = useQuery({
    queryKey: ["histories", prjId],
    queryFn: async () => {
      return await getAllLlmHistory({
        data: { projId: parseInt(prjId) },
      });
    },
  });

  useEffect(() => {
    setStreamingResponse("");
  }, [histories]);
  //todo: damn, how else would i handle this
  const [selectedHistory, setSelectedHistory] = useState<string>("");
  const getSingleLlmHistory = useServerFn(getSingleLlmHistoryFn);
  const [streamingResponse, setStreamingResponse] = useState<string>("");
  const {
    data: loadedHistory,
    isLoading,
    isError,
  } = useQuery({
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

  const userSendMsgHandler = async (formData: FormData) => {
    const params = new URLSearchParams({
      msg: formData.get("msg")?.toString() || "No message",
      historyId: selectedHistory,
    });
    const url = `/api/sse/chat?${params.toString()}`;
    console.log("connecting to " + url);
    const eventSource = new EventSource(url);

    setStreamingResponse("");
    queryClient.invalidateQueries({
      queryKey: ["loadedHistory"],
    });
    //Todo: handle this more gracefully such that the streaming response won't flash and reappear

    eventSource.onmessage = (e) =>
      setStreamingResponse((pre) => {
        return pre + JSON.parse(e.data)?.content;
      });

    eventSource.addEventListener("done", () => {
      eventSource.close();
      queryClient.invalidateQueries({ queryKey: ["loadedHistory"] });
    });
  };

  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className="h-screen w-full rounded-lg border"
    >
      {/* Left: chat/history panel */}
      <ResizablePanel defaultSize="40%">
        <div className="flex h-full flex-col overflow-auto">
          {histories && (
            <HoverSelect
              items={histories.map((history) => ({
                name: history.name,
                value: history.id,
              }))}
              action={(value: any) => {
                setSelectedHistory(value);
                queryClient.invalidateQueries({
                  queryKey: ["loadedHistory"],
                });
              }}
            />
          )}
          {isLoading && <span>Loading...</span>}
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
              loadedHistory[0]?.content?.map((msg) =>
                msg.role === "user" ? (
                  <li className="bg-amber-200 p-5 m-5 ml-25">
                    <strong>{msg.role}: </strong>
                    <Markdown remarkPlugins={[remarkGfm]}>
                      {msg.content?.toString() || "<no reply> "}
                    </Markdown>
                  </li>
                ) : (
                  <li className="bg-amber-200 p-5 m-5 mr-25">
                    <strong>{msg.role}: </strong>
                    <Markdown remarkPlugins={[remarkGfm]}>
                      {msg.content?.toString() || "<no reply> "}
                    </Markdown>
                  </li>
                ),
              )
            ) : (
              <div className=" flex items-center h-full">
                <div>No chat Session loaded, select or start new</div>
              </div>
            )}
            {streamingResponse !== "" && (
              <li className="bg-amber-200 p-5 m-5 mr-25">
                <strong>{"streaming ai "}: </strong>
                <Markdown remarkPlugins={[remarkGfm]}>
                  {streamingResponse}
                </Markdown>
              </li>
            )}
          </ol>
          <form
            className=" flex gap-2 border-t p-4"
            action={userSendMsgHandler}
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
            {accessURL && (
              <iframe
                className="h-full w-full"
                src={`${accessURL}//vnc/index.html?autoconnect=true`}
                title="browser"
              />
            )}
          </ResizablePanel>

          <ResizableHandle withHandle />
          <ResizablePanel defaultSize="50%">
            {accessURL && (
              <iframe
                className="h-full w-full"
                src={`${accessURL}/code-server/?folder=/home/gem`}
                title="code-server"
              />
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
