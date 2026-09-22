import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { publicApi } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import Card from '../components/Card';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { colors, gradients, typography, spacing, borderRadius, shadows, STATUS_COLORS } from '../theme';

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
    } catch (err) {
      setError('Complaint not found. Check the ID and try again.');
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await track(true);
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0F172A', '#1E293B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Icon name="search" size={24} color={colors.primary} />
            </View>
            <Text style={styles.title}>Track Complaint</Text>
            <Text style={styles.subtitle}>
              Enter the complaint ID to check its current status
            </Text>
          </View>

          {/* Search Box */}
          <View style={styles.searchCard}>
            <Card variant="glass" style={styles.searchCardInner}>
              <View style={styles.searchRow}>
                <View style={styles.inputWrapper}>
                  <Icon name="search" size={20} color={colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter Complaint ID"
                    placeholderTextColor={colors.textMuted}
                    value={query}
                    onChangeText={setQuery}
                    keyboardType="numeric"
                  />
                </View>
                <TouchableOpacity
                  onPress={() => track()}
                  disabled={loading || !query.trim()}
                  style={styles.searchButton}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.searchButtonGradient}
                  >
                    <Icon name="search" size={20} color={colors.white} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <Icon name="alertCircle" size={16} color={colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}
            </Card>
          </View>

          {/* Result Card */}
          {result && (
            <View style={styles.resultSection}>
              {/* Header Card */}
              <Card variant="gradient" style={styles.resultCard}>
                <Text style={styles.resultTitle}>{result.title}</Text>

                <View style={styles.badgeRow}>
                  <StatusBadge status={result.status} size="sm" />
                  <View style={styles.departmentBadge}>
                    <Text style={styles.departmentText}>{result.department}</Text>
                  </View>
                </View>

                <Text style={styles.resultDescription}>{result.description}</Text>
              </Card>

              {/* Info Grid */}
              <Card variant="gradient" style={styles.infoCard}>
                <View style={styles.infoGrid}>
                  {[
                    { label: 'Complaint ID', value: result.id || result._id, icon: 'search' },
                    { label: 'Type', value: result.type?.replace(/_/g, ' '), icon: 'list' },
                    { label: 'Priority', value: result.priority ? `Level ${result.priority}` : null, icon: 'alertCircle' },
                    { label: 'Ward', value: result.ward, icon: 'mapPin' },
                    { label: 'City', value: result.city, icon: 'mapPin' },
                    { label: 'Assigned to', value: result.assignedOfficial?.name, icon: 'user' },
                    { label: 'Rating', value: result.satisfactionRating ? `${result.satisfactionRating}/5 ⭐` : null, icon: 'check' },
                  ]
                    .filter((item) => item.value)
                    .map((item, i) => (
                      <View key={i} style={styles.infoItem}>
                        <View style={styles.infoLeft}>
                          <Icon name={item.icon} size={16} color={colors.textDim} />
                          <Text style={styles.infoLabel}>{item.label}</Text>
                        </View>
                        <Text style={styles.infoValue}>{item.value}</Text>
                      </View>
                    ))}
                </View>
              </Card>

              {/* Timeline */}
              {(result.timeline || result.statusHistory || []).length > 0 && (
                <Card variant="gradient" style={styles.timelineCard}>
                  <View style={styles.timelineHeader}>
                    <Icon name="clock" size={20} color={colors.primary} />
                    <Text style={styles.timelineTitle}>Status Timeline</Text>
                  </View>

                  {(result.timeline || result.statusHistory || [])
                    .slice()
                    .reverse()
                    .map((entry, i) => (
                      <View key={i} style={styles.timelineItem}>
                        <View
                          style={[
                            styles.timelineDot,
                            { backgroundColor: STATUS_COLORS[entry.status] || colors.textMuted },
                          ]}
                        />
                        <View style={styles.timelineContent}>
                          <Text style={styles.timelineStatus}>
                            {entry.status?.replace('_', ' ')}
                          </Text>
                          {entry.note ? (
                            <Text style={styles.timelineNote}>{entry.note}</Text>
                          ) : null}
                          <Text style={styles.timelineDate}>
                            {new Date(entry.timestamp).toLocaleString()}
                          </Text>
                        </View>
                      </View>
                    ))}
                </Card>
              )}
            </View>
          )}

          {/* Empty State */}
          {!result && !error && !loading && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrapper}>
                <Icon name="search" size={48} color={colors.textDim} />
              </View>
              <Text style={styles.emptyTitle}>Track Your Complaint</Text>
              <Text style={styles.emptyText}>
                Enter your complaint ID above to see its current status and timeline
              </Text>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing['2xl'],
    paddingBottom: spacing['4xl'],
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSizes['3xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.fontSizes.base,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 300,
  },
  searchCard: {
    marginBottom: spacing['2xl'],
  },
  searchCardInner: {
    padding: spacing.lg,
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSizes.base,
    color: colors.text,
    paddingVertical: spacing.md,
  },
  searchButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  searchButtonGradient: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: `${colors.error}20`,
    borderRadius: borderRadius.md,
  },
  errorText: {
    flex: 1,
    fontSize: typography.fontSizes.sm,
    color: colors.error,
  },
  resultSection: {
    gap: spacing.lg,
  },
  resultCard: {
    padding: spacing['2xl'],
  },
  resultTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    marginBottom: spacing.lg,
    letterSpacing: -0.3,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  departmentBadge: {
    backgroundColor: `${colors.accent}30`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  departmentText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.accent,
  },
  resultDescription: {
    fontSize: typography.fontSizes.sm,
    color: colors.textMuted,
    lineHeight: 20,
  },
  infoCard: {
    padding: spacing['2xl'],
  },
  infoGrid: {
    gap: spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  infoLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.textMuted,
  },
  infoValue: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text,
    textTransform: 'capitalize',
  },
  timelineCard: {
    padding: spacing['2xl'],
  },
  timelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  timelineTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 6,
  },
  timelineContent: {
    flex: 1,
  },
  timelineStatus: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text,
    textTransform: 'capitalize',
    marginBottom: spacing.xs,
  },
  timelineNote: {
    fontSize: typography.fontSizes.sm,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  timelineDate: {
    fontSize: typography.fontSizes.xs,
    color: colors.textDim,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['5xl'],
  },
  emptyIconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['2xl'],
  },
  emptyTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSizes.base,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
  },
});
