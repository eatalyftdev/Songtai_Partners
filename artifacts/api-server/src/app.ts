import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import { pinoHttp } from "pino-http";
import router from "./routes";
import { requireAuth } from "./middleware/requireAuth";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req: Record<string, unknown>) {
        return {
          id: req.id,
          method: req.method,
          url: typeof req.url === "string" ? req.url.split("?")[0] : req.url,
        };
      },
      res(res: Record<string, unknown>) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Auth middleware ────────────────────────────────────────────────────────
//
// Public GET paths that partner sites need — no auth required:
//   /api/healthz
//   /api/products
//   /api/testimonials
//   /api/gallery
//   /api/faq
//   /api/about
//   /api/partners/:slug  (exact slug look-up for active partners)
//   /api/auth/login      (POST — public by design)
//   /api/auth/me         (GET — handled inside the route itself)
//
// Everything else — all mutations (POST/PATCH/DELETE on content) and
// admin-only reads (/api/partners list, /api/partners/stats) — requires
// a valid JWT issued by POST /api/auth/login.

const PUBLIC_GET_PREFIXES = [
  "/healthz",
  "/products",
  "/testimonials",
  "/gallery",
  "/faq",
  "/about",
  "/auth",           // /auth/login (POST) and /auth/me (GET) handle auth internally
  "/storage/objects", // serve stored files publicly
];

// Matches /partners/<slug> but NOT /partners, /partners/stats, or other admin sub-routes
const PARTNER_SLUG_RE = /^\/partners\/(?!stats$)[^/]+$/;

app.use(
  "/api",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Allow POST /auth/login without a Bearer token
    if (req.method === "POST" && req.path === "/auth/login") {
      next();
      return;
    }

    // Allow all GET / HEAD / OPTIONS that match public paths
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const path = req.path; // relative to /api
      const isPublic =
        PUBLIC_GET_PREFIXES.some((p) => path === p || path.startsWith(p + "/") || path === p) ||
        PARTNER_SLUG_RE.test(path);
      if (isPublic) {
        next();
        return;
      }
    }

    // Everything else goes through requireAuth
    await requireAuth(req, res, next);
  },
);

app.use("/api", router);

export default app;
