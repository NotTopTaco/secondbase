import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../stores/gameStore';
import { usePollingStore } from '../../stores/pollingStore';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PlayerPhoto } from '../../components/ui/PlayerPhoto';
import { TeamLogo } from '../../components/ui/TeamLogo';
import { DiamondRunners } from '../../components/ui/DiamondRunners';
import { getTeamColors } from '../../theme/teamColors';
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

  const navigate = useNavigate();
  const delayOffsetS = usePollingStore((s) => s.delayOffsetS);
  const setDelayOffset = usePollingStore((s) => s.setDelayOffset);

  const statusLabel = getStatusLabel(status);
  const awayColors = getTeamColors(awayTeam?.id);
  const homeColors = getTeamColors(homeTeam?.id);

  return (
    <div
      className={styles.bar}
      style={{
        '--away-color': awayColors.primary,
        '--home-color': homeColors.primary,
      } as React.CSSProperties}
    >
      {/* Home plate icon */}
      <button
        className={styles.homeBtn}
        onClick={(e) => { e.stopPropagation(); navigate('/'); }}
        aria-label="Back to games"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M3 8 L10 2 L17 8 L17 17 L3 17 Z" transform="rotate(180 10 10)" />
        </svg>
      </button>

      {/* Left: Scores */}
      <div className={styles.section}>
        <div className={styles.scoreBlock}>
          <div className={styles.scoreRow}>
            <TeamLogo teamId={awayTeam?.id ?? 0} abbreviation={awayTeam?.abbreviation} size={20} />
            <span className={styles.teamAbbr} style={{ color: awayColors.primary }}>
              {awayTeam?.abbreviation ?? awayTeam?.name?.slice(0, 3).toUpperCase() ?? 'AWAY'}
            </span>
            <span className={styles.runs}>{awayTeam?.runs ?? 0}</span>
          </div>
          <div className={styles.scoreRow}>
            <TeamLogo teamId={homeTeam?.id ?? 0} abbreviation={homeTeam?.abbreviation} size={20} />
            <span className={styles.teamAbbr} style={{ color: homeColors.primary }}>
              {homeTeam?.abbreviation ?? homeTeam?.name?.slice(0, 3).toUpperCase() ?? 'HOME'}
            </span>
            <span className={styles.runs}>{homeTeam?.runs ?? 0}</span>
          </div>
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
