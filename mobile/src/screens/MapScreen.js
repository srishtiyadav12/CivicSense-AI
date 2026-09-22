import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { complaintApi } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import Card from '../components/Card';
import Icon from '../components/Icon';
import { colors, gradients, typography, spacing, borderRadius, shadows, STATUS_COLORS } from '../theme';

const { width } = Dimensions.get('window');

const FILTERS = [
  { key: 'all', label: 'All', icon: 'list' },
  { key: 'submitted', label: 'New', icon: 'alertCircle' },
  { key: 'in_progress', label: 'Active', icon: 'clock' },
  { key: 'resolved', label: 'Resolved', icon: 'check' },
];

export default function MapScreen({ navigation }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    requestLocation();
    loadComplaints();
  }, []);

  const requestLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      }
    } catch (err) {
      console.log('Location error:', err);
    }
  };

  const loadComplaints = async () => {
    try {
      const res = await complaintApi.getAll({ page: 1, limit: 100 });
      const complaintsData = res.data.complaints || [];
      setComplaints(complaintsData);
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredComplaints = filter === 'all'
    ? complaints
    : complaints.filter(c => c.status === filter);

  // Group complaints by area/ward
  const groupedComplaints = filteredComplaints.reduce((acc, complaint) => {
    const area = complaint.ward || complaint.city || 'Unknown Area';
    if (!acc[area]) {
      acc[area] = [];
    }
    acc[area].push(complaint);
    return acc;
  }, {});

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return (R * c).toFixed(1);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading nearby complaints...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0F172A', '#1E293B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>Nearby Complaints</Text>
              <Text style={styles.subtitle}>
                {location ? 'Based on your location' : 'All areas'}
              </Text>
            </View>
            <View style={styles.locationBadge}>
              <Icon name="mapPin" size={16} color={colors.primary} />
              <Text style={styles.locationText}>
                {location ? 'Location ON' : 'Location OFF'}
              </Text>
            </View>
          </View>

          {/* Filter Bar */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {FILTERS.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.filterButton,
                  filter === item.key && styles.filterButtonActive,
                ]}
                onPress={() => setFilter(item.key)}
                activeOpacity={0.8}
              >
                {filter === item.key ? (
                  <LinearGradient
                    colors={gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.filterButtonGradient}
                  >
                    <Icon name={item.icon} size={16} color={colors.white} />
                    <Text style={styles.filterTextActive}>{item.label}</Text>
                  </LinearGradient>
                ) : (
                  <>
                    <Icon name={item.icon} size={16} color={colors.textMuted} />
                    <Text style={styles.filterText}>{item.label}</Text>
                  </>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Stats Card */}
        <Card variant="gradient" style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{filteredComplaints.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Object.keys(groupedComplaints).length}</Text>
              <Text style={styles.statLabel}>Areas</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {filteredComplaints.filter(c => c.status === 'resolved').length}
              </Text>
              <Text style={styles.statLabel}>Resolved</Text>
            </View>
          </View>
        </Card>

        {/* Complaints by Area */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {Object.entries(groupedComplaints).map(([area, areaComplaints], index) => (
            <Card key={area} variant="gradient" style={styles.areaCard}>
              <View style={styles.areaHeader}>
                <View style={styles.areaIconWrapper}>
                  <Icon name="mapPin" size={20} color={colors.primary} />
                </View>
                <View style={styles.areaInfo}>
                  <Text style={styles.areaName}>{area}</Text>
                  <Text style={styles.areaCount}>
                    {areaComplaints.length} complaint{areaComplaints.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>

              {areaComplaints.slice(0, 3).map((complaint, idx) => {
                const distance = location && complaint.location?.coordinates
                  ? calculateDistance(
                      location.latitude,
                      location.longitude,
                      complaint.location.coordinates[1],
                      complaint.location.coordinates[0]
                    )
                  : null;

                return (
                  <TouchableOpacity
                    key={complaint._id || complaint.id}
                    style={styles.complaintItem}
                    onPress={() => navigation.navigate('ComplaintDetail', { id: complaint._id || complaint.id })}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.statusIndicator,
                        { backgroundColor: STATUS_COLORS[complaint.status] || colors.textMuted }
                      ]}
                    />
                    <View style={styles.complaintContent}>
                      <Text style={styles.complaintTitle} numberOfLines={1}>
                        {complaint.title}
                      </Text>
                      <Text style={styles.complaintDescription} numberOfLines={1}>
                        {complaint.description}
                      </Text>
                      <View style={styles.complaintFooter}>
                        <StatusBadge status={complaint.status} size="sm" />
                        {distance && (
                          <View style={styles.distanceBadge}>
                            <Icon name="mapPin" size={12} color={colors.textDim} />
                            <Text style={styles.distanceText}>{distance} km</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <Icon name="chevronRight" size={20} color={colors.textDim} />
                  </TouchableOpacity>
                );
              })}

              {areaComplaints.length > 3 && (
                <TouchableOpacity
                  style={styles.viewMoreButton}
                  onPress={() => navigation.navigate('ComplaintsTab')}
                >
                  <Text style={styles.viewMoreText}>
                    View {areaComplaints.length - 3} more in {area}
                  </Text>
                  <Icon name="chevronRight" size={16} color={colors.primary} />
                </TouchableOpacity>
              )}
            </Card>
          ))}

          {filteredComplaints.length === 0 && (
            <Card variant="gradient" style={styles.emptyCard}>
              <View style={styles.emptyIconWrapper}>
                <Icon name="mapPin" size={48} color={colors.textDim} />
              </View>
              <Text style={styles.emptyTitle}>No complaints found</Text>
              <Text style={styles.emptyText}>
                Try changing the filter or check back later
              </Text>
            </Card>
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: typography.fontSizes.base,
    color: colors.textMuted,
    marginTop: spacing.lg,
  },
  header: {
    padding: spacing['2xl'],
    paddingBottom: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSizes['3xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.fontSizes.sm,
    color: colors.textMuted,
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  locationText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.primary,
  },
  filterScroll: {
    gap: spacing.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  filterButtonGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  filterText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.textMuted,
  },
  filterTextActive: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.white,
  },
  statsCard: {
    marginHorizontal: spacing['2xl'],
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  scrollContent: {
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['4xl'],
  },
  areaCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  areaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  areaIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  areaInfo: {
    flex: 1,
  },
  areaName: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  areaCount: {
    fontSize: typography.fontSizes.sm,
    color: colors.textMuted,
  },
  complaintItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statusIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: spacing.md,
  },
  complaintContent: {
    flex: 1,
  },
  complaintTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  complaintDescription: {
    fontSize: typography.fontSizes.sm,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  complaintFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  distanceText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textDim,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  viewMoreText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.primary,
  },
  emptyCard: {
    padding: spacing['3xl'],
    alignItems: 'center',
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
  },
});
