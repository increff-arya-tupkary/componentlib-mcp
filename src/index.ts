/**
 * Main entry point for HeroUI MCP Server
 */

import { logger } from "@utils/logger.js";
import { HeroUiMcpApplication } from "./app.js";

/**
 * Main function to start the application
 */
async function main(): Promise<void> {
	try {
		const app = new HeroUiMcpApplication();

		// Handle graceful shutdown
		const shutdown = async (signal: string) => {
			logger.info(`Received ${signal}, shutting down gracefully`);
			await app.stop();
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

// Start the application
main().catch((error) => {
	logger.error("Unhandled error in main:", error);
	process.exit(1);
});
