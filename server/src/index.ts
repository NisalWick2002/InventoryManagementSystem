import { env } from './config/env.js';
import './config/firebase.js';
import { connectDb } from './db/index.js';
import { createApp } from './app.js';

async function main() {
  console.log('✅ Firebase Admin initialized successfully');
  await connectDb();
  console.log('✅ MongoDB connected successfully');
  const app = createApp();
  app.listen(env.PORT, () => {
    const baseUrl = env.API_BASE_URL ?? `http://localhost:${env.PORT}`;
    console.log('═══════════════════════════════════════════════════');
    console.log(`🚀 InventoryManagementSystem Server listening on port ${env.PORT}`);
    console.log(`📡 API Base URL: ${baseUrl}/api`);
    console.log(`🌍 Environment: ${env.NODE_ENV}`);
    console.log('✅ MongoDB: Connected');
    console.log('═══════════════════════════════════════════════════');
  });
}

main().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
