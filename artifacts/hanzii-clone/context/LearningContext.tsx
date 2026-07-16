import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { LearningState } from "@/types";

const STORAGE_KEY = "@hanzii_learning";

interface LearningContextValue extends LearningState {
  toggleSaved: (wordId: string) => void;
  markLearned: (wordId: string, level: number) => void;
  unmarkLearned: (wordId: string, level: number) => void;
  isSaved: (wordId: string) => boolean;
  isLearned: (wordId: string) => boolean;
  resetLevel: (level: number) => void;
}

const LearningContext = createContext<LearningContextValue | null>(null);

const defaultState: LearningState = {
  savedWords: [],
  learnedWords: [],
  progress: {},
  streak: 0,
  lastStudyDate: null,
};

export function LearningProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LearningState>(defaultState);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setState(JSON.parse(raw));
        } catch {}
      }
      setLoaded(true);
    });
  }, []);

  const persist = useCallback((next: LearningState) => {
    setState(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const toggleSaved = useCallback(
    (wordId: string) => {
      const saved = state.savedWords.includes(wordId)
        ? state.savedWords.filter((id) => id !== wordId)
        : [...state.savedWords, wordId];
      persist({ ...state, savedWords: saved });
    },
    [state, persist]
  );

  const markLearned = useCallback(
    (wordId: string, level: number) => {
      const today = new Date().toDateString();
      const learned = state.learnedWords.includes(wordId)
        ? state.learnedWords
        : [...state.learnedWords, wordId];

      const prev = state.progress[level] ?? { learned: 0, total: 0 };
      const newLearned = state.learnedWords.includes(wordId) ? prev.learned : prev.learned + 1;

      let streak = state.streak;
      if (state.lastStudyDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        streak = state.lastStudyDate === yesterday.toDateString() ? streak + 1 : 1;
      }

      persist({
        ...state,
        learnedWords: learned,
        progress: {
          ...state.progress,
          [level]: { ...prev, learned: newLearned, lastStudied: today },
        },
        streak,
        lastStudyDate: today,
      });
    },
    [state, persist]
  );

  const unmarkLearned = useCallback(
    (wordId: string, level: number) => {
      const learned = state.learnedWords.filter((id) => id !== wordId);
      const prev = state.progress[level] ?? { learned: 0, total: 0 };
      const newCount = Math.max(0, prev.learned - 1);
      persist({
        ...state,
        learnedWords: learned,
        progress: {
          ...state.progress,
          [level]: { ...prev, learned: newCount },
        },
      });
    },
    [state, persist]
  );

  const isSaved = useCallback((wordId: string) => state.savedWords.includes(wordId), [state.savedWords]);
  const isLearned = useCallback((wordId: string) => state.learnedWords.includes(wordId), [state.learnedWords]);

  const resetLevel = useCallback(
    (level: number) => {
      const levelWords = state.learnedWords;
      persist({
        ...state,
        progress: { ...state.progress, [level]: { learned: 0, total: 0 } },
      });
    },
    [state, persist]
  );

  if (!loaded) return null;

  return (
    <LearningContext.Provider
      value={{ ...state, toggleSaved, markLearned, unmarkLearned, isSaved, isLearned, resetLevel }}
    >
      {children}
    </LearningContext.Provider>
  );
}

export function useLearning() {
  const ctx = useContext(LearningContext);
  if (!ctx) throw new Error("useLearning must be used within LearningProvider");
  return ctx;
}
