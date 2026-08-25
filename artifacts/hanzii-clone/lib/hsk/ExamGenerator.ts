import { ExamMode, HSKExam, HSKLevel, HSKSection, SyllabusVersion } from "@/types/hskExam";
import { getExamBlueprint, HSK_LEVEL_METAS } from "@/constants/examConfig";
import { QuestionEngine } from "./QuestionEngine";

export class ExamGenerator {
  /**
   * Generates a complete, structured HSK exam based on level, syllabus version, and mode.
   */
  public static generateExam(params: {
    level: HSKLevel;
    syllabusVersion?: SyllabusVersion;
    mode?: ExamMode;
    targetWeaknesses?: string[];
    seed?: string;
  }): HSKExam {
    const {
      level,
      syllabusVersion = "2.0",
      mode = "mock",
      targetWeaknesses = [],
      seed = `hsk_${level}_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    } = params;

    const blueprint = getExamBlueprint(level, syllabusVersion);
    const meta = HSK_LEVEL_METAS[level];

    const sections: HSKSection[] = [];
    let totalQuestions = 0;

    blueprint.sections.forEach((bpSection, sIdx) => {
      // Calculate questions count for this section based on blueprint
      const sectionQuestionCount = bpSection.questionTypes.reduce((sum, qt) => sum + qt.count, 0);

      // In quick practice mode or demo, we keep a practical number if full count is too huge for 1 test session
      const targetCount = mode === "practice" ? Math.min(10, sectionQuestionCount) : sectionQuestionCount;

      const questions = QuestionEngine.getQuestionsForSection({
        level,
        syllabusVersion,
        section: bpSection.type,
        count: targetCount,
        seed: `${seed}_sec${sIdx}`,
        targetWeaknesses,
      });

      totalQuestions += questions.length;

      sections.push({
        id: `sec_${level}_${bpSection.type}_${sIdx}`,
        title: bpSection.title,
        type: bpSection.type,
        instructions: bpSection.instructions,
        questions,
      });
    });

    const modeLabels: Record<ExamMode, string> = {
      mock: "Đề Thi Chuẩn Quốc Tế",
      practice: "Đề Luyện Tập Tự Do",
      adaptive: "Đề Thi Thích Ứng (Adaptive)",
      weakness: "Đề Ôn Luyện Điểm Yếu",
    };

    const examTitle = `Đề Thi HSK ${level} (${modeLabels[mode]})`;
    const examSubtitle = `Biên soạn theo cấu trúc chuẩn HSK ${syllabusVersion} • ${meta.vocabRange} • ${meta.durationMinutes} phút`;

    const exam: HSKExam = {
      id: `exam_${level}_${syllabusVersion}_${seed}`,
      level,
      syllabusVersion,
      mode,
      title: examTitle,
      subtitle: examSubtitle,
      isOfficial: mode === "mock",
      durationMinutes: mode === "practice" ? 0 : blueprint.durationMinutes,
      totalQuestions,
      passingScore: blueprint.passingScore,
      maxScore: blueprint.maxScore,
      seed,
      createdAt: new Date().toISOString(),
      sections,
    };

    return exam;
  }
}
