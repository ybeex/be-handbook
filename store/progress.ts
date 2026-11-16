'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ProgressStore {
  completedTopics: string[];
  quizScores: Record<string, number>;
  totalPoints: number;
  streak: number;
  lastVisitedTopic: string;
  sidebarOpen: boolean;
  searchQuery: string;
  
  markTopicComplete: (topicId: string) => void;
  markTopicIncomplete: (topicId: string) => void;
  setQuizScore: (quizId: string, score: number) => void;
  setLastVisited: (topicId: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  isTopicComplete: (topicId: string) => boolean;
  getCompletionPercentage: () => number;
  getTotalTopics: () => number;
}

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set, get) => ({
      completedTopics: [],
      quizScores: {},
      totalPoints: 0,
      streak: 0,
      lastVisitedTopic: '',
      sidebarOpen: true,
      searchQuery: '',

      markTopicComplete: (topicId) => {
        const { completedTopics } = get();
        if (!completedTopics.includes(topicId)) {
          set(state => ({
            completedTopics: [...state.completedTopics, topicId],
            totalPoints: state.totalPoints + 10,
          }));
        }
      },

      markTopicIncomplete: (topicId) => {
        set(state => ({
          completedTopics: state.completedTopics.filter(id => id !== topicId),
          totalPoints: Math.max(0, state.totalPoints - 10),
        }));
      },

      setQuizScore: (quizId, score) => {
        set(state => ({
          quizScores: { ...state.quizScores, [quizId]: score },
          totalPoints: state.totalPoints + (score * 5),
        }));
      },

      setLastVisited: (topicId) => {
        set({ lastVisitedTopic: topicId });
      },

      toggleSidebar: () => {
        set(state => ({ sidebarOpen: !state.sidebarOpen }));
      },

      setSidebarOpen: (open) => {
        set({ sidebarOpen: open });
      },

      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      isTopicComplete: (topicId) => {
        return get().completedTopics.includes(topicId);
      },

      getCompletionPercentage: () => {
        const { completedTopics } = get();
        const totalTopics = 40;
        return Math.round((completedTopics.length / totalTopics) * 100);
      },

      getTotalTopics: () => 40,
    }),
    {
      name: 'backend-handbook-progress',
    }
  )
);
