import { useAuthStore } from '../../stores/authStore';
import { PlayerPhoto } from '../../components/ui/PlayerPhoto';
import { PlayerSearchInput } from './PlayerSearchInput';
import type { PlayerSearchResult } from '../../api/authApi';
import styles from './PlayerFavorites.module.css';

interface FavoritePlayer {
  player_id: number;
  full_name: string;
  team: string | null;
  position: string | null;
}

interface PlayerFavoritesProps {
  players: FavoritePlayer[];
}

export function PlayerFavorites({ players }: PlayerFavoritesProps) {
  const favoritePlayerIds = useAuthStore((s) => s.favoritePlayerIds);
  const toggleFavoritePlayer = useAuthStore((s) => s.toggleFavoritePlayer);

  const handleAdd = (player: PlayerSearchResult) => {
    toggleFavoritePlayer(player.player_id);
  };

  return (
    <div className={styles.container}>
      <PlayerSearchInput onSelect={handleAdd} excludeIds={favoritePlayerIds} />

      {players.length > 0 && (
        <div className={styles.list}>
          {players.map((player) => (
            <div key={player.player_id} className={styles.item}>
              <PlayerPhoto playerId={player.player_id} size={32} />
              <div className={styles.info}>
                <span className={styles.name}>{player.full_name}</span>
                <span className={styles.meta}>
                  {[player.position, player.team].filter(Boolean).join(' - ')}
                </span>
              </div>
              <button
                className={styles.remove}
                onClick={() => toggleFavoritePlayer(player.player_id)}
                type="button"
                aria-label={`Remove ${player.full_name}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {players.length === 0 && (
        <p className={styles.empty}>Search for players above to add favorites</p>
      )}
    </div>
  );
}
