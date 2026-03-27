const TEAM_COLORS: Record<number, { primary: string; secondary: string }> = {
  // AL East
  110: { primary: '#DF4601', secondary: '#000000' }, // Baltimore Orioles
  111: { primary: '#BD3039', secondary: '#0C2340' }, // Boston Red Sox
  147: { primary: '#134A8E', secondary: '#1D2D5C' }, // New York Yankees
  139: { primary: '#092C5C', secondary: '#8FBCE6' }, // Tampa Bay Rays
  141: { primary: '#134A8E', secondary: '#1D2D5C' }, // Toronto Blue Jays

  // AL Central
  145: { primary: '#27251F', secondary: '#C4CED4' }, // Chicago White Sox
  114: { primary: '#00385D', secondary: '#E50022' }, // Cleveland Guardians
  116: { primary: '#0C2340', secondary: '#FA4616' }, // Detroit Tigers
  118: { primary: '#004687', secondary: '#BD9B60' }, // Kansas City Royals
  142: { primary: '#002B5C', secondary: '#D31145' }, // Minnesota Twins

  // AL West
  117: { primary: '#003263', secondary: '#862633' }, // Houston Astros
  108: { primary: '#003263', secondary: '#BA0021' }, // Los Angeles Angels
  133: { primary: '#003831', secondary: '#EFB21E' }, // Oakland Athletics
  136: { primary: '#0C2C56', secondary: '#005C5C' }, // Seattle Mariners
  140: { primary: '#003278', secondary: '#C0111F' }, // Texas Rangers

  // NL East
  144: { primary: '#CE1141', secondary: '#13274F' }, // Atlanta Braves
  146: { primary: '#FF6600', secondary: '#002D72' }, // Miami Marlins
  121: { primary: '#002D72', secondary: '#FF5910' }, // New York Mets
  143: { primary: '#E81828', secondary: '#002D72' }, // Philadelphia Phillies
  120: { primary: '#AB0003', secondary: '#14225A' }, // Washington Nationals

  // NL Central
  112: { primary: '#0E3386', secondary: '#CC3433' }, // Chicago Cubs
  113: { primary: '#C6011F', secondary: '#000000' }, // Cincinnati Reds
  158: { primary: '#12284B', secondary: '#FDB827' }, // Milwaukee Brewers
  134: { primary: '#FD5A1E', secondary: '#27251F' }, // Pittsburgh Pirates
  138: { primary: '#C41E3A', secondary: '#0C2340' }, // St. Louis Cardinals

  // NL West
  109: { primary: '#A71930', secondary: '#E3D4AD' }, // Arizona Diamondbacks
  115: { primary: '#002F6C', secondary: '#FD5A1E' }, // Colorado Rockies
  119: { primary: '#005A9C', secondary: '#EF3E42' }, // Los Angeles Dodgers
  135: { primary: '#2F241D', secondary: '#FCC09F' }, // San Diego Padres
  137: { primary: '#FD5A1E', secondary: '#27251F' }, // San Francisco Giants
};

const FALLBACK = { primary: '#4a9eff', secondary: '#1a2d4a' };

export function getTeamColors(teamId: number | undefined): { primary: string; secondary: string } {
  if (teamId == null) return FALLBACK;
  return TEAM_COLORS[teamId] ?? FALLBACK;
}
