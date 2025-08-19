/**
 * Server configuration interface and default values for HeroUI MCP Server
 */

import { randomUUID } from "node:crypto";
import type { CacheConfig } from "./cache.config.js";
import { defaultCacheConfig } from "./cache.config.js";

export interface ServerConfig {
	/** Server name for MCP identification */
	name: string;
	/** Server version */
	version: string;
	/** Server description */
	description: string;
	/** HTTP port to listen on */
	port: number;
	/** HTTP host to listen on */
	host: string;
	/** Enable DNS rebinding protection */
	enableDnsRebindingProtection: boolean;
	/** Allowed hosts for DNS rebinding protection */
	allowedHosts: string[];
	/** Session ID generator function */
	sessionIdGenerator: () => string;
	/** Cache configuration */
	cache: CacheConfig;
}

export interface HttpTransportConfig {
	enableDnsRebindingProtection: boolean;
	allowedHosts: string[];
	sessionIdGenerator: () => string;
}

/**
 * Default server configuration
 */
export const defaultServerConfig: ServerConfig = {
	port: 3000,
	host: "localhost",
	name: "mcp-server",
	version: "1.0.0",
	description: "A Model Context Protocol (MCP) server",
	enableDnsRebindingProtection: false, // Disabled by default for backwards compatibility
	allowedHosts: ["127.0.0.1"],
	sessionIdGenerator: () => randomUUID(),
	cache: defaultCacheConfig,
};

/**
 * Create HTTP transport configuration from server config
 */
export function createHttpTransportConfig(
	config: ServerConfig,
): HttpTransportConfig {
	return {
		enableDnsRebindingProtection: config.enableDnsRebindingProtection,
		allowedHosts: config.allowedHosts,
		sessionIdGenerator: config.sessionIdGenerator,
	};
}
