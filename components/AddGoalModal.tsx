import { useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Coins, Heart, X, Clock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCreateGoal } from '@/lib/hooks/useGoals';
import { useProfile } from '@/lib/hooks/useProfile';
import { useTheme } from '@/contexts/ThemeContext';
import { showToast } from '@/lib/toast';
import { formatGoldWeight } from '@/lib/utils/goldUnits';
import GlassInput from './ui/GlassInput';
import DepthButton from './ui/DepthButton';
import StatCard from './ui/StatCard';
import ThemedSwitch from './ui/ThemedSwitch';
import { TEXT, formatNumber, formatDecimal } from '@/constants/text';
import { persianToEnglish } from '@/utils/numbers';
import { LinearGradient } from 'expo-linear-gradient';

interface AddGoalModalProps {
  visible: boolean;
  onClose: () => void;
  goldPrice?: number;
}

export default function AddGoalModal({ visible, onClose, goldPrice }: AddGoalModalProps) {
  const createGoal = useCreateGoal();
  const { data: profile } = useProfile();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [goalName, setGoalName] = useState('');
  const [goalPrice, setGoalPrice] = useState('');
  const [recurringEnabled, setRecurringEnabled] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<'weekly' | 'monthly'>('monthly');
  const [recurringDay, setRecurringDay] = useState('1');

  // Memoized styles for dynamic theming and RTL support
  const modalContainerStyle = useMemo(
    () => ({ backgroundColor: theme.colors.background }),
    [theme.colors.background]
  );

  const modalHeaderStyle = useMemo(
    () => ({
      borderBottomColor: theme.colors.border,
      flexDirection: 'row-reverse' as const,
    }),
    [theme.colors.border]
  );

  const modalHeaderSafeAreaStyle = useMemo(
    () => ({ paddingTop: (insets.top || 0) + 24 }),
    [insets.top]
  );

  const modalTitleStyle = useMemo(() => ({ color: theme.colors.text }), [theme.colors.text]);

  const handlePriceChange = (text: string) => {
    const cleanedText = text.replace(/[^\d\u06F0-\u06F9\u0660-\u0669]/g, '');
    if (!cleanedText) {
      setGoalPrice('');
      return;
    }
    setGoalPrice(cleanedText);
  };

  const getPriceValue = useCallback((): number => {
    // Convert Persian digits to English, remove commas and parse to number
    const englishPrice = persianToEnglish(goalPrice);
    const cleanedPrice = englishPrice.replace(/[^\d]/g, '');
    return parseInt(cleanedPrice) || 0;
  }, [goalPrice]);

  const goldEquivalent = goalPrice && goldPrice ? getPriceValue() / goldPrice : 0;

  const goldWeightFormatted = goldEquivalent > 0 ? formatGoldWeight(goldEquivalent) : null;

  // Calculate timeline estimate
  const timelineEstimate = useMemo(() => {
    if (!profile || !goldPrice || !goalPrice || goldEquivalent <= 0) {
      return null;
    }

    const salary = profile.monthlySalary;
    const savingsPercentage = profile.monthlySavingsPercentage;

    if (salary <= 0 || savingsPercentage <= 0) {
      return null;
    }

    const price = getPriceValue();
    const monthlySavings = (salary * savingsPercentage) / 100;
    const monthsToSave = price / monthlySavings;

    const years = Math.floor(monthsToSave / 12);
    const months = Math.floor(monthsToSave % 12);

    let timelineText = '';
    if (monthsToSave === 0) {
      timelineText = TEXT.timeline.goalReached;
    } else if (years > 0) {
      timelineText = TEXT.timeline.yearsToSave(years, months);
    } else if (months > 0) {
      timelineText = TEXT.timeline.monthsToSave(months);
    } else {
      const days = Math.ceil(monthsToSave * 30);
      timelineText = TEXT.timeline.daysToSave(days);
    }

    return {
      monthsToSave,
      monthlySavings,
      timelineText,
    };
  }, [profile, goldPrice, goalPrice, goldEquivalent, getPriceValue]);

  const handleAddGoal = async (addToWishlist: boolean) => {
    // eslint-disable-next-line no-console
    console.log('handleAddGoal called with addToWishlist:', addToWishlist);

    if (!goalName || !goalPrice) {
      // eslint-disable-next-line no-console
      console.log('Validation failed: missing name or price');
      showToast.error(TEXT.common.error, TEXT.calculate.enterGoalAndPrice);
      return;
    }

    const price = getPriceValue();
    // eslint-disable-next-line no-console
    console.log('Goal price:', price);

    if (isNaN(price) || price <= 0) {
      // eslint-disable-next-line no-console
      console.log('Validation failed: invalid price');
      showToast.error(TEXT.common.error, TEXT.calculate.enterValidPrice);
      return;
    }

    // eslint-disable-next-line no-console
    console.log('Sending goal data:', {
      name: goalName,
      price,
      isWishlisted: addToWishlist,
      savedGoldAmount: 0,
    });

    try {
      const result = await createGoal.mutateAsync({
        name: goalName,
        price,
        isWishlisted: addToWishlist,
        savedGoldAmount: 0,
        recurringPlan: {
          enabled: recurringEnabled,
          frequency: recurringFrequency,
          dayOfWeek:
            recurringFrequency === 'weekly'
              ? Number(persianToEnglish(recurringDay || '0'))
              : undefined,
          dayOfMonth:
            recurringFrequency === 'monthly'
              ? Number(persianToEnglish(recurringDay || '1'))
              : undefined,
          reminderHour: 20,
        },
      });

      // eslint-disable-next-line no-console
      console.log('Goal created successfully:', result);

      showToast.success(
        TEXT.calculate.goalAdded,
        addToWishlist ? TEXT.calculate.addedToWishlist : TEXT.calculate.goalSaved
      );
      resetForm();
      onClose();
    } catch (error: unknown) {
      // eslint-disable-next-line no-console
      console.error('CreateGoal error:', error);
      // eslint-disable-next-line no-console
      console.error(
        'Error response:',
        (error as { response?: { data?: unknown } })?.response?.data
      );
      // eslint-disable-next-line no-console
      console.error(
        'Error status:',
        (error as { response?: { status?: unknown } })?.response?.status
      );

      const errorMessage =
        (error as { response?: { data?: { error?: string }; message?: string } })?.response?.data
          ?.error ||
        (error as { message?: string })?.message ||
        TEXT.calculate.addGoalError;
      showToast.error(TEXT.common.error, errorMessage);
    }
  };

  const resetForm = () => {
    setGoalName('');
    setGoalPrice('');
    setRecurringEnabled(false);
    setRecurringFrequency('monthly');
    setRecurringDay('1');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <LinearGradient
          colors={[theme.colors.background, theme.colors.backgroundSecondary]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={[styles.modalHeader, modalHeaderStyle, modalHeaderSafeAreaStyle]}>
          <Text style={[styles.modalTitle, modalTitleStyle]}>{TEXT.calculate.newGoal}</Text>
          <TouchableOpacity onPress={handleClose}>
            <X size={24} color={theme.colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <KeyboardAwareScrollView
          style={styles.modalContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          enableOnAndroid={true}
          enableAutomaticScroll={true}
          extraScrollHeight={20}
        >
          <View style={styles.inputGroup}>
            <Text
              style={[
                styles.label,
                {
                  color: theme.colors.text,
                  marginBottom: theme.spacing.sm,
                },
              ]}
            >
              {TEXT.calculate.goalName}
            </Text>
            <GlassInput
              placeholder={TEXT.calculate.goalNamePlaceholder}
              value={goalName}
              onChangeText={setGoalName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text
              style={[
                styles.label,
                {
                  color: theme.colors.text,
                  marginBottom: theme.spacing.sm,
                },
              ]}
            >
              {TEXT.calculate.price}
            </Text>
            <GlassInput
              icon={<Coins size={20} color={theme.colors.textSecondary} strokeWidth={2.5} />}
              placeholder="0"
              value={goalPrice}
              onChangeText={handlePriceChange}
              keyboardType="numeric"
            />
          </View>

          {goldWeightFormatted && (
            <StatCard
              icon={<Coins size={36} color={theme.colors.primary} strokeWidth={2.5} />}
              label={TEXT.calculate.goldEquivalent}
              value={`${formatDecimal(goldWeightFormatted.primary.value)} ${goldWeightFormatted.primary.unit}`}
              subtext={
                goldWeightFormatted.secondary
                  ? `(${formatDecimal(goldWeightFormatted.secondary.value)} ${goldWeightFormatted.secondary.unit})`
                  : undefined
              }
              variant="primary"
              style={{ marginBottom: theme.spacing.md }}
            />
          )}

          {/* Timeline Estimate */}
          {timelineEstimate && (
            <StatCard
              icon={<Clock size={32} color={theme.colors.success} strokeWidth={2.5} />}
              label={TEXT.timeline.canBuy}
              value={timelineEstimate.timelineText}
              subtext={`${formatNumber(timelineEstimate.monthlySavings)} ${TEXT.wishlist.toman} / ${TEXT.common.month}`}
              variant="success"
              style={{ marginBottom: theme.spacing.md }}
            />
          )}

          <View style={styles.recurringRow}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              {TEXT.calculate.recurringPlan}
            </Text>
            <ThemedSwitch value={recurringEnabled} onValueChange={setRecurringEnabled} />
          </View>

          {recurringEnabled && (
            <>
              <View style={styles.buttonGroup}>
                <DepthButton
                  onPress={() => setRecurringFrequency('monthly')}
                  variant={recurringFrequency === 'monthly' ? 'primary' : 'outline'}
                  size="medium"
                >
                  {TEXT.calculate.monthlyPlan}
                </DepthButton>
                <DepthButton
                  onPress={() => setRecurringFrequency('weekly')}
                  variant={recurringFrequency === 'weekly' ? 'primary' : 'outline'}
                  size="medium"
                >
                  {TEXT.calculate.weeklyPlan}
                </DepthButton>
              </View>

              <View style={styles.inputGroup}>
                <Text
                  style={[
                    styles.label,
                    { color: theme.colors.text, marginBottom: theme.spacing.sm },
                  ]}
                >
                  {recurringFrequency === 'monthly'
                    ? TEXT.calculate.dayOfMonth
                    : TEXT.calculate.dayOfWeek}
                </Text>
                <GlassInput
                  placeholder={recurringFrequency === 'monthly' ? '1-28' : '0-6'}
                  value={recurringDay}
                  onChangeText={setRecurringDay}
                  keyboardType="numeric"
                />
              </View>
            </>
          )}

          <View style={styles.buttonGroup}>
            <DepthButton
              onPress={() => handleAddGoal(true)}
              disabled={goldEquivalent <= 0}
              variant="primary"
              size="large"
              icon={
                <Heart size={20} color={theme.isDark ? '#0A0A0A' : '#FFFFFF'} strokeWidth={2.5} />
              }
              iconPosition="right"
            >
              {TEXT.calculate.addToWishlist}
            </DepthButton>

            <DepthButton
              onPress={() => handleAddGoal(false)}
              disabled={goldEquivalent <= 0}
              variant="outline"
              size="large"
            >
              {TEXT.calculate.saveWithoutWishlist}
            </DepthButton>
          </View>

          <Text style={[styles.helpText, { color: theme.colors.textSecondary }]}>
            {TEXT.calculate.wishlistHelp}
          </Text>
        </KeyboardAwareScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  buttonGroup: {
    gap: 12,
    marginBottom: 16,
  },
  helpText: {
    fontFamily: 'Vazirmatn_400Regular',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontFamily: 'Vazirmatn_400Regular',
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'right',
  },
  modalContainer: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },
  modalHeader: {
    alignItems: 'center',
    borderBottomWidth: 1,
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: 24,
  },
  modalTitle: {
    fontFamily: 'Vazirmatn_700Bold',
    fontSize: 24,
  },
  recurringRow: {
    alignItems: 'center',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
});
