/**
 * Vercel serverless entry point.
 *
 * Vercel wraps this in its own HTTP listener — we only export the Express app,
 * we do NOT call app.listen() here. The main src/index.ts still starts the
 * server normally for Replit / Railway / Render / local dev.
 */
import app from "../src/app";

export default app;
