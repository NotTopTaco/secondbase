import { Router } from 'express';
import { getLiveFeed } from '../services/gameService.js';

export const gameRouter = Router();

gameRouter.get('/:gamePk/live', async (req, res) => {
  const gamePk = parseInt(req.params.gamePk, 10);
  if (isNaN(gamePk)) {
    res.status(400).json({ error: 'Invalid gamePk' });
    return;
  }
  const data = await getLiveFeed(gamePk);
  res.json(data);
});
