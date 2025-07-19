/**
 * Session management middleware
 */

import { getSessionId, validateSessionId } from "@http/utils/request.utils.js";
import type { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { SessionManager } from "@types";
import { handleError } from "@utils/errors.js";
import { logger } from "@utils/logger.js";
import type { NextFunction, Request, Response } from "express";

/**
 * Extended request interface with session info
 */
interface SessionRequest extends Request {
	sessionId?: string;
	transport?: StreamableHTTPServerTransport;
}

/**
 * Middleware to validate session for requests that require it
 */
export function requireSession(sessionManager: SessionManager) {
	return (req: Request, res: Response, next: NextFunction): void => {
		try {
			const sessionId = validateSessionId(req);
			const transport = sessionManager.getTransport(sessionId);

			if (!transport) {
				handleError(new Error(`Invalid session ID: ${sessionId}`), res);
				return;
			}

			// Add session info to request for downstream handlers
			(req as SessionRequest).sessionId = sessionId;
			(req as SessionRequest).transport = transport;

			next();
		} catch (error) {
			handleError(error, res);
		}
	};
}

/**
 * Middleware to log requests with session information
 */
export function logRequest(
	req: Request,
	_res: Response,
	next: NextFunction,
): void {
	const sessionId = getSessionId(req);
	const method = req.method;
	const path = req.path;
	const hasSession = sessionId ? "with session" : "without session";

	logger.info(`${method} ${path} ${hasSession} ${sessionId || "N/A"}`);

	next();
}

/**
 * Middleware to add CORS headers for MCP requests
 */
export function addCorsHeaders(
	req: Request,
	res: Response,
	next: NextFunction,
): void {
	// Add basic CORS headers for MCP clients
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
	res.header("Access-Control-Allow-Headers", "Content-Type, mcp-session-id");

	if (req.method === "OPTIONS") {
		res.sendStatus(200);
		return;
	}

	next();
}

/**
 * Middleware to validate JSON content type for POST requests
 */
export function validateJsonContent(
	req: Request,
	res: Response,
	next: NextFunction,
): void {
	if (req.method === "POST") {
		const contentType = req.headers["content-type"];
		if (!contentType || !contentType.includes("application/json")) {
			res.status(400).json({
				jsonrpc: "2.0",
				error: {
					code: -32700,
					message: "Content-Type must be application/json",
				},
				id: null,
			});
			return;
		}
	}

	next();
}
