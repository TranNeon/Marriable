import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import {
  createLlmHistoryFn,
  getAllLlmHistoryFn,
  getSingleLlmHistoryFn,
} from "#/lib/crud/llmHistory.ts";
import { QueryClient, useQuery, useQueryClient } from "@tanstack/react-query";
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

function Chat(props: { prjId: string; queryClient: QueryClient }) {
  const getAllLlmHistory = useServerFn(getAllLlmHistoryFn);
  const { data: histories } = useQuery({
    queryKey: ["histories", props.prjId],
    queryFn: async () => {
      return await getAllLlmHistory({
        data: { projId: parseInt(props.prjId) },
      });
    },
  });

  const [selectedHistory, setSelectedHistory] = useState<string>("");
  const getSingleLlmHistory = useServerFn(getSingleLlmHistoryFn);
  const [streamingResponse, setStreamingResponse] = useState<string>("");
  const { data: loadedHistory, isLoading } = useQuery({
    queryKey: ["loadedHistory"],
    queryFn: () =>
      getSingleLlmHistory({ data: { historyId: parseInt(selectedHistory) } }),
  });

  const userSendMsgHandler = async (formData: FormData) => {
    const params = new URLSearchParams({
      msg: formData.get("msg")?.toString() || "No message",
      historyId: selectedHistory,
    });

    const url = `/api/sse/chat?${params.toString()}`;
    const eventSource = new EventSource(url);

    eventSource.onmessage = (e) =>
      setStreamingResponse((pre) => {
        return pre + JSON.parse(e.data)?.content;
      });

    eventSource.addEventListener("done", () => {
      eventSource.close();
      props.queryClient.invalidateQueries({ queryKey: ["loadedHistory"] });
      setStreamingResponse("");
    });

    //invalidate anyways such that posted user message is stored
    props.queryClient.invalidateQueries({ queryKey: ["loadedHistory"] });
  };

  return (
    <div className="flex h-full flex-col overflow-auto">
      {histories && (
        <HoverSelect
          items={histories.map((history) => ({
            name: history.name,
            value: history.id,
          }))}
          action={(value: any) => {
            setSelectedHistory(value);
            props.queryClient.invalidateQueries({
              queryKey: ["loadedHistory"],
            });
          }}
        />
      )}
      {isLoading && <span>Loading...</span>}
      <Button onClick={NewChatHandler()}>New HISTORY IMMEDIATELY</Button>
      <ol className="flex-1 overflow-auto">
        {isLoading && <li className="p-5 m-5">Loading chat...</li>}

        {!isLoading && !loadedHistory?.[0]?.content?.length && (
          <li className="flex items-center justify-center h-full">
            <div>No chat Session, select or start new</div>
          </li>
        )}

        {loadedHistory?.[0]?.content?.map((msg, i) => (
          <li
            key={i}
            className={`p-5 m-5 ${msg.role === "user" ? "bg-amber-200 ml-25" : "bg-amber-100 mr-25"}`}
          >
            <strong>{msg.role}: </strong>
            <Markdown remarkPlugins={[remarkGfm]}>
              {msg.content?.toString() || "<no reply>"}
            </Markdown>
          </li>
        ))}

        {streamingResponse && (
          <li className="bg-amber-100 mr-25">
            <strong>streaming ai: </strong>
            <Markdown remarkPlugins={[remarkGfm]}>{streamingResponse}</Markdown>
          </li>
        )}
      </ol>
      <form className=" flex gap-2 border-t p-4" action={userSendMsgHandler}>
        <Input name="msg" placeholder="message here" />
        <Button type="submit"> Send msg</Button>
      </form>
    </div>
  );

  function NewChatHandler():
    | import("react").MouseEventHandler<HTMLButtonElement>
    | undefined {
    return async () => {
      createLlmHistoryFn({
        data: {
          projId: parseInt(props.prjId),
        },
      }).then((createdSessionId) => {
        props.queryClient.invalidateQueries({
          queryKey: ["histories", props.prjId],
        });
        setSelectedHistory(createdSessionId.toString());
      });
    };
  }
}

function RouteComponent() {
  const getContainerAcessURLIn = useServerFn(getContainerAcessURLFn);

  const { prjId } = Route.useParams();
  const queryClient = useQueryClient();
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
        <Chat prjId={prjId} queryClient={queryClient}></Chat>
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
