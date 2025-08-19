/**
 * Main entry point for the MCP Server
 */

import { logger } from "@utils/logger.js";
import { McpApplication } from "./app.js";

/**
 * Main function to start the application
 */
export async function main(): Promise<void> {
	try {
		const app = new McpApplication();

		// Handle graceful shutdown
		const shutdown = async (signal: string) => {
			logger.info(`Received ${signal}, shutting down gracefully`);
			try {
				await app.stop();
			} catch (error) {
				logger.error("Error during shutdown:", error);
				process.exit(1);
			}
			process.exit(0);
		};

		process.on("SIGINT", () => shutdown("SIGINT"));
		process.on("SIGTERM", () => shutdown("SIGTERM"));

		// Start the application
		await app.start();
	} catch (error) {
		logger.error("Failed to start application:", error);
		process.exit(1);
	}
}

// Start the application if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch((error) => {
		logger.error("Unhandled error in main:", error);
		process.exit(1);
	});
}
