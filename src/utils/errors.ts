/**
 * Error handling utilities for HeroUI MCP Server
 */

import { McpServerError, SessionError, ValidationError } from "@types";
import type { Response } from "express";

/**
 * Standard JSON-RPC error codes
 */
export const ErrorCodes = {
	PARSE_ERROR: -32700,
	INVALID_REQUEST: -32600,
	METHOD_NOT_FOUND: -32601,
	INVALID_PARAMS: -32602,
	INTERNAL_ERROR: -32603,
	SERVER_ERROR: -32000,
	SESSION_ERROR: -32001,
	VALIDATION_ERROR: -32002,
} as const;

/**
 * JSON-RPC error response structure
 */
export interface JsonRpcError {
	jsonrpc: "2.0";
	error: {
		code: number;
		message: string;
		data?: Record<string, unknown>;
	};
	id: string | number | null;
}

/**
 * Create a JSON-RPC error response
 */
export function createErrorResponse(
	code: number,
	message: string,
	id: string | number | null = null,
	data?: Record<string, unknown>,
): JsonRpcError {
	return {
		jsonrpc: "2.0",
		error: {
			code,
			message,
			data,
		},
		id,
	};
}

/**
 * Handle and send error response
 */
export function handleError(
	error: unknown,
	res: Response,
	id: string | number | null = null,
): void {
	console.error("MCP Server Error:", error);

	if (error instanceof SessionError) {
		res
			.status(400)
			.json(
				createErrorResponse(
					ErrorCodes.SESSION_ERROR,
					error.message,
					id,
					error.data,
				),
			);
	} else if (error instanceof ValidationError) {
		res
			.status(400)
			.json(
				createErrorResponse(
					ErrorCodes.VALIDATION_ERROR,
					error.message,
					id,
					error.data,
				),
			);
	} else if (error instanceof McpServerError) {
		res
			.status(500)
			.json(createErrorResponse(error.code, error.message, id, error.data));
	} else if (error instanceof Error) {
		res
			.status(500)
			.json(createErrorResponse(ErrorCodes.INTERNAL_ERROR, error.message, id));
	} else {
		res
			.status(500)
			.json(
				createErrorResponse(
					ErrorCodes.INTERNAL_ERROR,
					"Unknown error occurred",
					id,
				),
			);
	}
}

/**
 * Create session error for missing or invalid session
 */
export function createSessionError(message: string): SessionError {
	return new SessionError(message);
}

/**
 * Create validation error for invalid input
 */
export function createValidationError(
	message: string,
	data?: Record<string, unknown>,
): ValidationError {
	return new ValidationError(message, data);
}

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler<T extends unknown[]>(
	fn: (...args: T) => Promise<void>,
): (...args: T) => void {
	return (...args: T) => {
		const result = fn(...args);
		if (result && typeof result.catch === "function") {
			result.catch((error: unknown) => {
				console.error("Unhandled async error:", error);
			});
		}
	};
}
