import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { LearningState, StudyProgress } from "@/types";
import { useAuth } from "./AuthContext";
import { supabase } from "@/lib/supabase";

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
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<LearningState>(defaultState);

  useEffect(() => {
    console.log("[LearningContext] effect fired | authLoading:", authLoading, "| user:", user?.id ?? null);

    if (authLoading) {
      console.log("[LearningContext] auth still loading — skip");
      return;
    }

    if (!user) {
      console.log("[LearningContext] no user — loading guest state from AsyncStorage");
      AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
        if (raw) {
          try {
            setState(JSON.parse(raw));
            console.log("[LearningContext] guest state loaded from AsyncStorage");
          } catch {
            setState(defaultState);
          }
        } else {
          setState(defaultState);
          console.log("[LearningContext] no local data — using defaultState");
        }
      });
      return;
    }

    const loadSupabaseData = async () => {
      console.log("[LearningContext] fetching from Supabase for user:", user.id);
      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("streak, last_study_date, progress")
          .eq("id", user.id)
          .single();
        console.log("[LearningContext] profile:", profile, "| error:", profileError?.message);

        const streak = profile?.streak ?? 0;
        const lastStudyDate = profile?.last_study_date ?? null;
        const progress = (profile?.progress as Record<number, StudyProgress>) ?? {};

        const { data: userWords, error: wordsError } = await supabase
          .from("user_words")
          .select("word_id, is_saved, is_learned")
          .eq("user_id", user.id);
        console.log("[LearningContext] userWords:", userWords, "| error:", wordsError?.message);

        const savedWords = userWords?.filter((w) => w.is_saved).map((w) => w.word_id) ?? [];
        const learnedWords = userWords?.filter((w) => w.is_learned).map((w) => w.word_id) ?? [];

        // Merge any offline guest data
        const localRaw = await AsyncStorage.getItem(STORAGE_KEY);
        if (localRaw) {
          try {
            const localState: LearningState = JSON.parse(localRaw);
            const mergedSaved = Array.from(new Set([...savedWords, ...localState.savedWords]));
            const mergedLearned = Array.from(new Set([...learnedWords, ...localState.learnedWords]));
            const mergedStreak = Math.max(streak, localState.streak);
            const mergedLastStudyDate = localState.lastStudyDate || lastStudyDate;
            const mergedProgress = { ...progress };
            Object.entries(localState.progress || {}).forEach(([lvlStr, localProg]) => {
              const lvl = Number(lvlStr);
              const cur = mergedProgress[lvl] || { learned: 0, total: 0 };
              mergedProgress[lvl] = {
                learned: Math.max(cur.learned, localProg.learned),
                total: Math.max(cur.total, localProg.total),
                lastStudied: localProg.lastStudied || cur.lastStudied,
              };
            });

            await supabase.from("profiles").upsert({
              id: user.id,
              streak: mergedStreak,
              last_study_date: mergedLastStudyDate,
              progress: mergedProgress,
              updated_at: new Date().toISOString(),
            });

            const allWordIds = Array.from(new Set([...mergedSaved, ...mergedLearned]));
            if (allWordIds.length > 0) {
              await supabase.from("user_words").upsert(
                allWordIds.map((id) => ({
                  user_id: user.id,
                  word_id: id,
                  is_saved: mergedSaved.includes(id),
                  is_learned: mergedLearned.includes(id),
                })),
                { onConflict: "user_id,word_id" }
              );
            }

            await AsyncStorage.removeItem(STORAGE_KEY);
            setState({
              savedWords: mergedSaved,
              learnedWords: mergedLearned,
              progress: mergedProgress,
              streak: mergedStreak,
              lastStudyDate: mergedLastStudyDate,
            });
            console.log("[LearningContext] merged offline+remote state set");
            return;
          } catch {
            // ignore merge errors
          }
        }

        setState({ savedWords, learnedWords, progress, streak, lastStudyDate });
        console.log("[LearningContext] remote state set | savedWords:", savedWords.length, "learnedWords:", learnedWords.length);
      } catch (e) {
        console.error("[LearningContext] error loading from Supabase:", e);
      }
    };

    loadSupabaseData();
  }, [authLoading, user?.id]);

  const persistLocal = useCallback((next: LearningState) => {
    setState(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const toggleSaved = useCallback(
    async (wordId: string) => {
      const isCurrentlySaved = state.savedWords.includes(wordId);
      const nextSaved = isCurrentlySaved
        ? state.savedWords.filter((id) => id !== wordId)
        : [...state.savedWords, wordId];
      const nextState = { ...state, savedWords: nextSaved };

      if (!user) {
        persistLocal(nextState);
      } else {
        setState(nextState);
        const { error } = await supabase.from("user_words").upsert(
          {
            user_id: user.id,
            word_id: wordId,
            is_saved: !isCurrentlySaved,
            is_learned: state.learnedWords.includes(wordId),
          },
          { onConflict: "user_id,word_id" }
        );
        if (error) console.error("[toggleSaved] upsert error:", error.message);
        else console.log("[toggleSaved] saved to Supabase OK | wordId:", wordId, "is_saved:", !isCurrentlySaved);
      }
    },
    [state, user, persistLocal]
  );

  const markLearned = useCallback(
    async (wordId: string, level: number) => {
      const today = new Date().toDateString();
      const alreadyLearned = state.learnedWords.includes(wordId);
      const nextLearned = alreadyLearned ? state.learnedWords : [...state.learnedWords, wordId];
      const prev = state.progress[level] ?? { learned: 0, total: 0 };
      const newLearnedCount = alreadyLearned ? prev.learned : prev.learned + 1;

      let streak = state.streak;
      if (state.lastStudyDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        streak = state.lastStudyDate === yesterday.toDateString() ? streak + 1 : 1;
      }

      const nextProgress = {
        ...state.progress,
        [level]: { ...prev, learned: newLearnedCount, lastStudied: today },
      };
      const nextState = { ...state, learnedWords: nextLearned, progress: nextProgress, streak, lastStudyDate: today };

      if (!user) {
        persistLocal(nextState);
      } else {
        setState(nextState);
        const { error: pErr } = await supabase.from("profiles").upsert({
          id: user.id,
          streak,
          last_study_date: today,
          progress: nextProgress,
          updated_at: new Date().toISOString(),
        });
        if (pErr) console.error("[markLearned] profile upsert error:", pErr.message);
        else console.log("[markLearned] profile updated OK");

        const { error: wErr } = await supabase.from("user_words").upsert(
          {
            user_id: user.id,
            word_id: wordId,
            is_saved: state.savedWords.includes(wordId),
            is_learned: true,
            learned_at: new Date().toISOString(),
          },
          { onConflict: "user_id,word_id" }
        );
        if (wErr) console.error("[markLearned] user_words upsert error:", wErr.message);
        else console.log("[markLearned] word saved to Supabase OK | wordId:", wordId);
      }
    },
    [state, user, persistLocal]
  );

  const unmarkLearned = useCallback(
    async (wordId: string, level: number) => {
      const nextLearned = state.learnedWords.filter((id) => id !== wordId);
      const prev = state.progress[level] ?? { learned: 0, total: 0 };
      const newCount = Math.max(0, prev.learned - 1);
      const nextProgress = { ...state.progress, [level]: { ...prev, learned: newCount } };
      const nextState = { ...state, learnedWords: nextLearned, progress: nextProgress };

      if (!user) {
        persistLocal(nextState);
      } else {
        setState(nextState);
        const { error: pErr } = await supabase.from("profiles").upsert({
          id: user.id,
          streak: state.streak,
          last_study_date: state.lastStudyDate,
          progress: nextProgress,
          updated_at: new Date().toISOString(),
        });
        if (pErr) console.error("[unmarkLearned] profile upsert error:", pErr.message);

        const { error: wErr } = await supabase.from("user_words").upsert(
          {
            user_id: user.id,
            word_id: wordId,
            is_saved: state.savedWords.includes(wordId),
            is_learned: false,
          },
          { onConflict: "user_id,word_id" }
        );
        if (wErr) console.error("[unmarkLearned] user_words upsert error:", wErr.message);
      }
    },
    [state, user, persistLocal]
  );

  const isSaved = useCallback((wordId: string) => state.savedWords.includes(wordId), [state.savedWords]);
  const isLearned = useCallback((wordId: string) => state.learnedWords.includes(wordId), [state.learnedWords]);

  const resetLevel = useCallback(
    async (level: number) => {
      const nextProgress = { ...state.progress, [level]: { learned: 0, total: 0 } };
      const nextState = { ...state, progress: nextProgress };

      if (!user) {
        persistLocal(nextState);
      } else {
        setState(nextState);
        await supabase.from("profiles").upsert({
          id: user.id,
          streak: state.streak,
          last_study_date: state.lastStudyDate,
          progress: nextProgress,
          updated_at: new Date().toISOString(),
        });
      }
    },
    [state, user, persistLocal]
  );

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
