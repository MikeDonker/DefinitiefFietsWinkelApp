import "@vibecodeapp/proxy"; // DO NOT REMOVE OTHERWISE VIBECODE PROXY WILL NOT WORK
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import "./env";
import { auth } from "./auth";
import { sampleRouter } from "./routes/sample";
import { bikesRouter } from "./routes/bikes";
import { workOrdersRouter } from "./routes/work-orders";
import { dashboardRouter } from "./routes/dashboard";
import { exportRouter } from "./routes/export";
import { aiRouter } from "./routes/ai";
import { websocketHandler } from "./websocket";

const app = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

// CORS middleware - string wildcard allowlist (matches Better Auth trustedOrigins pattern)
// Additional origins via CORS_ORIGINS env var (comma-separated)
const STATIC_ORIGINS = [
  "http://localhost:*",
  "http://127.0.0.1:*",
  "https://*.dev.vibecode.run",
  "https://*.vibecode.run",
  "https://*.vibecodeapp.com",
  "https://*.vibecode.dev",
  "https://vibecode.dev",
];

const extraOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean)
  : [];

const allowedOrigins = [...STATIC_ORIGINS, ...extraOrigins];

/** Match origin against wildcard pattern: "https://*.example.com" or "http://localhost:*" */
function matchOrigin(origin: string, pattern: string): boolean {
  const escaped = pattern
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, "[a-zA-Z0-9._:-]*");
  return new RegExp(`^${escaped}$`).test(origin);
}

app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return null;
      return allowedOrigins.some((p) => matchOrigin(origin, p)) ? origin : null;
    },
    credentials: true,
  })
);

// Logging
app.use("*", logger());

// Health check endpoint
app.get("/health", (c) => c.json({ status: "ok" }));

// Rate limiter for auth endpoints (max 10 requests per 15 minutes per IP)
const authRateLimiter = new Map<string, { count: number; resetAt: number }>();
const AUTH_RATE_LIMIT = 10;
const AUTH_RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMITER_MAX_SIZE = 10_000;

// Auto-cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of authRateLimiter) {
    if (entry.resetAt < now) authRateLimiter.delete(ip);
  }
}, 5 * 60 * 1000);

app.use("/api/auth/*", async (c, next) => {
  const ip = c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();

  const entry = authRateLimiter.get(ip);

  if (!entry || entry.resetAt < now) {
    // Evict oldest if map is full
    if (authRateLimiter.size >= RATE_LIMITER_MAX_SIZE) {
      const firstKey = authRateLimiter.keys().next().value;
      if (firstKey) authRateLimiter.delete(firstKey);
    }
    authRateLimiter.set(ip, { count: 1, resetAt: now + AUTH_RATE_WINDOW_MS });
    return next();
  }

  if (entry.count >= AUTH_RATE_LIMIT) {
    return c.json(
      { error: { message: "Too many requests. Please try again later.", code: "RATE_LIMITED" } },
      429
    );
  }

  entry.count++;
  return next();
});

// Better Auth handler - must be before the session middleware
app.all("/api/auth/*", (c) => auth.handler(c.req.raw));
app.all("/api/auth", (c) => auth.handler(c.req.raw));

// Optional auth middleware: populate user/session for non-auth /api routes
app.use("/api/*", async (c, next) => {
  try {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });
    if (session) {
      c.set("user", session.user);
      c.set("session", session.session);
    } else {
      c.set("user", null);
      c.set("session", null);
    }
  } catch {
    c.set("user", null);
    c.set("session", null);
  }
  await next();
});

// Routes
app.route("/api/sample", sampleRouter);
app.route("/api/bikes", bikesRouter);
app.route("/api/work-orders", workOrdersRouter);
app.route("/api/dashboard", dashboardRouter);
app.route("/api/export", exportRouter);
app.route("/api/ai", aiRouter);

const port = Number(process.env.PORT) || 3000;

export default {
  port,
  fetch(req: Request, server: unknown) {
    // Handle WebSocket upgrade requests on /ws path
    const url = new URL(req.url);
    if (url.pathname === "/ws") {
      const success = (server as { upgrade: (req: Request) => boolean }).upgrade(req);
      if (success) {
        // Return undefined to signal upgrade success
        return undefined;
      }
      return new Response("WebSocket upgrade failed", { status: 400 });
    }

    // Handle regular HTTP requests through Hono
    return app.fetch(req, server);
  },
  websocket: websocketHandler,
};
