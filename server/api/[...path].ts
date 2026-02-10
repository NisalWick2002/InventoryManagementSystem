import type { VercelRequest, VercelResponse } from "@vercel/node";

// NOTE: adjust import based on what server/src/app.ts exports:
import { createApp } from "../src/app";

// Create the Express app once (kept warm between invocations when possible)
const app = createApp();

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Express can handle Vercel req/res directly
  return app(req as any, res as any);
}