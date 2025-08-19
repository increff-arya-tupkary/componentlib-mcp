/**
 * Cache configuration interface and default values for HeroUI MCP Server
 */

import path from "node:path";

export interface CacheConfig {
	/** Base directory for all cache storage */
	cacheDir: string;
	/** repository URL for cloning */
	repoUrl: string;
	/** Target branch to clone from repository */
	repoBranch: string;
	/** Directory within cache for repository */
	cacheDirName: string;
	/** Sparse checkout paths for repository */
	sparseCheckoutPaths: string[];
	/** Timeout for git operations in milliseconds */
	gitTimeoutMs: number;
	/** Maximum number of retry attempts for git operations */
	gitMaxRetries: number;
	/** Interval between retry attempts in milliseconds */
	gitRetryIntervalMs: number;
	/** Whether to validate git availability on startup */
	validateGitOnStartup: boolean;
}

/**
 * Default cache configuration
 */
export const defaultCacheConfig: CacheConfig = {
	cacheDir: path.resolve(process.cwd(), ".cache"),
	repoUrl: "",
	repoBranch: "main",
	cacheDirName: "default",
	sparseCheckoutPaths: [],
	gitTimeoutMs: 300000, // 5 minutes
	gitMaxRetries: 3,
	gitRetryIntervalMs: 2000, // 2 seconds
	validateGitOnStartup: true,
};

/**
 * Get the full path to the cache directory
 */
export function getRepoCachePath(config: CacheConfig): string {
	return path.join(config.cacheDir, config.cacheDirName);
}

/**
 * Get the full path to the docs directory
 */
export function getDocsPath(config: CacheConfig): string {
	const repoCachePath = getRepoCachePath(config);
	const docsPath =
		config.sparseCheckoutPaths.find((p) => p.includes("docs")) || "";
	return path.join(repoCachePath, docsPath);
}

/**
 * Get the full path to the components directory
 */
export function getComponentsPath(config: CacheConfig): string {
	const repoCachePath = getRepoCachePath(config);
	const componentsPath =
		config.sparseCheckoutPaths.find((p) => p.includes("components")) || "";
	return path.join(repoCachePath, componentsPath);
}
