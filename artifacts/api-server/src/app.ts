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
//   /api/storage/objects/* (serve uploaded images)
//
// Everything else — all mutations (POST/PATCH/DELETE) and admin-only reads
// (/api/partners list, /api/partners/stats) — requires a valid Supabase JWT.

const PUBLIC_GET_PREFIXES = [
  "/healthz",
  "/products",
  "/testimonials",
  "/gallery",
  "/faq",
  "/about",
  "/storage/objects/",
];

// Matches /partners/<slug> but NOT /partners or /partners/stats
const PARTNER_SLUG_RE = /^\/partners\/[^/]+$/;

app.use(
  "/api",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Allow all GET / HEAD / OPTIONS that match public paths
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const path = req.path; // relative to /api
      const isPublic =
        PUBLIC_GET_PREFIXES.some((p) => path === p || path.startsWith(p)) ||
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
