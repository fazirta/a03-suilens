// WebSocket client management — extracted to avoid circular dependency
// between index.ts and consumer.ts

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const wsClients = new Set<any>();

export function broadcastToClients(data: unknown) {
  const message = JSON.stringify(data);
  for (const ws of wsClients) {
    try {
      ws.send(message);
    } catch {
      wsClients.delete(ws);
    }
  }
}
