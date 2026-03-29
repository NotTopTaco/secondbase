import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDb } from './connection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Recreate a table if its PK doesn't include the expected column.
 * Copies existing data to a temp table, drops the original, then
 * lets schema.sql recreate it with the correct PK.
 */
function migrateGameStatsPK(): void {
  const db = getDb();

  for (const table of ['batter_game_stats', 'pitcher_game_stats']) {
    // Check if table exists
    const exists = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
    ).get(table);
    if (!exists) continue;

    // Check current PK columns via table_info (pk > 0 means part of PK)
    const pkCols = db.prepare(`PRAGMA table_info(${table})`)
      .all()
      .filter((c: any) => c.pk > 0)
      .map((c: any) => c.name as string);

    if (pkCols.includes('game_pk')) continue; // Already migrated

    console.log(`[db] migrating ${table}: changing PK to include game_pk`);
    db.exec(`DROP TABLE IF EXISTS ${table}`);
  }
}

export function runMigrations(): void {
  migrateGameStatsPK();

  const db = getDb();
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);
  console.log('[db] migrations complete');
}
