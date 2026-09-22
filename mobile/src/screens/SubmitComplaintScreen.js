import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { complaintApi } from '../api/client';
import Input from '../components/Input';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { colors, gradients, typography, spacing, borderRadius, shadows, COMPLAINT_TYPES } from '../theme';
import { analyzeImageViaBackend, showAnalysisResult, generateComplaintSuggestions } from '../services/imageAnalyzer';
import axios from 'axios';

export default function SubmitComplaintScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('other');
  const [images, setImages] = useState([]);
  const [location, setLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(false);

  // AI Analysis states
  const [analyzing, setAnalyzing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [authenticityCheck, setAuthenticityCheck] = useState(null);

  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      setLocating(true);
      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        setLocation(loc.coords);
      } catch (err) {
        console.log('Location error:', err);
      }
      setLocating(false);
    }
  };

  // AI Image Analysis
  const analyzeImage = async (imageUri) => {
    setAnalyzing(true);
    try {
      const result = await analyzeImageViaBackend(imageUri, axios);

      setAuthenticityCheck({
        isAuthentic: result.isAuthentic,
        score: result.authenticityScore,
        detected: result.civicIssueDetected,
        summary: result.summary
      });

      if (result.civicIssueDetected && result.suggestedComplaint) {
        setAiSuggestion(result.suggestedComplaint);
        setShowAiModal(true);
      } else {
        Alert.alert(
          '⚠️ No Civic Issue Detected',
          'The AI could not detect a clear civic issue in this image. Please verify this is the correct photo or you can write your complaint manually.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      Alert.alert(
        'Analysis Unavailable',
        'AI analysis is currently unavailable. You can still submit the complaint manually.',
        [{ text: 'OK' }]
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: true,
    });
    if (!res.canceled && res.assets?.length) {
      const newImages = res.assets.map((a) => a.uri);
      setImages((prev) => [...prev, ...newImages]);

      // Analyze the first image
      if (images.length === 0 && newImages.length > 0) {
        await analyzeImage(newImages[0]);
      }
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Camera access is required to take photos.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!res.canceled && res.assets?.length) {
      const newImages = res.assets.map((a) => a.uri);
      setImages((prev) => [...prev, ...newImages]);

      // Analyze the captured photo
      if (newImages.length > 0) {
        await analyzeImage(newImages[0]);
      }
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    if (images.length === 1) {
      setAiSuggestion(null);
      setAuthenticityCheck(null);
    }
  };

  // Use AI Suggestion
  const useAiSuggestion = () => {
    if (aiSuggestion) {
      setTitle(aiSuggestion.title);
      setDescription(aiSuggestion.description);
      setType(aiSuggestion.type);
      setShowAiModal(false);
      Alert.alert('✨ AI Suggestion Applied', 'The form has been filled with AI-generated content. You can edit it before submitting.');
    }
  };

  // Write Own Complaint
  const writeOwn = () => {
    setShowAiModal(false);
  };

  const submit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Missing fields', 'Please enter a title and description.');
      return;
    }

    // Check authenticity warning
    if (authenticityCheck && !authenticityCheck.isAuthentic && authenticityCheck.score < 30) {
      Alert.alert(
        'Low Authenticity Score',
        'AI detected this might not be a genuine civic issue photo. Are you sure you want to submit?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Submit Anyway', onPress: () => submitComplaint() }
        ]
      );
      return;
    }

    submitComplaint();
  };

  const submitComplaint = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('type', type);

      if (location) {
        formData.append('location', JSON.stringify({
          type: 'Point',
          coordinates: [location.longitude, location.latitude],
        }));
      }

      images.forEach((uri, i) => {
        const ext = uri.split('.').pop() || 'jpg';
        formData.append('images', {
          uri,
          name: `photo_${i}.${ext}`,
          type: 'image/jpeg',
        });
      });

      await complaintApi.create(formData);
      Alert.alert(
        '✅ Success!',
        'Your complaint has been submitted and will be reviewed by authorities.',
        [{ text: 'View Complaints', onPress: () => navigation.navigate('ComplaintsTab') }]
      );
      setTitle('');
      setDescription('');
      setType('other');
      setImages([]);
      setAiSuggestion(null);
      setAuthenticityCheck(null);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  const typeConfig = COMPLAINT_TYPES[type] || COMPLAINT_TYPES.other;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#0F172A', '#1E293B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Report an Issue</Text>
              <Text style={styles.subtitle}>
                📸 Upload a photo and AI will help you write the complaint
              </Text>
            </View>

            {/* AI Authenticity Check */}
            {authenticityCheck && (
              <View style={[
                styles.authenticityCard,
                authenticityCheck.isAuthentic ? styles.authenticityGood : styles.authenticityBad
              ]}>
                <Text style={styles.authenticityIcon}>
                  {authenticityCheck.isAuthentic ? '✅' : '⚠️'}
                </Text>
                <View style={styles.authenticityContent}>
                  <Text style={styles.authenticityTitle}>
                    AI Authenticity: {authenticityCheck.score}%
                  </Text>
                  <Text style={styles.authenticityText}>
                    {authenticityCheck.summary}
                  </Text>
                </View>
              </View>
            )}

            {/* Analyzing Indicator */}
            {analyzing && (
              <View style={styles.analyzingCard}>
                <ActivityIndicator color={colors.primary} size="small" />
                <Text style={styles.analyzingText}>🔍 AI is analyzing your image...</Text>
              </View>
            )}

            {/* Form */}
            <View style={styles.formSection}>
              {/* Photos First */}
              <Text style={styles.sectionLabel}>📸 Upload Photo (AI Analysis)</Text>
              <View style={styles.photoActions}>
                <TouchableOpacity
                  onPress={takePhoto}
                  style={styles.photoButton}
                  activeOpacity={0.8}
                  disabled={analyzing}
                >
                  <LinearGradient
                    colors={['#334155', '#1E293B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.photoButtonGradient}
                  >
                    <Text style={{ fontSize: 32, marginBottom: 8 }}>📷</Text>
                    <Text style={styles.photoButtonText}>Camera</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={pickImage}
                  style={styles.photoButton}
                  activeOpacity={0.8}
                  disabled={analyzing}
                >
                  <LinearGradient
                    colors={['#334155', '#1E293B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.photoButtonGradient}
                  >
                    <Text style={{ fontSize: 32, marginBottom: 8 }}>🖼️</Text>
                    <Text style={styles.photoButtonText}>Gallery</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Image Preview */}
              {images.length > 0 && (
                <View style={styles.imageGrid}>
                  {images.map((uri, index) => (
                    <View key={index} style={styles.imageWrapper}>
                      <Image source={{ uri }} style={styles.imagePreview} />
                      <TouchableOpacity
                        onPress={() => removeImage(index)}
                        style={styles.removeButton}
                        activeOpacity={0.8}
                      >
                        <Icon name="x" size={12} color={colors.white} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <Input
                label="Issue Title"
                placeholder="Brief description (e.g., Broken streetlight)"
                value={title}
                onChangeText={setTitle}
              />

              <Input
                label="Description"
                placeholder="Provide details about the issue and its location"
                value={description}
                onChangeText={setDescription}
                multiline
                style={styles.textArea}
              />

              {/* Type Selection */}
              <Text style={styles.sectionLabel}>Issue Type</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.typeScroll}
              >
                {Object.entries(COMPLAINT_TYPES).map(([key, config]) => {
                  const isActive = type === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      onPress={() => setType(key)}
                      style={[
                        styles.typeCard,
                        isActive && { borderColor: config.color, backgroundColor: `${config.color}20` },
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.typeIcon}>{config.icon}</Text>
                      <Text style={[styles.typeLabel, isActive && { color: config.color }]}>
                        {config.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Location Status */}
              <View style={[styles.locationCard, location && styles.locationCardActive]}>
                <View style={[styles.locationIcon, location && styles.locationIconActive]}>
                  <Icon name="mapPin" size={20} color={location ? colors.success : colors.textMuted} />
                </View>
                <View style={styles.locationText}>
                  <Text style={styles.locationTitle}>
                    {location ? 'Location Detected' : locating ? 'Getting location...' : 'Location Unavailable'}
                  </Text>
                  <Text style={styles.locationSubtitle}>
                    {location
                      ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
                      : 'You can still submit without location'}
                  </Text>
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={submit}
                disabled={loading || analyzing}
                style={[
                  styles.submitButtonSmall,
                  (loading || analyzing) && { opacity: 0.6 }
                ]}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {analyzing ? 'Analyzing...' : 'Submit Complaint'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      {/* AI Suggestion Modal */}
      <Modal
        visible={showAiModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAiModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🤖 AI Generated Complaint</Text>
            <Text style={styles.modalConfidence}>
              Confidence: {aiSuggestion?.confidence || 0}%
            </Text>

            <View style={styles.modalSuggestion}>
              <Text style={styles.modalLabel}>Title:</Text>
              <Text style={styles.modalValue}>{aiSuggestion?.title}</Text>

              <Text style={[styles.modalLabel, { marginTop: 12 }]}>Description:</Text>
              <Text style={styles.modalValue}>{aiSuggestion?.description}</Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={useAiSuggestion}
                style={[styles.modalButton, styles.modalButtonPrimary]}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonTextPrimary}>✨ Use AI Suggestion</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={writeOwn}
                style={[styles.modalButton, styles.modalButtonSecondary]}
                activeOpacity={0.8}
              >
                <Text style={styles.modalButtonTextSecondary}>✍️ Write My Own</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing['2xl'],
    paddingBottom: spacing['4xl'],
  },
  header: {
    marginBottom: spacing['3xl'],
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
    lineHeight: 22,
  },
  authenticityCard: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    borderWidth: 2,
  },
  authenticityGood: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
  },
  authenticityBad: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
  authenticityIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  authenticityContent: {
    flex: 1,
  },
  authenticityTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: '#1e293b',
    marginBottom: 4,
  },
  authenticityText: {
    fontSize: typography.fontSizes.sm,
    color: '#475569',
  },
  analyzingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: '#fef3c7',
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  analyzingText: {
    fontSize: typography.fontSizes.sm,
    color: '#92400e',
    fontWeight: typography.fontWeights.medium,
  },
  formSection: {
    gap: spacing.lg,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  sectionLabel: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  typeScroll: {
    gap: spacing.md,
    paddingBottom: spacing.xs,
  },
  typeCard: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceLight,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    minWidth: 90,
  },
  typeIcon: {
    fontSize: 28,
    marginBottom: spacing.sm,
  },
  typeLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.textMuted,
    textAlign: 'center',
  },
  photoActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  photoButton: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  photoButtonGradient: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
  },
  photoButtonText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.text,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  imageWrapper: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.md,
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  locationCardActive: {
    borderColor: colors.success,
    backgroundColor: `${colors.success}10`,
  },
  locationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationIconActive: {
    backgroundColor: `${colors.success}20`,
  },
  locationText: {
    flex: 1,
  },
  locationTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  locationSubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
  },
  submitButtonSmall: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    alignSelf: 'center',
    minWidth: 160,
  },
  submitButtonText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius['2xl'],
    borderTopRightRadius: borderRadius['2xl'],
    padding: spacing['2xl'],
    paddingBottom: spacing['3xl'],
  },
  modalTitle: {
    fontSize: typography.fontSizes['2xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  modalConfidence: {
    fontSize: typography.fontSizes.sm,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  modalSuggestion: {
    backgroundColor: colors.surfaceLight,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  modalLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  modalValue: {
    fontSize: typography.fontSizes.base,
    color: colors.text,
    lineHeight: 22,
  },
  modalButtons: {
    gap: spacing.md,
  },
  modalButton: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: colors.primary,
  },
  modalButtonSecondary: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  modalButtonTextPrimary: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.white,
  },
  modalButtonTextSecondary: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
  },
});