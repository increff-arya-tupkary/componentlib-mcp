import { type CacheConfig, defaultCacheConfig } from "@config/cache.config.js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

interface Plugin {
	name: string;
	config: Partial<CacheConfig>;
}

class PluginManager {
	private plugins: Map<string, Plugin> = new Map();
	private activePlugin: string | null = null;

	constructor() {
		this.loadPlugins().catch((error) => {
			console.error("Failed to load plugins:", error);
		});
	}

	async loadPlugins() {
		const __filename = fileURLToPath(import.meta.url);
		const __dirname = path.dirname(__filename);
		const pluginsDir = __dirname;
		const pluginDirs = await fs.readdir(pluginsDir, { withFileTypes: true });

		for (const dirent of pluginDirs) {
			if (dirent.isDirectory()) {
				const pluginName = dirent.name;
				const configPath = path.join(
					pluginsDir,
					pluginName,
					`${pluginName}.config.js`,
				);
				try {
					const configModule = await import(configPath);
					if (configModule && typeof configModule === "object") {
						const configKey = Object.keys(configModule).find((key) =>
							key.toLowerCase().includes("config"),
						);
						if (configKey) {
							this.registerPlugin(pluginName, configModule[configKey]);
						}
					}
				} catch (error) {
					console.warn(`Could not load plugin ${pluginName}:`, error);
				}
			}
		}
	}

	registerPlugin(name: string, config: Partial<CacheConfig>) {
		this.plugins.set(name, { name, config });
	}

	setActivePlugin(name: string) {
		if (this.plugins.has(name)) {
			this.activePlugin = name;
		} else {
			throw new Error(`Plugin ${name} is not registered.`);
		}
	}

	getActivePluginConfig(): CacheConfig {
		if (this.activePlugin) {
			const plugin = this.plugins.get(this.activePlugin);
			if (plugin) {
				return { ...defaultCacheConfig, ...plugin.config };
			}
		}
		return defaultCacheConfig;
	}
}

export const pluginManager = new PluginManager();
