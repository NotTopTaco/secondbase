import { useState, useEffect } from 'react';
import { Panel } from '../../components/ui/Panel';
import { Spinner } from '../../components/ui/Spinner';
import { usePanelStore } from '../../stores/panelStore';
import { useGameStore } from '../../stores/gameStore';
import { fetchWinProbability, type WinProbabilityResponse } from '../../api/analyticsApi';
import { CurrentWinProb } from './CurrentWinProb';
import { WinProbChart } from './WinProbChart';

const PANEL_ID = 'winProbability';

export function WinProbabilityPanel() {
  const panel = usePanelStore((s) => s.panels.find((p) => p.id === PANEL_ID));
  const toggleCollapse = usePanelStore((s) => s.toggleCollapse);
  const gamePk = useGameStore((s) => s.gamePk);
  const homeTeam = useGameStore((s) => s.homeTeam);
  const awayTeam = useGameStore((s) => s.awayTeam);

  const [data, setData] = useState<WinProbabilityResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gamePk) {
      setData(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchWinProbability(gamePk)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [gamePk]);

  if (!panel) return null;

  return (
    <Panel
      id={PANEL_ID}
      title={panel.title}
      collapsed={panel.collapsed}
      onToggleCollapse={() => toggleCollapse(PANEL_ID)}
      sortable
    >
      {loading ? (
        <Spinner />
      ) : data === null ? (
        <div style={{ padding: '12px 0', color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
          No win probability data available
        </div>
      ) : (
        <>
          <CurrentWinProb
            homeWp={data.currentHomeWp}
            homeTeam={homeTeam?.abbreviation ?? homeTeam?.name}
            awayTeam={awayTeam?.abbreviation ?? awayTeam?.name}
          />
          <WinProbChart
            events={data.events}
            biggestSwing={data.biggestSwing}
          />
        </>
      )}
    </Panel>
  );
}
