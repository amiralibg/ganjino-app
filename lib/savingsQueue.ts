import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import type { CreateSavingsLogData } from './api/savingsLog';
import { savingsLogApi } from './api/savingsLog';

const SAVINGS_QUEUE_KEY = 'offlineSavingsQueue';

type QueuedSavingsLog = {
  id: string;
  createdAt: string;
  payload: CreateSavingsLogData;
};

const readQueue = async (): Promise<QueuedSavingsLog[]> => {
  const raw = await AsyncStorage.getItem(SAVINGS_QUEUE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as QueuedSavingsLog[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeQueue = async (items: QueuedSavingsLog[]): Promise<void> => {
  await AsyncStorage.setItem(SAVINGS_QUEUE_KEY, JSON.stringify(items));
};

export const enqueueSavingsLog = async (payload: CreateSavingsLogData): Promise<void> => {
  const queue = await readQueue();
  queue.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    createdAt: new Date().toISOString(),
    payload,
  });
  await writeQueue(queue);
};

export const getQueuedSavingsCount = async (): Promise<number> => {
  const queue = await readQueue();
  return queue.length;
};

export const flushSavingsQueue = async (): Promise<{ synced: number; failed: number }> => {
  const networkState = await NetInfo.fetch();
  if (!networkState.isConnected) {
    return { synced: 0, failed: 0 };
  }

  const queue = await readQueue();
  if (queue.length === 0) {
    return { synced: 0, failed: 0 };
  }

  const remaining: QueuedSavingsLog[] = [];
  let synced = 0;

  for (const item of queue) {
    try {
      await savingsLogApi.create(item.payload);
      synced += 1;
    } catch {
      remaining.push(item);
    }
  }

  await writeQueue(remaining);
  return { synced, failed: remaining.length };
};
