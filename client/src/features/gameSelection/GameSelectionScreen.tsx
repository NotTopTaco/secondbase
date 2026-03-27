import { useEffect, useState } from 'react';
import { fetchSchedule, type ScheduleGame } from '../../api/gameApi';
import { Spinner } from '../../components/ui/Spinner';
import { GameCard } from './GameCard';
import styles from './GameSelectionScreen.module.css';

export function GameSelectionScreen() {
  const [games, setGames] = useState<ScheduleGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchSchedule()
      .then((data) => {
        if (cancelled) return;
        const allGames = data.dates?.flatMap((d) => d.games) ?? [];
        setGames(allGames);
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className={styles.screen}>
      <div className={styles.header}>
        <h1 className={styles.logo}>
          Second<span className={styles.logoAccent}>Base</span>
        </h1>
        <p className={styles.tagline}>Real-time MLB analytics companion</p>
        <p className={styles.dateLabel}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      </div>

      <hr className={`stitchLine ${styles.stitching}`} />

      {loading && <Spinner />}

      {error && <p className={styles.error}>Failed to load schedule: {error}</p>}

      {!loading && !error && games.length === 0 && (
        <p className={styles.empty}>No games scheduled today</p>
      )}

      {!loading && !error && games.length > 0 && (
        <div className={styles.grid}>
          {games.map((game) => (
            <GameCard key={game.gamePk} game={game} />
          ))}
        </div>
      )}
    </div>
  );
}
