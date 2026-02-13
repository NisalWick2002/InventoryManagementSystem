import express from 'express';
import cors, { type CorsOptions } from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';

import healthRoutes from './modules/health/health.routes.js';
import meRoutes from './modules/me/me.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import productsRoutes from './modules/products/products.routes.js';
import suppliersRoutes from './modules/suppliers/suppliers.routes.js';
import wholesalersRoutes from './modules/wholesalers/wholesalers.routes.js';
import grnRoutes from './modules/grn/grn.routes.js';
import bomRoutes from './modules/bom/bom.routes.js';
import batchesRoutes from './modules/batches/batches.routes.js';
import ordersRoutes from './modules/orders/orders.routes.js';
import dispatchRoutes from './modules/dispatch/dispatch.routes.js';
import reportsRoutes from './modules/reports/reports.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();
  const allowlist = new Set(
    env.CORS_ORIGINS.split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  );

  const corsOptions: CorsOptions = {
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowlist.has(origin)) return callback(null, true);
      if (env.ALLOW_VERCEL_PREVIEWS && origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    optionsSuccessStatus: 204,
  };

  // Keep CORS first so all responses (including errors) can include CORS headers.
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));

  app.use(express.json());

  if (env.RATE_LIMIT_ENABLED) {
    app.use(
      '/api',
      rateLimit({
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        limit: env.RATE_LIMIT_MAX,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        message: {
          success: false,
          error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later.' },
        },
      })
    );
  }

  app.use('/api', healthRoutes);
  app.use('/api', meRoutes);
  app.use('/api', usersRoutes);
  app.use('/api', productsRoutes);
  app.use('/api', suppliersRoutes);
  app.use('/api', wholesalersRoutes);
  app.use('/api', grnRoutes);
  app.use('/api', bomRoutes);
  app.use('/api', batchesRoutes);
  app.use('/api', ordersRoutes);
  app.use('/api', dispatchRoutes);
  app.use('/api', reportsRoutes);
  app.use('/api', auditRoutes);

  app.use(errorHandler);
  return app;
}
