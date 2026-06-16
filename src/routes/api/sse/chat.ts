import { createFileRoute } from "@tanstack/react-router";
// import * as z from "zod";
import { authMiddleware } from "#/lib/authMiddleware.ts";
import { db } from "#/index";
import { llmHistory, project } from "#/db/schema";
// import type {ChatCompletionMessageParam} from "openai/resources/index.mjs";
import { eq } from "drizzle-orm";
import { getLlm } from "#/lib/llm.ts";
import { callTool, getMcp_n_Tool } from "#/lib/mcp-client.server.ts";
import { TextEncoder } from "util";
import { UNTITLED } from "#/lib/crud/llmHistory";

async function getOldHist(historyId: number) {
  return db
    .select()
    .from(llmHistory)
    .where(eq(llmHistory.id, historyId))
    .limit(1);
}

async function ownedPrjId(historyId: number) {
  const prjIdQueryResult = await db
    .select()
    .from(llmHistory)
    .where(eq(llmHistory.id, historyId));
  const prjId = prjIdQueryResult[0].projectId;
  if (!prjId) throw "no associated project";
  return prjId;
}
// Define interface for our tool call accumulator
interface ToolCallBufferItem {
  id: string;
  name: string;
  arguments: string;
}

interface ToolCallsBuffer {
  [index: number]: ToolCallBufferItem;
}

export const Route = createFileRoute("/api/sse/chat")({
  server: {
    middleware: [authMiddleware],
    handlers: ({ createHandlers }) =>
      createHandlers({
        GET: async ({ request, context }) => {
          //todo: apply auth;
          const { searchParams } = new URL(request.url);
          const [historyId, msg] = [
            searchParams.get("historyId") as unknown as number,
            searchParams.get("msg"),
          ];

          const oldHistArray = await getOldHist(historyId);
          const oldHist = oldHistArray[0];
          if (!oldHist || !oldHist.content) {
            throw new Error("History not found // no system prompt ");
          }

          if (!msg) throw "content null";

          oldHist.content.push({ role: "user", content: msg });

          // if this chat is unamed , give it a name
          if (oldHist.name === UNTITLED)
            await db
              .update(llmHistory)
              .set({ name: msg })
              .where(eq(llmHistory.id, historyId));

          const llm = getLlm();
          const prjId = await ownedPrjId(historyId);
          const { client: mcp, openai_tools: tools } =
            await getMcp_n_Tool(prjId);
          const encoder = new TextEncoder();
          let _controller: ReadableStreamDefaultController<any> | null = null;
          const stream = new ReadableStream({
            async start(controller) {
              _controller = controller;
            },
          });

          if (!_controller) throw " no container returned ";
          HandleController(_controller);

          return new Response(stream, {
            headers: {
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
              "Content-Type": "text/event-stream",
              "X-Accel-Buffering": "no",
            },
          });

          async function HandleController(
            controller: ReadableStreamDefaultController<any>,
          ) {
            const AGENT_LOOP = 50;
            const writePromise: Promise<any>[] = [];

            for (let i = 0; i < AGENT_LOOP; ++i) {
              const toolCallsBuffer: ToolCallsBuffer = {};
              let serverBuffer = "";
              let toolCount = 0;
              if (!oldHist.content) throw "no message sent???";

              const stream = await llm.chat.completions.create({
                model: process.env.LLM_MODEL || "deepseek-chat",
                messages: oldHist.content,
                tools,
                stream: true,
              });

              try {
                for await (const chunk of stream) {
                  const delta = chunk.choices[0]?.delta;
                  if (delta?.content) {
                    controller.enqueue(
                      encoder.encode(`data:${JSON.stringify(delta)}\n\n`),
                    );
                    serverBuffer = serverBuffer + delta.content;
                  }

                  if (delta?.tool_calls) {
                    for (const toolCall of delta.tool_calls) {
                      const index = toolCall.index;

                      // Initialize the buffer slot for this specific tool call index
                      if (!(index in toolCallsBuffer)) {
                        toolCount += 1;
                        toolCallsBuffer[index] = {
                          id: toolCall.id || "",
                          name: toolCall.function?.name || "",
                          arguments: "",
                        };
                        console.log(`Received tool call `);
                        console.log(toolCallsBuffer[index]);
                      }

                      // Accumulate the streaming arguments JSON string
                      if (toolCall.function?.arguments) {
                        const argFragment = toolCall.function.arguments;
                        toolCallsBuffer[index].arguments += argFragment;
                      }
                    }
                  }
                }
              } catch (error) {
                controller.error(error);
                return; // stop processing on stream error
              }

              if (!toolCount) {
                const assistantMsg: any = {
                  role: "assistant",
                  content: serverBuffer,
                };
                oldHist.content.push(assistantMsg);
                writePromise.push(
                  db
                    .update(llmHistory)
                    .set({ content: oldHist.content })
                    .where(eq(llmHistory.id, historyId)),
                );
                break;
              }

              // Push a SINGLE assistant message with ALL tool calls
              const assistantMsg: any = {
                role: "assistant",
                content: serverBuffer,
                tool_calls: Object.values(toolCallsBuffer).map((tc) => ({
                  id: tc.id,
                  type: "function",
                  function: {
                    name: tc.name,
                    arguments: tc.arguments,
                  },
                })),
              };
              oldHist.content.push(assistantMsg);

              // Then push tool results
              for (const [index, call_data] of Object.entries(
                toolCallsBuffer,
              )) {
                const args = JSON.parse(call_data?.arguments || "{}") as Record<
                  string,
                  unknown
                >;
                const result = await callTool(mcp, call_data.name, args).catch(
                  (e) => `error: ${e}`,
                );

                const tool_obj = {
                  role: "tool" as const,
                  tool_call_id: call_data.id,
                  content: result,
                };
                oldHist.content.push(tool_obj);
                controller.enqueue(
                  encoder.encode(
                    `event:tool\ndata:${JSON.stringify(tool_obj)}\n\n`,
                  ),
                );
              }
              // a write every msg
              writePromise.push(
                db
                  .update(llmHistory)
                  .set({ content: oldHist.content })
                  .where(eq(llmHistory.id, historyId)),
              );
            }

            await Promise.all(writePromise);
            controller.enqueue(encoder.encode("event: done\ndata: {}\n\n"));
            controller.close(); // close down connection when data is no longer in transit, client
          }
        },
      }),
  },
});
