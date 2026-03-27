import { useEffect, useRef, useState } from 'react';
import { fetchPlayersToday, type PlayerTodayEntry } from '../api/authApi';

const POLL_INTERVAL = 30000;

export function usePlayersToday(hasLiveGames: boolean) {
  const [players, setPlayers] = useState<PlayerTodayEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    const poll = async () => {
      try {
        const data = await fetchPlayersToday();
        if (!cancelledRef.current) {
          setPlayers(data.players);
          setError(null);
        }
      } catch (e) {
        if (!cancelledRef.current) {
          setError(e instanceof Error ? e.message : 'Failed to load');
        }
      } finally {
        if (!cancelledRef.current) setLoading(false);
      }
    };

    poll();

    let interval: ReturnType<typeof setInterval> | undefined;
    if (hasLiveGames) {
      interval = setInterval(poll, POLL_INTERVAL);
    }

    return () => {
      cancelledRef.current = true;
      if (interval) clearInterval(interval);
    };
  }, [hasLiveGames]);

  return { players, loading, error };
}
