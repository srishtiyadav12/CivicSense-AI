import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';
import { colors, font, space, radius } from '../theme';

const ROLES = [
  { key: 'citizen', label: 'Citizen' },
  { key: 'official', label: 'Official' },
];

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'citizen' });
  const [busy, setBusy] = useState(false);
  const [focused, setFocused] = useState(null);
  const set = (k) => (v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      return Alert.alert('Missing fields', 'All fields are required.');
    }
    setBusy(true);
    try {
      await register(form);
    } catch (err) {
      Alert.alert('Registration failed', err.response?.data?.message || 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const inputStyle = (key) => [styles.input, focused === key && styles.inputFocused];

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <View style={styles.mark}>
          <Text style={styles.markText}>CS</Text>
        </View>
        <Text style={styles.eyebrow}>GET STARTED</Text>
        <Text style={styles.title}>Join CivicSense</Text>
        <Text style={styles.subtitle}>Create an account to report and track civic issues.</Text>
        <View style={styles.formCard}>

        <TextInput
          style={inputStyle('name')} placeholder="Full name" value={form.name} onChangeText={set('name')}
          placeholderTextColor={colors.faint}
          onFocus={() => setFocused('name')} onBlur={() => setFocused(null)}
        />
        <TextInput
          style={inputStyle('email')} placeholder="Email address" value={form.email} onChangeText={set('email')}
          keyboardType="email-address" autoCapitalize="none" placeholderTextColor={colors.faint}
          onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
        />
        <TextInput
          style={inputStyle('password')} placeholder="Password (min 6 characters)" value={form.password}
          onChangeText={set('password')} secureTextEntry placeholderTextColor={colors.faint}
          onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
        />

        <Text style={styles.label}>I am a</Text>
        <View style={styles.roleRow}>
          {ROLES.map((r) => {
            const active = form.role === r.key;
            return (
              <TouchableOpacity
                key={r.key}
                style={[styles.roleBtn, active && styles.roleBtnActive]}
                onPress={() => set('role')(r.key)}
              >
                <Text style={[styles.roleText, active && styles.roleTextActive]}>{r.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={[styles.btn, busy && styles.btnDisabled]} onPress={handleSubmit} disabled={busy}>
          {busy ? <ActivityIndicator color={colors.white} /> : <Text style={styles.btnText}>Create account</Text>}
        </TouchableOpacity>

        </View>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.linkBtn}>
          <Text style={styles.linkText}>Already have an account? <Text style={styles.linkBold}>Sign in</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inner: { padding: 22, paddingTop: 58, paddingBottom: 36 },
  mark: {
    width: 62, height: 62, borderRadius: 20, backgroundColor: colors.brand,
    alignItems: 'center', justifyContent: 'center', marginBottom: 18, ...shadow.floating,
  },
  markText: { color: colors.white, fontSize: 22, fontWeight: font.bold, letterSpacing: -0.5 },
  eyebrow: { color: colors.brand, fontSize: font.xs, fontWeight: font.bold, letterSpacing: 1.8, marginBottom: 4 },
  title: { fontSize: font.xxl, fontWeight: font.bold, color: colors.textStrong, marginBottom: 5, letterSpacing: -0.5 },
  subtitle: { fontSize: font.sm + 1, color: colors.muted, marginBottom: 18, lineHeight: 20 },
  formCard: {
    backgroundColor: colors.card, borderRadius: radius.xl, padding: 18,
    borderWidth: 1, borderColor: colors.line, ...shadow.card,
  },
  label: { fontSize: font.sm, fontWeight: font.semibold, color: colors.body, marginBottom: 9 },
  input: {
    backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, paddingHorizontal: 15, paddingVertical: 14,
    fontSize: font.md, marginBottom: 12, color: colors.textStrong,
  },
  inputFocused: { borderColor: colors.brand, backgroundColor: colors.white },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  roleBtn: {
    flex: 1, paddingVertical: 13, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
  },
  roleBtnActive: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  roleText: { fontSize: font.sm + 1, color: colors.muted, fontWeight: font.medium },
  roleTextActive: { color: colors.brand, fontWeight: font.semibold },
  btn: {
    backgroundColor: colors.brand, borderRadius: radius.md, paddingVertical: 15,
    alignItems: 'center', marginTop: 3, ...shadow.floating,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: colors.white, fontSize: font.md, fontWeight: font.semibold },
  linkBtn: { alignItems: 'center', marginTop: 18 },
  linkText: { color: colors.muted, fontSize: font.sm + 1, fontWeight: font.medium },
  linkBold: { color: colors.brand, fontWeight: font.semibold },
});