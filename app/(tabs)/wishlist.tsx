import { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useGoals, useUpdateGoal, useDeleteGoal } from '@/lib/hooks/useGoals';
import { use18KGoldPrice } from '@/lib/hooks/useGold';
import { Heart, Coins, X, Plus } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { showToast } from '@/lib/toast';
import { TEXT, formatNumber, formatDecimal } from '@/constants/text';
import { formatGoldWeight } from '@/lib/utils/goldUnits';
import { persianToEnglish } from '@/utils/numbers';
import type { SavingsTimeline } from '@/lib/api/goals';
import WishlistCard from '@/components/ui/WishlistCard';
import GlassInput from '@/components/ui/GlassInput';
import DepthButton from '@/components/ui/DepthButton';
import AppHeader from '@/components/AppHeader';
import AddGoalModal from '@/components/AddGoalModal';
import { LinearGradient } from 'expo-linear-gradient';

export default function WishlistScreen() {
  const { data: goals = [], isLoading } = useGoals();
  const { data: goldPrice } = use18KGoldPrice();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const { theme } = useTheme();

  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [goldAmount, setGoldAmount] = useState('');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Memoized styles
  const deleteButtonBackgroundStyle = useMemo(() => ({ backgroundColor: '#DC2626' }), []);
  const deleteButtonTextStyle = useMemo(() => ({ color: '#FFFFFF' }), []);

  const wishlistItems = goals.filter((g) => g.isWishlisted);

  const calculateProgress = (saved: number, total: number) => {
    return Math.min((saved / total) * 100, 100);
  };

  const formatTimeline = (timeline: SavingsTimeline | null | undefined): string | null => {
    if (!timeline) return null;

    if (timeline.monthsToSave === 0) {
      return TEXT.timeline.goalReached;
    }

    const years = Math.floor(timeline.monthsToSave / 12);
    const months = Math.floor(timeline.monthsToSave % 12);

    if (years > 0) {
      return TEXT.timeline.yearsToSave(years, months);
    }

    if (months > 0) {
      return TEXT.timeline.monthsToSave(months);
    }

    return TEXT.timeline.daysToSave(timeline.daysToSave);
  };

  const handleGoldAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.\u06F0-\u06F9\u0660-\u0669]/g, '');
    const parts = cleaned.split('.');
    let final = parts[0];
    if (parts.length > 1) {
      final = parts[0] + '.' + parts.slice(1).join('');
    }
    setGoldAmount(final);
  };

  const handleAddGold = async (goalId: string, currentAmount: number) => {
    // Convert Persian to English before parsing
    const addAmount = parseFloat(persianToEnglish(goldAmount));

    if (isNaN(addAmount) || addAmount <= 0) {
      showToast.error(TEXT.common.error, TEXT.wishlist.enterValidAmount);
      return;
    }

    const newAmount = currentAmount + addAmount;

    try {
      await updateGoal.mutateAsync({
        id: goalId,
        data: { savedGoldAmount: newAmount },
      });
      showToast.success(TEXT.common.success, TEXT.wishlist.goldUpdated);
      setEditingGoalId(null);
      setGoldAmount('');
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        TEXT.wishlist.updateError;
      showToast.error(TEXT.common.error, errorMessage);
    }
  };

  const handleDeleteItem = (goalId: string, goalName: string) => {
    setDeleteConfirm({ id: goalId, name: goalName });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await deleteGoal.mutateAsync(deleteConfirm.id);
      showToast.success(TEXT.common.success, TEXT.common.delete);
      setDeleteConfirm(null);
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        TEXT.wishlist.deleteError;
      showToast.error(TEXT.common.error, errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.background, theme.colors.backgroundSecondary]}
        style={StyleSheet.absoluteFillObject}
      />
      <AppHeader />

      <KeyboardAwareScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        // eslint-disable-next-line react-native/no-inline-styles
        contentContainerStyle={{ paddingBottom: 160 }}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={20}
      >
        {/* Add New Goal Button */}
        <DepthButton
          onPress={() => setAddModalVisible(true)}
          variant="primary"
          size="large"
          // eslint-disable-next-line react-native/no-inline-styles
          style={{ marginBottom: 20 }}
          icon={<Plus size={20} color={theme.isDark ? '#0A0A0A' : '#FFFFFF'} strokeWidth={2.5} />}
          iconPosition="left"
        >
          {TEXT.wishlist.addNewGoal}
        </DepthButton>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : wishlistItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Heart size={48} color={theme.colors.textSecondary} strokeWidth={2} />
            <Text
              style={[styles.emptyText, styles.fontRegular, { color: theme.colors.textSecondary }]}
            >
              {TEXT.wishlist.noItems}
            </Text>
          </View>
        ) : (
          wishlistItems.map((item) => {
            const progress = calculateProgress(item.savedGoldAmount, item.goldEquivalent);
            const remaining = Math.max(0, item.goldEquivalent - item.savedGoldAmount);

            const goldEquivalentFormatted = formatGoldWeight(item.goldEquivalent);
            const savedGoldFormatted = formatGoldWeight(item.savedGoldAmount);
            const remainingFormatted = formatGoldWeight(remaining);

            // Use current price if available, otherwise fallback to creation price
            const displayPrice = item.currentPriceInToman ?? item.price;
            const priceLabel = item.currentPriceInToman
              ? `${formatNumber(displayPrice)} ${TEXT.wishlist.toman} (قیمت امروز)`
              : `${formatNumber(displayPrice)} ${TEXT.wishlist.toman}`;

            return (
              <WishlistCard
                key={item._id}
                goalName={item.name}
                price={priceLabel}
                goldEquivalent={`${formatDecimal(goldEquivalentFormatted.primary.value)} ${goldEquivalentFormatted.primary.unit}`}
                savedGold={`${formatDecimal(savedGoldFormatted.primary.value)} ${savedGoldFormatted.primary.unit}`}
                remaining={`${formatDecimal(remainingFormatted.primary.value)} ${remainingFormatted.primary.unit}`}
                progress={progress}
                timeline={formatTimeline(item.timeline)}
                onAddGold={() => {
                  setEditingGoalId(item._id);
                  setGoldAmount('');
                }}
                onDelete={() => handleDeleteItem(item._id, item.name)}
                goalReached={progress >= 100}
                savedAmountInToman={item.savedAmountInToman}
                remainingInToman={item.remainingInToman}
              />
            );
          })
        )}
      </KeyboardAwareScrollView>

      <Modal
        visible={editingGoalId !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditingGoalId(null)}
      >
        <KeyboardAwareScrollView
          style={styles.modalOverlay}
          enableOnAndroid={true}
          enableAutomaticScroll={true}
          extraScrollHeight={20}
        >
          <View
            style={[
              styles.modalContainer,
              {
                backgroundColor: theme.colors.card,
                borderTopLeftRadius: theme.radius.xl,
                borderTopRightRadius: theme.radius.xl,
              },
              theme.shadows.elevated,
            ]}
          >
            <View
              style={[
                styles.modalHeader,
                // eslint-disable-next-line react-native/no-inline-styles
                {
                  borderBottomColor: theme.colors.border,
                  borderBottomWidth: 1,
                  padding: theme.spacing.lg,
                },
              ]}
            >
              <Text style={[styles.modalTitle, styles.fontBold, { color: theme.colors.text }]}>
                {TEXT.wishlist.addGold}
              </Text>
              <TouchableOpacity onPress={() => setEditingGoalId(null)}>
                <X size={24} color={theme.colors.textSecondary} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            <View style={[styles.modalContent, { padding: theme.spacing.lg }]}>
              <Text
                style={[
                  styles.modalLabel,
                  styles.fontBold,
                  // eslint-disable-next-line react-native/no-inline-styles
                  {
                    color: theme.colors.text,
                    marginBottom: theme.spacing.sm,
                    fontSize: 16,
                  },
                ]}
              >
                {TEXT.wishlist.goldAmount}
              </Text>

              <GlassInput
                icon={<Coins size={20} color={theme.colors.textSecondary} strokeWidth={2.5} />}
                placeholder="0"
                value={goldAmount}
                onChangeText={handleGoldAmountChange}
                keyboardType="decimal-pad"
                autoFocus
                containerStyle={{ marginBottom: theme.spacing.lg }}
              />

              <DepthButton
                onPress={() => {
                  const goal = goals.find((g) => g._id === editingGoalId);
                  if (goal) {
                    void handleAddGold(editingGoalId!, goal.savedGoldAmount);
                  }
                }}
                variant="primary"
                size="large"
              >
                {TEXT.wishlist.save}
              </DepthButton>
            </View>
          </View>
        </KeyboardAwareScrollView>
      </Modal>

      <Modal
        visible={deleteConfirm !== null}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setDeleteConfirm(null)}
      >
        <View style={styles.confirmOverlay}>
          <View style={[styles.confirmContainer, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.confirmTitle, styles.fontBold, { color: theme.colors.text }]}>
              {TEXT.wishlist.removeGoal}
            </Text>
            <Text
              style={[
                styles.confirmMessage,
                styles.fontRegular,
                { color: theme.colors.textSecondary },
              ]}
            >
              {TEXT.wishlist.removeConfirm(deleteConfirm?.name || '')}
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  styles.confirmButtonCancel,
                  {
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.cardBorder,
                  },
                ]}
                onPress={() => setDeleteConfirm(null)}
              >
                <Text
                  style={[styles.confirmButtonText, styles.fontBold, { color: theme.colors.text }]}
                >
                  {TEXT.wishlist.cancel}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  styles.confirmButtonDelete,
                  deleteButtonBackgroundStyle,
                ]}
                onPress={confirmDelete}
              >
                <Text style={[styles.confirmButtonText, styles.fontBold, deleteButtonTextStyle]}>
                  {TEXT.wishlist.remove}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AddGoalModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        goldPrice={goldPrice?.price}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  confirmButton: {
    alignItems: 'center',
    borderRadius: 12,
    flex: 1,
    padding: 14,
  },
  confirmButtonCancel: {
    borderWidth: 1,
  },
  confirmButtonDelete: {},
  confirmButtonText: {
    fontSize: 16,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmContainer: {
    borderRadius: 20,
    maxWidth: 400,
    padding: 24,
    width: '100%',
  },
  confirmMessage: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'right',
  },
  confirmOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  confirmTitle: {
    fontSize: 20,
    marginBottom: 12,
    textAlign: 'right',
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  fontBold: {
    fontFamily: 'Vazirmatn_700Bold',
  },
  fontRegular: {
    fontFamily: 'Vazirmatn_400Regular',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  modalContent: {
    padding: 24,
  },
  modalHeader: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 24,
  },
  modalLabel: {
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'right',
  },
  modalOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalTitle: {
    fontSize: 20,
  },
});
