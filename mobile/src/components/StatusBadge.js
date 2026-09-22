import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { STATUS_COLORS, borderRadius, typography, colors } from '../theme';

const STATUS_LABELS = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  rejected: 'Rejected',
  reopened: 'Reopened',
};

export default function StatusBadge({ status, size = 'md', outline = false }) {
  const color = STATUS_COLORS[status] || STATUS_COLORS.submitted;
  const label = STATUS_LABELS[status] || status;

  const badgeStyle = [
    styles.badge,
    styles[`badge_${size}`],
    outline ? styles.badgeOutline : styles.badgeSolid,
    {
      backgroundColor: outline ? 'transparent' : `${color}20`,
      borderColor: color,
      borderWidth: outline ? 1.5 : 0,
    },
  ];

  const textStyle = [
    styles.text,
    styles[`text_${size}`],
    { color },
  ];

  return (
    <View style={badgeStyle}>
      <Text style={textStyle}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  badge_sm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badge_md: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  badge_lg: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  badgeSolid: {
    // Background color set dynamically
  },
  badgeOutline: {
    backgroundColor: 'transparent',
  },
  text: {
    fontWeight: typography.fontWeights.semibold,
    textAlign: 'center',
  },
  text_sm: {
    fontSize: typography.fontSizes.xs,
  },
  text_md: {
    fontSize: typography.fontSizes.sm,
  },
  text_lg: {
    fontSize: typography.fontSizes.base,
  },
});