import { HSKQuestion, HSKQuestionOption } from "@/types/hskExam";
import { QualityChecker } from "./QualityChecker";

export interface AIExplanationResult {
  whyCorrect: string;
  whyUserChoiceWrong?: string;
  keyVocabulary: { word: string; pinyin: string; meaning: string }[];
  keyGrammar: { pattern: string; explanation: string };
  memoryTip: string;
  similarExample: { chinese: string; pinyin: string; vietnamese: string };
}

export class AIQuestionGenerator {
  /**
   * Generates in-depth AI explanation for a single exam question on demand.
   */
  public static async explainQuestion(params: {
    question: HSKQuestion;
    userAnswer?: string;
  }): Promise<AIExplanationResult> {
    const { question, userAnswer } = params;

    try {
      const response = await fetch("/api/hsk-explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText: question.questionText,
          pinyinText: question.pinyinText,
          audioText: question.audioText,
          options: question.options,
          correctAnswer: question.correctAnswer,
          userAnswer: userAnswer || null,
          level: question.level,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data as AIExplanationResult;
      }
    } catch (err) {
      console.warn("[AIQuestionGenerator] explainQuestion API fallback to local parser:", err);
    }

    // High quality offline / local fallback generator
    const correctOpt = question.options.find((o) => o.id === question.correctAnswer);
    const userOpt = question.options.find((o) => o.id === userAnswer);

    return {
      whyCorrect: `Phương án ${question.correctAnswer} (${correctOpt?.text || ""}) chính xác vì ngữ cảnh câu và ngữ pháp phù hợp chuẩn HSK ${question.level}. ${question.explanation}`,
      whyUserChoiceWrong: userAnswer && userAnswer !== question.correctAnswer
        ? `Bạn đã chọn ${userAnswer} (${userOpt?.text || ""}). Phương án này chưa chính xác do không phù hợp với cấu trúc ngữ cảnh câu hỏi.`
        : undefined,
      keyVocabulary: [
        {
          word: question.pinyinText || "重点词汇",
          pinyin: question.pinyinText || "",
          meaning: "Từ vựng trọng điểm cần ghi nhớ trong câu",
        },
      ],
      keyGrammar: {
        pattern: "Cấu trúc ngữ pháp HSK chuẩn",
        explanation: "Chú ý trật tự từ: Chủ ngữ + Trạng ngữ thời gian/địa điểm + Động từ + Tân ngữ.",
      },
      memoryTip: "Ghi nhớ cấu trúc câu theo cụm từ và ngữ cảnh thay vì dịch từng từ đơn lẻ.",
      similarExample: {
        chinese: question.audioText || question.questionText,
        pinyin: question.pinyinText || "",
        vietnamese: question.explanation,
      },
    };
  }
}
