import type { TabId } from '../../stores/panelStore';
import { StrikeZonePanel } from '../strikeZone/StrikeZonePanel';
import { HotZonePanel } from '../hotZone/HotZonePanel';
import { PitcherTendencyPanel } from '../pitcherTendency/PitcherTendencyPanel';
import { BatterVsPitchTypePanel } from '../batterVsPitchType/BatterVsPitchTypePanel';
import { SprayChartPanel } from '../sprayChart/SprayChartPanel';
import { HeadToHeadPanel } from '../headToHead/HeadToHeadPanel';
import { NextPitchPanel } from '../nextPitchProbability/NextPitchPanel';
import { WinProbabilityPanel } from '../winProbability/WinProbabilityPanel';
import { PitcherFatiguePanel } from '../pitcherFatigue/PitcherFatiguePanel';
import { TimeThroughOrderPanel } from '../timeThroughOrder/TimeThroughOrderPanel';
import { UmpireScoutingPanel } from '../umpireScouting/UmpireScoutingPanel';
import { PitchMovementPanel } from '../pitchMovement/PitchMovementPanel';
import { BullpenStatusPanel } from '../bullpenStatus/BullpenStatusPanel';
import { BatterByCountPanel } from '../batterByCount/BatterByCountPanel';
import { StreakIndicatorPanel } from '../streakIndicator/StreakIndicatorPanel';
import { DefensivePositioningPanel } from '../defensivePositioning/DefensivePositioningPanel';
import { PitchTunnelingPanel } from '../pitchTunneling/PitchTunnelingPanel';

export const PANEL_COMPONENTS: Record<string, React.FC> = {
  strikeZone: StrikeZonePanel,
  hotZone: HotZonePanel,
  pitcherTendency: PitcherTendencyPanel,
  batterVsPitchType: BatterVsPitchTypePanel,
  sprayChart: SprayChartPanel,
  headToHead: HeadToHeadPanel,
  nextPitch: NextPitchPanel,
  winProbability: WinProbabilityPanel,
  pitcherFatigue: PitcherFatiguePanel,
  timeThroughOrder: TimeThroughOrderPanel,
  umpireScouting: UmpireScoutingPanel,
  pitchMovement: PitchMovementPanel,
  bullpenStatus: BullpenStatusPanel,
  batterByCount: BatterByCountPanel,
  streakIndicator: StreakIndicatorPanel,
  defensivePositioning: DefensivePositioningPanel,
  pitchTunneling: PitchTunnelingPanel,
};

export const TABS: { id: TabId; label: string }[] = [
  { id: 'pitcher', label: 'Pitcher' },
  { id: 'batter', label: 'Batter' },
  { id: 'matchup', label: 'Matchup' },
  { id: 'game', label: 'Game' },
];
