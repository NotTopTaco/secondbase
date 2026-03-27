import styles from './FavoriteStar.module.css';

interface FavoriteStarProps {
  size?: number;
}

export function FavoriteStar({ size = 12 }: FavoriteStarProps) {
  return (
    <svg
      className={styles.star}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="#f4c542"
      aria-label="Favorite player"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}
