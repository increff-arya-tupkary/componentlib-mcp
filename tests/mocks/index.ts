/**
 * Shared mocks for testing
 */

import { vi } from "vitest";
import type { CacheConfig } from "../../src/config/cache.config.js";
import type { ServerConfig } from "../../src/config/server.config.js";

// Mock cache config
export const mockCacheConfig: CacheConfig = {
	cacheDir: "/tmp/test-cache",
	repoUrl: "https://github.com/heroui-inc/heroui.git",
	repoBranch: "canary",
	cacheDirName: "heroui",
	sparseCheckoutPaths: [
		"apps/docs/content/docs",
		"apps/docs/content/components",
	],
	gitTimeoutMs: 30000,
	gitMaxRetries: 3,
	gitRetryIntervalMs: 1000,
	validateGitOnStartup: false,
};

// Mock server config
export const mockServerConfig: ServerConfig = {
	name: "test-mcp-server",
	version: "1.0.0-test",
	description: "A test MCP server",
	port: 0, // Use random available port for tests
	host: "localhost",
	enableDnsRebindingProtection: false,
	allowedHosts: ["127.0.0.1"],
	sessionIdGenerator: () => "test-session-id",
	cache: mockCacheConfig,
};

// Mock git cache
export const createMockGitCache = () => ({
	initializeCache: vi.fn().mockResolvedValue({ success: true }),
	checkCacheStatus: vi.fn().mockResolvedValue({
		isValid: true,
		lastChecked: new Date().toISOString(),
	}),
	getRepoCachePath: vi.fn().mockReturnValue("/tmp/test-cache/heroui"),
	isInitialized: vi.fn().mockReturnValue(true),
});

// Mock session manager
export const createMockSessionManager = () => ({
	createSession: vi.fn().mockReturnValue("test-session-id"),
	getSession: vi.fn().mockReturnValue(null),
	deleteSession: vi.fn().mockReturnValue(true),
	getSessionCount: vi.fn().mockReturnValue(0),
	shutdown: vi.fn(),
});

// Get random available port for testing
export const getRandomPort = (): number => {
	// Use port 0 to let the system assign an available port
	return 0;
};

// Create test server config with random port
export const createTestServerConfig = (
	overrides: Partial<ServerConfig> = {},
): ServerConfig => ({
	...mockServerConfig,
	port: getRandomPort(),
	...overrides,
});
