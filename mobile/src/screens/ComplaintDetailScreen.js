import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  RefreshControl,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { complaintApi, getApiBase } from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import Card from '../components/Card';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { colors, gradients, typography, spacing, borderRadius, shadows, STATUS_COLORS } from '../theme';

const API_BASE = getApiBase();
const STATUSES = ['under_review', 'assigned', 'in_progress', 'resolved', 'rejected'];

export default function ComplaintDetailScreen({ route }) {
  const { id } = route.params;
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [note, setNote] = useState('');
  const [updating, setUpdating] = useState(false);

  // Citizen review state
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [reopenBusy, setReopenBusy] = useState(false);

  const canManage = user?.role === 'official' || user?.role === 'admin' || user?.role === 'super_admin';
  const ownerId = complaint?.reportedBy?._id ?? complaint?.reportedBy?.id;
  const signedInId = user?._id ?? user?.id;
  const isOwner = ownerId != null && signedInId != null && Number(ownerId) === Number(signedInId);

  const load = async () => {
    try {
      const res = await complaintApi.getById(id);
      setComplaint(res.data.complaint);
    } catch (err) {
      console.error('Failed to load complaint:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleStatus = async () => {
    if (!newStatus) return;
    setUpdating(true);
    try {
      await complaintApi.updateStatus(id, { status: newStatus, note: note.trim() });
      setNewStatus('');
      setNote('');
      await load();
      Alert.alert('Success', 'Status updated successfully');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update');
    }
    setUpdating(false);
  };

  const handleRate = async () => {
    if (!rating) return;
    setReviewBusy(true);
    try {
      await complaintApi.rate(id, { rating, feedback: feedback.trim() });
      Alert.alert('Thank you!', 'Your review has been submitted.');
      await load();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit rating');
    }
    setReviewBusy(false);
  };

  const handleReopen = async () => {
    if (!reopenReason.trim()) {
      Alert.alert('Required', 'Please provide a reason.');
      return;
    }
    setReopenBusy(true);
    try {
      await complaintApi.reopen(id, { reason: reopenReason.trim() });
      Alert.alert('Reopened', 'Your complaint has been sent back for review.');
      setReopenReason('');
      await load();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to reopen');
    }
    setReopenBusy(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!complaint) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.notFoundText}>Complaint not found</Text>
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
          {/* Header Card */}
          <Card variant="gradient" style={styles.headerCard}>
            <Text style={styles.title}>{complaint.title}</Text>

            <View style={styles.badgeRow}>
              <StatusBadge status={complaint.status} size="sm" />
              <View style={styles.departmentBadge}>
                <Text style={styles.departmentText}>{complaint.department}</Text>
              </View>
            </View>

            <Text style={styles.description}>{complaint.description}</Text>

            {/* Images */}
            {complaint.images?.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.imageScroll}
              >
                {complaint.images.map((img, i) => {
                  const src = typeof img === 'string' ? img : img?.url || '';
                  const uri = src.startsWith('/uploads/') ? API_BASE + src : src;
                  return (
                    <Image
                      key={i}
                      source={{ uri }}
                      style={styles.image}
                    />
                  );
                })}
              </ScrollView>
            )}
          </Card>

          {/* Timeline Card */}
          <Card variant="gradient" style={styles.timelineCard}>
            <View style={styles.cardHeader}>
              <Icon name="clock" size={20} color={colors.primary} />
              <Text style={styles.cardTitle}>Status Timeline</Text>
            </View>

            {(complaint.statusHistory || []).slice().reverse().map((entry, i) => (
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

          {/* Citizen Review Card */}
          {isOwner && complaint.status === 'resolved' && (
            <Card variant="gradient" style={styles.reviewCard}>
              <Text style={styles.cardTitle}>How was your experience?</Text>

              {complaint.satisfactionRating ? (
                <View style={styles.existingReview}>
                  <Text style={styles.existingRatingText}>
                    You rated this {complaint.satisfactionRating}/5 ⭐
                  </Text>
                  {complaint.feedback ? (
                    <Text style={styles.existingFeedback}>"{complaint.feedback}"</Text>
                  ) : null}
                </View>
              ) : (
                <View>
                  <Text style={styles.rateLabel}>Tap to rate:</Text>
                  <View style={styles.starRow}>
                    {[1, 2, 3, 4, 5].map((v) => (
                      <TouchableOpacity key={v} onPress={() => setRating(v)}>
                        <Text
                          style={[
                            styles.star,
                            { color: v <= rating ? colors.warning : colors.textDim },
                          ]}
                        >
                          ★
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TextInput
                    style={styles.input}
                    multiline
                    placeholder="Feedback (optional)"
                    placeholderTextColor={colors.textMuted}
                    value={feedback}
                    onChangeText={setFeedback}
                  />

                  <Button
                    onPress={handleRate}
                    loading={reviewBusy}
                    disabled={!rating}
                    gradient
                    style={styles.smallButton}
                  >
                    Submit Review
                  </Button>
                </View>
              )}

              {/* Reopen Section */}
              <View style={styles.divider} />
              <Text style={styles.reopenLabel}>Issue not fixed? Reopen it</Text>

              <TextInput
                style={styles.input}
                multiline
                placeholder="What is still not resolved?"
                placeholderTextColor={colors.textMuted}
                value={reopenReason}
                onChangeText={setReopenReason}
              />

              <Button
                onPress={handleReopen}
                loading={reopenBusy}
                variant="outline"
                style={[styles.reopenButton, styles.smallButton]}
              >
                ↺ Reopen Complaint
              </Button>
            </Card>
          )}

          {/* Official Status Update Card */}
          {canManage && complaint.status !== 'resolved' && (
            <Card variant="gradient" style={styles.updateCard}>
              <Text style={styles.cardTitle}>Update Status</Text>

              <View style={styles.statusGrid}>
                {STATUSES.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[
                      styles.statusButton,
                      newStatus === s && styles.statusButtonActive,
                    ]}
                    onPress={() => setNewStatus(s)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.statusButtonText,
                        newStatus === s && styles.statusButtonTextActive,
                      ]}
                    >
                      {s.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.input}
                multiline
                placeholder="Notes (optional)"
                placeholderTextColor={colors.textMuted}
                value={note}
                onChangeText={setNote}
              />

              <Button
                onPress={handleStatus}
                loading={updating}
                disabled={!newStatus}
                gradient
                style={styles.smallButton}
              >
                Update Status
              </Button>
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
  notFoundText: {
    fontSize: typography.fontSizes.lg,
    color: colors.textMuted,
  },
  scrollContent: {
    padding: spacing['2xl'],
    paddingBottom: spacing['4xl'],
  },
  headerCard: {
    padding: spacing['2xl'],
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    marginBottom: spacing.lg,
    letterSpacing: -0.5,
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
  description: {
    fontSize: typography.fontSizes.base,
    color: colors.textMuted,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  imageScroll: {
    marginTop: spacing.md,
  },
  image: {
    width: 120,
    height: 90,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
  },
  timelineCard: {
    padding: spacing['2xl'],
    marginBottom: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  cardTitle: {
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
  reviewCard: {
    padding: spacing['2xl'],
    marginBottom: spacing.lg,
  },
  existingReview: {
    paddingVertical: spacing.md,
  },
  existingRatingText: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  existingFeedback: {
    fontSize: typography.fontSizes.sm,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  rateLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  starRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  star: {
    fontSize: 36,
  },
  input: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    fontSize: typography.fontSizes.base,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing['2xl'],
  },
  reopenLabel: {
    fontSize: typography.fontSizes.sm,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  reopenButton: {
    borderColor: colors.error,
  },
  updateCard: {
    padding: spacing['2xl'],
    marginBottom: spacing.lg,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statusButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  statusButtonActive: {
    backgroundColor: `${colors.primary}30`,
    borderColor: colors.primary,
  },
  statusButtonText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.textMuted,
    textTransform: 'capitalize',
  },
  statusButtonTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeights.semibold,
  },
  smallButton: {
  width: '70%',
  alignSelf: 'center',
  paddingVertical: spacing.md,
  paddingHorizontal: spacing.lg,
},
});
