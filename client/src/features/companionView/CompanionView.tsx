import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGameStore } from '../../stores/gameStore';
import { usePanelStore } from '../../stores/panelStore';
import { useGamePolling } from '../../hooks/useGamePolling';
import { useSchedulePolling } from '../../hooks/useSchedulePolling';
import { GameStateBar } from '../gameStateBar/GameStateBar';
import { TabBar } from './TabBar';
import { TabPanelGrid } from './TabPanelGrid';
import { Sidebar } from './Sidebar';
import styles from './CompanionView.module.css';

export function CompanionView() {
  const { gamePk: gamePkParam } = useParams<{ gamePk: string }>();
  const gamePk = gamePkParam ? parseInt(gamePkParam, 10) : null;
  const setGamePk = useGameStore((s) => s.setGamePk);
  const activeTab = usePanelStore((s) => s.activeTab);
  const setActiveTab = usePanelStore((s) => s.setActiveTab);

  useEffect(() => {
    if (gamePk) {
      setGamePk(gamePk);
    }
  }, [gamePk, setGamePk]);

  const { error } = useGamePolling(gamePk);
  useSchedulePolling(gamePk);

  return (
    <div className={styles.view}>
      <GameStateBar />
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      {error && (
        <div className={styles.error}>
          <span className={styles.errorDot} />
          Connection error: {error}
        </div>
      )}
      <div className={styles.mainArea}>
        <div className={styles.content}>
          <TabPanelGrid />
        </div>
        <Sidebar activeGamePk={gamePk} />
      </div>
      <Link to="/" className={styles.backLink}>
        &larr; Games
      </Link>
    </div>
  );
}
