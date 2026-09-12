/** Dark-first palette. One place to change the look of the whole app. */
export const colors = {
  bg: '#0B0F14',
  surface: '#131A22',
  surfaceAlt: '#1B242E',
  border: '#26313D',
  text: '#E8EDF2',
  textMuted: '#8A99A8',
  textFaint: '#5C6B7A',
  accent: '#4F8EF7',
  good: '#3DD68C',
  bad: '#F2555A',
  warn: '#F5A524',
  onAccent: '#FFFFFF',
};

/** Default palette offered in the habit editor. */
export const habitColors = [
  '#4F8EF7',
  '#3DD68C',
  '#F5A524',
  '#F2555A',
  '#A78BFA',
  '#22D3EE',
  '#FB7185',
  '#94A3B8',
];

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

export const type = {
  display: { fontSize: 30, fontWeight: '700' as const, color: colors.text },
  title: { fontSize: 20, fontWeight: '700' as const, color: colors.text },
  heading: { fontSize: 16, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.text },
  label: { fontSize: 13, fontWeight: '600' as const, color: colors.textMuted },
  caption: { fontSize: 12, fontWeight: '400' as const, color: colors.textFaint },
};
