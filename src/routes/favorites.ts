import { Router } from 'express';
import { z } from 'zod';
import {
  addFavoriteTeam,
  removeFavoriteTeam,
  addFavoritePlayer,
  removeFavoritePlayer,
  getFavoriteTeams,
  getFavoritePlayers,
} from '../services/favoritesService.js';
import { getPlayersToday } from '../services/playersTodayService.js';
import { validate, zIntId } from '../middleware/validate.js';

export const favoritesRouter = Router();

const teamParams = z.object({ teamId: zIntId });
const playerParams = z.object({ playerId: zIntId });

favoritesRouter.put('/teams/:teamId', validate({ params: teamParams }), (req, res) => {
  addFavoriteTeam(req.userId!, Number(req.params.teamId));
  res.json({ ok: true });
});

favoritesRouter.delete('/teams/:teamId', validate({ params: teamParams }), (req, res) => {
  removeFavoriteTeam(req.userId!, Number(req.params.teamId));
  res.json({ ok: true });
});

favoritesRouter.put('/players/:playerId', validate({ params: playerParams }), (req, res) => {
  addFavoritePlayer(req.userId!, Number(req.params.playerId));
  res.json({ ok: true });
});

favoritesRouter.delete('/players/:playerId', validate({ params: playerParams }), (req, res) => {
  removeFavoritePlayer(req.userId!, Number(req.params.playerId));
  res.json({ ok: true });
});

favoritesRouter.get('/teams', (req, res) => {
  const teamIds = getFavoriteTeams(req.userId!);
  res.json({ teamIds });
});

favoritesRouter.get('/players', (req, res) => {
  const playerIds = getFavoritePlayers(req.userId!);
  res.json({ playerIds });
});

favoritesRouter.get('/players-today', async (req, res) => {
  const players = await getPlayersToday(req.userId!);
  res.json({ players });
});
