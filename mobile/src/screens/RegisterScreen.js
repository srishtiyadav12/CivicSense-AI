import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { colors, gradients, typography, spacing, borderRadius, shadows } from '../theme';

const ROLES = [
  { key: 'citizen', label: 'Citizen', icon: 'user' },
  { key: 'official', label: 'Official', icon: 'check' },
];

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'citizen' });
  const [loading, setLoading] = useState(false);

  const set = (key) => (value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      alert('Please fill in all fields.');
      return;
    }

    if (form.password.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await register(form);
    } catch (err) {
      alert(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#0F172A', '#1E293B', '#334155']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join CivicSense and help improve your city</Text>
          </View>

          {/* Registration Form */}
          <View style={styles.formCard}>
            <Input
              label="Full Name"
              placeholder="Enter your name"
              value={form.name}
              onChangeText={set('name')}
              autoCapitalize="words"
              icon={<Icon name="user" size={20} color={colors.textMuted} />}
            />

            <Input
              label="Email"
              placeholder="your@email.com"
              value={form.email}
              onChangeText={set('email')}
              keyboardType="email-address"
              autoCapitalize="none"
              icon={<Icon name="mail" size={20} color={colors.textMuted} />}
            />

            <Input
              label="Password"
              placeholder="At least 6 characters"
              value={form.password}
              onChangeText={set('password')}
              secureTextEntry
              icon={<Icon name="lock" size={20} color={colors.textMuted} />}
            />

            {/* Role Selection */}
            <Text style={styles.roleLabel}>I am a</Text>
            <View style={styles.roleContainer}>
              {ROLES.map((role) => {
                const isActive = form.role === role.key;
                return (
                  <TouchableOpacity
                    key={role.key}
                    style={[styles.roleButton, isActive && styles.roleButtonActive]}
                    onPress={() => set('role')(role.key)}
                    activeOpacity={0.8}
                  >
                    <Icon
                      name={role.icon}
                      size={20}
                      color={isActive ? colors.primary : colors.textMuted}
                    />
                    <Text style={[styles.roleText, isActive && styles.roleTextActive]}>
                      {role.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Button
              onPress={handleSubmit}
              loading={loading}
              
              fullWidth
              style={styles.registerButton}
            >
              Create Account
            </Button>

            {/* Terms */}
            <Text style={styles.terms}>
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
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
  scrollContent: {
    flexGrow: 1,
    padding: spacing['2xl'],
    paddingTop: spacing['3xl'],
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
    maxWidth: 320,
  },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius['2xl'],
    padding: spacing['2xl'],
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.lg,
  },
  roleLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  roleButtonActive: {
    backgroundColor: `${colors.primary}20`,
    borderColor: colors.primary,
  },
  roleText: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.medium,
    color: colors.textMuted,
  },
  roleTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeights.semibold,
  },
  registerButton: {
    marginTop: spacing.md,
  },
  terms: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 18,
  },
});