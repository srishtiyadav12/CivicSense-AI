import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Icon from '../components/Icon';
import { colors, gradients, typography, spacing, borderRadius, shadows } from '../theme';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const firstName = user?.name?.split(' ')[0] || 'User';
  const initial = user?.name?.charAt(0)?.toUpperCase() || 'U';

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: logout
        },
      ]
    );
  };

  const menuItems = [
    {
      title: 'Account',
      items: [
        { icon: 'user', label: 'Edit Profile', onPress: () => {} },
        { icon: 'lock', label: 'Change Password', onPress: () => {} },
        { icon: 'bell', label: 'Notification Settings', onPress: () => {} },
      ],
    },
    {
      title: 'App Settings',
      items: [
        {
          icon: 'search',
          label: 'Language',
          value: 'English',
          onPress: () => {}
        },
        {
          icon: 'alertCircle',
          label: 'Help & Support',
          onPress: () => {}
        },
        {
          icon: 'alertCircle',
          label: 'About CivicSense',
          onPress: () => {}
        },
      ],
    },
  ];

  const stats = [
    { label: 'Complaints', value: user?.complaintsCount || 0, icon: 'list' },
    { label: 'Resolved', value: user?.resolvedCount || 0, icon: 'check' },
    { label: 'Pending', value: user?.pendingCount || 0, icon: 'clock' },
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
          {/* Profile Header */}
          <Card variant="gradient" style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <LinearGradient
                colors={gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>{initial}</Text>
              </LinearGradient>

              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{user?.name}</Text>
                <Text style={styles.profileEmail}>{user?.email}</Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>{user?.role || 'citizen'}</Text>
                </View>
              </View>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              {stats.map((stat, index) => (
                <View key={index} style={styles.statItem}>
                  <Icon name={stat.icon} size={20} color={colors.primary} />
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </Card>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('ComplaintsTab')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.quickActionGradient}
              >
                <Icon name="list" size={24} color={colors.white} />
                <Text style={styles.quickActionText}>My Complaints</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('SubmitComplaint')}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={gradients.accent}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.quickActionGradient}
              >
                <Icon name="plus" size={24} color={colors.white} />
                <Text style={styles.quickActionText}>New Report</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Preferences */}
          <Card variant="gradient" style={styles.preferencesCard}>
            <Text style={styles.sectionTitle}>Preferences</Text>

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceLeft}>
                <Icon name="bell" size={20} color={colors.textMuted} />
                <Text style={styles.preferenceLabel}>Push Notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceLeft}>
                <Icon name="mail" size={20} color={colors.textMuted} />
                <Text style={styles.preferenceLabel}>Email Notifications</Text>
              </View>
              <Switch
                value={emailNotifications}
                onValueChange={setEmailNotifications}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceLeft}>
                <Icon name="alertCircle" size={20} color={colors.textMuted} />
                <Text style={styles.preferenceLabel}>Dark Mode</Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          </Card>

          {/* Menu Sections */}
          {menuItems.map((section, sectionIndex) => (
            <Card key={sectionIndex} variant="gradient" style={styles.menuCard}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={styles.menuItem}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuItemLeft}>
                    <Icon name={item.icon} size={20} color={colors.textMuted} />
                    <Text style={styles.menuItemLabel}>{item.label}</Text>
                  </View>
                  <View style={styles.menuItemRight}>
                    {item.value && (
                      <Text style={styles.menuItemValue}>{item.value}</Text>
                    )}
                    <Icon name="chevronRight" size={16} color={colors.textDim} />
                  </View>
                </TouchableOpacity>
              ))}
            </Card>
          ))}

          {/* Logout Button */}
          <Button
            onPress={handleLogout}
            variant="outline"
            fullWidth
            style={styles.logoutButton}
          >
            Logout
          </Button>

          {/* App Version */}
          <Text style={styles.versionText}>CivicSense AI v1.0.0</Text>
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
  profileCard: {
    padding: spacing['2xl'],
    marginBottom: spacing.lg,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
  avatarText: {
    fontSize: typography.fontSizes['3xl'],
    fontWeight: typography.fontWeights.bold,
    color: colors.white,
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  profileName: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  profileEmail: {
    fontSize: typography.fontSizes.sm,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: `${colors.primary}30`,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  roleText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.primary,
    textTransform: 'capitalize',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
  },
  statLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  quickActionButton: {
    flex: 1,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  quickActionGradient: {
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.md,
  },
  quickActionText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.white,
  },
  preferencesCard: {
    padding: spacing['2xl'],
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  preferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  preferenceLabel: {
    fontSize: typography.fontSizes.base,
    color: colors.text,
  },
  menuCard: {
    padding: spacing['2xl'],
    marginBottom: spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  menuItemLabel: {
    fontSize: typography.fontSizes.base,
    color: colors.text,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  menuItemValue: {
    fontSize: typography.fontSizes.sm,
    color: colors.textMuted,
  },
  logoutButton: {
    marginTop: spacing.lg,
    borderColor: colors.error,
  },
  versionText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textDim,
    textAlign: 'center',
    marginTop: spacing['2xl'],
  },
});
