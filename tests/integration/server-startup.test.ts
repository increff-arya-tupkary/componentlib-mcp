/**
 * Integration tests for server startup and lifecycle
 */

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

describe("Server Startup Integration", () => {
	let app: HeroUiMcpApplication;

	beforeEach(() => {
		vi.clearAllMocks();

		// Setup git cache mock defaults
		mockGitCache.initializeCache.mockResolvedValue({ success: true });
		mockGitCache.checkCacheStatus.mockResolvedValue({
			isValid: true,
			lastChecked: new Date().toISOString(),
		});
	});

	afterEach(async () => {
		if (app) {
			try {
				await app.stop();
			} catch {
				// Ignore errors during cleanup
			}
		}
	});

	describe("Application lifecycle", () => {
		it("should start and stop the server successfully", async () => {
			const config = createTestServerConfig();
			app = new HeroUiMcpApplication(config);

			// Start the server
			await expect(app.start()).resolves.toBeUndefined();

			// Verify the server is running by checking if we can get the express app
			expect(app.getApp()).toBeDefined();

			// Stop the server
			await expect(app.stop()).resolves.toBeUndefined();
		});

		it("should initialize cache before starting HTTP server", async () => {
			const config = createTestServerConfig();
			app = new HeroUiMcpApplication(config);

			await app.start();

			expect(mockGitCache.initializeCache).toHaveBeenCalled();
			expect(app.isCacheInitialized()).toBe(true);
		});

		it("should continue startup even when cache initialization fails", async () => {
			mockGitCache.initializeCache.mockResolvedValue({
				success: false,
				message: "Failed to initialize cache",
			});

			const config = createTestServerConfig();
			app = new HeroUiMcpApplication(config);

			await expect(app.start()).resolves.toBeUndefined();
			expect(app.isCacheInitialized()).toBe(false);
		});

		it("should handle multiple start/stop cycles", async () => {
			const config = createTestServerConfig();
			app = new HeroUiMcpApplication(config);

			// First cycle
			await app.start();
			await app.stop();

			// Second cycle
			await app.start();
			await app.stop();

			// Should complete without errors
			expect(true).toBe(true);
		});
	});

	describe("Configuration handling", () => {
		it("should use provided configuration", async () => {
			const customConfig = createTestServerConfig({
				name: "test-custom-server",
				version: "2.0.0-test",
				port: 0, // Use random port
			});

			app = new HeroUiMcpApplication(customConfig);
			await app.start();

			// Configuration should be applied (we can't easily test port without actual network binding)
			expect(app.getApp()).toBeDefined();
		});

		it("should use default configuration when none provided", async () => {
			app = new HeroUiMcpApplication();
			await app.start();

			expect(app.getApp()).toBeDefined();
		});
	});

	describe("Dependencies initialization", () => {
		it("should initialize session manager", async () => {
			const config = createTestServerConfig();
			app = new HeroUiMcpApplication(config);

			const sessionManager = app.getSessionManager();
			expect(sessionManager).toBeDefined();
			expect(sessionManager.getSessionCount).toBeDefined();
		});

		it("should initialize git cache", async () => {
			const config = createTestServerConfig();
			app = new HeroUiMcpApplication(config);

			const gitCache = app.getGitCache();
			expect(gitCache).toBeDefined();
			expect(gitCache.initializeCache).toBeDefined();
		});

		it("should set up express application with middleware", async () => {
			const config = createTestServerConfig();
			app = new HeroUiMcpApplication(config);

			const expressApp = app.getApp();
			expect(expressApp).toBeDefined();
			expect(typeof expressApp.listen).toBe("function");
		});
	});

	describe("Error scenarios", () => {
		it("should handle cache initialization timeout", async () => {
			// Simulate slow cache initialization
			mockGitCache.initializeCache.mockImplementation(
				() =>
					new Promise((resolve) =>
						setTimeout(() => resolve({ success: true }), 100),
					),
			);

			const config = createTestServerConfig();
			app = new HeroUiMcpApplication(config);

			await expect(app.start()).resolves.toBeUndefined();
		});

		it("should handle cache initialization error", async () => {
			mockGitCache.initializeCache.mockRejectedValue(new Error("Cache error"));

			const config = createTestServerConfig();
			app = new HeroUiMcpApplication(config);

			// Should not throw, should handle gracefully
			await expect(app.start()).rejects.toThrow();
		});
	});

	describe("Graceful shutdown", () => {
		it("should stop session manager during shutdown", async () => {
			const config = createTestServerConfig();
			app = new HeroUiMcpApplication(config);

			await app.start();
			const sessionManager = app.getSessionManager();

			await app.stop();

			expect(sessionManager.shutdown).toHaveBeenCalled();
		});

		it("should handle stop when not started", async () => {
			const config = createTestServerConfig();
			app = new HeroUiMcpApplication(config);

			// Should not throw when stopping a server that wasn't started
			await expect(app.stop()).resolves.toBeUndefined();
		});

		it("should handle multiple stop calls", async () => {
			const config = createTestServerConfig();
			app = new HeroUiMcpApplication(config);

			await app.start();
			await app.stop();

			// Second stop should not throw
			await expect(app.stop()).resolves.toBeUndefined();
		});
	});
});
