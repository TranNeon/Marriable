import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import {
  createLlmHistoryFn,
  getAllLlmHistoryFn,
  getSingleLlmHistoryFn,
} from "#/lib/crud/llmHistory.ts";
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
import HoverSelect from "#/components/hover-select";
import { defineHandlerCallback } from "@tanstack/react-start/server";

function RouteComponent() {
  const decoder = new TextDecoder();

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
  const [streamingResponse, setStreamingResponse] = useState<string>("");
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
        console.log(e.data);
        return pre + JSON.parse(e.data)?.content;
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
                console.log("selected history" + selectedHistory);
                queryClient.invalidateQueries({
                  queryKey: ["loadedHistory"],
                });
              }}
            />
          )}

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
            <li className="bg-amber-200 p-5 m-5 mr-25">
              <strong>{"streaming ai "}: </strong>
              <Markdown remarkPlugins={[remarkGfm]}>
                {streamingResponse}
              </Markdown>
            </li>
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
