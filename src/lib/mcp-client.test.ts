import { describe, expect, it } from "vitest";
import { docker, getContainerAcessURL } from "./mcp-client";

describe("mcp-client", () => {
	it("should do something with getContainer", async () => {
		// Write your test logic here
		const result = await docker
			.getContainer(
				"94634a9ac57672e442fc4b91339f6c791213663291d7dfff6c3a195e9d8a0562",
			)
			.inspect();
		console.dir(result, { depth: null });

		expect(result).toBeDefined();
	});
});
