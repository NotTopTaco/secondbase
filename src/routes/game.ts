import { Router } from 'express';
import { z } from 'zod';
import { getLiveFeed } from '../services/gameService.js';
import { validate, zIntId } from '../middleware/validate.js';

export const gameRouter = Router();

gameRouter.get(
  '/:gamePk/live',
  validate({ params: z.object({ gamePk: zIntId }) }),
  async (req, res) => {
    const data = await getLiveFeed(Number(req.params.gamePk));
    res.json(data);
  },
);
