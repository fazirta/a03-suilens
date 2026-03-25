import { swagger } from "@elysiajs/swagger";
import { desc } from "drizzle-orm";
import { Elysia } from "elysia";
import { startConsumer } from "./consumer";
import { db } from "./db";
import { notifications } from "./db/schema";
import { wsClients } from "./ws";

const app = new Elysia()
  .use(swagger({
    documentation: {
      info: { title: "Notification Service API", version: "1.0.0" },
    },
  }))
  .get("/api/notifications", async () => {
    return db.select().from(notifications).orderBy(desc(notifications.sentAt));
  })
  .ws("/ws", {
    open(ws) {
      wsClients.add(ws);
      console.log(`WebSocket client connected (total: ${wsClients.size})`);
    },
    message(_ws, _message) {
      // No-op: server only pushes, does not receive
    },
    close(ws) {
      wsClients.delete(ws);
      console.log(`WebSocket client disconnected (total: ${wsClients.size})`);
    },
  })
  .get("/health", () => ({ status: "ok", service: "notification-service" }))
  .listen(3003);

startConsumer().catch(console.error);

console.log(`Notification Service running on port ${app.server?.port}`);
