import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { Word } from "@/types";
import { useAuth } from "./AuthContext";
import { supabase } from "@/lib/supabase";

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
  const { user, loading: authLoading } = useAuth();
  const [customWords, setCustomWords] = useState<Word[]>([]);

  // Effect runs whenever auth finishes loading or the user changes.
  useEffect(() => {
    // Wait until Supabase has restored the session from storage
    if (authLoading) return;

    if (!user) {
      // Guest mode
      AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
        if (raw) {
          try {
            setCustomWords(JSON.parse(raw));
          } catch {
            setCustomWords([]);
          }
        } else {
          setCustomWords([]);
        }
      });
      return;
    }

    // Logged-in: fetch from Supabase
    const loadSupabaseCustomWords = async () => {
      try {
        const { data: remoteWords } = await supabase
          .from("custom_words")
          .select("*")
          .eq("user_id", user.id);

        let currentRemote: Word[] = (remoteWords || []).map((w) => ({
          id: w.id,
          character: w.character,
          traditional: w.traditional,
          pinyin: w.pinyin,
          meaning: w.meaning,
          hskLevel: w.hsk_level,
          examples: typeof w.examples === "string" ? JSON.parse(w.examples) : (w.examples ?? []),
          tags: typeof w.tags === "string" ? JSON.parse(w.tags) : (w.tags ?? []),
          isCustom: true,
        }));

        // Merge any offline (guest) words up to Supabase
        const localRaw = await AsyncStorage.getItem(STORAGE_KEY);
        if (localRaw) {
          try {
            const localWords: Word[] = JSON.parse(localRaw);
            if (localWords.length > 0) {
              await supabase.from("custom_words").upsert(
                localWords.map((w) => ({
                  id: w.id,
                  user_id: user.id,
                  character: w.character,
                  traditional: w.traditional,
                  pinyin: w.pinyin,
                  meaning: w.meaning,
                  hsk_level: w.hskLevel,
                  examples: w.examples,
                  tags: w.tags || [],
                }))
              );

              const remoteIds = new Set(currentRemote.map((w) => w.id));
              localWords.forEach((lw) => {
                if (!remoteIds.has(lw.id)) currentRemote.push(lw);
              });

              await AsyncStorage.removeItem(STORAGE_KEY);
            }
          } catch {
            // ignore merge errors
          }
        }

        setCustomWords(currentRemote);
      } catch (e) {
        console.error("CustomWordsContext: error loading from Supabase", e);
      }
    };

    loadSupabaseCustomWords();
  }, [authLoading, user?.id]); // ← include authLoading so effect re-runs when it flips to false

  const persistLocal = useCallback((words: Word[]) => {
    setCustomWords(words);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(words));
  }, []);

  const addWord = useCallback(
    async (data: Omit<Word, "id" | "isCustom">) => {
      const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const newWord: Word = { ...data, id, isCustom: true };

      if (!user) {
        persistLocal([...customWords, newWord]);
      } else {
        setCustomWords((prev) => [...prev, newWord]);
        await supabase.from("custom_words").insert({
          id,
          user_id: user.id,
          character: data.character,
          traditional: data.traditional,
          pinyin: data.pinyin,
          meaning: data.meaning,
          hsk_level: data.hskLevel,
          examples: data.examples,
          tags: data.tags || [],
        });
      }
    },
    [customWords, user, persistLocal]
  );

  const deleteWord = useCallback(
    async (id: string) => {
      if (!user) {
        persistLocal(customWords.filter((w) => w.id !== id));
      } else {
        setCustomWords((prev) => prev.filter((w) => w.id !== id));
        await supabase.from("custom_words").delete().eq("id", id);
      }
    },
    [customWords, user, persistLocal]
  );

  const updateWord = useCallback(
    async (id: string, data: Omit<Word, "id" | "isCustom">) => {
      const updatedWord: Word = { ...data, id, isCustom: true };

      if (!user) {
        persistLocal(customWords.map((w) => (w.id === id ? updatedWord : w)));
      } else {
        setCustomWords((prev) => prev.map((w) => (w.id === id ? updatedWord : w)));
        await supabase
          .from("custom_words")
          .update({
            character: data.character,
            traditional: data.traditional,
            pinyin: data.pinyin,
            meaning: data.meaning,
            hsk_level: data.hskLevel,
            examples: data.examples,
            tags: data.tags || [],
          })
          .eq("id", id);
      }
    },
    [customWords, user, persistLocal]
  );

  const getCustomWordById = useCallback(
    (id: string) => customWords.find((w) => w.id === id),
    [customWords]
  );

  // Do NOT return null while loading — render children with empty state
  // to avoid unmounting the navigation tree.
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
