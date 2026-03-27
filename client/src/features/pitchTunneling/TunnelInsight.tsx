import type { TunnelPair } from '../../api/playerApi';
import { PITCH_LABELS } from '../../theme/colors';
import styles from './tunneling.module.css';

interface TunnelInsightProps {
  pair: TunnelPair;
}

export function TunnelInsight({ pair }: TunnelInsightProps) {
  const nameA = PITCH_LABELS[pair.pitchTypeA] ?? pair.pitchTypeA;
  const nameB = PITCH_LABELS[pair.pitchTypeB] ?? pair.pitchTypeB;

  const quality =
    pair.tunnelScore >= 5 ? 'elite' :
    pair.tunnelScore >= 3 ? 'strong' :
    pair.tunnelScore >= 2 ? 'good' : 'moderate';

  return (
    <div className={styles.insight}>
      <span className={styles.insightScore}>
        Tunnel Score: <strong>{pair.tunnelScore.toFixed(1)}</strong>
        <span className={`${styles.quality} ${styles[quality]}`}>{quality}</span>
      </span>
      <p className={styles.insightText}>
        The {nameA} and {nameB} are only{' '}
        <strong>{pair.separationAtDecisionIn.toFixed(1)}"</strong> apart at the decision point
        ({pair.decisionPointDistanceFt.toFixed(0)} ft from plate) but separate to{' '}
        <strong>{pair.separationAtPlateIn.toFixed(1)}"</strong> at the plate.
      </p>
    </div>
  );
}
