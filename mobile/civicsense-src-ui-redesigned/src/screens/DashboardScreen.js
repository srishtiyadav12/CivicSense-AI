import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { dashboardApi } from '../api/client';
import Icon from '../components/Icon';
import { colors, font, space, radius, shadow } from '../theme';

const STAT_CONF = [
  { key: 'total', label: 'Total', color: colors.brand },
  { key: 'open', label: 'Open', color: colors.warning },
  { key: 'inProgress', label: 'In progress', color: colors.cyan },
  { key: 'resolved', label: 'Resolved', color: colors.success },
];

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await dashboardApi.getStats();
      setStats(res.data.stats);
    } catch {}
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
      >
        {/* Greeting header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.kicker}>CIVICSENSE AI</Text>
            <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'there'} 👋</Text>
            <Text style={styles.subtitle}>Make your neighbourhood better, one report at a time.</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Sign out</Text>
          </TouchableOpacity>
        </View>

        {/* Stat grid */}
        {stats && (
          <>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>Your activity</Text>
              <Text style={styles.sectionHint}>Overview</Text>
            </View>
            <View style={styles.grid}>
            {STAT_CONF.map((s) => (
              <View key={s.key} style={[styles.statCard, { borderTopColor: s.color }]}>
                <Text style={[styles.statValue, { color: s.color }]}>{stats[s.key] ?? 0}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
            </View>
          </>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('SubmitComplaint')}>
            <Icon name="upload" size={22} color={colors.white} strokeWidth={2.2} />
            <Text style={styles.actionText}>Report an issue</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionSecondary]}
            onPress={() => navigation.navigate('ComplaintsTab')}
          >
            <Icon name="list" size={22} color={colors.brand} strokeWidth={2.2} />
            <Text style={[styles.actionText, { color: colors.brand }]}>My complaints</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: space.lg, paddingTop: 18, paddingBottom: 12,
  },
  headerText: { flex: 1, paddingRight: 12 },
  kicker: { fontSize: font.xs, color: colors.brand, fontWeight: font.bold, letterSpacing: 1.8, marginBottom: 5 },
  greeting: { fontSize: font.xxl, fontWeight: font.bold, color: colors.textStrong, letterSpacing: -0.5 },
  subtitle: { fontSize: font.sm, color: colors.muted, marginTop: 5, lineHeight: 19 },
  logoutBtn: {
    paddingHorizontal: 11, paddingVertical: 8, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card,
  },
  logoutText: { fontSize: font.xs, color: colors.body, fontWeight: font.semibold },
  sectionHeading: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: space.lg, marginTop: 10, marginBottom: 10,
  },
  sectionTitle: { fontSize: font.lg, color: colors.textStrong, fontWeight: font.semibold },
  sectionHint: { fontSize: font.xs, color: colors.muted, fontWeight: font.medium },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: space.lg },
  statCard: {
    width: '47.5%', backgroundColor: colors.card, borderRadius: radius.lg, padding: 17,
    borderWidth: 1, borderColor: colors.line, borderTopWidth: 3, ...shadow.card,
  },
  statValue: { fontSize: 29, fontWeight: font.bold, marginBottom: 3 },
  statLabel: {
    fontSize: font.xs, color: colors.muted, textTransform: 'uppercase',
    letterSpacing: 0.7, fontWeight: font.semibold,
  },
  actions: { flexDirection: 'row', gap: 10, paddingHorizontal: space.lg, marginTop: 22 },
  actionBtn: {
    flex: 1, backgroundColor: colors.brand, borderRadius: radius.lg, paddingVertical: 17,
    alignItems: 'center', ...shadow.floating,
  },
  actionSecondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, shadowOpacity: 0, elevation: 0 },
  actionText: { color: colors.white, fontSize: font.sm + 1, fontWeight: font.semibold, marginTop: 8, textAlign: 'center' },
});