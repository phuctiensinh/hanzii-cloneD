import AsyncStorage from "@react-native-async-storage/async-storage";
import { ExamAutoSaveState, ExamResult, HSKQuestion, QuestionStatus } from "@/types/hskExam";
import { QUESTION_BANK } from "@/constants/questionBank";

const AUTOSAVE_KEY = "@hanzii_hsk_autosave";
const HISTORY_KEY = "@hanzii_hsk_history";
const WEAKNESSES_KEY = "@hanzii_hsk_weaknesses";
const ADMIN_QUESTIONS_KEY = "@hanzii_hsk_admin_questions";

export class HSKStorage {
  // ================= AutoSave =================
  public static async saveAutoSave(state: ExamAutoSaveState): Promise<void> {
    try {
      await AsyncStorage.setItem(AUTOSAVE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("[HSKStorage] saveAutoSave error:", e);
    }
  }

  public static async getAutoSave(): Promise<ExamAutoSaveState | null> {
    try {
      const raw = await AsyncStorage.getItem(AUTOSAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn("[HSKStorage] getAutoSave error:", e);
      return null;
    }
  }

  public static async clearAutoSave(): Promise<void> {
    try {
      await AsyncStorage.removeItem(AUTOSAVE_KEY);
    } catch (e) {
      console.warn("[HSKStorage] clearAutoSave error:", e);
    }
  }

  // ================= History =================
  public static async saveResult(result: ExamResult): Promise<void> {
    try {
      const history = await this.getHistory();
      // Prepend to top, keep max 50 recent exams
      const updated = [result, ...history.filter((h) => h.examId !== result.examId)].slice(0, 50);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));

      // Also record any detected weaknesses
      if (result.weaknesses && result.weaknesses.length > 0) {
        const weakNames = result.weaknesses.map((w) => w.name);
        await this.recordWeaknesses(weakNames);
      }
    } catch (e) {
      console.warn("[HSKStorage] saveResult error:", e);
    }
  }

  public static async getHistory(): Promise<ExamResult[]> {
    try {
      const raw = await AsyncStorage.getItem(HISTORY_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (e) {
      console.warn("[HSKStorage] getHistory error:", e);
      return [];
    }
  }

  public static async getResultById(examId: string): Promise<ExamResult | null> {
    const history = await this.getHistory();
    return history.find((h) => h.examId === examId) || null;
  }

  // ================= Weaknesses =================
  public static async getUserWeaknesses(): Promise<string[]> {
    try {
      const raw = await AsyncStorage.getItem(WEAKNESSES_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }

  public static async recordWeaknesses(newWeaknesses: string[]): Promise<void> {
    try {
      const current = await this.getUserWeaknesses();
      const merged = Array.from(new Set([...newWeaknesses, ...current])).slice(0, 30);
      await AsyncStorage.setItem(WEAKNESSES_KEY, JSON.stringify(merged));
    } catch (e) {
      console.warn("[HSKStorage] recordWeaknesses error:", e);
    }
  }

  // ================= Admin Question Bank Management =================
  public static async getAllQuestions(): Promise<HSKQuestion[]> {
    try {
      const raw = await AsyncStorage.getItem(ADMIN_QUESTIONS_KEY);
      const customQuestions: HSKQuestion[] = raw ? JSON.parse(raw) : [];
      
      // Merge with default seed bank (avoid duplicate IDs)
      const customIds = new Set(customQuestions.map((q) => q.id));
      const combined = [
        ...customQuestions,
        ...QUESTION_BANK.filter((q) => !customIds.has(q.id)),
      ];
      return combined;
    } catch (e) {
      return QUESTION_BANK;
    }
  }

  public static async saveQuestion(question: HSKQuestion): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(ADMIN_QUESTIONS_KEY);
      let customQuestions: HSKQuestion[] = raw ? JSON.parse(raw) : [];
      const existingIdx = customQuestions.findIndex((q) => q.id === question.id);
      
      if (existingIdx >= 0) {
        customQuestions[existingIdx] = question;
      } else {
        customQuestions = [question, ...customQuestions];
      }
      await AsyncStorage.setItem(ADMIN_QUESTIONS_KEY, JSON.stringify(customQuestions));
    } catch (e) {
      console.warn("[HSKStorage] saveQuestion error:", e);
    }
  }

  public static async updateQuestionStatus(id: string, status: QuestionStatus): Promise<void> {
    const all = await this.getAllQuestions();
    const target = all.find((q) => q.id === id);
    if (target) {
      target.status = status;
      target.updatedAt = new Date().toISOString();
      await this.saveQuestion(target);
    }
  }

  public static async deleteQuestion(id: string): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(ADMIN_QUESTIONS_KEY);
      if (!raw) return;
      let customQuestions: HSKQuestion[] = JSON.parse(raw);
      customQuestions = customQuestions.filter((q) => q.id !== id);
      await AsyncStorage.setItem(ADMIN_QUESTIONS_KEY, JSON.stringify(customQuestions));
    } catch (e) {
      console.warn("[HSKStorage] deleteQuestion error:", e);
    }
  }
}
