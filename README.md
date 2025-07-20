# HeroUI MCP Server

[![npm version](https://img.shields.io/npm/v/heroui-mcp.svg)](https://www.npmjs.com/package/heroui-mcp)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A high-quality, open-source Model Context Protocol (MCP) server that provides AI agents with comprehensive context and tooling for the [HeroUI](https://heroui.com/) component library. This server bridges AI systems and HeroUI, enabling intelligent assistance for developers working with HeroUI components.

## 🚀 Features

- **Component Discovery**: List and explore all available HeroUI components
- **Documentation Access**: Retrieve comprehensive component documentation and usage examples
- **API Reference**: Access detailed component props, slots, and data attributes
- **Accessibility Information**: Get accessibility guidelines and best practices for each component
- **Usage Patterns**: Learn common implementation patterns and best practices
- **TypeScript Support**: Full TypeScript support with comprehensive type definitions
- **Caching System**: Efficient Git-based caching for fast documentation retrieval
- **RESTful API**: Clean HTTP endpoints for easy integration

## 📋 Prerequisites

- **Node.js** 18.0 or higher
- **pnpm** (recommended) or npm
- **Git** (for repository caching)
- **Bun** (optional, recommended for faster development) or **tsx** for TypeScript execution

## 🛠️ Installation

### From Source

1. **Clone the repository**:
   ```bash
   git clone https://github.com/T-Hash06/heroui-mcp.git
   cd heroui-mcp
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Build the project**:
   ```bash
   pnpm build
   ```

4. **Start the server**:
   ```bash
   pnpm start
   ```

The server will start on `http://localhost:3000` by default.

## 🎯 Quick Start

### Basic Usage

Once the server is running, the best way to interact with it is through the [MCP Inspector](https://modelcontextprotocol.io/docs/tools/inspector) tool, which provides a user-friendly interface for exploring and testing MCP servers.

1. **Install the MCP Inspector**:
   ```bash
   npx @modelcontextprotocol/inspector
   ```

2. **Connect to your server**:
   - Open the MCP Inspector in your browser
   - Add your server URL: `http://localhost:3000`
   - Explore the available tools and resources interactively

### Available Tools

The server provides the following MCP tools:

| Tool | Description |
|------|-------------|
| `list_components` | List all available HeroUI components |
| `get_component_docs` | Get comprehensive documentation for a component |
| `get_component_api` | Get API reference (props, methods, events) |
| `get_component_slots` | Get slot information for a component |
| `get_component_data_attributes` | Get data attributes for a component |
| `get_component_accessibility` | Get accessibility information and guidelines |
| `get_component_usage` | Get usage examples and patterns |

### Example: Exploring Components

Using the MCP Inspector, you can:

1. **Browse available tools** - See all component-related tools in a visual interface
2. **Test tools interactively** - Run tools like `list_components` or `get_component_docs` with real-time results
3. **Explore component data** - Get detailed information about any HeroUI component
4. **View formatted output** - See documentation and API information in a readable format

The MCP Inspector provides the best experience for exploring the server's capabilities without needing to write code or use command-line tools.

## 🏗️ Development

### Development Setup

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Start development server** (choose one option):

   **Option A: Using Bun (recommended for faster startup)**
   ```bash
   # Install Bun if you don't have it
   curl -fsSL https://bun.sh/install | bash
   
   # Start development server
   pnpm dev
   ```

   **Option B: Using tsx (if you prefer Node.js)**
   ```bash
   # Install tsx globally or use npx
   npm install -g tsx
   
   # Run directly with tsx
   npx tsx src/index.ts
   ```

3. **For production deployment**:
   ```bash
   # Build the project
   pnpm build
   
   # Start production server
   pnpm start
   ```

4. **Run tests**:
   ```bash
   pnpm test
   ```

5. **Format code**:
   ```bash
   pnpm format
   ```

6. **Check code quality**:
   ```bash
   pnpm check
   ```

### Project Structure

```
src/
├── app.ts                # Main application setup
├── index.ts              # Entry point
├── cache/                # Git caching system
├── config/               # Configuration management
├── http/                 # HTTP server and routes
├── resources/            # MCP resources
├── server/               # MCP server factory
├── tools/                # MCP tools implementation
│   └── components/       # HeroUI component tools
├── transport/            # Session management
├── types/                # TypeScript type definitions
└── utils/                # Utility functions
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server with Bun (fast TypeScript execution) |
| `pnpm build` | Build the project for production (TypeScript compilation) |
| `pnpm start` | Start the production server (requires build first) |
| `pnpm test` | Run tests in watch mode |
| `pnpm test:run` | Run tests once |
| `pnpm test:coverage` | Run tests with coverage report |
| `pnpm check` | Run all quality checks (lint, type-check, test) |
| `pnpm format` | Format code with Biome |
| `pnpm lint` | Lint code with Biome |

### Development vs Production

- **Development**: Use `pnpm dev` (Bun) or `npx tsx src/index.ts` for fast TypeScript execution
- **Production**: Use `pnpm build` then `pnpm start` for optimized compiled JavaScript

## 🔧 Configuration

The server can be configured through environment variables or configuration files:

### Environment Variables

```bash
# Server configuration
PORT=3000
HOST=localhost

# Cache configuration
CACHE_DIR=./cache
REPO_URL=https://github.com/heroui-inc/heroui.git
BRANCH=main
```

### Configuration Files

- `src/config/server.config.ts` - Server configuration
- `src/config/cache.config.ts` - Cache configuration

## 🧪 Testing

The project uses [Vitest](https://vitest.dev/) for testing:

```bash
# Run all tests
pnpm test

# Run tests once
pnpm test:run

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test src/tools/components/list-components.test.ts
```

## 🤝 Contributing

### Quick Contribution Guide

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Run quality checks**: `pnpm check`
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Development Standards

- Follow [Conventional Commits](https://www.conventionalcommits.org/)
- Maintain TypeScript strict mode compliance
- Write tests for new functionality
- Ensure all quality checks pass (`pnpm check`)
- Document new features and APIs

## 🐞 Troubleshooting

### Common Issues

**Server won't start**
- Check if the port is already in use
- Verify Node.js version (18.0+ required)
- Ensure all dependencies are installed

**Cache initialization fails**
- Check internet connection for Git repository access
- Verify Git is installed and accessible
- Check repository URL and branch configuration

**Tool execution errors**
- Ensure the HeroUI repository cache is initialized
- Check component name spelling and case sensitivity
- Verify the requested component exists in the documentation

### Debug Mode

Enable debug logging:

```bash
NODE_ENV=development pnpm dev
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [HeroUI](https://heroui.com/) - The amazing component library this server supports
- [Model Context Protocol](https://modelcontextprotocol.io/) - The protocol specification

## 🔗 Links

- [HeroUI Documentation](https://heroui.com/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Project Issues](https://github.com/T-Hash06/heroui-mcp/issues)
- [Project Discussions](https://github.com/T-Hash06/heroui-mcp/discussions)

---

<div align="center">
  <p>Made with ❤️ for the HeroUI community</p>
  <p>
    <a href="https://heroui.com/">HeroUI</a> •
    <a href="https://modelcontextprotocol.io/">MCP</a> •
    <a href="https://github.com/T-Hash06/heroui-mcp">GitHub</a>
  </p>
</div>
