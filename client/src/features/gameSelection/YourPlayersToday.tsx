import { useNavigate } from 'react-router-dom';
import { usePlayersToday } from '../../hooks/usePlayersToday';
import { PlayerPhoto } from '../../components/ui/PlayerPhoto';
import { StatusBadge } from '../../components/ui/StatusBadge';
import type { PlayerTodayEntry } from '../../api/authApi';
import styles from './YourPlayersToday.module.css';

function shortenName(fullName: string): string {
  const parts = fullName.split(' ');
  if (parts.length < 2) return fullName;
  return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
}

function formatStats(entry: PlayerTodayEntry): string {
  if (entry.batting) {
    const { hits, atBats, homeRuns, rbi } = entry.batting;
    let s = `${hits}-${atBats}`;
    if (homeRuns > 0) s += `, ${homeRuns} HR`;
    if (rbi > 0) s += `, ${rbi} RBI`;
    return s;
  }
  if (entry.pitching) {
    const { inningsPitched, strikeOuts, earnedRuns } = entry.pitching;
    return `${inningsPitched} IP, ${strikeOuts} K, ${earnedRuns} ER`;
  }
  if (entry.gameTime) {
    return new Date(entry.gameTime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  }
  return '';
}

interface Props {
  hasLiveGames: boolean;
}

export function YourPlayersToday({ hasLiveGames }: Props) {
  const navigate = useNavigate();
  const { players, loading } = usePlayersToday(hasLiveGames);

  if (loading || players.length === 0) return null;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Your Players Today</h2>
      </div>
      <div className={styles.list}>
        {players.map((entry) => (
          <div
            key={`${entry.playerId}-${entry.gamePk}`}
            className={styles.row}
            onClick={() => navigate(`/game/${entry.gamePk}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') navigate(`/game/${entry.gamePk}`);
            }}
          >
            <PlayerPhoto playerId={entry.playerId} size={28} />
            <span className={styles.name}>{shortenName(entry.fullName)}</span>
            <span className={styles.team}>
              {entry.teamAbbreviation}
            </span>
            <span className={styles.opponent}>
              {entry.isHome ? 'vs' : '@'} {entry.opponentAbbreviation}
            </span>
            <span className={styles.stats}>{formatStats(entry)}</span>
            <StatusBadge status={entry.gameState === 'Live' ? 'Live' : entry.gameState === 'Final' ? 'Final' : 'Preview'} />
          </div>
        ))}
      </div>
    </div>
  );
}
