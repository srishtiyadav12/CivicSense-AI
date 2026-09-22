import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform, SafeAreaView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { complaintApi } from '../api/client';
import Icon from '../components/Icon';
import { colors, font, space, radius, shadow } from '../theme';

const TYPES = [
  'pothole', 'garbage', 'broken_streetlight', 'water_leakage', 'drainage',
  'damaged_infrastructure', 'noise_pollution', 'stray_animals', 'electricity', 'sewage', 'other',
];

export default function SubmitComplaintScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('other');
  const [images, setImages] = useState([]);
  const [location, setLocation] = useState(null);
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [focused, setFocused] = useState(null);

  // Request location on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocating(true);
        try {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setLocation(loc.coords);
        } catch {}
        setLocating(false);
      }
    })();
  }, []);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, base64: false });
    if (!res.canceled && res.assets?.length) {
      setImages((prev) => [...prev, ...res.assets.map((a) => a.uri)]);
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permission needed', 'Camera access is required to take photos.');
    const res = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!res.canceled && res.assets?.length) {
      setImages((prev) => [...prev, ...res.assets.map((a) => a.uri)]);
    }
  };

  const submit = async () => {
    if (!title.trim() || !description.trim()) {
      return Alert.alert('Missing fields', 'Title and description are required.');
    }
    setBusy(true);
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
        formData.append('images', { uri, name: `photo.${ext}`, type: 'image/jpeg' });
      });

      await complaintApi.create(formData);
      Alert.alert('Submitted!', 'Your complaint has been analyzed and routed.', [
        { text: 'View my complaints', onPress: () => navigation.navigate('ComplaintsTab') },
      ]);
      setTitle(''); setDescription(''); setType('other'); setImages([]); setLocation(null);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit complaint');
    }
    setBusy(false);
  };

  const inputStyle = (key) => [styles.input, focused === key && styles.inputFocused];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topRow}><View style={styles.topIcon}><Icon name="upload" size={20} color={colors.brand} strokeWidth={2} /></View><View style={{ flex: 1 }}><Text style={styles.eyebrow}>CIVIC REPORT</Text><Text style={styles.heading}>Report an issue</Text></View></View>
          <Text style={styles.sub}>Describe the problem and our AI will route it to the right department.</Text>

          <Text style={styles.sectionLabel}>Issue details</Text>
          <TextInput
            style={inputStyle('title')} placeholder="Issue title" value={title}
            onChangeText={setTitle} placeholderTextColor={colors.faint}
            onFocus={() => setFocused('title')} onBlur={() => setFocused(null)}
          />
          <TextInput
            style={[inputStyle('desc'), { minHeight: 100, textAlignVertical: 'top' }]} multiline
            placeholder="What's the problem? Where exactly?" value={description}
            onChangeText={setDescription} placeholderTextColor={colors.faint}
            onFocus={() => setFocused('desc')} onBlur={() => setFocused(null)}
          />

          <Text style={styles.label}>Issue type</Text>
          <View style={styles.typeGrid}>
            {TYPES.map((t) => {
              const active = type === t;
              return (
                <TouchableOpacity key={t} style={[styles.typeBtn, active && styles.typeBtnActive]} onPress={() => setType(t)}>
                  <Text style={[styles.typeBtnText, active && styles.typeBtnTextActive]}>{t.replace(/_/g, ' ')}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Photos</Text>
          <Text style={styles.helper}>Add evidence from your camera or gallery.</Text>
          <View style={styles.imgRow}>
            <TouchableOpacity style={styles.imgBtn} onPress={takePhoto}>
              <Icon name="camera" size={20} color={colors.brand} strokeWidth={2} />
              <Text style={styles.imgBtnText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imgBtn} onPress={pickImage}>
              <Icon name="image" size={20} color={colors.brand} strokeWidth={2} />
              <Text style={styles.imgBtnText}>Gallery</Text>
            </TouchableOpacity>
          </View>
          {images.length > 0 && (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              {images.map((uri, i) => (
                <View key={i} style={styles.imgThumb}>
                  <Image source={{ uri }} style={styles.thumb} />
                  <TouchableOpacity style={styles.removeImg} onPress={() => setImages((prev) => prev.filter((_, j) => j !== i))}>
                    <Icon name="minus" size={12} color={colors.white} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          <Text style={styles.label}>Location</Text>
          <View style={[styles.locCard, location && styles.locCardLocked]}>
            <Icon name="gps" size={18} color={location ? colors.success : colors.faint} strokeWidth={2} />
            <Text style={[styles.locText, location ? { color: colors.success } : { color: colors.faint }]}>
              {location
                ? `GPS locked · ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                : locating ? 'Getting location…' : 'Location not available — you can submit without it.'}
            </Text>
          </View>

          <TouchableOpacity style={[styles.submitBtn, busy && { opacity: 0.6 }]} onPress={submit} disabled={busy}>
            {busy ? <ActivityIndicator color={colors.white} /> : <Text style={styles.submitText}>Submit complaint</Text>}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: space.lg },
  topRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 7 },
  topIcon: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: colors.brandSoft,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  eyebrow: { fontSize: font.xs, color: colors.brand, fontWeight: font.bold, letterSpacing: 1.5, marginBottom: 2 },
  heading: { fontSize: font.xl, fontWeight: font.bold, color: colors.textStrong },
  sub: { fontSize: font.sm, color: colors.muted, marginBottom: 18, lineHeight: 19 },
  sectionLabel: { fontSize: font.lg, fontWeight: font.semibold, color: colors.textStrong, marginBottom: 11 },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, paddingHorizontal: 15, paddingVertical: 14,
    fontSize: font.md, color: colors.textStrong, marginBottom: 12,
  },
  inputFocused: { borderColor: colors.brand, backgroundColor: colors.white, shadowColor: colors.brand, shadowOpacity: 0.06, shadowRadius: 5, elevation: 1 },
  label: { fontSize: font.sm, fontWeight: font.semibold, color: colors.text, marginBottom: 7, marginTop: 5 },
  helper: { fontSize: font.xs, color: colors.faint, marginTop: -3, marginBottom: 9 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 7 },
  typeBtn: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  typeBtnActive: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  typeBtnText: { fontSize: font.xs, color: colors.muted, textTransform: 'capitalize' },
  typeBtnTextActive: { color: colors.brand, fontWeight: font.semibold },
  imgRow: { flexDirection: 'row', gap: 10 },
  imgBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: radius.md, borderWidth: 1,
    borderColor: colors.line, backgroundColor: colors.card, ...shadow.card,
  },
  imgBtnText: { fontSize: font.sm, color: colors.brand, fontWeight: font.semibold },
  imgThumb: { position: 'relative', width: 78, height: 78, marginTop: 2 },
  thumb: { width: 78, height: 78, borderRadius: radius.md },
  removeImg: {
    position: 'absolute', top: -6, right: -6, width: 23, height: 23, borderRadius: 12,
    backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.background,
  },
  locCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, padding: 14, marginBottom: 18, ...shadow.card,
  },
  locCardLocked: { borderColor: colors.success + '55', backgroundColor: colors.success + '0D' },
  locText: { flex: 1, fontSize: font.sm, fontWeight: font.medium, lineHeight: 18 },
  submitBtn: {
    backgroundColor: colors.brand, borderRadius: radius.md, paddingVertical: 16,
    alignItems: 'center', marginTop: 3, ...shadow.floating,
  },
  submitText: { color: colors.white, fontSize: font.md, fontWeight: font.semibold },
});