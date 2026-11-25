import { create } from 'zustand';

interface PendingState {
  pendingCount: number;
  setPendingCount: (count: number) => void;
}

export const usePendingStore = create<PendingState>((set) => ({
  pendingCount: 0,
  setPendingCount: (pendingCount) => set({ pendingCount }),
}));
