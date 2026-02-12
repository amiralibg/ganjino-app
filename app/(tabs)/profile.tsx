import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Switch, ActivityIndicator } from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useAuthStore } from '@/store/useAuthStore';
import { LogOut, Moon, Sun, Wallet, TrendingUp } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { showToast } from '@/lib/toast';
import { useProfile, useUpdateProfile } from '@/lib/hooks/useProfile';
import ElevatedCard from '@/components/ui/ElevatedCard';
import GlassInput from '@/components/ui/GlassInput';
import DepthButton from '@/components/ui/DepthButton';
import StatCard from '@/components/ui/StatCard';
import AppHeader from '@/components/AppHeader';
import { LinearGradient } from 'expo-linear-gradient';
import { TEXT, formatNumber } from '@/constants/text';
import { persianToEnglish, englishToPersian } from '@/utils/numbers';

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const { theme, isDark, toggleTheme } = useTheme();

  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const [monthlySalary, setMonthlySalary] = useState('');
  const [savingsPercentage, setSavingsPercentage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      // Convert to Persian digits with comma formatting for display
      if (profile.monthlySalary > 0) {
        const formatted = new Intl.NumberFormat('en-US').format(profile.monthlySalary);
        setMonthlySalary(englishToPersian(formatted));
      } else {
        setMonthlySalary('');
      }
      setSavingsPercentage(
        profile.monthlySavingsPercentage > 0
          ? englishToPersian(profile.monthlySavingsPercentage.toString())
          : englishToPersian('20')
      );
    }
  }, [profile]);

  const handleSalaryChange = (text: string) => {
    // Convert Persian/Arabic digits to English
    const converted = persianToEnglish(text);
    const cleanedText = converted.replace(/[^\d]/g, '');

    if (cleanedText === '') {
      setMonthlySalary('');
      return;
    }

    // Format with commas (using English format)
    const formatted = new Intl.NumberFormat('en-US').format(parseInt(cleanedText));

    // Convert to Persian digits for display
    const persianFormatted = englishToPersian(formatted);
    setMonthlySalary(persianFormatted);
  };

  const handlePercentageChange = (text: string) => {
    // Convert Persian/Arabic digits to English
    const converted = persianToEnglish(text);
    const cleanedText = converted.replace(/[^\d]/g, '');
    const value = parseInt(cleanedText) || 0;

    if (cleanedText === '') {
      setSavingsPercentage('');
      return;
    }

    if (value <= 100) {
      // Store with Persian digits for display
      setSavingsPercentage(englishToPersian(cleanedText));
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
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
                thumbColor={isDark ? theme.colors.primary : '#f4f3f4'}
              />
            </View>
          </ElevatedCard>
        </View>

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
