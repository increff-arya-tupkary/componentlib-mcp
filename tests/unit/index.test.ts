/**
 * Unit tests for main entry point (index.ts)
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the HeroUiMcpApplication
const mockApp = {
	start: vi.fn(),
	stop: vi.fn(),
};

vi.mock("../../src/app.js", () => ({
	HeroUiMcpApplication: vi.fn().mockImplementation(() => mockApp),
}));

// Mock logger
vi.mock("../../src/utils/logger.js", () => ({
	logger: {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	},
}));

describe("Main Entry Point", () => {
	let originalExit: typeof process.exit;
	let originalOn: typeof process.on;
	let mockExit: ReturnType<typeof vi.fn>;
	let mockOn: ReturnType<typeof vi.fn>;
	let processHandlers: { [key: string]: () => void } = {};

	beforeEach(() => {
		vi.clearAllMocks();

		// Mock process.exit
		originalExit = process.exit;
		mockExit = vi.fn();
		// biome-ignore lint/suspicious/noExplicitAny: Required for process mocking
		process.exit = mockExit as any;

		// Mock process.on to capture signal handlers
		originalOn = process.on;
		mockOn = vi.fn((signal: string, handler: () => void) => {
			processHandlers[signal] = handler;
			return process;
		});
		// biome-ignore lint/suspicious/noExplicitAny: Required for process mocking
		process.on = mockOn as any;

		// Reset app mocks
		mockApp.start.mockResolvedValue(undefined);
		mockApp.stop.mockResolvedValue(undefined);

		// Clear any existing handlers
		processHandlers = {};
	});

	afterEach(() => {
		// Restore original functions
		process.exit = originalExit;
		process.on = originalOn;

		// Clear modules to reset the main module
		vi.resetModules();
	});

	describe("main function", () => {
		it("should start the application successfully", async () => {
			// Import the module to trigger main execution
			await import("../../src/index.js");

			// Wait for async operations
			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(mockApp.start).toHaveBeenCalled();
			expect(mockExit).not.toHaveBeenCalled();
		});

		it("should handle application start failure", async () => {
			const error = new Error("Failed to start");
			mockApp.start.mockRejectedValue(error);

			await import("../../src/index.js");

			// Wait for async operations
			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(mockExit).toHaveBeenCalledWith(1);
		});

		it("should register SIGINT handler", async () => {
			await import("../../src/index.js");

			expect(mockOn).toHaveBeenCalledWith("SIGINT", expect.any(Function));
		});

		it("should register SIGTERM handler", async () => {
			await import("../../src/index.js");

			expect(mockOn).toHaveBeenCalledWith("SIGTERM", expect.any(Function));
		});
	});

	describe("signal handlers", () => {
		beforeEach(async () => {
			// Import to register handlers
			await import("../../src/index.js");
			await new Promise((resolve) => setTimeout(resolve, 10));
		});

		it("should handle SIGINT signal gracefully", async () => {
			const sigintHandler = processHandlers["SIGINT"];
			expect(sigintHandler).toBeDefined();

			// Trigger the handler
			await sigintHandler();

			expect(mockApp.stop).toHaveBeenCalled();
			expect(mockExit).toHaveBeenCalledWith(0);
		});

		it("should handle SIGTERM signal gracefully", async () => {
			const sigtermHandler = processHandlers["SIGTERM"];
			expect(sigtermHandler).toBeDefined();

			// Trigger the handler
			await sigtermHandler();

			expect(mockApp.stop).toHaveBeenCalled();
			expect(mockExit).toHaveBeenCalledWith(0);
		});

		it("should handle shutdown errors gracefully", async () => {
			const error = new Error("Shutdown failed");
			mockApp.stop.mockRejectedValue(error);

			const sigintHandler = processHandlers["SIGINT"];

			// The shutdown function doesn't catch errors, so it will propagate
			await expect(sigintHandler()).rejects.toThrow("Shutdown failed");

			expect(mockApp.stop).toHaveBeenCalled();
		});
	});

	describe("error handling", () => {
		it("should handle unhandled errors in main", async () => {
			// Mock an error in the main function
			const error = new Error("Unhandled error");
			mockApp.start.mockImplementation(() => {
				throw error;
			});

			await import("../../src/index.js");

			// Wait for async operations
			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(mockExit).toHaveBeenCalledWith(1);
		});
	});
});
