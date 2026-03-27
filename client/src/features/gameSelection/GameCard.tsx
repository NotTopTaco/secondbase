import { useNavigate } from 'react-router-dom';
import type { ScheduleGame } from '../../api/gameApi';
import { PlayerPhoto } from '../../components/ui/PlayerPhoto';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { TeamLogo } from '../../components/ui/TeamLogo';
import { getTeamColors } from '../../theme/teamColors';
import styles from './GameCard.module.css';

interface GameCardProps {
  game: ScheduleGame;
}

const BRAVES_ID = 144;

function shortenName(fullName: string): string {
  const parts = fullName.split(' ');
  if (parts.length < 2) return fullName;
  return `${parts[0][0]}. ${parts.slice(1).join(' ')}`;
}

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

  const awayColors = getTeamColors(away.team.id);
  const homeColors = getTeamColors(home.team.id);

  const gameTime = new Date(game.gameDate).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div
      className={`${styles.card} ${isBraves ? styles.braves : ''} ${isLive ? styles.live : ''}`}
      onClick={() => navigate(`/game/${game.gamePk}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') navigate(`/game/${game.gamePk}`);
      }}
      style={{
        '--away-color': awayColors.primary,
        '--home-color': homeColors.primary,
      } as React.CSSProperties}
    >
      <div className={styles.topRow}>
        <div className={styles.teams}>
          <div className={styles.teamRow}>
            <TeamLogo teamId={away.team.id} abbreviation={away.team.abbreviation} size={24} />
            <span className={styles.teamName}>{away.team.name}</span>
            {showScores && <span className={styles.score}>{away.score ?? 0}</span>}
            {away.leagueRecord && (
              <span className={styles.record}>
                ({away.leagueRecord.wins}-{away.leagueRecord.losses})
              </span>
            )}
          </div>
          <div className={styles.teamRow}>
            <TeamLogo teamId={home.team.id} abbreviation={home.team.abbreviation} size={24} />
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
      {!showScores && away.probablePitcher && home.probablePitcher && (
        <div className={styles.matchup}>
          <PlayerPhoto playerId={away.probablePitcher.id} size={24} />
          <span>{shortenName(away.probablePitcher.fullName)}</span>
          <span className={styles.vs}>vs</span>
          <span>{shortenName(home.probablePitcher.fullName)}</span>
          <PlayerPhoto playerId={home.probablePitcher.id} size={24} />
        </div>
      )}
      {isLive && game.linescore?.offense?.batter && game.linescore?.defense?.pitcher && (
        <div className={styles.atBat}>
          <span className={styles.inning}>
            {game.linescore.inningHalf === 'Top' ? 'Top' : 'Bot'} {game.linescore.currentInningOrdinal}
          </span>
          {' — '}
          {shortenName(game.linescore.offense.batter.fullName)} vs{' '}
          {shortenName(game.linescore.defense.pitcher.fullName)}
        </div>
      )}
      <div className={styles.meta}>
        {game.venue && <span className={styles.venue}>{game.venue.name}</span>}
        {!showScores && <span className={styles.time}>{gameTime}</span>}
      </div>
    </div>
  );
}
