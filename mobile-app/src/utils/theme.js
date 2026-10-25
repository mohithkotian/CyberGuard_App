import { StyleSheet, Platform } from 'react-native';

export const colors = {
  navy:        '#030A14',
  deepBg:      '#050D1A',
  card:        'rgba(10, 20, 42, 0.85)',
  cardSolid:   '#0C162A',
  cardBorder:  'rgba(0, 180, 255, 0.2)',
  cardGlow:    'rgba(0, 255, 209, 0.1)',
  cyber:       '#00B4FF',
  electric:    '#00B4FF',
  accent:      '#00FFD1',
  neonCyan:    '#00FFD1',
  neonBlue:    '#00B4FF',
  neonPurple:  '#A855F7',
  neonPink:    '#EC4899',
  warn:        '#FF9F1C',
  warning:     '#FF9F1C',
  success:     '#00C896',
  danger:      '#FF3B30',
  error:       '#FF3B30',
  text:        '#F0F6FC',
  textSecondary:'#94A3B8',
  muted:       '#64748B',
  border:      'rgba(0, 180, 255, 0.2)',
  borderLight: 'rgba(255, 255, 255, 0.08)',
  glass:       'rgba(255, 255, 255, 0.04)',
};

export const globalStyles = StyleSheet.create({
  screen: { 
    flex: 1, 
    backgroundColor: colors.navy 
  },
  container: {
    flex: 1,
    backgroundColor: colors.navy,
  },
  glassCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: colors.cyber,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 14,
  },
  card: {
    backgroundColor: 'rgba(12, 22, 45, 0.75)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 255, 0.18)',
    marginBottom: 14,
  },
  input: {
    backgroundColor: 'rgba(15, 25, 50, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 255, 0.3)',
    borderRadius: 10,
    color: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 14,
    marginBottom: 14,
  },
  label: { 
    fontSize: 10, 
    color: colors.accent, 
    marginBottom: 6, 
    fontWeight: '800', 
    letterSpacing: 1.5,
    textTransform: 'uppercase'
  },
  btnPrimary: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  btnPrimaryText: { 
    color: '#030A14', 
    fontSize: 13, 
    fontWeight: '900',
    letterSpacing: 1.2
  },
  btnCyber: {
    backgroundColor: colors.cyber,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.cyber,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  btnCyberText: {
    color: '#030A14',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  btnOutline: {
    backgroundColor: 'rgba(0, 180, 255, 0.05)',
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 180, 255, 0.4)',
  },
  btnOutlineText: { 
    color: colors.cyber, 
    fontSize: 13, 
    fontWeight: '800',
    letterSpacing: 1
  },
  heading: { 
    fontSize: 24, 
    fontWeight: '900', 
    color: '#FFFFFF', 
    marginBottom: 4,
    letterSpacing: 1.5,
  },
  subheading: { 
    fontSize: 12, 
    color: colors.muted,
    lineHeight: 18,
  },
  badge: { 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  spaceBetween: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  sectionTitle: { 
    fontSize: 11, 
    color: colors.accent, 
    fontWeight: '900', 
    letterSpacing: 2.5, 
    textTransform: 'uppercase', 
    marginBottom: 12 
  },
  mono: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  tag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  }
});

export const statusColors = {
  pending:       '#FF9F1C',
  under_review:  '#00B4FF',
  investigating: '#A855F7',
  resolved:      '#00C896',
  closed:        '#64748B',
  rejected:      '#FF3B30',
};

export const severityColors = {
  low:      '#00C896',
  medium:   '#FF9F1C',
  high:     '#FF3B30',
  critical: '#EC4899',
};
