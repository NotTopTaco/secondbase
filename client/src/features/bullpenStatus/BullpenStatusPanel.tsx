import { useState, useEffect } from 'react';
import { Panel } from '../../components/ui/Panel';
import { Spinner } from '../../components/ui/Spinner';
import { TwoColumnLayout } from '../../components/ui/TwoColumnLayout';
import { usePanelStore } from '../../stores/panelStore';
import { useGameStore } from '../../stores/gameStore';
import { fetchBullpenStatus, type BullpenResponse } from '../../api/analyticsApi';
import { BullpenColumn } from './BullpenColumn';

const PANEL_ID = 'bullpenStatus';

export function BullpenStatusPanel() {
  const panel = usePanelStore((s) => s.panels.find((p) => p.id === PANEL_ID));
  const toggleCollapse = usePanelStore((s) => s.toggleCollapse);
  const gamePk = useGameStore((s) => s.gamePk);
  const awayTeam = useGameStore((s) => s.awayTeam);
  const homeTeam = useGameStore((s) => s.homeTeam);

  const [data, setData] = useState<BullpenResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gamePk) {
      setData(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchBullpenStatus(gamePk)
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
          No bullpen data available
        </div>
      ) : (
        <TwoColumnLayout
          leftTitle={awayTeam?.abbreviation ?? awayTeam?.name ?? 'Away'}
          rightTitle={homeTeam?.abbreviation ?? homeTeam?.name ?? 'Home'}
          left={<BullpenColumn relievers={data.away} />}
          right={<BullpenColumn relievers={data.home} />}
        />
      )}
    </Panel>
  );
}
