import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { Word } from "@/types";

const STORAGE_KEY = "@hanzii_custom_words";

interface CustomWordsContextValue {
  customWords: Word[];
  addWord: (data: Omit<Word, "id" | "isCustom">) => void;
  deleteWord: (id: string) => void;
  updateWord: (id: string, data: Omit<Word, "id" | "isCustom">) => void;
  getCustomWordById: (id: string) => Word | undefined;
}

const CustomWordsContext = createContext<CustomWordsContextValue | null>(null);

export function CustomWordsProvider({ children }: { children: React.ReactNode }) {
  const [customWords, setCustomWords] = useState<Word[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try { setCustomWords(JSON.parse(raw)); } catch {}
      }
    });
  }, []);

  const persist = useCallback((words: Word[]) => {
    setCustomWords(words);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(words));
  }, []);

  const addWord = useCallback((data: Omit<Word, "id" | "isCustom">) => {
    const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    persist([...customWords, { ...data, id, isCustom: true }]);
  }, [customWords, persist]);

  const deleteWord = useCallback((id: string) => {
    persist(customWords.filter((w) => w.id !== id));
  }, [customWords, persist]);

  const updateWord = useCallback((id: string, data: Omit<Word, "id" | "isCustom">) => {
    persist(customWords.map((w) => w.id === id ? { ...data, id, isCustom: true } : w));
  }, [customWords, persist]);

  const getCustomWordById = useCallback((id: string) => {
    return customWords.find((w) => w.id === id);
  }, [customWords]);

  return (
    <CustomWordsContext.Provider value={{ customWords, addWord, deleteWord, updateWord, getCustomWordById }}>
      {children}
    </CustomWordsContext.Provider>
  );
}

export function useCustomWords() {
  const ctx = useContext(CustomWordsContext);
  if (!ctx) throw new Error("useCustomWords must be used within CustomWordsProvider");
  return ctx;
}
