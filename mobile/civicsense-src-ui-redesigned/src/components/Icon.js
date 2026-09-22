import React from 'react';
import { View, StyleSheet } from 'react-native';

/**
 * Dependency-free vector icon set rendered with primitives.
 * Keeps the tab bar and buttons crisp and consistent without pulling in
 * an icon library (which could risk Expo Go compatibility).
 *
 * Usage: <Icon name="home" size={22} color="#6a7488" strokeWidth={2} />
 */
const Icon = ({ name, size = 22, color = '#6a7488', strokeWidth = 2 }) => {
  const s = size;          // total box (square)
  const sw = strokeWidth;
  const stroke = color;

  const box = { width: s, height: s, borderColor: stroke, borderWidth: sw };

  const shapes = {
    home: (
      <>
        {/* roof peak */}
        <View style={[styles.abs, { left: s * 0.46, top: 0, width: sw, height: s * 0.26 }]} />
        {/* roof left */}
        <View style={[styles.abs, { left: s * 0.02, top: s * 0.12, width: sw, height: s * 0.34, transform: [{ rotate: '-48deg' }] }]} />
        {/* roof right */}
        <View style={[styles.abs, { left: s * 0.82, top: s * 0.12, width: sw, height: s * 0.34, transform: [{ rotate: '48deg' }] }]} />
        {/* body */}
        <View style={[styles.abs, { left: s * 0.16, top: s * 0.46, width: s * 0.68, height: s * 0.5, ...box, borderRadius: 2 }]} />
        {/* door */}
        <View style={[styles.abs, { left: s * 0.42, top: s * 0.7, width: sw, height: s * 0.26 }]} />
      </>
    ),

    list: (
      <>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.abs, { left: s * 0.14, top: s * 0.16 + i * s * 0.3, flexDirection: 'row', alignItems: 'center' }]}>
            <View style={{ width: sw + 1.5, height: sw + 1.5, borderRadius: sw, backgroundColor: stroke }} />
            <View style={{ width: s * 0.1 }} />
            <View style={{ width: s * 0.5, height: sw, borderRadius: 2, backgroundColor: stroke }} />
          </View>
        ))}
      </>
    ),

    plus: (
      <>
        <View style={[styles.abs, { left: s * 0.2, top: s * 0.5 - sw / 2, width: s * 0.6, height: sw, borderRadius: 2, backgroundColor: stroke }]} />
        <View style={[styles.abs, { left: s * 0.5 - sw / 2, top: s * 0.2, width: sw, height: s * 0.6, borderRadius: 2, backgroundColor: stroke }]} />
      </>
    ),

    minus: (
      <View style={[styles.abs, { left: s * 0.2, top: s * 0.5 - sw / 2, width: s * 0.6, height: sw, borderRadius: 2, backgroundColor: stroke }]} />
    ),

    pin: (
      <>
        <View style={[styles.abs, { left: s * 0.2, top: s * 0.12, width: s * 0.6, height: s * 0.6, borderRadius: s * 0.3, ...box }]} />
        <View style={[styles.abs, { left: s * 0.46, top: s * 0.68, width: sw, height: s * 0.24, backgroundColor: stroke, transform: [{ rotate: '45deg' }] }]} />
        <View style={[styles.abs, { left: s * 0.39, top: s * 0.27, width: s * 0.22, height: s * 0.22, borderRadius: s * 0.11, backgroundColor: stroke }]} />
      </>
    ),

    camera: (
      <>
        <View style={[styles.abs, { left: s * 0.1, top: s * 0.28, width: s * 0.8, height: s * 0.56, borderRadius: 4, ...box }]} />
        <View style={[styles.abs, { left: s * 0.36, top: s * 0.16, width: s * 0.28, height: s * 0.16, borderRadius: 2, ...box }]} />
        <View style={[styles.abs, { left: s * 0.37, top: s * 0.38, width: s * 0.26, height: s * 0.26, borderRadius: s * 0.13, ...box }]} />
      </>
    ),

    image: (
      <>
        <View style={[styles.abs, { left: s * 0.12, top: s * 0.14, width: s * 0.76, height: s * 0.72, borderRadius: 3, ...box }]} />
        <View style={[styles.abs, { left: s * 0.2, top: s * 0.3, width: s * 0.22, height: s * 0.22, borderRadius: 4, ...box }]} />
        <View style={[styles.abs, { left: s * 0.62, top: s * 0.6, width: s * 0.2, height: s * 0.16, borderRightWidth: sw, borderBottomWidth: sw, borderColor: stroke, transform: [{ rotate: '45deg' }] }]} />
      </>
    ),

    star: (
      <View style={[
        styles.abs,
        {
          left: s * 0.06, top: s * 0.06, width: s * 0.88, height: s * 0.88, borderRadius: 2,
          borderColor: stroke, borderWidth: sw,
          transform: [{ rotate: '45deg' }],
        },
      ]} />
    ),

    check: (
      <>
        <View style={[styles.abs, { left: s * 0.26, top: s * 0.4, width: sw, height: s * 0.3, backgroundColor: stroke, borderRadius: 2, transform: [{ rotate: '45deg' }] }]} />
        <View style={[styles.abs, { left: s * 0.46, top: s * 0.26, width: sw, height: s * 0.5, backgroundColor: stroke, borderRadius: 2, transform: [{ rotate: '-45deg' }] }]} />
      </>
    ),

    search: (
      <>
        <View style={[styles.abs, { left: s * 0.12, top: s * 0.12, width: s * 0.56, height: s * 0.56, borderRadius: s * 0.28, ...box }]} />
        <View style={[styles.abs, { left: s * 0.6, top: s * 0.64, width: sw, height: s * 0.36, backgroundColor: stroke, borderRadius: 2, transform: [{ rotate: '45deg' }] }]} />
      </>
    ),

    chevron: (
      <View style={[styles.abs, { left: s * 0.34, top: s * 0.34, width: s * 0.32, height: s * 0.32, borderRightWidth: sw, borderBottomWidth: sw, borderColor: stroke, transform: [{ rotate: '-45deg' }] }]} />
    ),

    // "Report" — arrow pointing up-right into a tray
    upload: (
      <>
        <View style={[styles.abs, { left: s * 0.46, top: s * 0.14, width: sw, height: s * 0.36, backgroundColor: stroke, borderRadius: 2, transform: [{ rotate: '45deg' }] }]} />
        <View style={[styles.abs, { left: s * 0.27, top: s * 0.27, width: s * 0.3, height: s * 0.3, borderLeftWidth: sw, borderTopWidth: sw, borderColor: stroke, transform: [{ rotate: '45deg' }] }]} />
        <View style={[styles.abs, { left: s * 0.16, top: s * 0.68, width: s * 0.68, height: sw, backgroundColor: stroke, borderRadius: 2 }]} />
      </>
    ),

    gps: (
      <>
        <View style={[styles.abs, { left: s * 0.2, top: s * 0.2, width: s * 0.6, height: s * 0.6, borderRadius: s * 0.3, ...box }]} />
        <View style={[styles.abs, { left: s * 0.42, top: s * 0.42, width: s * 0.16, height: s * 0.16, borderRadius: s * 0.08, backgroundColor: stroke }]} />
      </>
    ),
  };

  return (
    <View style={{ width: s, height: s }} accessibilityLabel={name}>
      {shapes[name] || null}
    </View>
  );
};

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
});

export default Icon;