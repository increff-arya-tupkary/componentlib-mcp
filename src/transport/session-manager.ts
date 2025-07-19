/**
 * Session and transport management for HeroUI MCP Server
 */

import type { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { SessionManager, SessionTransport } from "../types/index.js";

export class SessionTransportManager implements SessionManager {
	private transports: Map<string, SessionTransport> = new Map();
	private cleanupInterval: NodeJS.Timeout | null = null;

	constructor(private readonly sessionTimeoutMs: number = 30 * 60 * 1000) {
		// 30 minutes default timeout
		this.startCleanupInterval();
	}

	/**
	 * Get transport by session ID
	 */
	getTransport(sessionId: string): StreamableHTTPServerTransport | undefined {
		const sessionTransport = this.transports.get(sessionId);
		if (sessionTransport) {
			// Update last activity
			sessionTransport.lastActivity = new Date();
			return sessionTransport.transport;
		}
		return undefined;
	}

	/**
	 * Store transport with session ID
	 */
	setTransport(
		sessionId: string,
		transport: StreamableHTTPServerTransport,
	): void {
		const now = new Date();
		const sessionTransport: SessionTransport = {
			sessionId,
			transport,
			createdAt: now,
			lastActivity: now,
		};

		this.transports.set(sessionId, sessionTransport);

		// Set up cleanup when transport closes
		transport.onclose = () => {
			this.removeTransport(sessionId);
		};
	}

	/**
	 * Remove transport by session ID
	 */
	removeTransport(sessionId: string): void {
		this.transports.delete(sessionId);
	}

	/**
	 * Get all active session IDs
	 */
	getActiveSessions(): string[] {
		return Array.from(this.transports.keys());
	}

	/**
	 * Get session count
	 */
	getSessionCount(): number {
		return this.transports.size;
	}

	/**
	 * Manual cleanup of expired sessions
	 */
	cleanup(): void {
		const now = new Date();
		const expiredSessions: string[] = [];

		for (const [sessionId, sessionTransport] of this.transports) {
			const timeSinceLastActivity =
				now.getTime() - sessionTransport.lastActivity.getTime();
			if (timeSinceLastActivity > this.sessionTimeoutMs) {
				expiredSessions.push(sessionId);
			}
		}

		for (const sessionId of expiredSessions) {
			this.removeTransport(sessionId);
		}
	}

	/**
	 * Start automatic cleanup interval
	 */
	private startCleanupInterval(): void {
		// Run cleanup every 5 minutes
		this.cleanupInterval = setInterval(
			() => {
				this.cleanup();
			},
			5 * 60 * 1000,
		);
	}

	/**
	 * Stop cleanup interval and close all transports
	 */
	shutdown(): void {
		if (this.cleanupInterval) {
			clearInterval(this.cleanupInterval);
			this.cleanupInterval = null;
		}

		// Close all transports
		for (const sessionTransport of this.transports.values()) {
			try {
				sessionTransport.transport.close();
			} catch (error) {
				console.error(
					`Error closing transport for session ${sessionTransport.sessionId}:`,
					error,
				);
			}
		}

		this.transports.clear();
	}
}
