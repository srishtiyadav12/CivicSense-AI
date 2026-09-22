import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { complaintApi } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import Icon from '../components/Icon';
import { colors, font, space, radius, PRIORITY_COLORS, shadow } from '../theme';

export default function ComplaintsScreen({ navigation }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const load = async (p = 1, append = false) => {
    try {
      const res = await complaintApi.getAll({ page: p, limit: 20 });
      const items = res.data.complaints || [];
      setComplaints((prev) => append ? [...prev, ...items] : items);
      setHasMore(items.length >= 20);
    } catch {}
  };

  useEffect(() => { load(); }, []);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  const loadMore = () => { if (hasMore && !loading) { setPage((p) => { const np = p + 1; load(np, true); return np; }); } };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ComplaintDetail', { id: item._id || item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <StatusBadge status={item.status} outline />
      </View>
      <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.cardMeta}>{item.department}</Text>
        <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[item.priority] || '#ca8a04' }]} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading && complaints.length === 0 ? (
        <ActivityIndicator size="large" color={colors.brand} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={complaints}
          keyExtractor={(item) => String(item._id || item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: space.lg }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={<Text style={styles.empty}>No complaints yet. Tap the button below to report one.</Text>}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('SubmitComplaint')}>
        <Icon name="plus" size={26} color={colors.white} strokeWidth={2.4} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, marginBottom: 11,
    borderWidth: 1, borderColor: colors.line, ...shadow.card,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 },
  titleWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingRight: 8 },
  typeDot: { width: 7, height: 7, borderRadius: 4, marginRight: 9 },
  cardTitle: { flex: 1, fontSize: font.md, fontWeight: font.semibold, color: colors.textStrong },
  cardDesc: { fontSize: font.sm, color: colors.body, lineHeight: 19, marginBottom: 13 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 11, borderTopWidth: 1, borderTopColor: colors.line },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardMeta: { fontSize: font.xs, color: colors.muted, fontWeight: font.medium },
  priorityDot: { width: 10, height: 10, borderRadius: 5 },
  emptyWrap: { alignItems: 'center', paddingTop: 70, paddingHorizontal: 28 },
  empty: { textAlign: 'center', color: colors.body, marginTop: 12, fontSize: font.md, fontWeight: font.semibold },
  emptySub: { textAlign: 'center', color: colors.faint, marginTop: 5, fontSize: font.sm },
  fab: {
    position: 'absolute', bottom: 22, right: 20, width: 58, height: 58, borderRadius: 29,
    backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', ...shadow.floating,
  },
});