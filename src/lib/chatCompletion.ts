import { createServerFn } from "@tanstack/react-start";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { getLlm } from "../lib/llm";
import { callTool, getMcp_n_Tool } from "../lib/mcp-client";

const DefaultHistory: ChatCompletionMessageParam[] = [
  {
    role: "system",
    content: `You are an AI assistant with full access to an Ubuntu Linux sandbox.

TOOL ROUTING — follow these rules exactly:
- To run bash/shell commands (npm, npx, git, ls, python3, curl…) → use shell_exec
- To read a file → use file_read
- To write/create a file → use file_write
- To list a directory → use file_list
- To run Python code (data analysis, math, pandas…) → use jupyter_execute
- shell_exec is for BASH. Do NOT pass bash commands to jupyter_execute or any code tool.

Workspace: /home/gem (Ubuntu Linux). Node.js and npm are already installed.`,
  },
];

const prjId_history = new Map<string, ChatCompletionMessageParam[]>();

export const getConversationHistoryFn = createServerFn({ method: "GET" })
  .inputValidator((data: string) => data)
  .handler(async ({ data: prjId }) => {
    let history = prjId_history.get(prjId);
    if (!history) {
      history = structuredClone(DefaultHistory);
      prjId_history.set(prjId, history);
    }
    return history;
  });

export const completeFn = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { usr_msg: ChatCompletionMessageParam; prjId: string }) => data,
  )
  .handler(({ data }) => complete(data.usr_msg, data.prjId));

async function complete(
  usr_msg: ChatCompletionMessageParam,
  prjId: string,
): Promise<ChatCompletionMessageParam[]> {
  const MODEL = process.env.LOCAL_LLM_MODEL ?? "qwen3-8b";
  console.log(`USER: ${usr_msg}`);

  const llm = getLlm();
  console.log(`Got llm ${llm}`);
  // what nice it is if this also handle sandbox init
  // also why does mcp handle container creation lol
  // ok it does , now how do i not ask for tools for every damn request

  const { client: mcp, openai_tools: tools } = await getMcp_n_Tool(prjId);
  console.log(`Got mcp ${mcp}`);

  DefaultHistory.push(usr_msg);
  const res = await llm.chat.completions.create({
    model: MODEL,
    messages: DefaultHistory,
    tools,
  });
  const msg = res.choices[0].message;
  DefaultHistory.push(msg);

  //if ai answer directly return
  if (!msg.tool_calls?.length) {
    console.log(`\nAI: ${msg.content}\n`);
    return DefaultHistory;
  }

  for (const tc of msg.tool_calls) {
    if (tc.type !== "function") continue;
    const args = JSON.parse(tc.function.arguments || "{}") as Record<
      string,
      unknown
    >;
    console.log(
      `  → ${tc.function.name}(${JSON.stringify(args).slice(0, 80)})`,
    );
    const result = await callTool(mcp, tc.function.name, args).catch(
      (e) => `error: ${e}`,
    );
    DefaultHistory.push({ role: "tool", tool_call_id: tc.id, content: result });
  }

  console.log(`llm processing done, returning to user`);

  return DefaultHistory;
}
