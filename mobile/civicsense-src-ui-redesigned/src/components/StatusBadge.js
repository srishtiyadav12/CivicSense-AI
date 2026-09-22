import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { STATUS_COLORS, radius, font, colors } from '../theme';

/**
 * Reusable status pill — single source of truth for status colors and label.
 * Used across Complaints, Detail and Tracking screens.
 */
const StatusBadge = ({ status, outline = false }) => {
  const bg = STATUS_COLORS[status] || colors.faint;
  const label = String(status || 'unknown').replace('_', ' ');
  return (
    <View style={[styles.pill, { backgroundColor: outline ? `${bg}1A` : bg }]}>
      <View style={[styles.dot, { backgroundColor: outline ? bg : colors.white }]} />
      <Text style={[styles.label, { color: outline ? bg : colors.white }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill,
  },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  label: { fontSize: font.xs, fontWeight: font.semibold, textTransform: 'capitalize' },
});

export default StatusBadge;