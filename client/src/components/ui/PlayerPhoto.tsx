import { useState } from 'react';
import styles from './PlayerPhoto.module.css';

interface PlayerPhotoProps {
  playerId: number;
  size?: number;
}

export function PlayerPhoto({ playerId, size = 40 }: PlayerPhotoProps) {
  const [errored, setErrored] = useState(false);
  const src = `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_${size * 2},q_auto:best/v1/people/${playerId}/headshot/67/current`;

  if (errored) {
    return (
      <div
        className={styles.fallback}
        style={{ width: size, height: size }}
      >
        ?
      </div>
    );
  }

  return (
    <img
      className={styles.photo}
      src={src}
      alt="Player headshot"
      width={size}
      height={size}
      onError={() => setErrored(true)}
    />
  );
}
