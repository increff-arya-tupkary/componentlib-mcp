/**
 * Unit tests for HeroUiMcpApplication class
 */

import { describe, expect, it, vi } from "vitest";
import { createTestServerConfig } from "../mocks/index.js";

// Simple mocks for dependencies
vi.mock("../../src/cache/index.js");
vi.mock("../../src/transport/session-manager.js");
vi.mock("../../src/http/middleware/session.middleware.js");
vi.mock("../../src/http/routes/mcp-routes.js");
vi.mock("../../src/server/mcp-server.factory.js");
vi.mock("../../src/tools/registry.js");
vi.mock("../../src/resources/registry.js");
vi.mock("../../src/tools/components/list-components.js");
vi.mock("../../src/tools/components/get-component-docs.js");
vi.mock("../../src/tools/components/get-component-usage.js");
vi.mock("../../src/tools/components/get-component-api.js");
vi.mock("../../src/tools/components/get-component-slots.js");
vi.mock("../../src/tools/components/get-component-data-attributes.js");
vi.mock("../../src/tools/components/get-component-accessibility.js");
vi.mock("../../src/resources/examples/greeting-resource.js");
vi.mock("../../src/utils/errors.js");

// Mock express with a factory
vi.mock("express", () => {
	const mockApp = {
		listen: vi.fn(),
		use: vi.fn(),
		get: vi.fn(),
		post: vi.fn(),
		delete: vi.fn(),
	};

	const mockExpress = vi.fn(() => mockApp);
	// biome-ignore lint/suspicious/noExplicitAny: Required for mocking
	(mockExpress as any).json = vi.fn(() => "json-middleware");

	return {
		default: mockExpress,
	};
});

describe("McpApplication", () => {
	// Simple smoke tests to verify the class can be instantiated and basic methods exist
	it("should be defined and importable", async () => {
		const { McpApplication } = await import("../../src/app.js");
		expect(McpApplication).toBeDefined();
	});

	it("should have required methods", async () => {
		const { McpApplication } = await import("../../src/app.js");
		const config = createTestServerConfig();

		// Just check the class can be instantiated without detailed mocking
		const app = new McpApplication(config);

		expect(typeof app.start).toBe("function");
		expect(typeof app.stop).toBe("function");
		expect(typeof app.getApp).toBe("function");
		expect(typeof app.getSessionManager).toBe("function");
		expect(typeof app.getGitCache).toBe("function");
		expect(typeof app.isCacheInitialized).toBe("function");
	});
});
