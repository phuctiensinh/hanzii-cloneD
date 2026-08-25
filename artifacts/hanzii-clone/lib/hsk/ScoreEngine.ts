import { ExamResult, HSKExam, HSKSectionType, SectionScore, WeaknessCategory } from "@/types/hskExam";

export class ScoreEngine {
  /**
   * Pure calculation function: calculates official score, section breakdown, accuracy, and weakness diagnostic.
   */
  public static calculateResult(params: {
    exam: HSKExam;
    userAnswers: Record<string, string>;
    timeSpentSeconds: number;
    flaggedQuestionIds?: string[];
  }): ExamResult {
    const { exam, userAnswers, timeSpentSeconds, flaggedQuestionIds = [] } = params;

    const sectionScores: SectionScore[] = [];
    let totalCorrectCount = 0;
    let totalQuestionsCount = 0;

    const tagStats: Record<string, { correct: number; total: number }> = {};
    const questionTypeStats: Record<string, { correct: number; total: number }> = {};

    exam.sections.forEach((section) => {
      let sectionCorrect = 0;
      const sectionTotal = section.questions.length;
      totalQuestionsCount += sectionTotal;

      section.questions.forEach((q) => {
        const userAns = (userAnswers[q.id] || "").trim().toUpperCase();
        const correctAns = (q.correctAnswer || "").trim().toUpperCase();

        const isCorrect = userAns === correctAns;
        if (isCorrect) {
          sectionCorrect++;
          totalCorrectCount++;
        }

        // Aggregate question type
        if (!questionTypeStats[q.questionType]) {
          questionTypeStats[q.questionType] = { correct: 0, total: 0 };
        }
        questionTypeStats[q.questionType].total++;
        if (isCorrect) questionTypeStats[q.questionType].correct++;

        // Aggregate tags
        (q.tags || []).forEach((tag) => {
          if (!tagStats[tag]) {
            tagStats[tag] = { correct: 0, total: 0 };
          }
          tagStats[tag].total++;
          if (isCorrect) tagStats[tag].correct++;
        });
      });

      // Section scaling: In HSK 1-2 each section is 100 pts max (total 200). In HSK 3-6 each section is 100 pts max (total 300).
      const sectionMaxScore = 100;
      const sectionScoreVal = sectionTotal > 0
        ? Math.round((sectionCorrect / sectionTotal) * sectionMaxScore)
        : 0;
      const sectionAccuracy = sectionTotal > 0
        ? Math.round((sectionCorrect / sectionTotal) * 100)
        : 0;

      sectionScores.push({
        type: section.type,
        title: section.title,
        correctCount: sectionCorrect,
        totalCount: sectionTotal,
        score: sectionScoreVal,
        maxScore: sectionMaxScore,
        accuracy: sectionAccuracy,
      });
    });

    const totalScore = sectionScores.reduce((acc, s) => acc + s.score, 0);
    const maxScore = exam.maxScore || (exam.level <= 2 ? 200 : 300);
    const passingScore = exam.passingScore || (exam.level <= 2 ? 120 : 180);
    const isPassed = totalScore >= passingScore;
    const accuracy = totalQuestionsCount > 0
      ? Math.round((totalCorrectCount / totalQuestionsCount) * 100)
      : 0;

    // Weakness analysis
    const weaknesses: WeaknessCategory[] = [];

    // Check section weaknesses
    sectionScores.forEach((sec) => {
      if (sec.accuracy < 70) {
        weaknesses.push({
          id: `sec_${sec.type}`,
          name: `Kỹ năng ${sec.type === "listening" ? "Nghe hiểu" : sec.type === "reading" ? "Đọc hiểu" : "Viết & Ngữ pháp"}`,
          type: "section",
          correctCount: sec.correctCount,
          totalCount: sec.totalCount,
          accuracy: sec.accuracy,
          recommendations: [
            `Luyện thêm 20 câu phần ${sec.type === "listening" ? "Nghe" : sec.type === "reading" ? "Đọc" : "Viết"} HSK ${exam.level}`,
            `Nghe lại file audio hoặc phân tích kỹ các câu bị sai`,
          ],
        });
      }
    });

    // Check tag weaknesses
    Object.entries(tagStats).forEach(([tag, stat]) => {
      const tagAcc = Math.round((stat.correct / stat.total) * 100);
      if (stat.total >= 1 && tagAcc < 60) {
        weaknesses.push({
          id: `tag_${tag}`,
          name: `Chủ đề / Ngữ pháp: ${tag}`,
          type: "grammar",
          correctCount: stat.correct,
          totalCount: stat.total,
          accuracy: tagAcc,
          recommendations: [
            `Ôn lại các điểm ngữ pháp liên quan đến ${tag}`,
            `Luyện tập đề thi chuyên đề theo điểm yếu`,
          ],
        });
      }
    });

    // Sort weaknesses from lowest accuracy to highest
    weaknesses.sort((a, b) => a.accuracy - b.accuracy);

    let weakestAreaSummary = "Bạn đã làm bài rất tốt trên tất cả các phần!";
    if (weaknesses.length > 0) {
      weakestAreaSummary = `Bạn cần cải thiện nhiều nhất ở: ${weaknesses[0].name} (Độ chính xác: ${weaknesses[0].accuracy}%).`;
    }

    const studyRecommendations = weaknesses.length > 0
      ? [
          `Tập trung ôn luyện lại phần ${weaknesses[0].name}`,
          `Tạo đề thi thích ứng (Adaptive) theo điểm yếu để củng cố kiến thức`,
          `Xem lại chi tiết giải thích các câu sai ở bên dưới`,
        ]
      : [
          `Duy trì phong độ và thử sức với cấp độ HSK cao hơn!`,
          `Luyện tập thêm chế độ Mock Exam để nâng cao tốc độ phản xạ`,
        ];

    return {
      examId: exam.id,
      level: exam.level,
      syllabusVersion: exam.syllabusVersion,
      mode: exam.mode,
      title: exam.title,
      totalScore,
      maxScore,
      passingScore,
      isPassed,
      accuracy,
      timeSpentSeconds,
      totalTimeMinutes: exam.durationMinutes,
      sectionScores,
      userAnswers,
      flaggedQuestionIds,
      weaknesses,
      weakestAreaSummary,
      studyRecommendations,
      completedAt: new Date().toISOString(),
      examSnapshot: exam,
    };
  }
}
