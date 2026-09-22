import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, ScrollView, RefreshControl,
} from 'react-native';
import { publicApi } from '../api/client';

const STATUS_COLORS = {
  submitted: '#5b67f5', under_review: '#14b8a6', assigned: '#8b5cf6',
  in_progress: '#f59e0b', resolved: '#10b981', rejected: '#f43f5e', reopened: '#6366f1',
};

export default function TrackingScreen() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const track = async (refresh = false) => {
    const id = query.trim();
    if (!id) return;
    setLoading(true);
    setError('');
    if (!refresh) setResult(null);
    try {
      const res = await publicApi.track(id);
      setResult(res.data.complaint);
    } catch {
      setError('Complaint not found. Check the ID and try again.');
    }
    setLoading(false);
  };

  const onRefresh = async () => { setRefreshing(true); await track(true); setRefreshing(false); };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5b67f5" />}>
      <Text style={styles.heading}>Track a complaint</Text>
      <Text style={styles.sub}>Enter the complaint ID to check its current status.</Text>

      <View style={styles.searchRow}>
        <TextInput style={styles.input} placeholder="Complaint ID" value={query}
          onChangeText={setQuery} keyboardType="numeric" placeholderTextColor="#94a3b8" />
        <TouchableOpacity style={styles.searchBtn} onPress={() => track()} disabled={loading || !query.trim()}>
          {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.searchBtnText}>Track</Text>}
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {result && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{result.title}</Text>
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: STATUS_COLORS[result.status] || '#94a3b8' }]}>
              <Text style={styles.badgeText}>{result.status?.replace('_', ' ')}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: '#eef2ff' }]}>
              <Text style={[styles.badgeText, { color: '#5b67f5' }]}>{result.department}</Text>
            </View>
          </View>

          <View style={styles.infoGrid}>
            {[
              { label: 'Ward', value: result.ward },
              { label: 'City', value: result.city },
              { label: 'Type', value: result.type?.replace(/_/g, ' ') },
              { label: 'Priority', value: result.priority ? `Level ${result.priority}` : null },
              { label: 'Assigned to', value: result.assignedOfficial?.name },
              { label: 'Rating', value: result.satisfactionRating ? `${result.satisfactionRating}/5 ⭐` : null },
            ].filter((r) => r.value).map((r, i) => (
              <View key={i} style={styles.infoItem}>
                <Text style={styles.infoLabel}>{r.label}</Text>
                <Text style={styles.infoValue}>{r.value}</Text>
              </View>
            ))}
          </View>

          {(result.timeline || []).length > 0 && (
            <View style={styles.tlSection}>
              <Text style={styles.tlTitle}>Timeline</Text>
              {result.timeline.slice().reverse().map((entry, i) => (
                <View key={i} style={styles.tlItem}>
                  <View style={[styles.tlDot, { backgroundColor: STATUS_COLORS[entry.status] || '#94a3b8' }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tlStatus}>{entry.status?.replace('_', ' ')}</Text>
                    {entry.note ? <Text style={styles.tlNote}>{entry.note}</Text> : null}
                    <Text style={styles.tlDate}>{new Date(entry.timestamp).toLocaleDateString()}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20, paddingTop: 18 },
  heading: { fontSize: font.xxl, fontWeight: font.bold, color: colors.textStrong, marginBottom: 5, letterSpacing: -0.5 },
  sub: { fontSize: font.sm, color: colors.muted, marginBottom: 18, lineHeight: 19 },
  searchRow: { flexDirection: 'row', gap: 9, alignItems: 'stretch' },
  input: {
    flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 14,
    fontSize: font.md, color: colors.textStrong,
  },
  searchBtn: { backgroundColor: colors.brand, borderRadius: radius.md, paddingHorizontal: 20, justifyContent: 'center', ...shadow.floating },
  searchBtnText: { color: colors.white, fontSize: font.sm, fontWeight: font.semibold },
  error: {
    color: colors.danger, fontSize: font.sm, marginTop: 12, backgroundColor: '#FFF3F3',
    padding: 11, borderRadius: radius.md,
  },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: 17, marginTop: 18,
    borderWidth: 1, borderColor: colors.line, ...shadow.card,
  },
  cardTitle: { fontSize: font.lg, fontWeight: font.semibold, color: colors.textStrong, marginBottom: 11 },
  badges: { flexDirection: 'row', gap: 8, marginBottom: 15 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  badgeText: { color: colors.white, fontSize: font.xs, fontWeight: font.semibold, textTransform: 'capitalize' },
  infoGrid: { gap: 0, marginBottom: 13 },
  infoItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.line },
  infoLabel: { fontSize: font.xs, color: colors.muted },
  infoValue: { maxWidth: '62%', textAlign: 'right', fontSize: font.xs, color: colors.textStrong, fontWeight: font.semibold, textTransform: 'capitalize' },
  tlSection: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 15, marginTop: 4 },
  tlTitle: { fontSize: font.md, fontWeight: font.semibold, color: colors.textStrong, marginBottom: 12 },
  tlItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 13 },
  tlDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  tlStatus: { fontSize: font.sm, fontWeight: font.semibold, color: colors.textStrong, textTransform: 'capitalize' },
  tlNote: { fontSize: font.xs + 1, color: colors.body, marginTop: 3 },
  tlDate: { fontSize: font.xs, color: colors.faint, marginTop: 3 },
});
