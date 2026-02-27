import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useAuthStore } from '@/store/useAuthStore';
import { LogOut, Moon, Sun, Wallet, TrendingUp, Bell } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { showToast } from '@/lib/toast';
import { useProfile, useUpdateProfile } from '@/lib/hooks/useProfile';
import { useActiveSessions, useRevokeSession, useLogoutAllDevices } from '@/lib/hooks/useSessions';
import ElevatedCard from '@/components/ui/ElevatedCard';
import GlassInput from '@/components/ui/GlassInput';
import DepthButton from '@/components/ui/DepthButton';
import StatCard from '@/components/ui/StatCard';
import ThemedSwitch from '@/components/ui/ThemedSwitch';
import AppHeader from '@/components/AppHeader';
import { LinearGradient } from 'expo-linear-gradient';
import { TEXT, formatNumber } from '@/constants/text';
import { persianToEnglish } from '@/utils/numbers';
import { formatDate } from '@/constants/text';
import { registerForPushNotificationsAsync } from '@/lib/notifications';

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const { theme, isDark, toggleTheme } = useTheme();

  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const { data: sessionsResponse } = useActiveSessions();
  const revokeSession = useRevokeSession();
  const logoutAllDevices = useLogoutAllDevices();

  const [monthlySalary, setMonthlySalary] = useState('');
  const [savingsPercentage, setSavingsPercentage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [activeSection, setActiveSection] = useState<
    'financial' | 'notifications' | 'sessions' | 'appearance'
  >('financial');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [goldAlertThreshold, setGoldAlertThreshold] = useState('');

  useEffect(() => {
    if (profile) {
      if (profile.monthlySalary > 0) {
        setMonthlySalary(String(profile.monthlySalary));
      } else {
        setMonthlySalary('');
      }
      setSavingsPercentage(
        profile.monthlySavingsPercentage > 0 ? String(profile.monthlySavingsPercentage) : '20'
      );
      setNotificationsEnabled(Boolean(profile.notificationsEnabled));
      if (profile.goldPriceAlertThreshold && profile.goldPriceAlertThreshold > 0) {
        setGoldAlertThreshold(String(profile.goldPriceAlertThreshold));
      } else {
        setGoldAlertThreshold('');
      }
    }
  }, [profile]);

  const handleSalaryChange = (text: string) => {
    const cleanedText = text.replace(/[^\d\u06F0-\u06F9\u0660-\u0669]/g, '');
    if (cleanedText === '') {
      setMonthlySalary('');
      return;
    }
    setMonthlySalary(cleanedText);
  };

  const handlePercentageChange = (text: string) => {
    const cleanedText = text.replace(/[^\d\u06F0-\u06F9\u0660-\u0669]/g, '');
    const value = parseInt(persianToEnglish(cleanedText || '0'), 10) || 0;

    if (cleanedText === '') {
      setSavingsPercentage('');
      return;
    }

    if (value <= 100) {
      setSavingsPercentage(cleanedText);
    }
  };

  const handleSaveFinancials = async () => {
    // Convert Persian digits to English, remove commas and parse
    const englishSalary = persianToEnglish(monthlySalary);
    const salary = parseInt(englishSalary.replace(/,/g, '')) || 0;
    const percentage = parseInt(persianToEnglish(savingsPercentage)) || 20;

    if (salary <= 0) {
      showToast.error(TEXT.common.error, TEXT.profile.enterValidSalary);
      return;
    }

    if (percentage <= 0 || percentage > 100) {
      showToast.error(TEXT.common.error, TEXT.profile.enterValidPercentage);
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile.mutateAsync({
        monthlySalary: salary,
        monthlySavingsPercentage: percentage,
      });
      showToast.success(TEXT.common.success, TEXT.profile.financialsUpdated);
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        TEXT.profile.updateError;
      showToast.error(TEXT.common.error, errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleGoldAlertThresholdChange = (text: string) => {
    const cleanedText = text.replace(/[^\d\u06F0-\u06F9\u0660-\u0669]/g, '');

    if (cleanedText === '') {
      setGoldAlertThreshold('');
      return;
    }

    setGoldAlertThreshold(cleanedText);
  };

  const handleSaveNotifications = async () => {
    setIsSavingNotifications(true);

    try {
      let pushToken: string | undefined = profile?.expoPushToken;
      if (notificationsEnabled) {
        const registeredToken = await registerForPushNotificationsAsync();
        pushToken = registeredToken ?? undefined;
        if (!pushToken) {
          showToast.error(TEXT.common.error, TEXT.profile.notificationsDenied);
          setIsSavingNotifications(false);
          return;
        }
      }

      const parsedThreshold = parseInt(persianToEnglish(goldAlertThreshold).replace(/,/g, '')) || 0;

      await updateProfile.mutateAsync({
        notificationsEnabled,
        expoPushToken: notificationsEnabled ? pushToken : '',
        goldPriceAlertThreshold: parsedThreshold,
      });

      showToast.success(TEXT.common.success, TEXT.profile.notificationsUpdated);
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        TEXT.profile.updateError;
      showToast.error(TEXT.common.error, errorMessage);
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await revokeSession.mutateAsync(sessionId);
      showToast.success(TEXT.common.success, TEXT.profile.revokeSuccess);
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        TEXT.profile.revokeError;
      showToast.error(TEXT.common.error, errorMessage);
    }
  };

  const handleLogoutAllDevices = async () => {
    try {
      await logoutAllDevices.mutateAsync();
      showToast.success(TEXT.common.success, TEXT.profile.logoutAllDevicesSuccess);
      await signOut();
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        TEXT.profile.logoutAllDevicesError;
      showToast.error(TEXT.common.error, errorMessage);
    }
  };

  const containerStyle = useMemo(
    () => ({ flex: 1, backgroundColor: theme.colors.background }),
    [theme.colors.background]
  );

  const titleStyle = useMemo(() => ({ color: theme.colors.text }), [theme.colors.text]);

  const emailStyle = useMemo(
    () => ({ color: theme.colors.textSecondary }),
    [theme.colors.textSecondary]
  );

  const sectionDescriptionStyle = useMemo(
    () => ({ color: theme.colors.textSecondary }),
    [theme.colors.textSecondary]
  );

  const cardRowStyle = useMemo<ViewStyle>(
    () => ({
      alignItems: 'center',
      flexDirection: 'row',
      padding: theme.spacing.md,
    }),
    [theme.spacing.md]
  );

  const themeLabelDynamicStyle = useMemo<TextStyle>(
    () => ({
      color: theme.colors.text,
      marginLeft: theme.spacing.md,
    }),
    [theme.colors.text, theme.spacing.md]
  );

  const signOutButtonStyle = useMemo<ViewStyle>(
    () => ({
      margin: theme.spacing.lg,
      shadowColor: 'transparent',
    }),
    [theme.spacing.lg, theme.colors.error]
  );

  const signOutTextStyle = useMemo<TextStyle>(
    () => ({
      color: theme.colors.background,
    }),
    [theme.colors.background]
  );

  if (profileLoading) {
    return (
      <View style={[styles.container, styles.centerContent, containerStyle]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Convert Persian digits to English and remove commas before parsing for calculations
  const englishSalary = persianToEnglish(monthlySalary);
  const salaryNum = parseInt(englishSalary.replace(/,/g, '')) || 0;
  const percentageNum = parseInt(persianToEnglish(savingsPercentage)) || 0;
  const monthlySavingsAmount =
    salaryNum > 0 && percentageNum > 0 ? (salaryNum * percentageNum) / 100 : 0;

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[theme.colors.background, theme.colors.backgroundSecondary]}
        style={StyleSheet.absoluteFillObject}
      />
      <AppHeader />
      <KeyboardAwareScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={20}
        extraHeight={80}
      >
        <View style={styles.userInfo}>
          <Text style={[styles.email, emailStyle]}>{user?.email || 'user@example.com'}</Text>
        </View>

        <View style={styles.sectionTabs}>
          {(
            [
              { key: 'financial', label: TEXT.profile.financialTab },
              { key: 'notifications', label: TEXT.profile.notificationsTab },
              { key: 'sessions', label: TEXT.profile.sessionsTab },
              { key: 'appearance', label: TEXT.profile.appearanceTab },
            ] as const
          ).map((item) => {
            const isActive = activeSection === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.sectionTabButton,
                  {
                    borderColor: isActive ? theme.colors.primary : theme.colors.border,
                    backgroundColor: isActive ? theme.colors.primary + '20' : 'transparent',
                  },
                ]}
                onPress={() => setActiveSection(item.key)}
              >
                <Text
                  style={[
                    styles.sectionTabText,
                    { color: isActive ? theme.colors.primary : theme.colors.textSecondary },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {activeSection === 'financial' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, titleStyle]}>{TEXT.profile.financialSettings}</Text>
            <Text style={[styles.sectionDescription, sectionDescriptionStyle]}>
              {TEXT.profile.financialDescription}
            </Text>

            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.inputLabel,
                  {
                    color: theme.colors.text,
                    marginBottom: theme.spacing.sm,
                  },
                ]}
              >
                {TEXT.profile.monthlySalary}
              </Text>
              <GlassInput
                icon={<Wallet size={20} color={theme.colors.textSecondary} strokeWidth={2.5} />}
                placeholder="0"
                value={monthlySalary}
                onChangeText={handleSalaryChange}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.inputLabel,
                  {
                    color: theme.colors.text,
                    marginBottom: theme.spacing.sm,
                  },
                ]}
              >
                {TEXT.profile.savingsPercentage}
              </Text>
              <GlassInput
                icon={<TrendingUp size={20} color={theme.colors.textSecondary} strokeWidth={2.5} />}
                placeholder="20"
                value={savingsPercentage}
                onChangeText={handlePercentageChange}
                keyboardType="numeric"
              />
            </View>

            {monthlySavingsAmount > 0 && (
              <StatCard
                icon={<TrendingUp size={32} color={theme.colors.primary} strokeWidth={2.5} />}
                label={TEXT.profile.saveFinancials}
                value={`${formatNumber(monthlySavingsAmount)} تومان`}
                variant="primary"
                style={{ marginBottom: theme.spacing.md }}
              />
            )}

            <DepthButton
              onPress={handleSaveFinancials}
              disabled={isSaving}
              loading={isSaving}
              variant="primary"
              size="large"
            >
              {TEXT.profile.saveFinancials}
            </DepthButton>
          </View>
        )}

        {activeSection === 'notifications' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {TEXT.profile.notificationsTitle}
            </Text>
            <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
              {TEXT.profile.notificationsDescription}
            </Text>

            <ElevatedCard elevation="elevated" shadowLevel="small">
              <View style={cardRowStyle}>
                <Bell size={20} color={theme.colors.textSecondary} strokeWidth={2.5} />
                <Text style={[styles.themeLabel, themeLabelDynamicStyle]}>
                  {TEXT.profile.enableNotifications}
                </Text>
                <ThemedSwitch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                />
              </View>
            </ElevatedCard>

            <View style={[styles.inputGroup, { marginTop: theme.spacing.md }]}>
              <Text
                style={[
                  styles.inputLabel,
                  { color: theme.colors.text, marginBottom: theme.spacing.sm },
                ]}
              >
                {TEXT.profile.goldAlertThreshold}
              </Text>
              <GlassInput
                icon={<TrendingUp size={20} color={theme.colors.textSecondary} strokeWidth={2.5} />}
                placeholder="0"
                value={goldAlertThreshold}
                onChangeText={handleGoldAlertThresholdChange}
                keyboardType="numeric"
              />
            </View>

            <DepthButton
              onPress={handleSaveNotifications}
              disabled={isSavingNotifications}
              loading={isSavingNotifications}
              variant="outline"
              size="large"
            >
              {TEXT.common.save}
            </DepthButton>
          </View>
        )}

        {activeSection === 'sessions' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {TEXT.profile.sessionsTitle}
            </Text>
            <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
              {TEXT.profile.sessionsDescription}
            </Text>

            {sessionsResponse?.sessions?.length ? (
              sessionsResponse.sessions.map((session) => (
                <ElevatedCard key={String(session.id)} elevation="elevated" shadowLevel="small">
                  <View
                    style={{
                      padding: theme.spacing.md,
                      gap: theme.spacing.sm,
                    }}
                  >
                    <Text style={[styles.sessionTitle, { color: theme.colors.text }]}>
                      {session.device.deviceName || TEXT.profile.deviceUnknown}
                    </Text>
                    <Text style={[styles.sessionSubtext, { color: theme.colors.textSecondary }]}>
                      {session.device.platform.toUpperCase()} •{' '}
                      {formatDate(String(session.lastUsed))}
                    </Text>
                    <DepthButton
                      onPress={() => handleRevokeSession(String(session.id))}
                      variant="outline"
                      size="medium"
                      disabled={revokeSession.isPending}
                    >
                      {TEXT.profile.revokeSession}
                    </DepthButton>
                  </View>
                </ElevatedCard>
              ))
            ) : (
              <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
                {TEXT.profile.noSessions}
              </Text>
            )}

            <DepthButton
              onPress={handleLogoutAllDevices}
              variant="outline"
              size="large"
              style={{ marginTop: theme.spacing.md }}
              disabled={logoutAllDevices.isPending}
              loading={logoutAllDevices.isPending}
            >
              {TEXT.profile.logoutAllDevices}
            </DepthButton>
          </View>
        )}

        {activeSection === 'appearance' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {TEXT.profile.theme}
            </Text>
            <Text style={[styles.sectionDescription, { color: theme.colors.textSecondary }]}>
              {TEXT.profile.themeDescription}
            </Text>

            <ElevatedCard elevation="elevated" shadowLevel="small">
              <View style={cardRowStyle}>
                {isDark ? (
                  <Moon size={20} color={theme.colors.textSecondary} strokeWidth={2.5} />
                ) : (
                  <Sun size={20} color={theme.colors.textSecondary} strokeWidth={2.5} />
                )}
                <Text style={[styles.themeLabel, themeLabelDynamicStyle]}>
                  {isDark ? TEXT.profile.darkMode : TEXT.profile.lightMode}
                </Text>
                <ThemedSwitch value={isDark} onValueChange={toggleTheme} />
              </View>
            </ElevatedCard>
          </View>
        )}

        <DepthButton
          onPress={handleSignOut}
          variant="primary"
          size="large"
          style={signOutButtonStyle}
          textStyle={signOutTextStyle}
          icon={<LogOut size={20} color={theme.colors.background} strokeWidth={2.5} />}
          iconPosition="right"
        >
          {TEXT.profile.signOut}
        </DepthButton>
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  email: {
    fontFamily: 'Vazirmatn_400Regular',
    fontSize: 14,
    textAlign: 'right',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'right',
  },
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  section: {
    padding: 24,
  },
  sectionTabButton: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sectionTabText: {
    fontFamily: 'Vazirmatn_500Medium',
    fontSize: 12,
  },
  sectionTabs: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
    marginTop: 16,
    paddingHorizontal: 24,
  },
  sectionDescription: {
    fontFamily: 'Vazirmatn_400Regular',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
    textAlign: 'right',
  },
  sectionTitle: {
    fontFamily: 'Vazirmatn_700Bold',
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'right',
  },
  sessionSubtext: {
    fontFamily: 'Vazirmatn_400Regular',
    fontSize: 12,
    textAlign: 'right',
  },
  sessionTitle: {
    fontFamily: 'Vazirmatn_700Bold',
    fontSize: 15,
    textAlign: 'right',
  },
  themeLabel: {
    flex: 1,
    fontFamily: 'Vazirmatn_400Regular',
    fontSize: 16,
    fontWeight: '500',
    marginRight: 12,
    textAlign: 'right',
  },
  userInfo: {
    marginTop: 24,
    paddingHorizontal: 24,
  },
});
