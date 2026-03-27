import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { apiFetch } from '../../api/client';
import { TeamSelector } from './TeamSelector';
import { PlayerFavorites } from './PlayerFavorites';
import styles from './ProfilePage.module.css';

interface PlayerInfo {
  player_id: number;
  full_name: string;
  team: string | null;
  position: string | null;
}

export function ProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const favoritePlayerIds = useAuthStore((s) => s.favoritePlayerIds);
  const logout = useAuthStore((s) => s.logout);
  const [players, setPlayers] = useState<PlayerInfo[]>([]);

  useEffect(() => {
    const ids = [...favoritePlayerIds];
    if (ids.length === 0) {
      setPlayers([]);
      return;
    }

    Promise.all(
      ids.map((id) =>
        apiFetch<{ player_id: number; full_name: string; team: string | null; position: string | null }>(
          `/players/${id}`
        ).catch(() => null)
      )
    ).then((results) => {
      setPlayers(results.filter((r): r is PlayerInfo => r !== null));
    });
  }, [favoritePlayerIds]);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className={styles.screen}>
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.back} onClick={() => navigate('/')} type="button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className={styles.logo}>
            Second<span className={styles.logoAccent}>Base</span>
          </h1>
        </div>

        <div className={styles.userCard}>
          <div className={styles.avatar}>
            {user?.username.charAt(0).toUpperCase()}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.username}>{user?.username}</span>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout} type="button">
            Sign Out
          </button>
        </div>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Favorite Teams</h2>
          <p className={styles.sectionDesc}>
            Select your favorite teams. Their games will appear first on the homepage.
          </p>
          <TeamSelector />
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Favorite Players</h2>
          <p className={styles.sectionDesc}>
            Search and add your favorite players. You'll see a star next to them on game cards.
          </p>
          <PlayerFavorites players={players} />
        </section>
      </div>
    </div>
  );
}
