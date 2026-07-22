import { createServerFn } from "@tanstack/react-start";
import * as z from "zod";
import { authMiddleware } from "../authMiddleware";
import { db } from "#/index";
import { llmHistory, project } from "#/db/schema";
import type { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { eq } from "drizzle-orm";
import { getLlm } from "../llm";

const ProjectId = z.object({
  projId: z.int().nonoptional(),
});

const DefaultHistory: ChatCompletionMessageParam[] = [
  {
    role: "system",
    content: `You are an AI assistant with full access to an Ubuntu Linux sandbox.
    Application listening on port 8080 will be exposed to direct request from user

TOOL ROUTING — follow these rules exactly:
- To run bash/shell commands (npm, npx, git, ls, python3, curl…) → use shell_exec
- To read a file → use file_read
- To write/create a file → use file_write
- To list a directory → use file_list
- To run Python code (data analysis, math, pandas…) → use jupyter_execute
- shell_exec is for BASH. Do NOT pass bash commands to jupyter_execute or any code tool.

As a very interactive agent who aware that user is watching you act, include a short sentence saying when calling function
"lemme click the continue button"
"there it is, lemme scroll down further"
"doensn't look good , let's try ..."

Workspace: /home/gem (Ubuntu Linux). Node.js and npm are already installed.`,
  },
];
export const UNTITLED = "New Chat";

export const createLlmHistoryFn = createServerFn({ method: "GET" })
  .inputValidator(ProjectId)
  .middleware([authMiddleware])
  .handler(async ({ data }) => {
    const result = await db
      .insert(llmHistory)
      .values({
        projectId: data.projId,
        content: DefaultHistory,
        name: UNTITLED,
      })
      .returning();
    return result[0].id;
  });

export const getAllLlmHistoryFn = createServerFn({ method: "GET" })
  .inputValidator(ProjectId)
  .middleware([authMiddleware])
  .handler(async ({ data }) => {
    return await db
      .select()
      .from(llmHistory)
      .where(eq(llmHistory.projectId, data.projId));
  });

//todo: need to that the session come from a project that the logged in user own .
const ProjectIdUndHistory = z.object({
  historyId: z.int().nonoptional(),
});

export const getSingleLlmHistoryFn = createServerFn({ method: "GET" })
  .inputValidator(ProjectIdUndHistory)
  .middleware([authMiddleware])
  .handler(async ({ data }) => {
    return await db
      .select()
      .from(llmHistory)
      .where(eq(llmHistory.id, data.historyId))
      .limit(1);
  });

export const historyUndMsg = z.object({
  historyId: z.int().nonoptional(),
  msg: z.string(),
});

// export const userSendMsgFn = createServerFn({
//   method: "POST",
// })
//   .inputValidator(historyUndMsg)
//   .handler(async ({ data: { historyId, msg } }) => {
//     console.log(`handing request: historyId ${historyId}`);

//     let oldHist = await db
//       .select()
//       .from(llmHistory)
//       .where(eq(llmHistory.id, historyId))
//       .limit(1);

//     if (!oldHist[0] || !oldHist[0].content) {
//       throw new Error("History not found or has no content");
//     }

//     oldHist[0].content.push({ role: "user", content: msg });

//     const llm = getLlm();

//     const prjIdQueryResult = await db
//       .select()
//       .from(llmHistory)
//       .where(eq(llmHistory.id, historyId));
//     const prjId = prjIdQueryResult[0].projectId;
//     if (!prjId) throw "no associated project";
//     const { client: mcp, openai_tools: tools } = await getMcp_n_Tool(prjId);

//     console.log(`USER: ${msg}`);
//     for (let i = 0; i < 50; ++i) {
//       const res = await llm.chat.completions.create({
//         model: process.env.LLM_MODEL || "gpt-4-32k",
//         messages: oldHist[0].content,
//         tools,
//       });
//       const llmReply = res.choices[0].message;
//       oldHist[0].content.push(llmReply);

//       //if ai answer directly this times stop looping and save
//       if (!llmReply.tool_calls?.length) {
//         break;
//       }

//       for (const tc of llmReply.tool_calls) {
//         if (tc.type !== "function") continue;
//         const args = JSON.parse(tc.function.arguments || "{}") as Record<
//           string,
//           unknown
//         >;

//         // const result = " Tool calling is infact not supported ";
//         const result = await callTool(mcp, tc.function.name, args).catch(
//           (e) => `error: ${e}`,
//         );

//         oldHist[0].content.push({
//           role: "tool",
//           tool_call_id: tc.id,
//           content: result,
//         });
//       }
//     }

//     await db
//       .update(llmHistory)
//       .set({ content: oldHist[0].content })
//       .where(eq(llmHistory.id, historyId));

//     return "ok";
//   });
