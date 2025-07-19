/**
 * Git cache utility for cloning and managing HeroUI repository
 */

import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import type { CacheConfig } from "@config/cache.config.js";
import { getHeroUiCachePath } from "@config/cache.config.js";
import { logger } from "@utils/logger.js";

const execFileAsync = promisify(execFile);

export interface GitCacheStatus {
	exists: boolean;
	isGitRepository: boolean;
	isValid: boolean;
	lastChecked: Date;
	error?: string;
}

export interface GitCacheOperationResult {
	success: boolean;
	message: string;
	error?: Error;
}

export class GitCacheError extends Error {
	constructor(
		message: string,
		public operation: string,
		public exitCode?: number,
		public stderr?: string,
	) {
		super(message);
		this.name = "GitCacheError";
	}
}

export class GitCache {
	constructor(private readonly config: CacheConfig) {}

	/**
	 * Validate that git is available in the system
	 */
	async validateGitAvailability(): Promise<void> {
		try {
			const { stdout } = await execFileAsync("git", ["--version"], {
				timeout: 10000,
			});
			logger.info(`Git validation successful: ${stdout.trim()}`);
		} catch (error) {
			const message = "Git is not available in the system PATH";
			logger.error(message, error);
			throw new GitCacheError(
				message,
				"validate_git",
				undefined,
				String(error),
			);
		}
	}

	/**
	 * Check the status of the HeroUI cache
	 */
	async checkCacheStatus(): Promise<GitCacheStatus> {
		const cachePath = getHeroUiCachePath(this.config);
		const status: GitCacheStatus = {
			exists: false,
			isGitRepository: false,
			isValid: false,
			lastChecked: new Date(),
		};

		try {
			// Check if cache directory exists
			const stat = await fs.stat(cachePath);
			status.exists = stat.isDirectory();

			if (status.exists) {
				// Check if it's a git repository
				try {
					const gitDir = path.join(cachePath, ".git");
					const gitStat = await fs.stat(gitDir);
					status.isGitRepository = gitStat.isDirectory();

					if (status.isGitRepository) {
						// Validate repository integrity
						await execFileAsync("git", ["status", "--porcelain"], {
							cwd: cachePath,
							timeout: 30000,
						});
						status.isValid = true;
						logger.debug("Cache status: valid git repository", { cachePath });
					}
				} catch (gitError) {
					logger.warn(
						"Cache directory exists but is not a valid git repository",
						{
							cachePath,
							error: gitError,
						},
					);
					status.error = `Invalid git repository: ${gitError}`;
				}
			}
		} catch (error) {
			logger.debug("Cache directory does not exist", { cachePath });
			status.error = `Cache check failed: ${error}`;
		}

		return status;
	}

	/**
	 * Clone the HeroUI repository with sparse checkout
	 */
	async cloneRepository(): Promise<GitCacheOperationResult> {
		const cachePath = getHeroUiCachePath(this.config);
		const parentDir = path.dirname(cachePath);

		try {
			// Ensure parent directory exists
			await fs.mkdir(parentDir, { recursive: true });
			logger.info("Created cache parent directory", { parentDir });

			// Remove existing cache if it exists and is invalid
			const status = await this.checkCacheStatus();
			if (status.exists && !status.isValid) {
				logger.warn("Removing invalid existing cache directory", { cachePath });
				await fs.rm(cachePath, { recursive: true, force: true });
			}

			// Clone repository with no checkout initially
			logger.info("Cloning HeroUI repository...", {
				url: this.config.heroUiRepoUrl,
				branch: this.config.heroUiRepoBranch,
				target: cachePath,
			});

			await this.executeGitCommand(
				[
					"clone",
					"--no-checkout",
					"--filter=blob:none",
					"--branch",
					this.config.heroUiRepoBranch,
					this.config.heroUiRepoUrl,
					cachePath,
				],
				parentDir,
			);

			// Configure sparse checkout
			await this.executeGitCommand(
				["sparse-checkout", "init", "--cone"],
				cachePath,
			);

			// Set sparse checkout paths
			await this.executeGitCommand(
				["sparse-checkout", "set"].concat(
					this.config.heroUiSparseCheckoutPaths,
				),
				cachePath,
			);

			// Checkout the files
			await this.executeGitCommand(["checkout"], cachePath);

			logger.info("Successfully cloned and configured HeroUI repository", {
				cachePath,
				sparseCheckoutPaths: this.config.heroUiSparseCheckoutPaths,
			});

			return {
				success: true,
				message: "Repository cloned successfully",
			};
		} catch (error) {
			const message = `Failed to clone repository: ${error instanceof Error ? error.message : error}`;
			logger.error(message, { error, cachePath });
			return {
				success: false,
				message,
				error: error instanceof Error ? error : new Error(String(error)),
			};
		}
	}

