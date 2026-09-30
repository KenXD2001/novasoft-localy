import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { notFound } from './middlewares/notFound.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { responseDelay } from './middlewares/responseDelay.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan(env.isDev ? 'dev' : 'combined'));

  // Unprefixed probe for load balancers / Docker HEALTHCHECK.
  app.get('/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok' } });
  });

  app.use(env.API_PREFIX, responseDelay, routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
