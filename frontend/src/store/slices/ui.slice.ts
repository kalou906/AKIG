/**
 * UI Store (Zustand)
 * Centralized UI state management
 */

import { create } from 'zustand';

interface Modal {
  isOpen: boolean;
  type?: 'confirm' | 'alert' | 'form' | 'custom';
  title?: string;
  message?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  data?: any;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  timestamp: number;
}

interface UIState {
  modal: Modal;
  notifications: Notification[];
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  loading: boolean;

  // Modal Actions
  openModal: (config: Omit<Modal, 'isOpen'>) => void;
  closeModal: () => void;

  // Notification Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // UI Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  modal: { isOpen: false },
  notifications: [],
  sidebarOpen: true,
  theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
  loading: false,

  // Modal Actions
  openModal: (config) => set({
    modal: { isOpen: true, ...config }
  }),

  closeModal: () => set({
    modal: { isOpen: false }
  }),

  // Notification Actions
  addNotification: (notification) => {
    const id = `${Date.now()}-${Math.random()}`;
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: Date.now()
    };

    set((state) => ({
      notifications: [newNotification, ...state.notifications]
    }));

    // Auto-remove after duration
    if (notification.duration !== 0) {
      const duration = notification.duration || 3000;
      setTimeout(() => {
        get().removeNotification(id);
      }, duration);
    }
  },

  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id)
  })),

  clearNotifications: () => set({ notifications: [] }),

  // UI Actions
  toggleSidebar: () => set((state) => ({
    sidebarOpen: !state.sidebarOpen
  })),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    set({ theme });
  },

  setLoading: (loading) => set({ loading })
}));
