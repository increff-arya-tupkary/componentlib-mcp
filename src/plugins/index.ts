/**
 * Plugin registration entry point
 */
import { herouiCacheConfig } from "./heroui/heroui.config.js";
import { pluginManager } from "./plugin-manager.js";

/**
 * Register all available plugins with the plugin manager
 */
export function registerPlugins(): void {
	pluginManager.registerPlugin("heroui", herouiCacheConfig);
}
