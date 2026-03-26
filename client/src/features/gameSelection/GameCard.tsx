import { useNavigate } from 'react-router-dom';
import type { ScheduleGame } from '../../api/gameApi';
import { StatusBadge } from '../../components/ui/StatusBadge';
import styles from './GameCard.module.css';

interface GameCardProps {
  game: ScheduleGame;
}

const BRAVES_ID = 144;

function getStatusLabel(status: string): 'Live' | 'Preview' | 'Final' | 'Delayed' {
  switch (status) {
    case 'Live':
      return 'Live';
    case 'Final':
      return 'Final';
    default:
      return 'Preview';
  }
}

export function GameCard({ game }: GameCardProps) {
  const navigate = useNavigate();
  const away = game.teams.away;
  const home = game.teams.home;
  const isBraves = away.team.id === BRAVES_ID || home.team.id === BRAVES_ID;
  const isLive = game.status.abstractGameState === 'Live';
  const isFinal = game.status.abstractGameState === 'Final';
  const showScores = isLive || isFinal;
  const statusLabel = getStatusLabel(game.status.abstractGameState);

  const gameTime = new Date(game.gameDate).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div
      className={`${styles.card} ${isBraves ? styles.braves : ''}`}
      onClick={() => navigate(`/game/${game.gamePk}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') navigate(`/game/${game.gamePk}`);
      }}
    >
      <div className={styles.topRow}>
        <div className={styles.teams}>
          <div className={styles.teamRow}>
            <span className={styles.teamName}>{away.team.name}</span>
            {showScores && <span className={styles.score}>{away.score ?? 0}</span>}
            {away.leagueRecord && (
              <span className={styles.record}>
                ({away.leagueRecord.wins}-{away.leagueRecord.losses})
              </span>
            )}
          </div>
          <div className={styles.teamRow}>
            <span className={styles.at}>@</span>
            <span className={styles.teamName}>{home.team.name}</span>
            {showScores && <span className={styles.score}>{home.score ?? 0}</span>}
            {home.leagueRecord && (
              <span className={styles.record}>
                ({home.leagueRecord.wins}-{home.leagueRecord.losses})
              </span>
            )}
          </div>
        </div>
        <StatusBadge status={statusLabel} />
      </div>
      <div className={styles.meta}>
        {game.venue && <span className={styles.venue}>{game.venue.name}</span>}
        {!showScores && <span className={styles.time}>{gameTime}</span>}
      </div>
    </div>
  );
}
