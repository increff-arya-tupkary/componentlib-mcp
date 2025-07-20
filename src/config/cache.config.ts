/**
 * Cache configuration interface and default values for HeroUI MCP Server
 */

import path from "node:path";

export interface CacheConfig {
	/** Base directory for all cache storage */
	cacheDir: string;
	/** HeroUI repository URL for cloning */
	heroUiRepoUrl: string;
	/** Target branch to clone from HeroUI repository */
	heroUiRepoBranch: string;
	/** Directory within cache for HeroUI repository */
	heroUiCacheDir: string;
	/** Sparse checkout paths for HeroUI repository */
	heroUiSparseCheckoutPaths: string[];
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
	heroUiRepoUrl: "https://github.com/heroui-inc/heroui.git",
	heroUiRepoBranch: "canary",
	heroUiCacheDir: "heroui",
	heroUiSparseCheckoutPaths: [
		"apps/docs/content/docs",
		"apps/docs/content/components",
	],
	gitTimeoutMs: 300000, // 5 minutes
	gitMaxRetries: 3,
	gitRetryIntervalMs: 2000, // 2 seconds
	validateGitOnStartup: true,
};

/**
 * Get the full path to the HeroUI cache directory
 */
export function getHeroUiCachePath(config: CacheConfig): string {
	return path.join(config.cacheDir, config.heroUiCacheDir);
}

/**
 * Get the full path to the HeroUI docs directory
 */
export function getHeroUiDocsPath(config: CacheConfig): string {
	return path.join(getHeroUiCachePath(config), "apps/docs/content/docs");
}

/**
 * Get the full path to the HeroUI components directory
 */
export function getHeroUiComponentsPath(config: CacheConfig): string {
	return path.join(getHeroUiCachePath(config), "apps/docs/content/components");
}
