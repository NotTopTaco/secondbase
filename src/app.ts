import express from 'express';
import corsMiddleware from 'cors';
import { config } from './config.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { scheduleRouter } from './routes/schedule.js';
import { gameRouter } from './routes/game.js';
import { playersRouter } from './routes/players.js';
import { matchupRouter } from './routes/matchup.js';

export function createApp() {
  const app = express();

  app.use(corsMiddleware({ origin: config.CORS_ORIGIN }));
  app.use(express.json());
  app.use(requestLogger);

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/schedule', scheduleRouter);
  app.use('/api/game', gameRouter);
  app.use('/api/players', playersRouter);
  app.use('/api/matchup', matchupRouter);

  app.use(errorHandler);

  return app;
}
