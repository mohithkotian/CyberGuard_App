import { StyleSheet, Platform } from 'react-native';

export const colors = {
  // Core Graphite & Slate Surfaces (AGENTS.md §2)
  bg:             '#0B0F17',
  navy:           '#0B0F17',
  deepBg:         '#0B0F17',
  surface:        '#121824',
  card:           '#121824',
  surfaceElevated:'#1A2233',
  cardSolid:      '#1A2233',
  glass:          '#121824',

  // Borders
  border:         '#232D3F',
  cardBorder:     '#232D3F',
  borderLight:    '#2F3B52',
  cardGlow:       'rgba(61, 245, 192, 0.08)',

  // Brand & Accents
  accent:         '#3DF5C0',
  cyber:          '#3DF5C0',
  neonCyan:       '#3DF5C0',
  neonBlue:       '#38BDF8',
  neonPurple:     '#818CF8',
  neonPink:       '#F472B6',
  electric:       '#F1F5F9',

  // Semantic Status
  success:        '#34D399',
  warn:           '#FBBF24',
  warning:        '#FBBF24',
  danger:         '#F87171',
  error:          '#F87171',

  // Typography
  text:           '#F1F5F9',
  textSecondary:  '#94A3B8',
  muted:          '#64748B',
};

export const typography = {
  sans: Platform.select({ ios: 'System', android: 'Roboto', default: 'System' }),
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
};

export const globalStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  glassCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: 10,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
    fontSize: 15,
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  btnPrimary: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    minHeight: 48,
    paddingVertical: 13,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  btnPrimaryText: {
    color: '#070B12',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  btnSecondary: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    minHeight: 48,
    paddingVertical: 13,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  btnSecondaryText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  btnCyber: {
    backgroundColor: colors.electric,
    borderRadius: 10,
    minHeight: 48,
    paddingVertical: 13,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  btnCyberText: {
    color: '#070B12',
    fontSize: 15,
    fontWeight: '700',
  },
  btnOutline: {
    backgroundColor: 'transparent',
    borderRadius: 10,
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  btnOutlineText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  btnDanger: {
    backgroundColor: 'rgba(248, 113, 113, 0.12)',
    borderRadius: 10,
    minHeight: 48,
    paddingVertical: 13,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.35)',
  },
  btnDangerText: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '700',
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  subheading: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  mono: {
    fontFamily: typography.mono,
  },
  tag: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});

export const statusColors = {
  pending:       '#FBBF24',
  under_review:  '#38BDF8',
  investigating: '#818CF8',
  resolved:      '#34D399',
  closed:        '#64748B',
  rejected:      '#F87171',
};

export const severityColors = {
  low:      '#34D399',
  medium:   '#FBBF24',
  high:     '#F87171',
  critical: '#F87171',
};
