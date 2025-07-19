import express from "express";

import { randomUUID } from "node:crypto";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";

const app = express();
app.use(express.json());

// Map to store transports by session ID
const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

// Function to create and configure MCP server
const createMcpServer = () => {
  const server = new McpServer({
    name: "demo-server",
    version: "1.0.0"
  });

  // Add an addition tool
  server.registerTool("add",
    {
      title: "Addition Tool",
      description: "Add two numbers",
    },
    async ({ a, b }) => ({
      content: [{ type: "text", text: String(Number.parseInt(a) + Number.parseInt(b)) }]
    })
  );

  // Add a dynamic greeting resource
  server.registerResource(
    "greeting",
    new ResourceTemplate("greeting://{name}", { list: undefined }),
    { 
      title: "Greeting Resource",      // Display name for UI
      description: "Dynamic greeting generator"
    },
    async (uri, { name }) => ({
      contents: [{
        uri: uri.href,
        text: `Hello, ${name}!`
      }]
    })
  );

  return server;
};

// Handle POST requests for client-to-server communication
app.post('/mcp', async (req: express.Request, res: express.Response) => {
  // Check for existing session ID
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  let transport: StreamableHTTPServerTransport;

  if (sessionId && transports[sessionId]) {
    // Reuse existing transport
    transport = transports[sessionId];
  } else if (!sessionId && isInitializeRequest(req.body)) {
    // New initialization request
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sessionId) => {
        // Store the transport by session ID
        transports[sessionId] = transport;
      },
      // DNS rebinding protection is disabled by default for backwards compatibility. If you are running this server
      // locally, make sure to set:
      // enableDnsRebindingProtection: true,
      // allowedHosts: ['127.0.0.1'],
    });

    // Clean up transport when closed
    transport.onclose = () => {
      if (transport.sessionId) {
        delete transports[transport.sessionId];
      }
    };

    const server = createMcpServer();

    // Connect to the MCP server
    await server.connect(transport);
  } else {
    // Invalid request
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Bad Request: No valid session ID provided',
      },
      id: null,
    });
    return;
  }

  // Handle the request
  await transport.handleRequest(req, res, req.body);
});

// Reusable handler for GET and DELETE requests
const handleSessionRequest = async (req: express.Request, res: express.Response) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }
  
  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
};

// Handle GET requests for server-to-client notifications via SSE
app.get('/mcp', handleSessionRequest);

// Handle DELETE requests for session termination
app.delete('/mcp', handleSessionRequest);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`MCP Server running on port ${PORT}`);11
});