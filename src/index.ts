import { config } from './config.js';
import { runMigrations } from './db/migrate.js';
import { createApp } from './app.js';

runMigrations();

const app = createApp();

app.listen(config.PORT, () => {
  console.log(`[server] SecondBase API running on http://localhost:${config.PORT}`);
});
