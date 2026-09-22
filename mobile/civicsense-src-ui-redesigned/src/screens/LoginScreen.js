import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors, font, space, radius } from '../theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [focused, setFocused] = useState(null);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      return Alert.alert('Missing fields', 'Please enter email and password.');
    }
    setBusy(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      Alert.alert('Login failed', err.response?.data?.message || 'Check your credentials and try again.');
    } finally {
      setBusy(false);
    }
  };

  const inputStyle = (key) => [
    styles.input,
    focused === key && styles.inputFocused,
  ];

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.inner}>
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>CS</Text>
          </View>
          <Text style={styles.eyebrow}>CIVICSENSE AI</Text>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>A city that listens — and responds.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.formTitle}>Sign in to continue</Text>
          <TextInput
            style={inputStyle('email')}
            placeholder="Email address"
            placeholderTextColor={colors.faint}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            onFocus={() => setFocused('email')}
            onBlur={() => setFocused(null)}
          />
          <TextInput
            style={inputStyle('password')}
            placeholder="Password"
            placeholderTextColor={colors.faint}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            onFocus={() => setFocused('password')}
            onBlur={() => setFocused(null)}
          />

          <TouchableOpacity style={[styles.btn, busy && styles.btnDisabled]} onPress={handleSubmit} disabled={busy}>
            {busy ? <ActivityIndicator color={colors.white} /> : <Text style={styles.btnText}>Sign in</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.linkBtn}>
          <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkBold}>Create one</Text></Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Tracking')} style={styles.trackLink}>
          <Text style={styles.trackText}>Track a complaint — no sign-in needed</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 22, paddingVertical: 32 },
  brand: { alignItems: 'center', marginBottom: 22 },
  logo: {
    width: 76, height: 76, borderRadius: 24,
    backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center',
    marginBottom: 18, ...shadow.floating,
  },
  logoText: { color: colors.white, fontSize: 27, fontWeight: font.bold, letterSpacing: -1 },
  eyebrow: { color: colors.brand, fontSize: font.xs, fontWeight: font.bold, letterSpacing: 2.2, marginBottom: 5 },
  title: { fontSize: font.xxl, fontWeight: font.bold, color: colors.textStrong, letterSpacing: -0.6 },
  subtitle: { fontSize: font.sm + 1, color: colors.muted, marginTop: 6, textAlign: 'center' },
  card: {
    backgroundColor: colors.card, borderRadius: radius.xl, padding: 22,
    borderWidth: 1, borderColor: colors.line, ...shadow.card,
  },
  formTitle: { fontSize: font.lg, fontWeight: font.semibold, color: colors.textStrong, marginBottom: 16 },
  input: {
    backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.line,
    borderRadius: radius.md, paddingHorizontal: 15, paddingVertical: 14,
    fontSize: font.md, marginBottom: 12, color: colors.textStrong,
  },
  inputFocused: { borderColor: colors.brand, backgroundColor: colors.white, shadowColor: colors.brand, shadowOpacity: 0.08, shadowRadius: 5, elevation: 1 },
  btn: {
    backgroundColor: colors.brand, borderRadius: radius.md, paddingVertical: 15,
    alignItems: 'center', marginTop: 5, ...shadow.floating,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: colors.white, fontSize: font.md, fontWeight: font.semibold },
  linkBtn: { alignItems: 'center', marginTop: 18 },
  linkText: { color: colors.muted, fontSize: font.sm + 1, fontWeight: font.medium },
  linkBold: { color: colors.brand, fontWeight: font.semibold },
  trackLink: {
    alignItems: 'center', marginTop: 16, paddingVertical: 10,
  },
  trackText: { color: colors.brand, fontSize: font.sm, fontWeight: font.semibold },
});