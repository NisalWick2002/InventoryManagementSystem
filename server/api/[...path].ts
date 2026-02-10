// server/api/[...path].ts
import '../dist/config/firebase.js';
import { connectDb } from '../dist/db/index.js';
import { createApp } from '../dist/app.js';

const app = createApp();

// Ensure DB connects once per warm function instance
let initPromise: Promise<void> | null = null;

async function ensureInit() {
  if (!initPromise) {
    initPromise = (async () => {
      await connectDb();
    })();
  }
  return initPromise;
}

export default async function handler(req: any, res: any) {
  try {
    await ensureInit();
    return app(req, res);
  } catch (err) {
    console.error('Vercel init failed:', err);
    res.status(500).json({ success: false, error: { code: 'INIT_FAILED', message: 'Server init failed' } });
  }
}
