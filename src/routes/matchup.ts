import { Router } from 'express';
import { z } from 'zod';
import { getMatchupHistory } from '../services/matchupService.js';
import { validate, zIntId } from '../middleware/validate.js';

export const matchupRouter = Router();

matchupRouter.get(
  '/:batterId/:pitcherId',
  validate({ params: z.object({ batterId: zIntId, pitcherId: zIntId }) }),
  (req, res) => {
    res.json(getMatchupHistory(Number(req.params.batterId), Number(req.params.pitcherId)));
  },
);
