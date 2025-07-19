/**
 * Resource registration and management
 */

import type { ResourceDefinition, ResourceRegistry } from "../types/index.js";
import { logger } from "../utils/logger.js";
import type { BaseResource } from "./base-resource.js";

export class ResourceRegistryImpl implements ResourceRegistry {
	private resources: Map<string, ResourceDefinition> = new Map();

	/**
	 * Register a resource from a resource class instance
	 */
	registerResourceClass(resource: BaseResource): void {
		const definition = resource.getDefinition();
		this.registerResource(definition);
	}

	/**
	 * Register a resource definition
	 */
	registerResource(resource: ResourceDefinition): void {
		if (this.resources.has(resource.name)) {
			logger.warn(
				`Resource '${resource.name}' is already registered. Overwriting.`,
			);
		}
		this.resources.set(resource.name, resource);
		logger.debug(`Registered resource: ${resource.name}`);
	}

	/**
	 * Get all registered resources
	 */
	getResources(): ResourceDefinition[] {
		return Array.from(this.resources.values());
	}

	/**
	 * Get a specific resource by name
	 */
	getResource(name: string): ResourceDefinition | undefined {
		return this.resources.get(name);
	}

	/**
	 * Check if a resource is registered
	 */
	hasResource(name: string): boolean {
		return this.resources.has(name);
	}

	/**
	 * Get list of resource names
	 */
	getResourceNames(): string[] {
		return Array.from(this.resources.keys());
	}

	/**
	 * Remove a resource
	 */
	removeResource(name: string): boolean {
		const removed = this.resources.delete(name);
		if (removed) {
			logger.debug(`Removed resource: ${name}`);
		}
		return removed;
	}

	/**
	 * Clear all resources
	 */
	clear(): void {
		this.resources.clear();
		logger.debug("Cleared all resources");
	}

	/**
	 * Get resource count
	 */
	getCount(): number {
		return this.resources.size;
	}
}
