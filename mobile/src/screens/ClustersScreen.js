import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { clustersApi } from '../api/client';
import Icon from '../components/Icon';
import Card from '../components/Card';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';

export default function ClustersScreen({ navigation }) {
  const [clusters, setClusters] = useState([]);
  const [clusterStats, setClusterStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadClusters = useCallback(async () => {
    try {
      setError(null);
      console.log('📍 Fetching clusters...');
      const res = await clustersApi.getClusters();
      console.log('📍 Clusters data:', res.data);
      setClusters(res.data.clusters || []);
      setClusterStats(res.data.stats);
    } catch (err) {
      console.error('❌ Failed to load clusters:', err.response?.status, err.response?.data || err.message);
      setError('Could not load clusters. Pull down to try again.');
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadClusters();
      setLoading(false);
    })();
  }, [loadClusters]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClusters();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Issue Clusters</Text>
          <Text style={styles.subtitle}>Related reports grouped together</Text>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {clusterStats && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{clusterStats.total ?? clusters.length}</Text>
              <Text style={styles.statLabel}>Clusters</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{clusterStats.largest || 0}</Text>
              <Text style={styles.statLabel}>Largest</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{clusterStats.avgSize || 0}</Text>
              <Text style={styles.statLabel}>Avg Size</Text>
            </View>
          </View>
        )}

        <View style={styles.list}>
          {clusters.length === 0 && !error && (
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No clusters yet.</Text>
            </View>
          )}

          {clusters.map((cluster) => (
            <TouchableOpacity
              key={cluster.id}
              onPress={() => navigation.navigate('ClusterDetail', { clusterId: cluster.id })}
              activeOpacity={0.7}
              style={styles.cardWrapper}
            >
              <Card variant="glass" style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleWrapper}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {cluster.title}
                    </Text>
                  </View>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{cluster.memberCount}</Text>
                  </View>
                </View>

                <View style={styles.cardInfo}>
                  <View style={styles.typeTag}>
                    <Text style={styles.typeText}>{cluster.type}</Text>
                  </View>
                  <Text style={styles.location} numberOfLines={1}>
                    📍 {cluster.locAddress || 'Location not set'}
                  </Text>
                </View>

                <View style={styles.metrics}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Similarity</Text>
                    <View style={styles.similarityBar}>
                      <View
                        style={[
                          styles.similarityFill,
                          { width: `${(cluster.avgSimilarity || 0) * 100}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.metricValue}>
                      {((cluster.avgSimilarity || 0) * 100).toFixed(0)}%
                    </Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Priority</Text>
                    <View style={styles.priorityDots}>
                      {[1, 2, 3, 4].map((level) => (
                        <View
                          key={level}
                          style={[
                            styles.priorityDot,
                            { backgroundColor: level <= cluster.priority ? colors.primary : colors.textMuted },
                          ]}
                        />
                      ))}
                    </View>
                  </View>
                </View>

                <View style={styles.cardArrow}>
                  <Icon name="chevronRight" size={18} color={colors.primary} />
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: spacing['2xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing['3xl'] },
  header: { padding: spacing['2xl'], paddingBottom: spacing.lg },
  title: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  subtitle: { fontSize: typography.fontSizes.sm, color: colors.textMuted, marginTop: spacing.xs },
  errorBox: {
    marginHorizontal: spacing['2xl'],
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  errorText: { color: '#EF4444', fontSize: typography.fontSizes.sm },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing['2xl'],
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.2)',
  },
  statValue: { fontSize: typography.fontSizes.xl, fontWeight: typography.fontWeights.bold, color: colors.primary },
  statLabel: { fontSize: typography.fontSizes.xs, color: colors.textMuted, marginTop: spacing.xs },
  list: { paddingHorizontal: spacing['2xl'], gap: spacing.md },
  emptyText: { color: colors.textMuted, fontSize: typography.fontSizes.base },
  cardWrapper: { ...shadows.md },
  card: { padding: spacing.lg, borderLeftWidth: 4, borderLeftColor: colors.primary },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  cardTitleWrapper: { flex: 1 },
  cardTitle: { fontSize: typography.fontSizes.base, fontWeight: typography.fontWeights.semibold, color: colors.text },
  badge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.white, fontWeight: typography.fontWeights.bold, fontSize: typography.fontSizes.sm },
  cardInfo: { marginBottom: spacing.md },
  typeTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  typeText: {
    fontSize: typography.fontSizes.xs,
    color: colors.primary,
    fontWeight: typography.fontWeights.semibold,
    textTransform: 'capitalize',
  },
  location: { fontSize: typography.fontSizes.sm, color: colors.textMuted },
  metrics: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  metricItem: { flex: 1 },
  metricLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
    fontWeight: typography.fontWeights.semibold,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  similarityBar: {
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  similarityFill: { height: '100%', backgroundColor: colors.primary },
  metricValue: { fontSize: typography.fontSizes.sm, fontWeight: typography.fontWeights.bold, color: colors.primary },
  priorityDots: { flexDirection: 'row', gap: spacing.xs },
  priorityDot: { width: 6, height: 6, borderRadius: 3 },
  cardArrow: { position: 'absolute', right: spacing.lg, top: spacing.lg },
});