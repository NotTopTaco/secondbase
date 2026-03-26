export const PITCH_COLORS: Record<string, string> = {
  FF: '#E74C3C',
  SI: '#E91E90',
  FC: '#F39C12',
  SL: '#3498DB',
  CU: '#F1C40F',
  CH: '#2ECC71',
  FS: '#9B59B6',
};

export const PITCH_LABELS: Record<string, string> = {
  FF: '4-Seam',
  SI: 'Sinker',
  FC: 'Cutter',
  SL: 'Slider',
  CU: 'Curveball',
  CH: 'Changeup',
  FS: 'Splitter',
};

export const ZONE_SCALE = {
  cold: '#2166AC',
  neutral: '#F7F7F7',
  hot: '#B2182B',
} as const;

export const RESULT_COLORS: Record<string, string> = {
  single: '#2ECC71',
  double: '#F39C12',
  triple: '#3498DB',
  homeRun: '#E74C3C',
  out: '#606070',
};
