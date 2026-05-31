import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIStore {
  isDarkMode: boolean;
  sidebarOpen: boolean;
  aiPanelOpen: boolean;
  activeTab: string;
  toggleDarkMode: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setAIPanelOpen: (open: boolean) => void;
  toggleAIPanel: () => void;
  setActiveTab: (tab: string) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      isDarkMode: true,
      sidebarOpen: true,
      aiPanelOpen: false,
      activeTab: 'overview',

      toggleDarkMode: () => set(state => ({ isDarkMode: !state.isDarkMode })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
      setAIPanelOpen: (open) => set({ aiPanelOpen: open }),
      toggleAIPanel: () => set(state => ({ aiPanelOpen: !state.aiPanelOpen })),
      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    {
      name: 'trip-ui-storage',
    }
  )
);
