import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../utils/theme';

export default function CyberBackground() {
  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.ambientTop} />
      <View style={styles.ambientBottom} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg,
    overflow: 'hidden',
  },
  ambientTop: {
    position: 'absolute',
    top: -120,
    left: '20%',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(61, 245, 192, 0.03)',
  },
  ambientBottom: {
    position: 'absolute',
    bottom: -100,
    right: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(56, 189, 248, 0.02)',
  },
});
