import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { useState } from "react";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "#/components/ui/resizable";
import { completeFn, getConversationHistoryFn } from "#/lib/chatCompletion";
import { getContainerAcessURLFn } from "#/lib/mcp-client";

export const Route = createFileRoute("/projects/$projectId")({
	loader: async ({ params }) => {
		const history = await getConversationHistoryFn({ data: params.projectId });
		return { history };
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { projectId } = Route.useParams();
	const { history: initialHistory } = Route.useLoaderData();
	const [chat, setChat] =
		useState<ChatCompletionMessageParam[]>(initialHistory);
	const [msg, setMsg] = useState("");

	const getAccessURL = useServerFn(getContainerAcessURLFn);
	const { data: accessURL } = useQuery({
		queryKey: ["accessURL", projectId],
		queryFn: () => getAccessURL({ data: projectId }),
	});

	const handleSubmit = async () => {
		console.log("handleSubmit called, msg:", JSON.stringify(msg));
		const updated = await completeFn({
			data: { usr_msg: { role: "user", content: msg }, prjId: projectId },
		});
		console.log("completeFn resolved:", updated);
		if (updated) setChat(updated);
		setMsg("");
	};

	console.log(`acess URL ${accessURL}`);

	return (
		<ResizablePanelGroup
			orientation="horizontal"
			className="h-screen w-full rounded-lg border"
		>
			{/* Left: chat/history panel */}
			<ResizablePanel defaultSize="60%">
				<div className="flex h-full flex-col">
					<div className="flex-1 overflow-auto p-6">{JSON.stringify(chat)}</div>

					<div className=" flex gap-2 border-t p-4">
						<Input
							id="msg"
							placeholder="message here"
							value={msg}
							onChange={(e) => {
								console.log(e.target.value);
								setMsg(e.target.value);
							}}
							onKeyDown={(e) =>
								e.key === "Enter" && !e.shiftKey && handleSubmit()
							}
						/>
						<Button onClick={handleSubmit}> Send msg</Button>
					</div>
				</div>
			</ResizablePanel>

			<ResizableHandle withHandle />

			{/* Middle: code-server */}
			<ResizablePanel defaultSize="20%">
				<div className="relative h-full w-full">
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
