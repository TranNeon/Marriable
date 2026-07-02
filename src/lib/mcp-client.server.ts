import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";

import type Docker from "dockerode";

import type { ChatCompletionTool } from "openai/resources/index.mjs";
import { getAssociatedContainer } from "./crud/project";

const DOCKER_ENGINE = "http://localhost";
const SANDBOX_IMAGE = "ghcr.io/agent-infra/sandbox:latest";

let _docker: Docker;
export const getDocker = async (): Promise<Docker> => {
  if (!_docker) {
    const { default: DockerClient } = await import("dockerode");
    _docker = new DockerClient();
  }
  return _docker;
};

async function mcpConnect(mcp_url: string, name?: String) {
  const client = new Client(
    { name: `aio-client-${name}`, version: "1.0" },
    { capabilities: {} },
  );
  try {
    await client.connect(new StreamableHTTPClientTransport(new URL(mcp_url)));
  } catch {
    await client.connect(
      new SSEClientTransport(new URL(mcp_url.replace("/mcp", "/mcp/sse"))),
    );
  }
  return client;
}

// ── tool call via MCP ─────────────────────────────────────────────────────────
async function getMappedPort(
  container: Docker.Container,
  targetPort: number,
): Promise<number | undefined> {
  const info = await container.inspect();
  const bindings = info.NetworkSettings.Ports[`${targetPort}/tcp`];
  if (bindings && bindings.length > 0) {
    return parseInt(bindings[0].HostPort, 10);
  }
  return undefined;
}

export async function getContainerAcessURL(projectId: number) {
  const containerId = await getAssociatedContainer(projectId);
  if (!containerId)
    throw "no container found for this project, this shouldn't happen";
  const docker = await getDocker();
  const container = docker.getContainer(containerId);
  const info = await container.inspect();
  if (!info.State.Running) {
    await container.start();
  }

  return `http://localhost:${await getMappedPort(container, 8080)}`;
}
// projectId is optional is provided as metadata
export async function createContainer(
  projectId: string,
): Promise<Docker.Container> {
  const docker = await getDocker();
  const container = await docker.createContainer({
    Image: SANDBOX_IMAGE,
    HostConfig: {
      SecurityOpt: ["seccomp:unconfined"],
      PortBindings: { "8080/tcp": [{ HostPort: "0" }] },
    },
    // // Using a command that keeps the container alive (if your image doesn't have a long-running entrypoint)
    // Cmd: ["tail", "-f", "/dev/null"],
    ExposedPorts: { "8080/tcp": {} },
  });

  return container;
}

export async function callTool(
  client: Client,
  name: string,
  args: Record<string, unknown>,
) {
  const result = await client.callTool({ name, arguments: args });
  return (
    result.content as Array<{ type: string; text?: string; data?: string }>
  )
    .map((p) =>
      p.type === "image"
        ? `[image ${p.data?.length ?? 0} bytes]`
        : (p.text ?? ""),
    )
    .join("\n")
    .slice(0, 3000); // cap to save context window
}

//this indirectly also ensure starting the docker container for us
export const getMcp_n_Tool = createServerOnlyFn(async (projId: number) => {
  const accessURL = await getContainerAcessURL(projId);
  const client = await mcpConnect(accessURL + "/mcp");
  const { tools: mcpTools } = await client.listTools();
  const openai_tools = mcpTools.map((t: Tool) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description ?? t.name,
      parameters: t.inputSchema ?? {},
    },
  }));
  console.log(
    `✓ MCP connected  ${mcpTools.length} tools: ${mcpTools.map((t) => t.name).join("  ")}\n`,
  );

  return { client, openai_tools };
});
