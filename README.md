# Extensible MCP Server for Component Libraries

[![npm version](https://img.shields.io/npm/v/heroui-mcp.svg)](https://www.npmjs.com/package/heroui-mcp)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A high-quality, open-source Model Context Protocol (MCP) server that provides AI agents with comprehensive context and tooling for virtually any component library. This server is designed with a plugin-based architecture, making it easy to extend and adapt to different documentation sources.

## ✨ Core Concepts

This server is built on two key concepts:

-   **Plugin Architecture**: The server can be extended to support different component libraries by creating plugins. Each plugin provides the necessary configuration to locate and cache the documentation for a specific library. The active plugin is determined by a simple configuration file, allowing you to switch between different libraries without changing the core code.
-   **Git-Based Caching**: To ensure fast and efficient access to documentation, the server clones the component library's repository into a local cache. This approach avoids the need for external APIs and allows the server to work offline after the initial cache is built.

## 🚀 Features

-   **Extensible Plugin System**: Easily add support for new component libraries.
-   **Component Discovery**: List and explore all available components for the active library.
-   **Documentation Access**: Retrieve comprehensive component documentation and usage examples.
-   **API Reference**: Access detailed component props, slots, and data attributes.
-   **Accessibility Information**: Get accessibility guidelines and best practices for each component.
-   **Usage Patterns**: Learn common implementation patterns and best practices.
-   **TypeScript Support**: Full TypeScript support with comprehensive type definitions.
-   **Caching System**: Efficient Git-based caching for fast documentation retrieval.
-   **RESTful API**: Clean HTTP endpoints for easy integration.

## 📋 Prerequisites

-   **Node.js** 18.0 or higher
-   **npm** (or your preferred package manager)
-   **Git** (for repository caching)

## 🛠️ Installation

### From Source

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/increff-arya-tupkary/componentlib-mcp.git
    cd componentlib-mcp
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Build the project**:
    ```bash
    npm run build
    ```

4.  **Start the server**:
    ```bash
    npm start
    ```

The server will start on `http://localhost:3000` by default.

## 🎯 Quick Start

### Basic Usage

Once the server is running, the best way to interact with it is through the [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector) tool, which provides a user-friendly interface for exploring and testing MCP servers.

1.  **Install the MCP Inspector**:
    ```bash
    npx @modelcontextprotocol/inspector
    ```

2.  **Connect to your server**:
    -   Open the MCP Inspector in your browser
    -   Add your server URL: `http://localhost:3000`
    -   Explore the available tools and resources interactively

### Available Tools

The server provides the following MCP tools, which will operate on the currently active component library:

| Tool                          | Description                                       |
| ----------------------------- | ------------------------------------------------- |
| `list_components`             | List all available components                     |
| `get_component_docs`          | Get comprehensive documentation for a component   |
| `get_component_api`           | Get API reference (props, methods, events)        |
| `get_component_slots`         | Get slot information for a component              |
| `get_component_data_attributes` | Get data attributes for a component               |
| `get_component_accessibility` | Get accessibility information and guidelines      |
| `get_component_usage`         | Get usage examples and patterns                   |

## 🔧 Configuration

The active component library is determined by a configuration file in the root of the project.

### `mcp.config.json`

This file specifies which plugin the server should use. The `activePlugin` property should correspond to the name of a plugin directory in `src/plugins`.

```json
{
  "activePlugin": "heroui"
}
```

To switch to a different component library, simply change the value of `activePlugin` and restart the server.

## 🔌 Creating a Plugin

Adding support for a new component library is easy. Here’s how to create a plugin for a hypothetical library called `AwesomeUI`.

### 1. Create the Plugin Directory

In the `src/plugins` directory, create a new folder for your plugin. The name of this folder will be used as the plugin's identifier.

```bash
mkdir src/plugins/awesome-ui
```

### 2. Create the Configuration File

Inside the new directory, create a configuration file named `[plugin-name].config.ts`. For this example, it would be `src/plugins/awesome-ui/awesome-ui.config.ts`.

### 3. Define the Configuration

In this file, you'll specify the details of the component library's documentation source. The configuration should export an object that matches the `Partial<CacheConfig>` interface.

Here’s an example for `AwesomeUI`:

```typescript
import { type CacheConfig } from "../../config/cache.config";

export const awesomeUiCacheConfig: Partial<CacheConfig> = {
  // The URL of the component library's git repository
  repoUrl: "https://github.com/awesome-ui/awesome-ui.git",

  // The branch to clone
  repoBranch: "main",

  // A unique name for the cache directory
  cacheDirName: "awesome-ui",

  // Paths within the repo to check out for documentation
  sparseCheckoutPaths: [
    "packages/docs/content/components",
    "packages/docs/content/guides"
  ],
};
```

### 4. Activate the Plugin

Update `mcp.config.json` to use your new plugin:

```json
{
  "activePlugin": "awesome-ui"
}
```

### 5. Restart the Server

Finally, rebuild and restart the server to apply the changes.

```bash
npm run build && npm start
```

The server will now provide context and tooling for the `AwesomeUI` component library.

## 🏗️ Development

### Development Setup

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Start development server**:
    ```bash
    npm run dev
    ```

3.  **For production deployment**:
    ```bash
    # Build the project
    npm run build
    
    # Start production server
    npm start
    ```

4.  **Run tests**:
    ```bash
    npm test
    ```

5.  **Format code**:
    ```bash
    npm run format
    ```

6.  **Check code quality**:
    ```bash
    npm run check
    ```

### Project Structure

```
.
├── mcp.config.json       # Server configuration for active plugin
└── src/
    ├── app.ts            # Main application setup
    ├── index.ts          # Entry point
    ├── cache/            # Git caching system
    ├── config/           # Configuration management
    ├── http/             # HTTP server and routes
    ├── plugins/          # Plugin directory
    │   └── heroui/       # Example plugin for HeroUI
    ├── resources/        # MCP resources
    ├── server/           # MCP server factory
    ├── tools/            # MCP tools implementation
    ├── transport/        # Session management
    ├── types/            # TypeScript type definitions
    └── utils/            # Utility functions
```

### Available Scripts

| Script             | Description                                                 |
| ------------------ | ----------------------------------------------------------- |
| `npm run dev`      | Start development server with `tsx` (fast TypeScript execution) |
| `npm run build`    | Build the project for production (TypeScript compilation)   |
| `npm run start`    | Start the production server (requires build first)          |
| `npm run test`     | Run tests in watch mode                                     |
| `npm run test:run` | Run tests once                                              |
| `npm run test:coverage` | Run tests with coverage report                              |
| `npm run check`    | Run all quality checks (lint, type-check, test)             |
| `npm run format`   | Format code with Biome                                      |
| `npm run lint`     | Lint code with Biome                                        |

## 🧪 Testing

The project uses [Vitest](https://vitest.dev/) for testing:

```bash
# Run all tests
npm test

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage
```

## 🙏 Acknowledgments

-   [HeroUI](https://heroui.com/) - The component library that inspired this project.
-   [Model Context Protocol](https://modelcontextprotocol.io/) - The protocol specification.

## 🔗 Links

-   [Model Context Protocol](https://modelcontextprotocol.io/)
-   [Project Issues](https://github.com/increff-arya-tupkary/componentlib-mcp/issues)
-   [Project Discussions](https://github.com/increff-arya-tupkary/componentlib-mcp/discussions)

---

<div align="center">
  <p>Made with ❤️ for the open-source community</p>
  <p>
    <a href="https://modelcontextprotocol.io/">MCP</a> •
    <a href="https://github.com/increff-arya-tupkary/componentlib-mcp">GitHub</a>
  </p>
</div>
