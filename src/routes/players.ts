import { Router } from 'express';
import {
  getPlayerWithFallback,
  getHotZones,
  getPitcherTendencies,
  getBatterVsPitchType,
  getSprayChart,
  searchPlayers,
} from '../services/playerService.js';
import { getTTOSplits } from '../services/ttoService.js';
import { getPitchMovement } from '../services/pitchMovementService.js';
import { getCountStats } from '../services/countStatsService.js';
import { getStreak } from '../services/streakService.js';
import { getPitchTunneling } from '../services/tunnelingService.js';

export const playersRouter = Router();

playersRouter.get('/search', (req, res) => {
  const q = (req.query.q as string || '').trim();
  if (q.length < 2) {
    res.json({ results: [] });
    return;
  }
  res.json({ results: searchPlayers(q) });
});

playersRouter.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: 'Invalid player ID' }); return; }

  const player = await getPlayerWithFallback(id);
  if (!player) { res.status(404).json({ error: 'Player not found' }); return; }
  res.json(player);
});

playersRouter.get('/:id/hot-zones', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: 'Invalid player ID' }); return; }

  const season = req.query.season ? parseInt(req.query.season as string, 10) : undefined;
  const period = req.query.period as string | undefined;
  res.json(getHotZones(id, season, period));
});

playersRouter.get('/:id/pitch-tendencies', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: 'Invalid player ID' }); return; }

  const season = req.query.season ? parseInt(req.query.season as string, 10) : undefined;
  const batterHand = req.query.batterHand as string | undefined;
  res.json(getPitcherTendencies(id, season, batterHand));
});

playersRouter.get('/:id/vs-pitch-type', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: 'Invalid player ID' }); return; }

  const season = req.query.season ? parseInt(req.query.season as string, 10) : undefined;
  const hand = req.query.hand as string | undefined;
  res.json(getBatterVsPitchType(id, season, hand));
});

playersRouter.get('/:id/spray-chart', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: 'Invalid player ID' }); return; }

  const season = req.query.season ? parseInt(req.query.season as string, 10) : undefined;
  const pitchType = req.query.pitchType as string | undefined;
  const hand = req.query.hand as string | undefined;
  res.json(getSprayChart(id, season, pitchType, hand));
});

playersRouter.get('/:id/tto-splits', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: 'Invalid player ID' }); return; }

  const season = req.query.season ? parseInt(req.query.season as string, 10) : undefined;
  res.json(getTTOSplits(id, season));
});

playersRouter.get('/:id/pitch-movement', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: 'Invalid player ID' }); return; }

  const season = req.query.season ? parseInt(req.query.season as string, 10) : undefined;
  res.json(getPitchMovement(id, season));
});

playersRouter.get('/:id/count-stats', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: 'Invalid player ID' }); return; }

  const season = req.query.season ? parseInt(req.query.season as string, 10) : undefined;
  res.json(getCountStats(id, season));
});

playersRouter.get('/:id/streak', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: 'Invalid player ID' }); return; }

  const pitcherId = req.query.pitcherId ? parseInt(req.query.pitcherId as string, 10) : undefined;
  const season = req.query.season ? parseInt(req.query.season as string, 10) : undefined;
  res.json(getStreak(id, pitcherId, season));
});

playersRouter.get('/:id/pitch-tunneling', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: 'Invalid player ID' }); return; }

  const season = req.query.season ? parseInt(req.query.season as string, 10) : undefined;
  res.json(getPitchTunneling(id, season));
});
