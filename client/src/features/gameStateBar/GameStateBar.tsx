import { useGameStore } from '../../stores/gameStore';
import { usePollingStore } from '../../stores/pollingStore';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PlayerPhoto } from '../../components/ui/PlayerPhoto';
import { DiamondRunners } from '../../components/ui/DiamondRunners';
import styles from './GameStateBar.module.css';

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

export function GameStateBar() {
  const {
    status,
    inning,
    inningHalf,
    awayTeam,
    homeTeam,
    batter,
    pitcher,
    count,
    runners,
  } = useGameStore();

  const delayOffsetS = usePollingStore((s) => s.delayOffsetS);
  const setDelayOffset = usePollingStore((s) => s.setDelayOffset);

  const statusLabel = getStatusLabel(status);

  return (
    <div className={styles.bar}>
      {/* Left: Scores */}
      <div className={styles.section}>
        <div className={styles.scoreBlock}>
          <span className={styles.teamAbbr}>
            {awayTeam?.abbreviation ?? awayTeam?.name?.slice(0, 3).toUpperCase() ?? 'AWAY'}
          </span>
          <span className={styles.runs}>{awayTeam?.runs ?? 0}</span>
          <span className={styles.divider}>-</span>
          <span className={styles.runs}>{homeTeam?.runs ?? 0}</span>
          <span className={styles.teamAbbr}>
            {homeTeam?.abbreviation ?? homeTeam?.name?.slice(0, 3).toUpperCase() ?? 'HOME'}
          </span>
        </div>
        <StatusBadge status={statusLabel} />
      </div>

      {/* Center: Inning, count, outs, diamond */}
      <div className={styles.section}>
        {inning != null && (
          <div className={styles.inningInfo}>
            <span className={styles.inningLabel}>
              {inningHalf === 'Top' ? 'TOP' : 'BOT'}
            </span>
            <span className={styles.inningNum}>{inning}</span>
          </div>
        )}
        <div className={styles.count}>
          <span>
            <span className={styles.countLabel}>B</span> {count.balls}
          </span>
          <span>
            <span className={styles.countLabel}>S</span> {count.strikes}
          </span>
        </div>
        <DiamondRunners runners={runners} outs={count.outs} />
      </div>

      {/* Right: Matchup + delay */}
      <div className={styles.section}>
        <div className={styles.matchup}>
          {batter && (
            <>
              <PlayerPhoto playerId={batter.id} size={28} />
              <span className={styles.playerName}>{batter.name}</span>
            </>
          )}
          <span className={styles.vs}>vs</span>
          {pitcher && (
            <>
              <span className={styles.playerName}>{pitcher.name}</span>
              <PlayerPhoto playerId={pitcher.id} size={28} />
            </>
          )}
        </div>
        <div className={styles.delayControl}>
          <button
            className={styles.delayBtn}
            onClick={() => setDelayOffset(Math.max(0, delayOffsetS - 5))}
            aria-label="Decrease delay"
          >
            -
          </button>
          <span className={styles.delayValue}>{delayOffsetS}s</span>
          <button
            className={styles.delayBtn}
            onClick={() => setDelayOffset(delayOffsetS + 5)}
            aria-label="Increase delay"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
