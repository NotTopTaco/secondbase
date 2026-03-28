import { Router } from 'express';
import { z } from 'zod';
import { getNextPitchPredictions } from '../services/nextPitchService.js';
import { getWinProbability } from '../services/winProbabilityService.js';
import { getVelocityData } from '../services/velocityService.js';
import { getUmpireData } from '../services/umpireService.js';
import { getBullpenStatus } from '../services/bullpenService.js';
import { getDefensivePositioning } from '../services/defensivePositioningService.js';
import { validate, zIntId } from '../middleware/validate.js';

export const gameAnalyticsRouter = Router();

const gamePkParams = z.object({ gamePk: zIntId });

const nextPitchQuery = z.object({
  pitcherId: z.coerce.number().int().positive({ message: 'pitcherId required' }),
  batterHand: z.enum(['L', 'R']).default('R'),
  balls: z.coerce.number().int().min(0).max(3).default(0),
  strikes: z.coerce.number().int().min(0).max(2).default(0),
  lastPitchType: z.string().optional(),
});

const defensiveQuery = z.object({
  batterId: z.coerce.number().int().positive({ message: 'batterId required' }),
});

gameAnalyticsRouter.get(
  '/:gamePk/next-pitch',
  validate({ params: gamePkParams, query: nextPitchQuery }),
  (req, res) => {
    const { pitcherId, batterHand, balls, strikes, lastPitchType } =
      req.validatedQuery as z.infer<typeof nextPitchQuery>;
    const result = getNextPitchPredictions(pitcherId, batterHand, balls, strikes, Number(req.params.gamePk), lastPitchType);
    res.json(result);
  },
);

gameAnalyticsRouter.get(
  '/:gamePk/win-probability',
  validate({ params: gamePkParams }),
  async (req, res) => {
    try {
      const result = await getWinProbability(Number(req.params.gamePk));
      res.json(result);
    } catch {
      res.status(500).json({ error: 'Failed to compute win probability' });
    }
  },
);

gameAnalyticsRouter.get(
  '/:gamePk/velocity',
  validate({ params: gamePkParams }),
  async (req, res) => {
    try {
      const result = await getVelocityData(Number(req.params.gamePk));
      res.json(result);
    } catch {
      res.status(500).json({ error: 'Failed to get velocity data' });
    }
  },
);

gameAnalyticsRouter.get(
  '/:gamePk/umpire',
  validate({ params: gamePkParams }),
  async (req, res) => {
    try {
      const result = await getUmpireData(Number(req.params.gamePk));
      res.json(result);
    } catch {
      res.status(500).json({ error: 'Failed to get umpire data' });
    }
  },
);

gameAnalyticsRouter.get(
  '/:gamePk/bullpen',
  validate({ params: gamePkParams }),
  async (req, res) => {
    try {
      const result = await getBullpenStatus(Number(req.params.gamePk));
      res.json(result);
    } catch {
      res.status(500).json({ error: 'Failed to get bullpen status' });
    }
  },
);

gameAnalyticsRouter.get(
  '/:gamePk/defensive-positioning',
  validate({ params: gamePkParams, query: defensiveQuery }),
  async (req, res) => {
    const { batterId } = req.validatedQuery as z.infer<typeof defensiveQuery>;
    try {
      const result = await getDefensivePositioning(Number(req.params.gamePk), batterId);
      res.json(result);
    } catch {
      res.status(500).json({ error: 'Failed to get defensive positioning' });
    }
  },
);
