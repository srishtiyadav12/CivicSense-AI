import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TextInput,
  TouchableOpacity, Alert, Image, RefreshControl, Platform,
} from 'react-native';
import { complaintApi, getApiBase } from '../api/client';
import { useAuth } from '../context/AuthContext';

const API_BASE = getApiBase();
const STATUS_COLORS = {
  submitted: '#5b67f5', under_review: '#14b8a6', assigned: '#8b5cf6',
  in_progress: '#f59e0b', resolved: '#10b981', rejected: '#f43f5e', reopened: '#6366f1',
};
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
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleStatus = async () => {
    if (!newStatus) return;
    setUpdating(true);
    try {
      await complaintApi.updateStatus(id, { status: newStatus, note: note.trim() });
      setNewStatus(''); setNote('');
      await load();
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
    if (!reopenReason.trim()) return Alert.alert('Required', 'Please provide a reason.');
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

  if (loading) return <ActivityIndicator size="large" color="#5b67f5" style={{ flex: 1 }} />;
  if (!complaint) return <Text style={{ textAlign: 'center', marginTop: 40, color: '#94a3b8' }}>Complaint not found</Text>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5b67f5" />}>
      <View style={styles.card}>
        <Text style={styles.title}>{complaint.title}</Text>
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: STATUS_COLORS[complaint.status] || '#94a3b8' }]}>
            <Text style={styles.badgeText}>{complaint.status?.replace('_', ' ')}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: '#eef2ff' }]}>
            <Text style={[styles.badgeText, { color: '#5b67f5' }]}>{complaint.department}</Text>
          </View>
        </View>
        <Text style={styles.desc}>{complaint.description}</Text>

        {complaint.images?.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            {complaint.images.map((img, i) => {
              const src = typeof img === 'string' ? img : img?.url || '';
              const uri = src.startsWith('/uploads/') ? API_BASE + src : src;
              return <Image key={i} source={{ uri }} style={styles.image} />;
            })}
          </ScrollView>
        )}
      </View>

      {/* Timeline */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Status Timeline</Text>
        {(complaint.statusHistory || []).slice().reverse().map((entry, i) => (
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

      {/* Citizen review */}
      {isOwner && complaint.status === 'resolved' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>How was your experience?</Text>
          {complaint.satisfactionRating ? (
            <View>
              <Text style={styles.reviewExisting}>You rated this {complaint.satisfactionRating}/5 ⭐</Text>
              {complaint.feedback ? <Text style={{ color: '#475569', marginTop: 4, fontStyle: 'italic' }}>"{complaint.feedback}"</Text> : null}
            </View>
          ) : (
            <View>
              <Text style={{ marginBottom: 8, color: '#475569', fontSize: 13 }}>Tap to rate:</Text>
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((v) => (
                  <TouchableOpacity key={v} onPress={() => setRating(v)}>
                    <Text style={[styles.star, { color: v <= rating ? '#f59e0b' : '#cbd5e1' }]}>★</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput style={[styles.input, { marginTop: 10, minHeight: 60 }]} multiline
                placeholder="Feedback (optional)" value={feedback} onChangeText={setFeedback}
                placeholderTextColor="#94a3b8" />
              <TouchableOpacity style={styles.btn} onPress={handleRate} disabled={reviewBusy || !rating}>
                <Text style={styles.btnText}>{reviewBusy ? 'Submitting...' : 'Submit Review'}</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.divider} />
          <Text style={{ fontSize: 13, color: '#94a3b8', marginTop: 12, marginBottom: 8 }}>Issue not fixed? Reopen it</Text>
          <TextInput style={[styles.input, { minHeight: 60 }]} multiline
            placeholder="What is still not resolved?" value={reopenReason}
            onChangeText={setReopenReason} placeholderTextColor="#94a3b8" />
          <TouchableOpacity style={[styles.btn, { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecdd3' }]}
            onPress={handleReopen} disabled={reopenBusy}>
            <Text style={{ color: '#f43f5e', fontWeight: '600' }}>{reopenBusy ? 'Reopening...' : '↺ Reopen Complaint'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Status update (officials) */}
      {canManage && complaint.status !== 'resolved' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Update Status</Text>
          <View style={styles.statusRow}>
            {STATUSES.map((s) => (
              <TouchableOpacity key={s} style={[styles.statusBtn, newStatus === s && styles.statusBtnActive]}
                onPress={() => setNewStatus(s)}>
                <Text style={[styles.statusBtnText, newStatus === s && styles.statusBtnTextActive]}>
                  {s.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={[styles.input, { marginTop: 10, minHeight: 60 }]} multiline
            placeholder="Notes (optional)" value={note} onChangeText={setNote}
            placeholderTextColor="#94a3b8" />
          <TouchableOpacity style={styles.btn} onPress={handleStatus} disabled={updating || !newStatus}>
            <Text style={styles.btnText}>{updating ? 'Updating...' : 'Update Status'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: 17,
    marginHorizontal: 16, marginTop: 14, borderWidth: 1, borderColor: colors.line, ...shadow.card,
  },
  title: { fontSize: font.xl, fontWeight: font.bold, color: colors.textStrong, marginBottom: 11, lineHeight: 28 },
  cardTitle: { fontSize: font.lg, fontWeight: font.semibold, color: colors.textStrong, marginBottom: 12 },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 13 },
  departmentBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: colors.brandSoft },
  departmentText: { color: colors.brand, fontSize: font.xs, fontWeight: font.semibold },
  desc: { fontSize: font.md, color: colors.body, lineHeight: 22 },
  image: { width: 112, height: 84, borderRadius: radius.md, marginRight: 9, backgroundColor: colors.surfaceAlt },
  tlItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, marginBottom: 14 },
  tlDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  tlStatus: { fontSize: font.sm, fontWeight: font.semibold, color: colors.textStrong, textTransform: 'capitalize' },
  tlNote: { fontSize: font.xs + 1, color: colors.body, marginTop: 3, lineHeight: 17 },
  tlDate: { fontSize: font.xs, color: colors.faint, marginTop: 3 },
  starRow: { flexDirection: 'row', gap: 8 },
  star: { fontSize: 32 },
  reviewExisting: { fontSize: font.md, color: colors.textStrong, fontWeight: font.semibold },
  input: {
    backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: 13, fontSize: font.md, color: colors.textStrong,
  },
  btn: { backgroundColor: colors.brand, borderRadius: radius.md, paddingVertical: 14, alignItems: 'center', marginTop: 10, ...shadow.floating },
  btnText: { color: colors.white, fontSize: font.sm + 1, fontWeight: font.semibold },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.line, marginTop: 14 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusBtn: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surfaceAlt },
  statusBtnActive: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  statusBtnText: { fontSize: font.xs, color: colors.muted, textTransform: 'capitalize' },
  statusBtnTextActive: { color: colors.brand, fontWeight: font.semibold },
});
