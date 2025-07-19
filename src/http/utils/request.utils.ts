/**
 * Request/response utilities for HTTP layer
 */

import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { createSessionError } from "@utils/errors.js";
import type { Request, Response } from "express";

/**
 * Extract session ID from request headers
 */
export function getSessionId(req: Request): string | undefined {
	return req.headers["mcp-session-id"] as string | undefined;
}

/**
 * Check if request has valid session ID
 */
export function hasSessionId(req: Request): boolean {
	const sessionId = getSessionId(req);
	return sessionId !== undefined && sessionId.trim().length > 0;
}

/**
 * Validate session ID exists and is not empty
 */
export function validateSessionId(req: Request): string {
	const sessionId = getSessionId(req);
	if (!sessionId || sessionId.trim().length === 0) {
		throw createSessionError("Missing or empty session ID");
	}
	return sessionId;
}

/**
 * Check if request is a new initialization request
 */
export function isNewInitializeRequest(req: Request): boolean {
	return !hasSessionId(req) && isInitializeRequest(req.body);
}

/**
 * Check if request is a session continuation request
 */
export function isSessionContinuation(req: Request): boolean {
	return hasSessionId(req);
}

/**
 * Validate request for MCP processing
 */
export function validateMcpRequest(req: Request): {
	isInitialize: boolean;
	sessionId?: string;
} {
	const isInitialize = isNewInitializeRequest(req);
	const isSession = isSessionContinuation(req);

	if (!isInitialize && !isSession) {
		throw createSessionError(
			"Bad Request: No valid session ID provided and not an initialize request",
		);
	}

	return {
		isInitialize,
		sessionId: isSession ? validateSessionId(req) : undefined,
	};
}

/**
 * Send session error response
 */
export function sendSessionError(res: Response, message: string): void {
	res.status(400).json({
		jsonrpc: "2.0",
		error: {
			code: -32001,
			message,
		},
		id: null,
	});
}

/**
 * Send invalid request error response
 */
export function sendInvalidRequestError(res: Response, message: string): void {
	res.status(400).json({
		jsonrpc: "2.0",
		error: {
			code: -32000,
			message,
		},
		id: null,
	});
}

/**
 * Extract JSON-RPC request ID if available
 */
export function getRequestId(req: Request): string | number | null {
	if (req.body && typeof req.body === "object" && "id" in req.body) {
		return req.body.id as string | number;
	}
	return null;
}

/**
 * Check if request has valid JSON-RPC format
 */
export function isValidJsonRpc(req: Request): boolean {
	return (
		req.body &&
		typeof req.body === "object" &&
		req.body.jsonrpc === "2.0" &&
		"method" in req.body
	);
}
