import { Router } from 'express';
import { z } from 'zod';
import { getSchedule } from '../services/scheduleService.js';
import { validate } from '../middleware/validate.js';

export const scheduleRouter = Router();

const scheduleQuery = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD').optional(),
});

scheduleRouter.get(
  '/',
  validate({ query: scheduleQuery }),
  async (req, res) => {
    const { date } = req.validatedQuery as z.infer<typeof scheduleQuery>;
    const data = await getSchedule(date);
    res.json(data);
  },
);
