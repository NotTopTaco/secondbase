import { Router } from 'express';
import {
  addFavoriteTeam,
  removeFavoriteTeam,
  addFavoritePlayer,
  removeFavoritePlayer,
  getFavoriteTeams,
  getFavoritePlayers,
} from '../services/favoritesService.js';
import { getPlayersToday } from '../services/playersTodayService.js';

export const favoritesRouter = Router();

favoritesRouter.put('/teams/:teamId', (req, res) => {
  const teamId = Number(req.params.teamId);
  if (!Number.isInteger(teamId)) {
    res.status(400).json({ error: 'Invalid team ID' });
    return;
  }
  addFavoriteTeam(req.userId!, teamId);
  res.json({ ok: true });
});

favoritesRouter.delete('/teams/:teamId', (req, res) => {
  const teamId = Number(req.params.teamId);
  if (!Number.isInteger(teamId)) {
    res.status(400).json({ error: 'Invalid team ID' });
    return;
  }
  removeFavoriteTeam(req.userId!, teamId);
  res.json({ ok: true });
});

favoritesRouter.put('/players/:playerId', (req, res) => {
  const playerId = Number(req.params.playerId);
  if (!Number.isInteger(playerId)) {
    res.status(400).json({ error: 'Invalid player ID' });
    return;
  }
  addFavoritePlayer(req.userId!, playerId);
  res.json({ ok: true });
});

favoritesRouter.delete('/players/:playerId', (req, res) => {
  const playerId = Number(req.params.playerId);
  if (!Number.isInteger(playerId)) {
    res.status(400).json({ error: 'Invalid player ID' });
    return;
  }
  removeFavoritePlayer(req.userId!, playerId);
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
