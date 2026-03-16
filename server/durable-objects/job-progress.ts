import { DurableObject } from "cloudflare:workers";
import type { Env } from "../env";

/**
 * Step name mapping: workflow step names → frontend step IDs
 */
const STEP_MAP: Record<string, string> = {
  "fetch-render": "fetch",
  "parse-assets": "visual",
  "analyze-voice": "voice",
  "synthesize-vibe": "vibe",
  "score-package": "package",
};

/**
 * Durable Object for broadcasting real-time extraction progress to
 * connected WebSocket clients. Uses the Hibernation API so idle
 * connections don't consume CPU.
 */
export class JobProgressDO extends DurableObject<Env> {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // -----------------------------------------------------------------------
    // WebSocket upgrade at /ws
    // -----------------------------------------------------------------------
    if (url.pathname === "/ws") {
      const upgradeHeader = request.headers.get("Upgrade");
      if (upgradeHeader !== "websocket") {
        return new Response("Expected WebSocket upgrade", { status: 426 });
      }

      const pair = new WebSocketPair();
      const [client, server] = [pair[0], pair[1]];

      this.ctx.acceptWebSocket(server);

      // Send all accumulated progress so the client catches up immediately
      const history = await this.ctx.storage.get<string[]>("progressHistory") || [];
      for (const msg of history) {
        server.send(msg);
      }

      return new Response(null, { status: 101, webSocket: client });
    }

    // -----------------------------------------------------------------------
    // Progress update at POST /progress
    // -----------------------------------------------------------------------
    if (url.pathname === "/progress" && request.method === "POST") {
      const update = await request.json<{
        step: string;
        status: string;
        percent: number;
        message?: string;
        details?: Record<string, unknown>;
      }>();

      // Map workflow step name to frontend step ID
      const stepId = STEP_MAP[update.step] || update.step;

      const message = JSON.stringify({
        type: "progress",
        stepId,
        step: update.step,
        status: update.status,
        percent: update.percent,
        message: update.message,
        details: update.details,
        timestamp: Date.now(),
      });

      // Store in history so late-connecting clients get the full timeline
      const history = await this.ctx.storage.get<string[]>("progressHistory") || [];
      history.push(message);
      await this.ctx.storage.put("progressHistory", history);

      // If this is the final step completing, also send a "complete" message
      if (update.step === "score-package" && update.status === "complete") {
        const completeMsg = JSON.stringify({
          type: "complete",
          percent: 100,
          timestamp: Date.now(),
        });
        history.push(completeMsg);
        await this.ctx.storage.put("progressHistory", history);
        this.broadcast(message);
        this.broadcast(completeMsg);
      } else {
        this.broadcast(message);
      }

      return new Response("ok", { status: 200 });
    }

    return new Response("Not found", { status: 404 });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (message === "ping") {
      ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
    }
  }

  async webSocketClose(
    _ws: WebSocket,
    _code: number,
    _reason: string,
    _wasClean: boolean
  ): Promise<void> {
    // Cleaned up automatically by the runtime
  }

  async webSocketError(ws: WebSocket, _error: unknown): Promise<void> {
    try {
      ws.close(1011, "Unexpected error");
    } catch {
      // Already closed
    }
  }

  private broadcast(message: string): void {
    const sockets = this.ctx.getWebSockets();
    for (const ws of sockets) {
      try {
        ws.send(message);
      } catch {
        // Disconnected — runtime will clean up
      }
    }
  }
}
