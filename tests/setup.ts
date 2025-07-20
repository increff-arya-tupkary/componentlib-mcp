/**
 * Test setup and utilities for HeroUI MCP Server tests
 */

import { afterEach, beforeEach, vi } from "vitest";

// Mock logger to avoid console noise in tests
vi.mock("@utils/logger.js", () => ({
	logger: {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	},
}));

// Global test setup
beforeEach(() => {
	// Clear all mocks before each test
	vi.clearAllMocks();
});

afterEach(() => {
	// Clean up any remaining timers or handles
	vi.clearAllTimers();
	vi.useRealTimers();
});

// Increase timeout for integration tests
vi.setConfig({
	testTimeout: 30000,
	hookTimeout: 30000,
});
