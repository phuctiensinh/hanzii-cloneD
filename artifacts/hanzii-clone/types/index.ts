export interface Word {
  id: string;
  character: string;
  traditional: string;
  pinyin: string;
  meaning: string;
  hskLevel: number;
  examples: Example[];
  tags?: string[];
  isCustom?: boolean;
}

export interface Example {
  chinese: string;
  pinyin: string;
  vietnamese: string;
}

export interface StudyProgress {
  learned: number;
  total: number;
  lastStudied?: string;
}

export interface LearningState {
  savedWords: string[];
  learnedWords: string[];
  progress: Record<number, StudyProgress>;
  streak: number;
  lastStudyDate: string | null;
}
