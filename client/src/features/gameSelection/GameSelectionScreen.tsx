import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchSchedule, type ScheduleGame } from '../../api/gameApi';
import { useAuthStore } from '../../stores/authStore';
import { useSchedulePolling } from '../../hooks/useSchedulePolling';
import { Spinner } from '../../components/ui/Spinner';
import { AlertBadge } from '../../components/ui/AlertBadge';
import { GameCard } from './GameCard';
import { YourPlayersToday } from './YourPlayersToday';
import styles from './GameSelectionScreen.module.css';

export function GameSelectionScreen() {
  const navigate = useNavigate();
  const [games, setGames] = useState<ScheduleGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const favoriteTeamIds = useAuthStore((s) => s.favoriteTeamIds);
  const favoritePlayerIds = useAuthStore((s) => s.favoritePlayerIds);
  const user = useAuthStore((s) => s.user);

  useSchedulePolling(null);

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

  const sortedGames = useMemo(() => {
    if (favoriteTeamIds.size === 0) return games;
    return [...games].sort((a, b) => {
      const aFav = favoriteTeamIds.has(a.teams.away.team.id) || favoriteTeamIds.has(a.teams.home.team.id);
      const bFav = favoriteTeamIds.has(b.teams.away.team.id) || favoriteTeamIds.has(b.teams.home.team.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return 0;
    });
  }, [games, favoriteTeamIds]);

  const hasLiveGames = games.some((g) => g.status.abstractGameState === 'Live');

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
        <div className={styles.profileWrapper}>
          <button
            className={styles.profileBtn}
            onClick={() => navigate('/profile')}
            type="button"
            title="Profile"
          >
            {user?.username.charAt(0).toUpperCase()}
          </button>
          <AlertBadge />
        </div>
      </div>

      <hr className={`stitchLine ${styles.stitching}`} />

      {loading && <Spinner />}

      {error && <p className={styles.error}>Failed to load schedule: {error}</p>}

      {!loading && !error && (
        <>
          {favoritePlayerIds.size > 0 && <YourPlayersToday hasLiveGames={hasLiveGames} />}

          {games.length === 0 ? (
            <p className={styles.empty}>No games scheduled today</p>
          ) : (
            <div className={styles.grid}>
              {sortedGames.map((game) => (
                <GameCard key={game.gamePk} game={game} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
