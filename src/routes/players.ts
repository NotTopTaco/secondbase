import { Router } from 'express';
import { z } from 'zod';
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
import { getMatchupHistory } from '../services/matchupService.js';
import { validate, zIntId, zOptionalInt, zOptionalString } from '../middleware/validate.js';

export const playersRouter = Router();

const idParams = z.object({ id: zIntId });

const searchQuery = z.object({
  q: z.string().min(2),
});

const seasonQuery = z.object({
  season: zOptionalInt,
});

const hotZonesQuery = z.object({
  season: zOptionalInt,
  period: zOptionalString,
});

const tendenciesQuery = z.object({
  season: zOptionalInt,
  batterHand: zOptionalString,
});

const vsPitchQuery = z.object({
  season: zOptionalInt,
  hand: zOptionalString,
});

const sprayChartQuery = z.object({
  season: zOptionalInt,
  pitchType: zOptionalString,
  hand: zOptionalString,
});

const streakQuery = z.object({
  pitcherId: zOptionalInt,
  season: zOptionalInt,
});

const batterBundleQuery = z.object({
  pitcherId: z.coerce.number().int().positive({ message: 'pitcherId required' }),
  season: zOptionalInt,
});

const pitcherBundleQuery = z.object({
  season: zOptionalInt,
  batterHand: zOptionalString,
});

playersRouter.get('/search', validate({ query: searchQuery }), (req, res) => {
  const { q } = req.validatedQuery as z.infer<typeof searchQuery>;
  res.json({ results: searchPlayers(q.trim()) });
});

playersRouter.get('/:id', validate({ params: idParams }), async (req, res) => {
  const id = Number(req.params.id);
  const player = await getPlayerWithFallback(id);
  if (!player) { res.status(404).json({ error: 'Player not found' }); return; }
  res.json(player);
});

playersRouter.get('/:id/hot-zones', validate({ params: idParams, query: hotZonesQuery }), (req, res) => {
  const id = Number(req.params.id);
  const { season, period } = req.validatedQuery as z.infer<typeof hotZonesQuery>;
  res.json(getHotZones(id, season, period));
});

playersRouter.get('/:id/pitch-tendencies', validate({ params: idParams, query: tendenciesQuery }), (req, res) => {
  const id = Number(req.params.id);
  const { season, batterHand } = req.validatedQuery as z.infer<typeof tendenciesQuery>;
  res.json(getPitcherTendencies(id, season, batterHand));
});

playersRouter.get('/:id/vs-pitch-type', validate({ params: idParams, query: vsPitchQuery }), (req, res) => {
  const id = Number(req.params.id);
  const { season, hand } = req.validatedQuery as z.infer<typeof vsPitchQuery>;
  res.json(getBatterVsPitchType(id, season, hand));
});

playersRouter.get('/:id/spray-chart', validate({ params: idParams, query: sprayChartQuery }), (req, res) => {
  const id = Number(req.params.id);
  const { season, pitchType, hand } = req.validatedQuery as z.infer<typeof sprayChartQuery>;
  res.json(getSprayChart(id, season, pitchType, hand));
});

playersRouter.get('/:id/tto-splits', validate({ params: idParams, query: seasonQuery }), (req, res) => {
  const id = Number(req.params.id);
  const { season } = req.validatedQuery as z.infer<typeof seasonQuery>;
  res.json(getTTOSplits(id, season));
});

playersRouter.get('/:id/pitch-movement', validate({ params: idParams, query: seasonQuery }), (req, res) => {
  const id = Number(req.params.id);
  const { season } = req.validatedQuery as z.infer<typeof seasonQuery>;
  res.json(getPitchMovement(id, season));
});

playersRouter.get('/:id/count-stats', validate({ params: idParams, query: seasonQuery }), (req, res) => {
  const id = Number(req.params.id);
  const { season } = req.validatedQuery as z.infer<typeof seasonQuery>;
  res.json(getCountStats(id, season));
});

playersRouter.get('/:id/streak', validate({ params: idParams, query: streakQuery }), (req, res) => {
  const id = Number(req.params.id);
  const { pitcherId, season } = req.validatedQuery as z.infer<typeof streakQuery>;
  res.json(getStreak(id, pitcherId, season));
});

playersRouter.get('/:id/pitch-tunneling', validate({ params: idParams, query: seasonQuery }), (req, res) => {
  const id = Number(req.params.id);
  const { season } = req.validatedQuery as z.infer<typeof seasonQuery>;
  res.json(getPitchTunneling(id, season));
});

playersRouter.get('/:id/batter-bundle', validate({ params: idParams, query: batterBundleQuery }), (req, res) => {
  const id = Number(req.params.id);
  const { pitcherId, season } = req.validatedQuery as z.infer<typeof batterBundleQuery>;

  res.json({
    hotZones: getHotZones(id, season),
    batterVsPitch: getBatterVsPitchType(id, season),
    sprayChart: getSprayChart(id, season),
    matchup: getMatchupHistory(id, pitcherId),
    countStats: getCountStats(id, season),
    streak: getStreak(id, pitcherId, season),
  });
});

playersRouter.get('/:id/pitcher-bundle', validate({ params: idParams, query: pitcherBundleQuery }), (req, res) => {
  const id = Number(req.params.id);
  const { season, batterHand } = req.validatedQuery as z.infer<typeof pitcherBundleQuery>;

  res.json({
    tendencies: getPitcherTendencies(id, season, batterHand),
    ttoSplits: getTTOSplits(id, season),
    pitchMovement: getPitchMovement(id, season),
    pitchTunneling: getPitchTunneling(id, season),
  });
});