	/**
	 * Update the existing repository cache
	 */
	async updateRepository(): Promise<GitCacheOperationResult> {
		const cachePath = getHeroUiCachePath(this.config);

		try {
			const status = await this.checkCacheStatus();
			if (!status.isValid) {
				logger.info(
					"Cache is invalid, performing fresh clone instead of update",
				);
				return await this.cloneRepository();
			}

			logger.info("Updating HeroUI repository cache...", { cachePath });

			// Fetch latest changes
			await this.executeGitCommand(["fetch", "origin"], cachePath);

			// Reset to latest origin branch
			await this.executeGitCommand(
				["reset", "--hard", `origin/${this.config.heroUiRepoBranch}`],
				cachePath,
			);

			// Reapply sparse checkout in case patterns changed
			await this.executeGitCommand(
				["sparse-checkout", "set"].concat(
					this.config.heroUiSparseCheckoutPaths,
				),
				cachePath,
			);

			logger.info("Successfully updated HeroUI repository cache", {
				cachePath,
			});

			return {
				success: true,
				message: "Repository updated successfully",
			};
		} catch (error) {
			const message = `Failed to update repository: ${error instanceof Error ? error.message : error}`;
			logger.error(message, { error, cachePath });
			return {
				success: false,
				message,
				error: error instanceof Error ? error : new Error(String(error)),
			};
		}
	}

	/**
	 * Initialize or update the cache
	 */
	async initializeCache(): Promise<GitCacheOperationResult> {
		logger.info("Initializing HeroUI cache...");

		try {
			if (this.config.validateGitOnStartup) {
				await this.validateGitAvailability();
			}

			const status = await this.checkCacheStatus();

			if (status.isValid) {
				logger.info("Valid cache found, checking for updates...");
				return await this.updateRepository();
			} else {
				logger.info("No valid cache found, cloning repository...");
				return await this.cloneRepository();
			}
		} catch (error) {
			const message = `Cache initialization failed: ${error instanceof Error ? error.message : error}`;
			logger.error(message, { error });
			return {
				success: false,
				message,
				error: error instanceof Error ? error : new Error(String(error)),
			};
		}
	}

	/**
	 * Clean up the cache directory
	 */
	async clearCache(): Promise<GitCacheOperationResult> {
		const cachePath = getHeroUiCachePath(this.config);

		try {
			logger.info("Clearing HeroUI cache...", { cachePath });
			await fs.rm(cachePath, { recursive: true, force: true });
			logger.info("Cache cleared successfully", { cachePath });

			return {
				success: true,
				message: "Cache cleared successfully",
			};
		} catch (error) {
			const message = `Failed to clear cache: ${error instanceof Error ? error.message : error}`;
			logger.error(message, { error, cachePath });
			return {
				success: false,
				message,
				error: error instanceof Error ? error : new Error(String(error)),
			};
		}
	}

	/**
	 * Execute a git command with proper error handling and retries
	 */
	private async executeGitCommand(
		args: string[],
		cwd: string,
		attempt = 1,
	): Promise<void> {
		try {
			logger.debug("Executing git command", { args, cwd, attempt });

			const { stdout, stderr } = await execFileAsync("git", args, {
				cwd,
				timeout: this.config.gitTimeoutMs,
				maxBuffer: 10 * 1024 * 1024, // 10MB buffer
			});

			if (stderr && !this.isIgnorableStderr(stderr)) {
				logger.warn("Git command produced stderr", { args, stderr });
			}

			logger.debug("Git command completed successfully", {
				args,
				stdoutLength: stdout.length,
			});
		} catch (error: unknown) {
			const gitError = error as {
				message: string;
				code?: number;
				stderr?: string;
			};
			const isLastAttempt = attempt >= this.config.gitMaxRetries;

			logger.warn("Git command failed", {
				args,
				cwd,
				attempt,
				maxRetries: this.config.gitMaxRetries,
				error: gitError.message,
				stderr: gitError.stderr,
				exitCode: gitError.code,
			});

			if (isLastAttempt) {
				throw new GitCacheError(
					`Git command failed after ${attempt} attempts: ${gitError.message}`,
					args.join(" "),
					gitError.code,
					gitError.stderr,
				);
			}

			// Wait before retry
			await this.sleep(this.config.gitRetryIntervalMs);

			// Retry the command
			return this.executeGitCommand(args, cwd, attempt + 1);
		}
	}

	/**
	 * Check if stderr output can be safely ignored
	 */
	private isIgnorableStderr(stderr: string): boolean {
		const ignorablePatterns = [
			/warning:/i,
			/note:/i,
			/hint:/i,
			/remote: Enumerating objects/i,
			/remote: Counting objects/i,
			/remote: Compressing objects/i,
			/remote: Total/i,
			/Receiving objects/i,
			/Resolving deltas/i,
		];

		return ignorablePatterns.some((pattern) => pattern.test(stderr));
	}

	/**
	 * Sleep utility for retry delays
	 */
	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
