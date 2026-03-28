import express from 'express';
import compression from 'compression';
import corsMiddleware from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requireAuth } from './middleware/requireAuth.js';
import { authRouter } from './routes/auth.js';
import { favoritesRouter } from './routes/favorites.js';
import { scheduleRouter } from './routes/schedule.js';
import { gameRouter } from './routes/game.js';
import { playersRouter } from './routes/players.js';
import { matchupRouter } from './routes/matchup.js';
import { gameAnalyticsRouter } from './routes/gameAnalytics.js';

export function createApp() {
  const app = express();

  app.use(compression());
  app.use(corsMiddleware({ origin: config.CORS_ORIGIN, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(requestLogger);

  // Public routes
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  app.use('/api/auth', authRouter);

  // Auth wall — everything below requires a valid session
  app.use(requireAuth);

  // Protected routes
  app.use('/api/favorites', favoritesRouter);
  app.use('/api/schedule', scheduleRouter);
  app.use('/api/game', gameRouter);
  app.use('/api/players', playersRouter);
  app.use('/api/matchup', matchupRouter);
  app.use('/api/game-analytics', gameAnalyticsRouter);

  app.use(errorHandler);

  return app;
}
