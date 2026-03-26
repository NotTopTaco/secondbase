import { Router } from 'express';
import { getSchedule } from '../services/scheduleService.js';

export const scheduleRouter = Router();

scheduleRouter.get('/', async (req, res) => {
  const date = req.query.date as string | undefined;
  const data = await getSchedule(date);
  res.json(data);
});
