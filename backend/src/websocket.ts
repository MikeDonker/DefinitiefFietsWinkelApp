import type { ServerWebSocket } from "bun";

// =============================================================================
// WebSocket Event Types
// =============================================================================

export type WebSocketEventType =
  | "bike:created"
  | "bike:updated"
  | "bike:checkout"
  | "workorder:created"
  | "workorder:updated";

export interface WebSocketEvent<T = unknown> {
  type: WebSocketEventType;
  data: T;
  timestamp: string;
}

// =============================================================================
// Connected Clients Management
// =============================================================================

const connectedClients = new Set<ServerWebSocket<unknown>>();
const MAX_CONNECTIONS = 500;
const connectionsPerIP = new Map<string, number>();
const MAX_CONNECTIONS_PER_IP = 10;

export function addClient(ws: ServerWebSocket<unknown>): boolean {
  if (connectedClients.size >= MAX_CONNECTIONS) {
    console.log(`[WebSocket] Connection rejected: max connections (${MAX_CONNECTIONS}) reached`);
    return false;
  }
  connectedClients.add(ws);
  console.log(`[WebSocket] Client connected. Total clients: ${connectedClients.size}`);
  return true;
}

export function removeClient(ws: ServerWebSocket<unknown>): void {
  connectedClients.delete(ws);
  console.log(`[WebSocket] Client disconnected. Total clients: ${connectedClients.size}`);
}

// Cleanup stale IP tracking every 10 minutes
setInterval(() => {
  connectionsPerIP.clear();
}, 10 * 60 * 1000);

export function getClientCount(): number {
  return connectedClients.size;
}

// =============================================================================
// Broadcast Function
// =============================================================================

/**
 * Broadcasts an event to all connected WebSocket clients.
 * Resilient to connection drops - failed sends are silently ignored.
 */
export function broadcast<T = unknown>(event: WebSocketEventType, data: T): void {
  const message: WebSocketEvent<T> = {
    type: event,
    data,
    timestamp: new Date().toISOString(),
  };

  const payload = JSON.stringify(message);

  console.log(`[WebSocket] Broadcasting ${event} to ${connectedClients.size} clients`);

  for (const client of connectedClients) {
    try {
      client.send(payload);
    } catch (error) {
      // Client may have disconnected, remove it from the set
      console.log(`[WebSocket] Failed to send to client, removing from set`);
      connectedClients.delete(client);
    }
  }
}

// =============================================================================
// Heartbeat - ping all clients every 30 seconds
// =============================================================================

setInterval(() => {
  const pingMessage = JSON.stringify({
    type: "ping",
    data: {},
    timestamp: new Date().toISOString(),
  });

  for (const client of connectedClients) {
    try {
      client.send(pingMessage);
    } catch {
      connectedClients.delete(client);
    }
  }
}, 30000);

// =============================================================================
// WebSocket Handler Configuration
// =============================================================================

export const websocketHandler = {
  open(ws: ServerWebSocket<unknown>) {
    const accepted = addClient(ws);
    if (!accepted) {
      ws.send(JSON.stringify({
        type: "error",
        data: { message: "Too many connections" },
        timestamp: new Date().toISOString(),
      }));
      ws.close(1013, "Too many connections");
      return;
    }
    ws.send(JSON.stringify({
      type: "connected",
      data: { message: "Connected to WebSocket server" },
      timestamp: new Date().toISOString(),
    }));
  },

  message(ws: ServerWebSocket<unknown>, message: string | Buffer) {
    // Handle incoming messages if needed (e.g., ping/pong, subscriptions)
    try {
      const data = JSON.parse(message.toString());

      // Handle ping messages
      if (data.type === "ping") {
        ws.send(JSON.stringify({
          type: "pong",
          data: {},
          timestamp: new Date().toISOString(),
        }));
      }
    } catch {
      // Invalid JSON, ignore
    }
  },

  close(ws: ServerWebSocket<unknown>) {
    removeClient(ws);
  },

  drain(ws: ServerWebSocket<unknown>) {
    // Called when a socket is ready to receive more data after being backpressured
    console.log(`[WebSocket] Socket drained`);
  },
};
