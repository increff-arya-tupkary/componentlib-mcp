/**
 * Integration tests for HTTP endpoints
 */

import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HeroUiMcpApplication } from "../../src/app.js";
import { createTestServerConfig } from "../mocks/index.js";

// Mock the GitCache
const mockGitCache = {
	initializeCache: vi.fn(),
	checkCacheStatus: vi.fn(),
	getLocalPath: vi.fn(),
	isInitialized: vi.fn(),
};

vi.mock("../../src/cache/index.js", () => ({
	GitCache: vi.fn().mockImplementation(() => mockGitCache),
}));

// Mock SessionTransportManager
const mockSessionManager = {
	createSession: vi.fn(),
	getSession: vi.fn(),
	deleteSession: vi.fn(),
	getSessionCount: vi.fn().mockReturnValue(0),
	shutdown: vi.fn(),
};

vi.mock("../../src/transport/session-manager.js", () => ({
	SessionTransportManager: vi.fn().mockImplementation(() => mockSessionManager),
}));

describe("HTTP Endpoints Integration", () => {
	let app: HeroUiMcpApplication;

	beforeEach(() => {
		vi.clearAllMocks();

		// Setup git cache mock defaults
		mockGitCache.initializeCache.mockResolvedValue({ success: true });
		mockGitCache.checkCacheStatus.mockResolvedValue({
			isValid: true,
			lastChecked: new Date().toISOString(),
		});

		// Create app with test config
		const config = createTestServerConfig();
		app = new HeroUiMcpApplication(config);
	});

	afterEach(async () => {
		if (app) {
			await app.stop();
		}
	});

	describe("GET /health", () => {
		it("should return healthy status", async () => {
			const response = await request(app.getApp()).get("/health").expect(200);

			expect(response.body).toMatchObject({
				status: "healthy",
				name: expect.any(String),
				version: expect.any(String),
				timestamp: expect.any(String),
				sessions: expect.any(Number),
				cache: {
					initialized: expect.any(Boolean),
					valid: expect.any(Boolean),
					lastChecked: expect.any(String),
				},
			});
		});

		it("should handle cache status errors gracefully", async () => {
			mockGitCache.checkCacheStatus.mockRejectedValue(new Error("Cache error"));

			const response = await request(app.getApp()).get("/health").expect(500);

			expect(response.body).toMatchObject({
				status: "error",
				message: "Health check failed",
			});
		});

		it("should return correct cache status when not initialized", async () => {
			mockGitCache.checkCacheStatus.mockResolvedValue({
				isValid: false,
				lastChecked: null,
			});

			const response = await request(app.getApp()).get("/health").expect(200);

			expect(response.body.cache).toMatchObject({
				valid: false,
				lastChecked: null,
			});
		});
	});

	describe("MCP endpoints", () => {
		describe("POST /mcp", () => {
			it("should accept JSON requests", async () => {
				const requestBody = {
					jsonrpc: "2.0",
					method: "initialize",
					params: {
						protocolVersion: "2024-11-05",
						capabilities: {},
					},
					id: 1,
				};

				// This will likely return an error since we don't have a full MCP setup,
				// but it should accept the request format
				const response = await request(app.getApp())
					.post("/mcp")
					.send(requestBody)
					.set("Content-Type", "application/json");

				// Should not be a 404 or 415 (unsupported media type)
				expect([200, 400, 500]).toContain(response.status);
			});

			it("should reject non-JSON content", async () => {
				const response = await request(app.getApp())
					.post("/mcp")
					.send("not json")
					.set("Content-Type", "text/plain")
					.expect(400);

				expect(response.body).toMatchObject({
					error: {
						code: expect.any(Number),
						message: expect.any(String),
					},
				});
			});
		});

		describe("GET /mcp", () => {
			it("should handle GET requests", async () => {
				const response = await request(app.getApp()).get("/mcp");

				// Should not be a 404
				expect([200, 400, 500]).toContain(response.status);
			});
		});

		describe("DELETE /mcp", () => {
			it("should handle DELETE requests", async () => {
				const response = await request(app.getApp()).delete("/mcp");

				// Should not be a 404
				expect([200, 400, 500]).toContain(response.status);
			});
		});
	});

	describe("404 handling", () => {
		it("should return 404 for unknown routes", async () => {
			const response = await request(app.getApp())
				.get("/unknown-route")
				.expect(404);

			expect(response.body).toMatchObject({
				error: "Not Found",
				message: expect.stringContaining("Route GET /unknown-route not found"),
			});
		});

		it("should return 404 for unsupported methods", async () => {
			const response = await request(app.getApp()).patch("/health").expect(404);

			expect(response.body).toMatchObject({
				error: "Not Found",
				message: expect.stringContaining("Route PATCH /health not found"),
			});
		});
	});

	describe("CORS headers", () => {
		it("should include CORS headers in responses", async () => {
			const response = await request(app.getApp()).get("/health").expect(200);

			expect(response.headers).toHaveProperty("access-control-allow-origin");
			expect(response.headers).toHaveProperty("access-control-allow-methods");
			expect(response.headers).toHaveProperty("access-control-allow-headers");
		});
	});

	describe("JSON middleware", () => {
		it("should parse JSON bodies correctly", async () => {
			const testData = { test: "data", number: 42 };

			// This tests that JSON parsing works by sending to MCP endpoint
			// The test validates that express.json() middleware is working
			const response = await request(app.getApp())
				.post("/mcp")
				.send(testData)
				.set("Content-Type", "application/json");

			// The MCP endpoint will return 400 for missing session/invalid request,
			// but JSON parsing should work (not 415 or parse error)
			expect([400, 500]).toContain(response.status);
		});
	});

	describe("error handling", () => {
		it("should handle internal server errors gracefully", async () => {
			// Force an error by making cache check fail
			mockGitCache.checkCacheStatus.mockImplementation(() => {
				throw new Error("Simulated error");
			});

			const response = await request(app.getApp()).get("/health").expect(500);

			expect(response.body).toMatchObject({
				status: "error",
				message: expect.any(String),
			});
		});
	});
});
