import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { dashboardApi } from '../api/client';
import Card from '../components/Card';
import Icon from '../components/Icon';
import { colors, gradients, typography, spacing, borderRadius, shadows, STATUS_COLORS } from '../theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing['2xl'] * 2 - spacing.md) / 2;

export default function AnalyticsScreen() {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, trendsRes] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getTrends(),
      ]);
      setStats(statsRes.data.stats);
      setTrends(trendsRes.data.trends);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const overviewCards = [
    {
      title: 'Total Complaints',
      value: stats?.total || 0,
      icon: 'list',
      gradient: gradients.primary,
      change: '+12%',
      changePositive: true,
    },
    {
      title: 'Resolved',
      value: stats?.resolved || 0,
      icon: 'check',
      gradient: gradients.success,
      change: '+8%',
      changePositive: true,
    },
    {
      title: 'In Progress',
      value: stats?.inProgress || 0,
      icon: 'clock',
      gradient: gradients.warning,
      change: '-5%',
      changePositive: false,
    },
    {
      title: 'Pending',
      value: stats?.open || 0,
      icon: 'alertCircle',
      gradient: ['#3B82F6', '#06B6D4'],
      change: '+3%',
      changePositive: true,
    },
  ];

  const categoryData = [
    { label: 'Potholes', value: 45, color: '#F59E0B' },
    { label: 'Garbage', value: 30, color: '#EF4444' },
    { label: 'Streetlights', value: 15, color: '#FBBF24' },
    { label: 'Water', value: 10, color: '#3B82F6' },
  ];

  const responseTimeData = [
    { label: 'Under 24h', value: 65, color: '#10B981' },
    { label: '1-3 days', value: 25, color: '#F59E0B' },
    { label: '3+ days', value: 10, color: '#EF4444' },
  ];

  const departmentPerformance = [
    { name: 'Public Works', resolved: 156, total: 180, percentage: 87 },
    { name: 'Sanitation', resolved: 89, total: 110, percentage: 81 },
    { name: 'Water Dept', resolved: 45, total: 62, percentage: 73 },
    { name: 'Electricity', resolved: 67, total: 85, percentage: 79 },
  ];

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
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Analytics</Text>
            <Text style={styles.subtitle}>
              Insights and performance metrics
            </Text>
          </View>

          {/* Overview Cards Grid */}
          <View style={styles.cardsGrid}>
            {overviewCards.map((card, index) => (
              <View key={index} style={styles.statCardWrapper}>
                <LinearGradient
                  colors={card.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.statCard}
                >
                  <View style={styles.statIconWrapper}>
                    <Icon name={card.icon} size={20} color={colors.white} />
                  </View>
                  <Text style={styles.statValue}>{card.value}</Text>
                  <Text style={styles.statTitle}>{card.title}</Text>
                  <View style={styles.statChange}>
                    <Text
                      style={[
                        styles.statChangeText,
                        { color: card.changePositive ? '#34D399' : '#F87171' },
                      ]}
                    >
                      {card.change}
                    </Text>
                  </View>
                </LinearGradient>
              </View>
            ))}
          </View>

          {/* Category Distribution */}
          <Card variant="gradient" style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Icon name="list" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>By Category</Text>
            </View>

            {categoryData.map((item, index) => (
              <View key={index} style={styles.dataRow}>
                <View style={styles.dataLeft}>
                  <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                  <Text style={styles.dataLabel}>{item.label}</Text>
                </View>
                <View style={styles.dataRight}>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${item.value}%`, backgroundColor: item.color },
                      ]}
                    />
                  </View>
                  <Text style={styles.dataValue}>{item.value}%</Text>
                </View>
              </View>
            ))}
          </Card>

          {/* Response Time */}
          <Card variant="gradient" style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Icon name="clock" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Response Time</Text>
            </View>

            {responseTimeData.map((item, index) => (
              <View key={index} style={styles.dataRow}>
                <View style={styles.dataLeft}>
                  <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                  <Text style={styles.dataLabel}>{item.label}</Text>
                </View>
                <View style={styles.dataRight}>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${item.value}%`, backgroundColor: item.color },
                      ]}
                    />
                  </View>
                  <Text style={styles.dataValue}>{item.value}%</Text>
                </View>
              </View>
            ))}
          </Card>

          {/* Department Performance */}
          <Card variant="gradient" style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Icon name="check" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Department Performance</Text>
            </View>

            {departmentPerformance.map((dept, index) => (
              <View key={index} style={styles.deptRow}>
                <View style={styles.deptInfo}>
                  <Text style={styles.deptName}>{dept.name}</Text>
                  <Text style={styles.deptStats}>
                    {dept.resolved} / {dept.total} resolved
                  </Text>
                </View>
                <View style={styles.deptPercentage}>
                  <LinearGradient
                    colors={
                      dept.percentage >= 80
                        ? gradients.success
                        : dept.percentage >= 60
                        ? gradients.warning
                        : ['#EF4444', '#F87171']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.percentageBadge}
                  >
                    <Text style={styles.percentageText}>{dept.percentage}%</Text>
                  </LinearGradient>
                </View>
              </View>
            ))}
          </Card>

          {/* Weekly Trend (Simplified) */}
          <Card variant="gradient" style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Icon name="alertCircle" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Weekly Trend</Text>
            </View>

            <View style={styles.chartContainer}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                const height = Math.random() * 80 + 20; // Random height for demo
                return (
                  <View key={index} style={styles.barContainer}>
                    <View style={styles.barWrapper}>
                      <LinearGradient
                        colors={gradients.primary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={[styles.bar, { height: `${height}%` }]}
                      />
                    </View>
                    <Text style={styles.barLabel}>{day}</Text>
                  </View>
                );
              })}
            </View>
          </Card>
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
    marginBottom: spacing['2xl'],
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
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing['2xl'],
  },
  statCardWrapper: {
    width: CARD_WIDTH,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  statCard: {
    padding: spacing.lg,
    minHeight: 140,
  },
  statIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  statValue: {
    fontSize: typography.fontSizes['3xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  statTitle: {
    fontSize: typography.fontSizes.xs,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: spacing.sm,
  },
  statChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statChangeText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
  },
  sectionCard: {
    padding: spacing['2xl'],
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  dataLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dataLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.text,
  },
  dataRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  progressBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  dataValue: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text,
    minWidth: 40,
    textAlign: 'right',
  },
  deptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  deptInfo: {
    flex: 1,
  },
  deptName: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  deptStats: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
  },
  deptPercentage: {
    marginLeft: spacing.md,
  },
  percentageBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    minWidth: 60,
    alignItems: 'center',
  },
  percentageText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.white,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    marginTop: spacing.md,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 2,
  },
  barWrapper: {
    width: '100%',
    height: 120,
    justifyContent: 'flex-end',
    marginBottom: spacing.sm,
  },
  bar: {
    width: '100%',
    borderRadius: borderRadius.sm,
    minHeight: 20,
  },
  barLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
