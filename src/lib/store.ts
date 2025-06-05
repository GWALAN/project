import { create } from 'zustand';
import { User } from '@/types';

interface UserState {
  user: User | null;
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  isCreator: boolean;
  setIsCreator: (isCreator: boolean) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

interface LinkState {
  links: any[];
  setLinks: (links: any[]) => void;
  isLinksLoading: boolean;
  setIsLinksLoading: (isLoading: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  updateUser: (updates) => set((state) => ({
    user: state.user ? { ...state.user, ...updates } : null
  })),
  isCreator: false,
  setIsCreator: (isCreator) => set({ isCreator }),
  isLoading: true,
  setIsLoading: (isLoading) => set({ isLoading }),
}));

export const useLinkStore = create<LinkState>((set) => ({
  links: [],
  setLinks: (links) => set({ links }),
  isLinksLoading: false,
  setIsLinksLoading: (isLoading) => set({ isLinksLoading: isLoading }),
}));