import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSidebarStore } from '../../stores/sidebarStore';
import { useAuthStore } from '../../stores/authStore';
import { TeamLogo } from '../../components/ui/TeamLogo';
import styles from './Sidebar.module.css';
import type { ScheduleGame } from '../../api/gameApi';

interface SidebarProps {
  activeGamePk: number | null;
}

function GameRow({ game, isPinned, onTogglePin }: { game: ScheduleGame; isPinned: boolean; onTogglePin: () => void }) {
  const navigate = useNavigate();
  const away = game.teams.away;
  const home = game.teams.home;
  const isLive = game.status.abstractGameState === 'Live';
  const isFinal = game.status.abstractGameState === 'Final';

  let statusText = '';
  if (isLive && game.linescore) {
    const half = game.linescore.inningHalf === 'Top' ? 'T' : 'B';
    statusText = `${half}${game.linescore.currentInning}`;
  } else if (isFinal) {
    statusText = 'F';
  } else {
    statusText = new Date(game.gameDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  return (
    <div
      className={`${styles.gameRow} ${isLive ? styles.liveRow : ''}`}
      onClick={() => navigate(`/game/${game.gamePk}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/game/${game.gamePk}`); }}
    >
      <div className={styles.teams}>
        <div className={styles.teamLine}>
          <TeamLogo teamId={away.team.id} abbreviation={away.team.abbreviation} size={14} />
          <span className={styles.abbr}>{away.team.abbreviation || away.team.name.slice(0, 3)}</span>
          {(isLive || isFinal) && <span className={styles.score}>{away.score ?? 0}</span>}
        </div>
        <div className={styles.teamLine}>
          <TeamLogo teamId={home.team.id} abbreviation={home.team.abbreviation} size={14} />
          <span className={styles.abbr}>{home.team.abbreviation || home.team.name.slice(0, 3)}</span>
          {(isLive || isFinal) && <span className={styles.score}>{home.score ?? 0}</span>}
        </div>
      </div>
      <div className={styles.statusCol}>
        <span className={`${styles.statusText} ${isLive ? styles.liveText : ''}`}>{statusText}</span>
        <button
          className={`${styles.pinBtn} ${isPinned ? styles.pinned : ''}`}
          onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
          type="button"
          aria-label={isPinned ? 'Unpin game' : 'Pin game'}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill={isPinned ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function Sidebar({ activeGamePk }: SidebarProps) {
  const games = useSidebarStore((s) => s.games);
  const isCollapsed = useSidebarStore((s) => s.isCollapsed);
  const toggleCollapsed = useSidebarStore((s) => s.toggleCollapsed);
  const pinnedGamePks = useSidebarStore((s) => s.pinnedGamePks);
  const togglePin = useSidebarStore((s) => s.togglePin);
  const favoriteTeamIds = useAuthStore((s) => s.favoriteTeamIds);

  const { favoriteGames, pinnedGames, otherLive } = useMemo(() => {
    const filtered = games.filter((g) => g.gamePk !== activeGamePk);
    const favs: ScheduleGame[] = [];
    const pins: ScheduleGame[] = [];
    const other: ScheduleGame[] = [];

    for (const game of filtered) {
      const isFavTeam = favoriteTeamIds.has(game.teams.away.team.id) || favoriteTeamIds.has(game.teams.home.team.id);
      if (isFavTeam) {
        favs.push(game);
      } else if (pinnedGamePks.has(game.gamePk)) {
        pins.push(game);
      } else if (game.status.abstractGameState === 'Live') {
        other.push(game);
      }
    }

    const sortByStatus = (a: ScheduleGame, b: ScheduleGame) => {
      const order: Record<string, number> = { Live: 0, Final: 1, Preview: 2 };
      return (order[a.status.abstractGameState] ?? 2) - (order[b.status.abstractGameState] ?? 2);
    };

    favs.sort(sortByStatus);
    pins.sort(sortByStatus);

    return { favoriteGames: favs, pinnedGames: pins, otherLive: other };
  }, [games, activeGamePk, favoriteTeamIds, pinnedGamePks]);

  const totalGames = favoriteGames.length + pinnedGames.length + otherLive.length;

  if (isCollapsed) {
    return (
      <div className={styles.collapsed}>
        <button className={styles.expandBtn} onClick={toggleCollapsed} type="button" title="Expand sidebar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          {totalGames > 0 && <span className={styles.collapsedCount}>{totalGames}</span>}
        </button>
      </div>
    );
  }

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>Other Games</span>
        <span className={styles.headerCount}>{totalGames}</span>
        <button className={styles.collapseBtn} onClick={toggleCollapsed} type="button" title="Collapse sidebar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      <div className={styles.content}>
        {favoriteGames.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Your Teams</div>
            {favoriteGames.map((g) => (
              <GameRow key={g.gamePk} game={g} isPinned={false} onTogglePin={() => {}} />
            ))}
          </div>
        )}

        {pinnedGames.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Pinned</div>
            {pinnedGames.map((g) => (
              <GameRow key={g.gamePk} game={g} isPinned onTogglePin={() => togglePin(g.gamePk)} />
            ))}
          </div>
        )}

        {otherLive.length > 0 && (
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Other Live</div>
            {otherLive.map((g) => (
              <GameRow key={g.gamePk} game={g} isPinned={false} onTogglePin={() => togglePin(g.gamePk)} />
            ))}
          </div>
        )}

        {totalGames === 0 && (
          <p className={styles.empty}>No other games right now</p>
        )}
      </div>
    </div>
  );
}
