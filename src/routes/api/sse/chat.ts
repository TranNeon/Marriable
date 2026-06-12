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

          const oldHist = await getOldHist(historyId);
          if (!oldHist[0] || !oldHist[0].content) {
            throw new Error("History not found // no system prompt ");
          }

          if (!msg) throw "content null";

          oldHist[0].content.push({ role: "user", content: msg });

          const llm = getLlm();
          const prjId = await ownedPrjId(historyId);
          const { client: mcp, openai_tools: tools } =
            await getMcp_n_Tool(prjId);
          const encoder = new TextEncoder();

          const stream = new ReadableStream({
            async start(controller) {
              const AGENT_LOOP = 50;

              for (let i = 0; i < AGENT_LOOP; ++i) {
                if (!oldHist[0].content) throw "no message sent???";
                const stream = await llm.chat.completions.create({
                  model: process.env.LLM_MODEL || "gpt-4-32k",
                  messages: oldHist[0].content,
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
                    }
                  }
                } catch (error) {
                  controller.error(error);
                }

                // const llmReply = res.choices[0].message;
                // oldHist[0].content.push(llmReply);

                //if ai answer directly this times stop looping and save
                if (true) {
                  console.log(
                    "Stream ends, tool called should have been handled here",
                  );
                  break;
                }

                //   for (const tc of llmReply.tool_calls) {
                //     if (tc.type !== "function") continue;
                //     const args = JSON.parse(tc.function.arguments || "{}") as Record<
                //       string,
                //       unknown
                //     >;

                //     // const result = " Tool calling is infact not supported ";
                //     const result = await callTool(mcp, tc.function.name, args).catch(
                //       (e) => `error: ${e}`,
                //     );

                //     oldHist[0].content.push({
                //       role: "tool",
                //       tool_call_id: tc.id,
                //       content: result,
                //     });
                //   }
              }

              await db
                .update(llmHistory)
                .set({ content: oldHist[0].content })
                .where(eq(llmHistory.id, historyId));
              controller.close(); // close down connection.
            },
          });

          return new Response(stream, {
            headers: {
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
              "Content-Type": "text/event-stream",
              "X-Accel-Buffering": "no",
            },
          });
        },
      }),
  },
});
