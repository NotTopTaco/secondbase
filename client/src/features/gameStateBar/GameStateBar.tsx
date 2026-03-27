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
      {/* Zone A — Navigation */}
      <div className={styles.zoneNav}>
        <button
          className={styles.homeBtn}
          onClick={(e) => { e.stopPropagation(); navigate('/'); }}
          aria-label="Back to games"
        >
          <svg width="28" height="28" viewBox="0 0 20 20" fill="currentColor">
            <path d="M3 8 L10 2 L17 8 L17 17 L3 17 Z" transform="rotate(180 10 10)" />
          </svg>
        </button>
      </div>

      {/* Logo — centered */}
      <div className={styles.logo}>
        <span className={styles.logoText}>
          Second<span className={styles.logoAccent}>Base</span>
        </span>
        <StatusBadge status={statusLabel} />
      </div>

      {/* Zone B — Scoreboard */}
      <div className={styles.zoneScoreboard}>
        {inning != null && (
          <div className={styles.inningInfo}>
            <span className={styles.inningArrow}>
              <svg width="6" height="6" viewBox="0 0 6 6" fill="currentColor">
                {inningHalf === 'Top'
                  ? <polygon points="3,0 6,6 0,6" />
                  : <polygon points="3,6 6,0 0,0" />
                }
              </svg>
            </span>
            <span className={styles.inningNum}>{inning}</span>
          </div>
        )}
        <div className={styles.scoreTable}>
          <div className={styles.scoreHeaders}>
            <span />
            <span />
            <span className={styles.scoreHeader}>R</span>
            <span className={styles.scoreHeader}>H</span>
            <span className={styles.scoreHeader}>E</span>
          </div>
          <div className={styles.scoreRow}>
            <TeamLogo teamId={awayTeam?.id ?? 0} abbreviation={awayTeam?.abbreviation} size={20} />
            <span className={styles.teamAbbr} style={{ color: awayColors.primary }}>
              {awayTeam?.abbreviation ?? awayTeam?.name?.slice(0, 3).toUpperCase() ?? 'AWAY'}
            </span>
            <span className={styles.runs}>{awayTeam?.runs ?? 0}</span>
            <span className={styles.statCell}>{awayTeam?.hits ?? 0}</span>
            <span className={styles.statCell}>{awayTeam?.errors ?? 0}</span>
          </div>
          <div className={styles.scoreRow}>
            <TeamLogo teamId={homeTeam?.id ?? 0} abbreviation={homeTeam?.abbreviation} size={20} />
            <span className={styles.teamAbbr} style={{ color: homeColors.primary }}>
              {homeTeam?.abbreviation ?? homeTeam?.name?.slice(0, 3).toUpperCase() ?? 'HOME'}
            </span>
            <span className={styles.runs}>{homeTeam?.runs ?? 0}</span>
            <span className={styles.statCell}>{homeTeam?.hits ?? 0}</span>
            <span className={styles.statCell}>{homeTeam?.errors ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Zone C — Situation */}
      <div className={styles.zoneSituation}>
        <DiamondRunners runners={runners} outs={count.outs} />
        <div className={styles.countDots}>
          <div className={styles.dotRow}>
            {[0, 1, 2, 3].map((i) => (
              <span
                key={`b${i}`}
                className={`${styles.dot} ${i < count.balls ? styles.dotBallActive : ''}`}
              />
            ))}
          </div>
          <div className={styles.dotRow}>
            {[0, 1, 2].map((i) => (
              <span
                key={`s${i}`}
                className={`${styles.dot} ${i < count.strikes ? styles.dotStrikeActive : ''}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Zone D — Matchup */}
      <div className={styles.zoneMatchup}>
        {batter && <PlayerPhoto playerId={batter.id} size={32} />}
        <div className={styles.matchupCenter}>
          <span className={styles.playerName} title={batter?.name}>
            {batter?.name ?? '—'}
          </span>
          <span className={styles.vs}>vs</span>
          <span className={styles.playerName} title={pitcher?.name}>
            {pitcher?.name ?? '—'}
          </span>
        </div>
        {pitcher && <PlayerPhoto playerId={pitcher.id} size={32} />}
      </div>

      {/* Zone E — Delay Control */}
      <div className={styles.zoneDelay}>
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
