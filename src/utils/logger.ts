/**
 * Logging utilities for HeroUI MCP Server
 */

export enum LogLevel {
	DEBUG = 0,
	INFO = 1,
	WARN = 2,
	ERROR = 3,
}

export interface Logger {
	debug(message: string, ...args: unknown[]): void;
	info(message: string, ...args: unknown[]): void;
	warn(message: string, ...args: unknown[]): void;
	error(message: string, ...args: unknown[]): void;
}

class ConsoleLogger implements Logger {
	constructor(private readonly level: LogLevel = LogLevel.INFO) {}

	debug(message: string, ...args: unknown[]): void {
		if (this.level <= LogLevel.DEBUG) {
			console.debug(`[DEBUG] ${new Date().toISOString()} ${message}`, ...args);
		}
	}

	info(message: string, ...args: unknown[]): void {
		if (this.level <= LogLevel.INFO) {
			console.info(`[INFO] ${new Date().toISOString()} ${message}`, ...args);
		}
	}

	warn(message: string, ...args: unknown[]): void {
		if (this.level <= LogLevel.WARN) {
			console.warn(`[WARN] ${new Date().toISOString()} ${message}`, ...args);
		}
	}

	error(message: string, ...args: unknown[]): void {
		if (this.level <= LogLevel.ERROR) {
			console.error(`[ERROR] ${new Date().toISOString()} ${message}`, ...args);
		}
	}
}

/**
 * Create logger instance
 */
export function createLogger(level: LogLevel = LogLevel.INFO): Logger {
	return new ConsoleLogger(level);
}

/**
 * Default logger instance
 */
export const logger = createLogger(
	process.env.NODE_ENV === "development" ? LogLevel.DEBUG : LogLevel.INFO,
);
