import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  savingsLogApi,
  CreateSavingsLogData,
  GetSavingsLogsParams,
  GetAnalyticsParams,
  SavingsLog,
} from '../api/savingsLog';
import { enqueueSavingsLog } from '../savingsQueue';

export interface CreateSavingsLogResult {
  queued: boolean;
  savingsLog?: SavingsLog;
}

// Query keys
export const savingsLogKeys = {
  all: ['savingsLogs'] as const,
  lists: () => [...savingsLogKeys.all, 'list'] as const,
  list: (params?: GetSavingsLogsParams) => [...savingsLogKeys.lists(), params] as const,
  analytics: (params?: GetAnalyticsParams) => [...savingsLogKeys.all, 'analytics', params] as const,
};

/**
 * Hook to fetch all savings logs
 */
export const useSavingsLogs = (params?: GetSavingsLogsParams) => {
  return useQuery({
    queryKey: savingsLogKeys.list(params),
    queryFn: () => savingsLogApi.getAll(params),
  });
};

/**
 * Hook to fetch savings analytics
 */
export const useSavingsAnalytics = (params?: GetAnalyticsParams) => {
  return useQuery({
    queryKey: savingsLogKeys.analytics(params),
    queryFn: () => savingsLogApi.getAnalytics(params),
  });
};

/**
 * Hook to create a new savings log
 */
export const useCreateSavingsLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSavingsLogData): Promise<CreateSavingsLogResult> => {
      try {
        const savingsLog = await savingsLogApi.create(data);
        return { queued: false, savingsLog };
      } catch (error: unknown) {
        const status = (error as { response?: { status?: number } })?.response?.status;
        const code = (error as { code?: string })?.code;

        const shouldQueue =
          !status || code === 'ECONNABORTED' || code === 'ERR_NETWORK' || status >= 500;

        if (shouldQueue) {
          await enqueueSavingsLog(data);
          return { queued: true };
        }

        throw error;
      }
    },
    onSuccess: (result) => {
      if (result.queued) {
        return;
      }

      void queryClient.invalidateQueries({ queryKey: savingsLogKeys.all });
      void queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
};

/**
 * Hook to delete a savings log
 */
export const useDeleteSavingsLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => savingsLogApi.delete(id),
    onSuccess: () => {
      // Invalidate all savings logs and analytics queries
      void queryClient.invalidateQueries({ queryKey: savingsLogKeys.all });
    },
  });
};
