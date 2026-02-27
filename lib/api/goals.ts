import apiClient from './client';

export interface SavingsTimeline {
  monthsToSave: number;
  daysToSave: number;
  estimatedCompletionDate: string;
  monthlySavingsAmount: number;
  goldToSavePerMonth: number;
}

export interface Goal {
  _id: string;
  userId: string;
  name: string;
  price: number;
  goldEquivalent: number;
  goldPriceAtCreation: number;
  isWishlisted: boolean;
  savedGoldAmount: number;
  timeline?: SavingsTimeline | null;
  createdAt: string;
  updatedAt: string;
  // Dynamic fields calculated based on current gold price
  currentGoldPrice?: number; // Current market price per gram
  currentPriceInToman?: number; // Current total price based on today's gold price
  savedAmountInToman?: number; // Current value of saved gold in Toman
  remainingInToman?: number; // Remaining amount in Toman at current prices
  recurringPlan?: GoalRecurringPlan;
}

export interface GoalRecurringPlan {
  enabled: boolean;
  frequency: 'weekly' | 'monthly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  reminderHour: number;
}

export interface CreateGoalData {
  name: string;
  price: number;
  isWishlisted?: boolean;
  savedGoldAmount?: number;
  recurringPlan?: GoalRecurringPlan;
}

export interface UpdateGoalData {
  name?: string;
  price?: number;
  isWishlisted?: boolean;
  savedGoldAmount?: number;
  recurringPlan?: GoalRecurringPlan;
}

export const goalsApi = {
  getAll: async (): Promise<Goal[]> => {
    const response = await apiClient.get<{ goals: Goal[] }>('/goals');
    return response.data.goals;
  },

  getWishlisted: async (): Promise<Goal[]> => {
    const response = await apiClient.get<{ goals: Goal[] }>('/goals/wishlisted');
    return response.data.goals;
  },

  getById: async (id: string): Promise<Goal> => {
    const response = await apiClient.get<{ goal: Goal }>(`/goals/${id}`);
    return response.data.goal;
  },

  create: async (data: CreateGoalData): Promise<Goal> => {
    const response = await apiClient.post<{ goal: Goal }>('/goals', data);
    return response.data.goal;
  },

  update: async (id: string, data: UpdateGoalData): Promise<Goal> => {
    const response = await apiClient.put<{ goal: Goal }>(`/goals/${id}`, data);
    return response.data.goal;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/goals/${id}`);
  },

  toggleWishlist: async (id: string): Promise<Goal> => {
    const response = await apiClient.patch<{ goal: Goal }>(`/goals/${id}/wishlist`);
    return response.data.goal;
  },
};
