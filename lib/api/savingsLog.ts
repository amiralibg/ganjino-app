import apiClient from './client';

export interface SavingsLog {
  _id: string;
  userId: string;
  amount: number;
  type: 'money' | 'gold';
  goalId?: {
    _id: string;
    name: string;
    price: number;
    goldEquivalent: number;
  };
  goalAllocations?: Array<{
    goalId: string;
    amount: number;
    allocatedGoldAmount: number;
  }>;
  note?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSavingsLogData {
  amount: number;
  type?: 'money' | 'gold';
  goalId?: string;
  goalAllocations?: Array<{
    goalId: string;
    amount: number;
  }>;
  note?: string;
  date?: string;
}

export interface GetSavingsLogsParams {
  startDate?: string;
  endDate?: string;
  type?: 'money' | 'gold';
  goalId?: string;
  limit?: number;
}

export interface SavingsAnalytics {
  period: 'day' | 'week' | 'month';
  startDate: string;
  endDate: string;
  totals: {
    money: number;
    gold: number;
    entries: number;
  };
  byPeriod: Array<{
    _id: {
      period: string;
      type: 'money' | 'gold';
    };
    totalAmount: number;
    count: number;
  }>;
}

export interface GetAnalyticsParams {
  period?: 'day' | 'week' | 'month';
  startDate?: string;
  endDate?: string;
}

export const savingsLogApi = {
  create: async (data: CreateSavingsLogData): Promise<SavingsLog> => {
    const response = await apiClient.post<{ savingsLog: SavingsLog }>('/logs', data);
    return response.data.savingsLog;
  },

  getAll: async (params?: GetSavingsLogsParams): Promise<SavingsLog[]> => {
    const response = await apiClient.get<{ savingsLogs: SavingsLog[] }>('/logs', { params });
    return response.data.savingsLogs;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/logs/${id}`);
  },

  getAnalytics: async (params?: GetAnalyticsParams): Promise<SavingsAnalytics> => {
    const response = await apiClient.get<{ analytics: SavingsAnalytics }>('/logs/analytics', {
      params,
    });
    return response.data.analytics;
  },
};
