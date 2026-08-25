export type HSKLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type SyllabusVersion = "2.0" | "3.0";

export type ExamMode = "mock" | "practice" | "adaptive" | "weakness";

export type HSKSectionType = "listening" | "reading" | "writing";

export type QuestionDifficulty = "easy" | "medium" | "hard";

export type QuestionStatus = "draft" | "pending" | "approved" | "rejected" | "archived";

export interface HSKQuestionOption {
  id: string; // "A" | "B" | "C" | "D"
  text: string;
  pinyin?: string;
  imageUrl?: string;
}

export interface HSKQuestion {
  id: string;
  level: HSKLevel;
  syllabusVersion?: SyllabusVersion;
  section: HSKSectionType;
  questionType: string; // e.g., "listening_dialogue", "reading_cloze", "writing_reorder", "reading_error_detect"
  difficulty: QuestionDifficulty;
  questionText: string;
  pinyinText?: string;
  audioText?: string; // Text to be spoken for listening questions via TTS
  audioUrl?: string;
  imageUrl?: string;
  passage?: string; // For reading comprehension passages
  wordsToArrange?: string[]; // For writing/sentence arrangement
  options: HSKQuestionOption[];
  correctAnswer: string; // Option ID e.g. "A" or correct sentence
  explanation: string; // Detailed explanation in Vietnamese
  vocabularyIds?: string[];
  grammarIds?: string[];
  tags?: string[];
  qualityScore?: number;
  status?: QuestionStatus;
  createdAt?: string;
  updatedAt?: string;
  source?: "official" | "ai" | "curated" | "user_submission";
}

export interface HSKSection {
  id: string;
  title: string;
  type: HSKSectionType;
  instructions: string;
  passage?: string;
  questions: HSKQuestion[];
}

export interface HSKExam {
  id: string;
  level: HSKLevel;
  syllabusVersion: SyllabusVersion;
  mode: ExamMode;
  title: string;
  subtitle: string;
  isOfficial: boolean;
  durationMinutes: number;
  totalQuestions: number;
  passingScore: number;
  maxScore: number;
  seed: string;
  createdAt: string;
  sections: HSKSection[];
}

export interface SectionScore {
  type: HSKSectionType;
  title: string;
  correctCount: number;
  totalCount: number;
  score: number;
  maxScore: number;
  accuracy: number; // 0 to 100
}

export interface WeaknessCategory {
  id: string;
  name: string;
  type: "grammar" | "vocabulary" | "section" | "questionType";
  correctCount: number;
  totalCount: number;
  accuracy: number; // 0 to 100
  recommendations: string[];
}

export interface ExamResult {
  examId: string;
  level: HSKLevel;
  syllabusVersion: SyllabusVersion;
  mode: ExamMode;
  title: string;
  totalScore: number;
  maxScore: number;
  passingScore: number;
  isPassed: boolean;
  accuracy: number; // 0 to 100
  timeSpentSeconds: number;
  totalTimeMinutes: number;
  sectionScores: SectionScore[];
  userAnswers: Record<string, string>; // questionId -> answer
  flaggedQuestionIds: string[];
  weaknesses: WeaknessCategory[];
  weakestAreaSummary: string;
  studyRecommendations: string[];
  completedAt: string;
  examSnapshot: HSKExam;
}

export interface ExamBlueprintSection {
  type: HSKSectionType;
  title: string;
  instructions: string;
  questionTypes: {
    type: string;
    count: number;
    description: string;
  }[];
}

export interface ExamBlueprint {
  level: HSKLevel;
  syllabusVersion: SyllabusVersion;
  durationMinutes: number;
  passingScore: number;
  maxScore: number;
  totalQuestions: number;
  description: string;
  vocabularyCount: number;
  sections: ExamBlueprintSection[];
}

export interface QuestionQualityCheck {
  valid: boolean;
  score: number;
  problems: string[];
}

export interface ExamAutoSaveState {
  exam: HSKExam;
  currentSectionIdx: number;
  currentQuestionIdx: number;
  userAnswers: Record<string, string>;
  flaggedQuestionIds: string[];
  remainingSeconds: number;
  lastUpdated: string;
}
