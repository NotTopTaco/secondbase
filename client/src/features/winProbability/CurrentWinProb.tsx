import styles from './CurrentWinProb.module.css';

interface CurrentWinProbProps {
  homeWp: number;
  homeTeam?: string;
  awayTeam?: string;
}

export function CurrentWinProb({ homeWp, homeTeam, awayTeam }: CurrentWinProbProps) {
  const pct = Math.round(homeWp * 100);
  const teamLabel = homeTeam ?? 'Home';
  const oppLabel = awayTeam ?? 'Away';

  return (
    <div className={styles.container}>
      <span className={styles.value}>{pct}%</span>
      <span className={styles.label}>
        {teamLabel} win probability ({oppLabel} {100 - pct}%)
      </span>
    </div>
  );
}
