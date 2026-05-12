import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";

import type Docker from "dockerode";

import type { ChatCompletionTool } from "openai/resources/index.mjs";

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

let container_projectId = new Map<string, string>([
	[
		"my-first-project",
		"9d7df2f3a1c72c0c274fddac5854733fb7f5a42e92e5d3518b532744e7072c86",
	],
]);

async function getMappedPort(
	container: Docker.Container,
	targetPort: number,
): Promise<number | undefined> {
	// To get mapped ports on a container instance, you must inspect it first.
	// docker.getContainer() just returns a reference, it does not fetch status.
	const info = await container.inspect();
	const bindings = info.NetworkSettings.Ports[`${targetPort}/tcp`];
	if (bindings && bindings.length > 0) {
		return parseInt(bindings[0].HostPort, 10);
	}
	return undefined;
}

export const getContainerAcessURLFn = createServerFn({ method: "GET" })
	.inputValidator((projId: string) => projId)
	.handler(async ({ data: projId }) => {
		return await getContainerAcessURL(projId);
	});

export async function getContainerAcessURL(projectId: string) {
	const containerId = container_projectId.get(projectId);
	let container: Docker.Container;
	if (!containerId) {
		container = await createContainer(projectId);
		container_projectId.set(projectId, container.id);

		await container.start();
		console.log(`Started container ${container.id} `);
	} else {
		const docker = await getDocker();
		container = docker.getContainer(containerId);
		const info = await container.inspect();
		if (!info.State.Running) {
			await container.start();
		}
	}

	//try not hardcode this next time
	return `http://localhost:${await getMappedPort(container, 8080)}`;
}

async function createContainer(projectId: string): Promise<Docker.Container> {
	const docker = await getDocker();
	const container = await docker.createContainer({
		Image: SANDBOX_IMAGE,
		// Using a command that keeps the container alive (if your image doesn't have a long-running entrypoint)
		Cmd: ["tail", "-f", "/dev/null"],
		ExposedPorts: { "8080/tcp": {} },
		HostConfig: { PortBindings: { "8080/tcp": [{ HostPort: "0" }] } },
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

let _projectId_mcpClient_tools = new Map<
	string,
	{
		client: Client;
		tool: ChatCompletionTool;
	}
>();

export const getMcp_n_Tool = createServerOnlyFn(async (projId: string) => {
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
