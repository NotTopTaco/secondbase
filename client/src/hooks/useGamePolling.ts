import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { usePollingStore } from '../stores/pollingStore';
import { useMatchupStore } from '../stores/matchupStore';
import { useGameAnalyticsStore } from '../stores/gameAnalyticsStore';
import { useAnalyticsDataStore } from '../stores/analyticsDataStore';
import { fetchLiveFeed } from '../api/gameApi';
import { fetchBatterBundle, fetchPitcherBundle } from '../api/playerApi';

interface UseGamePollingResult {
  isPolling: boolean;
  error: string | null;
}

export function useGamePolling(gamePk: number | null): UseGamePollingResult {
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prevBatterRef = useRef<number | null>(null);
  const prevPitcherRef = useRef<number | null>(null);

  const intervalMs = usePollingStore((s) => s.intervalMs);

  useEffect(() => {
    if (!gamePk) {
      setIsPolling(false);
      return;
    }

    let cancelled = false;

    async function poll() {
      if (cancelled) return;

      try {
        const feed = await fetchLiveFeed(gamePk!);
        if (cancelled) return;

        useGameStore.getState().updateFromFeed(feed);
        useGameAnalyticsStore.getState().updateFromFeed(feed);
        usePollingStore.getState().setConnected(true);
        usePollingStore.getState().setLastUpdated(Date.now());
        setError(null);

        const batter = useGameStore.getState().batter;
        const pitcher = useGameStore.getState().pitcher;

        const batterChanged = batter?.id !== prevBatterRef.current;
        const pitcherChanged = pitcher?.id !== prevPitcherRef.current;

        if (batterChanged || pitcherChanged) {
          if (batterChanged) {
            useGameStore.getState().clearPitches();
          }
          prevBatterRef.current = batter?.id ?? null;
          prevPitcherRef.current = pitcher?.id ?? null;

          if (batter && pitcher) {
            // Fetch both bundles in parallel (2 HTTP requests instead of 10)
            const matchupKey = `${batter.id}-${pitcher.id}`;
            useMatchupStore.setState({ matchupKey, batterId: batter.id,
              loadingHotZones: true, loadingTendencies: true, loadingBatterVsPitch: true,
              loadingSprayChart: true, loadingH2H: true });
            useAnalyticsDataStore.setState({
              loadingCountStats: true, loadingTTOSplits: true, loadingPitchMovement: true,
              loadingStreak: true, loadingTunneling: true });

            Promise.all([
              fetchBatterBundle(batter.id, pitcher.id),
              fetchPitcherBundle(pitcher.id),
            ]).then(([batterBundle, pitcherBundle]) => {
              useMatchupStore.getState().setBundleData(batterBundle, pitcherBundle);
              useAnalyticsDataStore.getState().setBundleData(batterBundle, pitcherBundle);
            }).catch(() => {
              // Fallback: clear loading states on error
              useMatchupStore.setState({
                loadingHotZones: false, loadingTendencies: false, loadingBatterVsPitch: false,
                loadingSprayChart: false, loadingH2H: false });
              useAnalyticsDataStore.setState({
                loadingCountStats: false, loadingTTOSplits: false, loadingPitchMovement: false,
                loadingStreak: false, loadingTunneling: false });
            });
            void useGameAnalyticsStore.getState().fetchDefensivePositioningData(gamePk!, batter.id);
          }
        }
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : 'Polling error';
        setError(msg);
        usePollingStore.getState().setConnected(false);
      }
    }

    setIsPolling(true);
    void poll();

    const id = setInterval(poll, intervalMs);

    return () => {
      cancelled = true;
      clearInterval(id);
      setIsPolling(false);
    };
  }, [gamePk, intervalMs]);

  return { isPolling, error };
}
