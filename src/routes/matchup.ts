import { Router } from 'express';
import { getMatchupHistory } from '../services/matchupService.js';

export const matchupRouter = Router();

matchupRouter.get('/:batterId/:pitcherId', (req, res) => {
  const batterId = parseInt(req.params.batterId, 10);
  const pitcherId = parseInt(req.params.pitcherId, 10);

  if (isNaN(batterId) || isNaN(pitcherId)) {
    res.status(400).json({ error: 'Invalid player IDs' });
    return;
  }

  res.json(getMatchupHistory(batterId, pitcherId));
});
