import { useAuthStore } from '../../stores/authStore';
import { TeamLogo } from '../../components/ui/TeamLogo';
import { MLB_TEAMS } from '../../data/mlbTeams';
import styles from './TeamSelector.module.css';

export function TeamSelector() {
  const favoriteTeamIds = useAuthStore((s) => s.favoriteTeamIds);
  const toggleFavoriteTeam = useAuthStore((s) => s.toggleFavoriteTeam);

  return (
    <div className={styles.grid}>
      {MLB_TEAMS.map((team) => {
        const selected = favoriteTeamIds.has(team.id);
        return (
          <button
            key={team.id}
            className={`${styles.team} ${selected ? styles.selected : ''}`}
            onClick={() => toggleFavoriteTeam(team.id)}
            type="button"
          >
            <TeamLogo teamId={team.id} abbreviation={team.abbreviation} size={32} />
            <span className={styles.name}>{team.abbreviation}</span>
          </button>
        );
      })}
    </div>
  );
}
