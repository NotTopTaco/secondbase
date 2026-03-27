export interface FielderPosition {
  position: string;
  playerId: number;
  playerName: string;
  svgX: number;
  svgY: number;
}

export interface DefensiveAlignmentSummary {
  ifStandardPct: number | null;
  ifShadePct: number | null;
  ifStrategicPct: number | null;
  ofStandardPct: number | null;
  ofStrategicPct: number | null;
  totalPA: number;
  pullPct: number | null;
  centerPct: number | null;
  oppoPct: number | null;
}

export interface DefensivePositioningResponse {
  fielders: FielderPosition[];
  alignment: DefensiveAlignmentSummary | null;
  shiftDetected: boolean;
  shiftDescription: string | null;
}
