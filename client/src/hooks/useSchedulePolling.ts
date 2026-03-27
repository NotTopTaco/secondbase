import { useEffect, useRef } from 'react';
import { fetchSchedule } from '../api/gameApi';
import { useSidebarStore } from '../stores/sidebarStore';
import { useAlertStore } from '../stores/alertStore';

const POLL_INTERVAL = 30000;

export function useSchedulePolling(activeGamePk: number | null) {
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    const poll = async () => {
      try {
        const data = await fetchSchedule();
        const games = data.dates?.flatMap((d) => d.games) ?? [];
        if (!cancelledRef.current) {
          useSidebarStore.getState().updateGames(games);
          const { games: current, previousGames: previous } = useSidebarStore.getState();
          if (previous.length > 0) {
            useAlertStore.getState().processScheduleUpdate(current, previous);
          }
        }
      } catch {
        // Sidebar polling failure is non-critical
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL);

    return () => {
      cancelledRef.current = true;
      clearInterval(interval);
    };
  }, [activeGamePk]);
}
