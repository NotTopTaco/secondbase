import { config } from './config.js';
import { runMigrations } from './db/migrate.js';
import { createApp } from './app.js';
import { cleanExpiredSessions } from './services/authService.js';

runMigrations();
cleanExpiredSessions();

const SESSION_CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
setInterval(cleanExpiredSessions, SESSION_CLEANUP_INTERVAL);

const app = createApp();

app.listen(config.PORT, () => {
  console.log(`[server] SecondBase API running on http://localhost:${config.PORT}`);
});
