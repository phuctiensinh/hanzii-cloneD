import { HSKQuestion, QuestionQualityCheck } from "@/types/hskExam";

export class QualityChecker {
  /**
   * Validates a question against official HSK standards and calculates a quality score.
   */
  public static validateQuestion(q: Partial<HSKQuestion>): QuestionQualityCheck {
    const problems: string[] = [];
    let score = 1.0;

    // 1. Basic structural checks
    if (!q.questionText || q.questionText.trim().length === 0) {
      problems.push("Câu hỏi không được để trống (questionText is empty)");
      score -= 0.5;
    }

    if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
      problems.push("Phải có ít nhất 2 phương án lựa chọn (options < 2)");
      score -= 0.5;
    }

    if (!q.correctAnswer || q.correctAnswer.trim().length === 0) {
      problems.push("Chưa có đáp án đúng (correctAnswer is empty)");
      score -= 0.5;
    }

    if (!q.explanation || q.explanation.trim().length === 0) {
      problems.push("Thiếu phần giải thích đáp án (explanation is empty)");
      score -= 0.2;
    }

    // 2. Options validation
    if (q.options && Array.isArray(q.options)) {
      const optionTexts = q.options.map((opt) => opt.text.trim());
      const uniqueTexts = new Set(optionTexts);

      if (uniqueTexts.size !== optionTexts.length) {
        problems.push("Có phương án trả lời bị trùng lặp nội dung (duplicate options)");
        score -= 0.4;
      }

      // Check if correct answer matches one of option IDs
      const validOptionIds = q.options.map((o) => o.id);
      const isIdMatch = validOptionIds.includes(q.correctAnswer?.trim() || "");
      const isTextMatch = optionTexts.includes(q.correctAnswer?.trim() || "");

      if (!isIdMatch && !isTextMatch && q.section !== "writing") {
        problems.push("Đáp án đúng không trùng khớp với bất kỳ phương án nào");
        score -= 0.4;
      }

      // Check for extreme length disparity in options
      const lengths = optionTexts.map((t) => t.length);
      const minLen = Math.min(...lengths);
      const maxLen = Math.max(...lengths);
      if (maxLen > 40 && minLen < 5 && maxLen / (minLen || 1) > 6) {
        problems.push("Độ dài các phương án quá chênh lệch dễ đoán");
        score -= 0.1;
      }
    }

    // 3. Section specific checks
    if (q.section === "listening") {
      if (!q.audioText && !q.audioUrl) {
        problems.push("Câu hỏi phần Nghe phải có audioText hoặc audioUrl");
        score -= 0.3;
      }
    }

    if (q.section === "writing" && q.questionType === "writing_reorder") {
      if (!q.wordsToArrange || q.wordsToArrange.length < 2) {
        problems.push("Câu hỏi sắp xếp phải có danh sách từ wordsToArrange");
        score -= 0.3;
      }
    }

    // Bound score
    const finalScore = Math.max(0, Math.min(1.0, Math.round(score * 100) / 100));
    const valid = finalScore >= 0.70 && problems.length === 0;

    return {
      valid,
      score: finalScore,
      problems,
    };
  }
}
