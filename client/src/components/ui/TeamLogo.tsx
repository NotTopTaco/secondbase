import { useState } from 'react';
import { getTeamColors } from '../../theme/teamColors';
import styles from './TeamLogo.module.css';

interface TeamLogoProps {
  teamId: number;
  abbreviation?: string;
  size?: number;
  variant?: 'cap' | 'full';
}

export function TeamLogo({ teamId, abbreviation, size = 24, variant = 'cap' }: TeamLogoProps) {
  const [errored, setErrored] = useState(false);
  const colors = getTeamColors(teamId);

  // PNG from the same CDN family as PlayerPhoto — more reliable across browsers
  const pxSize = size * 2;
  const src = variant === 'cap'
    ? `https://midfield.mlbstatic.com/v1/team/${teamId}/spots/${pxSize}`
    : `https://www.mlbstatic.com/team-logos/${teamId}.svg`;

  if (errored || !teamId) {
    return (
      <div
        className={styles.fallback}
        style={{
          width: size,
          height: size,
          fontSize: size * 0.4,
          background: colors.primary,
        }}
      >
        {abbreviation?.slice(0, 3) ?? '?'}
      </div>
    );
  }

  return (
    <div
      className={styles.container}
      style={{ width: size, height: size }}
    >
      <img
        className={styles.logo}
        src={src}
        alt=""
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        onError={() => setErrored(true)}
      />
    </div>
  );
}
