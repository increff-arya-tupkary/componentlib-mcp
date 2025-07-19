/**
 * Shared TypeScript interfaces and types for HeroUI MCP Server
 */

import type {
	McpServer,
	ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import type { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { Request, Response } from "express";
import type { ZodRawShape } from "zod";

/**
 * Session management types
 */
export interface SessionTransport {
	sessionId: string;
	transport: StreamableHTTPServerTransport;
	createdAt: Date;
	lastActivity: Date;
}

export interface SessionManager {
	getTransport(sessionId: string): StreamableHTTPServerTransport | undefined;
	setTransport(
		sessionId: string,
		transport: StreamableHTTPServerTransport,
	): void;
	removeTransport(sessionId: string): void;
	cleanup(): void;
}

/**
 * Tool and Resource registry types
 */
export interface ToolDefinition {
	name: string;
	description: {
		title: string;
		description: string;
		inputSchema: ZodRawShape;
	};
	handler: (params: Record<string, unknown>) => Promise<{
		content: Array<{ type: "text"; text: string }>;
	}>;
}

export interface ResourceDefinition {
	name: string;
	template: ResourceTemplate;
	description: {
		title: string;
		description: string;
		mimeType: string;
	};
	handler: (
		uri: URL,
		params: Record<string, string | string[]>,
	) => Promise<{
		contents: Array<{ uri: string; text: string }>;
	}>;
}

export interface ToolRegistry {
	registerTool(tool: ToolDefinition): void;
	getTools(): ToolDefinition[];
	getTool(name: string): ToolDefinition | undefined;
}

export interface ResourceRegistry {
	registerResource(resource: ResourceDefinition): void;
	getResources(): ResourceDefinition[];
	getResource(name: string): ResourceDefinition | undefined;
}

/**
 * HTTP request/response types
 */
export interface McpRequest extends Request {
	sessionId?: string;
}

export interface McpResponse extends Response {}

/**
 * Server factory types
 */
export interface ServerDependencies {
	toolRegistry: ToolRegistry;
	resourceRegistry: ResourceRegistry;
	sessionManager: SessionManager;
}

export interface ServerFactory {
	createServer(dependencies: ServerDependencies): McpServer;
}

/**
 * Application types
 */
export interface Application {
	start(): Promise<void>;
	stop(): Promise<void>;
}

/**
 * Error types
 */
export class McpServerError extends Error {
	constructor(
		message: string,
		public code: number = -32000,
		public data?: Record<string, unknown>,
	) {
		super(message);
		this.name = "McpServerError";
	}
}

export class SessionError extends McpServerError {
	constructor(message: string, data?: Record<string, unknown>) {
		super(message, -32001, data);
		this.name = "SessionError";
	}
}

export class ValidationError extends McpServerError {
	constructor(message: string, data?: Record<string, unknown>) {
		super(message, -32002, data);
		this.name = "ValidationError";
	}
}
