import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet, SafeAreaView, Dimensions, Modal, Button } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { dashboardApi } from '../api/client';
import Icon from '../components/Icon';
import Card from '../components/Card';
import { colors, gradients, typography, spacing, borderRadius, shadows } from '../theme';
import { LocationAlerts } from '../components/LocationAlerts';

const { width } = Dimensions.get('window');

const TAGLINES = {
  citizen: "Let's make your city better",
  official: 'Your assigned complaints at a glance',
  admin: 'Monitor and manage the whole platform',
};

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState('Good morning');
  const [nearbyAlert, setNearbyAlert] = useState(null);

  // ----- Role flags (role comes from the login response) -----
  const role = user?.role || 'citizen';
  const isAdmin = role === 'admin';
  const isOfficial = role === 'official';
  const isCitizen = !isAdmin && !isOfficial;

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    load();
  }, []);

  const load = async () => {
    try {
      const statsRes = await dashboardApi.getStats();
      setStats(statsRes.data.stats);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleNearbyComplaints = (complaints) => {
    if (complaints.length > 0) {
      const closest = complaints[0];
      setNearbyAlert({
        title: '⚠️ Issues Nearby!',
        type: closest.type,
        distance: Math.round(closest.distance_meters),
        complaint: closest
      });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const firstName = user?.name?.split(' ')[0] || 'there';
  const initial = user?.name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <SafeAreaView style={styles.container}>
      {/* Nearby-issue alerts are for citizens only */}
      {isCitizen && <LocationAlerts onNearbyComplaints={handleNearbyComplaints} />}

      {/* Nearby Alert Modal */}
      <Modal visible={!!nearbyAlert} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: 'white', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
              {nearbyAlert?.title}
            </Text>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>
              📍 {nearbyAlert?.distance}m away
            </Text>
            <Text style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>
              🏷️ {nearbyAlert?.type?.toUpperCase()}
            </Text>
            <Text style={{ fontSize: 13, color: '#888', marginBottom: 15 }}>
              {nearbyAlert?.complaint?.title}
            </Text>
            <Button
              onPress={() => setNearbyAlert(null)}
              title="Dismiss"
              color="#007AFF"
            />
          </View>
        </View>
      </Modal>

      <LinearGradient
        colors={isAdmin ? ['#1E1B4B', '#0F172A'] : ['#0F172A', '#1E293B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
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
            <View style={styles.headerText}>
              <Text style={styles.greeting}>{greeting},</Text>
              <Text style={styles.userName}>{firstName}</Text>
              {!isCitizen && (
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>{isAdmin ? 'Admin' : 'Official'}</Text>
                </View>
              )}
              <Text style={styles.tagline}>{TAGLINES[role] || TAGLINES.citizen}</Text>
            </View>

            <TouchableOpacity
              onPress={logout}
              style={styles.avatar}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarText}>{initial}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Report Hero Card - citizens only */}
          {isCitizen && (
            <TouchableOpacity
              onPress={() => navigation.navigate('SubmitComplaint')}
              activeOpacity={0.9}
              style={styles.heroCard}
            >
              <LinearGradient
                colors={gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroGradient}
              >
                <View style={styles.heroIconWrapper}>
                  <Icon name="upload" size={24} color={colors.white} />
                </View>
                <Text style={styles.heroTitle}>Report an Issue</Text>
                <Text style={styles.heroSubtitle}>
                  See something that needs fixing? Report it now.
                </Text>
                <View style={styles.heroArrow}>
                  <Icon name="chevronRight" size={20} color={colors.white} />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Activity Status */}
          {stats && (
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>
                {isAdmin ? 'All Complaints' : isOfficial ? 'Assigned to You' : 'Your Activity'}
              </Text>
              <View style={styles.activityCard}>
                <View style={styles.activityHeader}>
                  <Text style={styles.activityTitle}>
                    📊 {isAdmin ? 'Platform Summary' : isOfficial ? 'My Workload' : 'Activity Summary'}
                  </Text>
                  <Text style={styles.totalReports}>{stats.total} Total Reports</Text>
                </View>

                <View style={styles.activityItem}>
                  <View style={styles.activityItemLeft}>
                    <Text style={styles.activityItemIcon}>🔴</Text>
                    <View style={styles.activityItemText}>
                      <Text style={styles.activityItemNumber}>{stats.open}</Text>
                      <Text style={styles.activityItemLabel}>Open</Text>
                    </View>
                  </View>
                  <Text style={styles.activityItemDescription}>
                    {isCitizen ? 'Need review' : 'Awaiting action'}
                  </Text>
                </View>

                <View style={styles.activityItem}>
                  <View style={styles.activityItemLeft}>
                    <Text style={styles.activityItemIcon}>⏳</Text>
                    <View style={styles.activityItemText}>
                      <Text style={styles.activityItemNumber}>{stats.inProgress}</Text>
                      <Text style={styles.activityItemLabel}>Progress</Text>
                    </View>
                  </View>
                  <Text style={styles.activityItemDescription}>Being fixed</Text>
                </View>

                <View style={styles.activityItem}>
                  <View style={styles.activityItemLeft}>
                    <Text style={styles.activityItemIcon}>✅</Text>
                    <View style={styles.activityItemText}>
                      <Text style={styles.activityItemNumber}>{stats.resolved}</Text>
                      <Text style={styles.activityItemLabel}>Resolved</Text>
                    </View>
                  </View>
                  <Text style={styles.activityItemDescription}>Completed</Text>
                </View>
              </View>
            </View>
          )}

          {/* Quick Actions */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsContainer}>
            {/* Complaints - everyone, label changes by role */}
            <TouchableOpacity
              onPress={() => navigation.navigate('ComplaintsTab')}
              style={styles.actionCardLarge}
              activeOpacity={0.8}
            >
              <Card variant="glass" style={styles.actionCardInner}>
                <View style={styles.actionIconWrapperLarge}>
                  <Icon name="list" size={24} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionTitle}>
                    {isAdmin ? 'All Complaints' : isOfficial ? 'Assigned Complaints' : 'My Complaints'}
                  </Text>
                  <Text style={styles.actionSubtitle}>
                    {isCitizen ? 'View & track reports' : 'Review & update status'}
                  </Text>
                </View>
                <Icon name="chevronRight" size={20} color={colors.textMuted} />
              </Card>
            </TouchableOpacity>

            {/* Track Status - everyone */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Tracking')}
              style={styles.actionCardLarge}
              activeOpacity={0.8}
            >
              <Card variant="glass" style={styles.actionCardInner}>
                <View style={styles.actionIconWrapperLarge}>
                  <Icon name="search" size={24} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionTitle}>Track Status</Text>
                  <Text style={styles.actionSubtitle}>Search by ID</Text>
                </View>
                <Icon name="chevronRight" size={20} color={colors.textMuted} />
              </Card>
            </TouchableOpacity>

            {/* View Clusters - admin only */}
            {isAdmin && (
              <TouchableOpacity
                onPress={() => navigation.navigate('ClustersTab')}
                style={styles.actionCardLarge}
                activeOpacity={0.8}
              >
                <Card variant="glass" style={styles.actionCardInner}>
                  <View style={styles.actionIconWrapperLarge}>
                    <Icon name="map" size={24} color="#8B5CF6" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.actionTitle}>View Clusters</Text>
                    <Text style={styles.actionSubtitle}>Group related issues</Text>
                  </View>
                  <Icon name="chevronRight" size={20} color={colors.textMuted} />
                </Card>
              </TouchableOpacity>
            )}

            {/* User Management - admin only */}
            {isAdmin && (
              <TouchableOpacity
                onPress={() => navigation.navigate('UserManagement')}
                style={styles.actionCardLarge}
                activeOpacity={0.8}
              >
                <Card variant="glass" style={styles.actionCardInner}>
                  <View style={styles.actionIconWrapperLarge}>
                    {/* If "users" is not in your Icon component, use an existing name such as "list" */}
                    <Icon name="users" size={24} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.actionTitle}>User Management</Text>
                    <Text style={styles.actionSubtitle}>Manage citizens & officials</Text>
                  </View>
                  <Icon name="chevronRight" size={20} color={colors.textMuted} />
                </Card>
              </TouchableOpacity>
            )}
          </View>

          <View style={{ height: spacing['2xl'] }} />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing['2xl'],
    paddingTop: spacing.xl,
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: typography.fontSizes.base,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  userName: {
    fontSize: typography.fontSizes['3xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  roleBadgeText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: '#C4B5FD',
  },
  tagline: {
    fontSize: typography.fontSizes.sm,
    color: colors.textDim,
  },
  avatar: {
    marginLeft: spacing.lg,
  },
  avatarGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  avatarText: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.white,
  },
  heroCard: {
    marginHorizontal: spacing['2xl'],
    marginBottom: spacing['3xl'],
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    ...shadows.xl,
  },
  heroGradient: {
    padding: spacing['2xl'],
    minHeight: 160,
    justifyContent: 'center',
  },
  heroIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  heroTitle: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  heroSubtitle: {
    fontSize: typography.fontSizes.base,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
  },
  heroArrow: {
    position: 'absolute',
    right: spacing['2xl'],
    top: spacing['2xl'],
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    marginHorizontal: spacing['2xl'],
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  statsSection: {
    marginBottom: spacing['2xl'],
  },
  statsOverview: {
    flexDirection: 'row',
    paddingHorizontal: spacing['2xl'],
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  statPill: {
    flex: 1,
    backgroundColor: 'rgba(79, 70, 229, 0.15)',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.25)',
  },
  statPillNumber: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statPillLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
    fontWeight: typography.fontWeights.semibold,
  },
  actionsContainer: {
    paddingHorizontal: spacing['2xl'],
    marginBottom: spacing['3xl'],
    gap: spacing.md,
  },
  actionCardLarge: {
    ...shadows.md,
  },
  actionCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.lg,
  },
  actionIconWrapperLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  actionSubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
  },
  activityCard: {
    marginHorizontal: spacing['2xl'],
    marginBottom: spacing['2xl'],
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.2)',
  },
  activityHeader: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(79, 70, 229, 0.2)',
  },
  activityTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  totalReports: {
    fontSize: typography.fontSizes.sm,
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: spacing.sm,
  },
  activityItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  activityItemIcon: {
    fontSize: typography.fontSizes['2xl'],
  },
  activityItemText: {
    alignItems: 'flex-start',
  },
  activityItemNumber: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  activityItemLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  activityItemDescription: {
    fontSize: typography.fontSizes.base,
    color: colors.textMuted,
  },
});