import React from 'react';
import { View, StyleSheet } from 'react-native';

/**
 * Dependency-free vector icon set rendered with primitives.
 * Modern redesigned version for CivicSense AI mobile app.
 *
 * Usage: <Icon name="home" size={22} color="#6366F1" strokeWidth={2} />
 */
const Icon = ({ name, size = 22, color = '#6366F1', strokeWidth = 2 }) => {
  const s = size;
  const sw = strokeWidth;
  const stroke = color;

  const box = { width: s, height: s, borderColor: stroke, borderWidth: sw };

  const shapes = {
    home: (
      <>
        {/* filled triangle roof, sits flush on top of the body */}
        <View
          style={[
            styles.abs,
            {
              left: s * 0.06,
              top: s * 0.02,
              width: 0,
              height: 0,
              borderLeftWidth: s * 0.44,
              borderRightWidth: s * 0.44,
              borderBottomWidth: s * 0.34,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderBottomColor: stroke,
            },
          ]}
        />
        {/* body, starts right where the roof ends so there's no gap */}
        <View style={[styles.abs, { left: s * 0.16, top: s * 0.34, width: s * 0.68, height: s * 0.62, ...box, borderRadius: 2, borderTopWidth: 0 }]} />
        {/* door */}
        <View style={[styles.abs, { left: s * 0.42, top: s * 0.68, width: sw, height: s * 0.28, backgroundColor: stroke }]} />
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

    mapPin: (
      <>
        {/* teardrop point, sits under the circle */}
        <View
          style={[
            styles.abs,
            {
              left: s * 0.35,
              top: s * 0.5,
              width: 0,
              height: 0,
              borderLeftWidth: s * 0.15,
              borderRightWidth: s * 0.15,
              borderTopWidth: s * 0.32,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderTopColor: stroke,
            },
          ]}
        />
        {/* head circle, drawn after so it overlaps and hides the top of the point */}
        <View style={[styles.abs, { left: s * 0.15, top: s * 0.06, width: s * 0.7, height: s * 0.7, borderRadius: s * 0.35, ...box }]} />
        {/* inner dot */}
        <View style={[styles.abs, { left: s * 0.38, top: s * 0.29, width: s * 0.24, height: s * 0.24, borderRadius: s * 0.12, backgroundColor: stroke }]} />
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

    chevronRight: (
      <View style={[styles.abs, { left: s * 0.34, top: s * 0.34, width: s * 0.32, height: s * 0.32, borderRightWidth: sw, borderBottomWidth: sw, borderColor: stroke, transform: [{ rotate: '-45deg' }] }]} />
    ),

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

    user: (
      <>
        {/* head, positioned so its bottom edge meets the shoulders with no gap */}
        <View style={[styles.abs, { left: s * 0.3, top: s * 0.1, width: s * 0.4, height: s * 0.4, borderRadius: s * 0.2, ...box }]} />
        {/* shoulders — starts right at the head's bottom edge */}
        <View style={[styles.abs, { left: s * 0.14, top: s * 0.48, width: s * 0.72, height: s * 0.34, borderTopLeftRadius: s * 0.36, borderTopRightRadius: s * 0.36, ...box, borderBottomWidth: 0 }]} />
      </>
    ),

    mail: (
      <>
        <View style={[styles.abs, { left: s * 0.1, top: s * 0.2, width: s * 0.8, height: s * 0.6, borderRadius: 4, ...box }]} />
        <View style={[styles.abs, { left: s * 0.1, top: s * 0.2, width: s * 0.4, height: s * 0.3, borderBottomWidth: sw, borderRightWidth: sw, borderColor: stroke, transform: [{ rotate: '45deg' }] }]} />
      </>
    ),

    lock: (
      <>
        <View style={[styles.abs, { left: s * 0.2, top: s * 0.45, width: s * 0.6, height: s * 0.45, borderRadius: 4, ...box }]} />
        <View style={[styles.abs, { left: s * 0.3, top: s * 0.15, width: s * 0.4, height: s * 0.35, borderTopLeftRadius: s * 0.2, borderTopRightRadius: s * 0.2, ...box, borderBottomWidth: 0 }]} />
      </>
    ),

    bell: (
      <>
        <View style={[styles.abs, { left: s * 0.25, top: s * 0.2, width: s * 0.5, height: s * 0.5, borderBottomLeftRadius: s * 0.25, borderBottomRightRadius: s * 0.25, ...box, borderTopWidth: 0 }]} />
        <View style={[styles.abs, { left: s * 0.15, top: s * 0.75, width: s * 0.7, height: sw, backgroundColor: stroke, borderRadius: 2 }]} />
      </>
    ),

    clock: (
      <>
        <View style={[styles.abs, { left: s * 0.15, top: s * 0.15, width: s * 0.7, height: s * 0.7, borderRadius: s * 0.35, ...box }]} />
        <View style={[styles.abs, { left: s * 0.48, top: s * 0.3, width: sw, height: s * 0.2, backgroundColor: stroke }]} />
        <View style={[styles.abs, { left: s * 0.48, top: s * 0.48, width: s * 0.15, height: sw, backgroundColor: stroke }]} />
      </>
    ),

    x: (
      <>
        <View style={[styles.abs, { left: s * 0.5 - sw / 2, top: s * 0.15, width: sw, height: s * 0.7, backgroundColor: stroke, transform: [{ rotate: '45deg' }] }]} />
        <View style={[styles.abs, { left: s * 0.5 - sw / 2, top: s * 0.15, width: sw, height: s * 0.7, backgroundColor: stroke, transform: [{ rotate: '-45deg' }] }]} />
      </>
    ),

    alertCircle: (
      <>
        <View style={[styles.abs, { left: s * 0.15, top: s * 0.15, width: s * 0.7, height: s * 0.7, borderRadius: s * 0.35, ...box }]} />
        <View style={[styles.abs, { left: s * 0.15, top: s * 0.15, width: sw, height: s * 0.2, backgroundColor: stroke }]} />
        <View style={[styles.abs, { left: s * 0.48, top: s * 0.65, width: sw, height: sw, backgroundColor: stroke, borderRadius: sw }]} />
      </>
    ),

    cluster: (
      <>
        <View style={[styles.abs, { left: s * 0.10, top: s * 0.10, width: s * 0.38, height: s * 0.28, borderRadius: 2, ...box }]} />
        <View style={[styles.abs, { left: s * 0.10, top: s * 0.10, width: s * 0.38, height: s * 0.28, borderRadius: 2, ...box }]} />        
        <View style={[styles.abs, { left: s * 0.10, top: s * 0.10, width: s * 0.38, height: s * 0.28, borderRadius: 2, ...box }]} />
        <View style={[styles.abs, { left: s * 0.10, top: s * 0.10, width: s * 0.38, height: s * 0.28, borderRadius: 2, ...box }]} />
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