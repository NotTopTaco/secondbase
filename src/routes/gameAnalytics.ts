import { Router } from 'express';
import { getNextPitchPredictions } from '../services/nextPitchService.js';
import { getWinProbability } from '../services/winProbabilityService.js';
import { getVelocityData } from '../services/velocityService.js';
import { getUmpireData } from '../services/umpireService.js';
import { getBullpenStatus } from '../services/bullpenService.js';
import { getDefensivePositioning } from '../services/defensivePositioningService.js';

export const gameAnalyticsRouter = Router();

gameAnalyticsRouter.get('/:gamePk/next-pitch', (req, res) => {
  const gamePk = parseInt(req.params.gamePk, 10);
  if (isNaN(gamePk)) { res.status(400).json({ error: 'Invalid gamePk' }); return; }

  const pitcherId = parseInt(req.query.pitcherId as string, 10);
  const batterHand = (req.query.batterHand as string) || 'R';
  const balls = parseInt(req.query.balls as string, 10) || 0;
  const strikes = parseInt(req.query.strikes as string, 10) || 0;
  const lastPitchType = req.query.lastPitchType as string | undefined;

  if (isNaN(pitcherId)) { res.status(400).json({ error: 'pitcherId required' }); return; }

  const result = getNextPitchPredictions(pitcherId, batterHand, balls, strikes, gamePk, lastPitchType);
  res.json(result);
});

gameAnalyticsRouter.get('/:gamePk/win-probability', async (req, res) => {
  const gamePk = parseInt(req.params.gamePk, 10);
  if (isNaN(gamePk)) { res.status(400).json({ error: 'Invalid gamePk' }); return; }

  try {
    const result = await getWinProbability(gamePk);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Failed to compute win probability' });
  }
});

gameAnalyticsRouter.get('/:gamePk/velocity', async (req, res) => {
  const gamePk = parseInt(req.params.gamePk, 10);
  if (isNaN(gamePk)) { res.status(400).json({ error: 'Invalid gamePk' }); return; }

  try {
    const result = await getVelocityData(gamePk);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Failed to get velocity data' });
  }
});

gameAnalyticsRouter.get('/:gamePk/umpire', async (req, res) => {
  const gamePk = parseInt(req.params.gamePk, 10);
  if (isNaN(gamePk)) { res.status(400).json({ error: 'Invalid gamePk' }); return; }

  try {
    const result = await getUmpireData(gamePk);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Failed to get umpire data' });
  }
});

gameAnalyticsRouter.get('/:gamePk/bullpen', async (req, res) => {
  const gamePk = parseInt(req.params.gamePk, 10);
  if (isNaN(gamePk)) { res.status(400).json({ error: 'Invalid gamePk' }); return; }

  try {
    const result = await getBullpenStatus(gamePk);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Failed to get bullpen status' });
  }
});

gameAnalyticsRouter.get('/:gamePk/defensive-positioning', async (req, res) => {
  const gamePk = parseInt(req.params.gamePk, 10);
  if (isNaN(gamePk)) { res.status(400).json({ error: 'Invalid gamePk' }); return; }

  const batterId = parseInt(req.query.batterId as string, 10);
  if (isNaN(batterId)) { res.status(400).json({ error: 'batterId required' }); return; }

  try {
    const result = await getDefensivePositioning(gamePk, batterId);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Failed to get defensive positioning' });
  }
});
