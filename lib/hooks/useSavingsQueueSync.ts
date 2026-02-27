import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';
import { flushSavingsQueue } from '../savingsQueue';
import { savingsLogKeys } from './useSavingsLogs';

export const useSavingsQueueSync = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const syncQueue = async () => {
      const result = await flushSavingsQueue();
      if (result.synced > 0) {
        void queryClient.invalidateQueries({ queryKey: savingsLogKeys.all });
        void queryClient.invalidateQueries({ queryKey: ['goals'] });
      }
    };

    void syncQueue();
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        void syncQueue();
      }
    });

    return unsubscribe;
  }, [queryClient]);
};
