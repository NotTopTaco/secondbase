import corsMiddleware from 'cors';
import { config } from '../config.js';

export const cors = corsMiddleware({
  origin: config.CORS_ORIGIN,
  credentials: true,
});
