import { HSKLevel, HSKQuestion, HSKSectionType, QuestionDifficulty, SyllabusVersion } from "@/types/hskExam";
import { QUESTION_BANK } from "@/constants/questionBank";
import { HSK_WORDS } from "@/constants/data";
import { QualityChecker } from "./QualityChecker";

// Seeded PRNG for stable, reproducible randomization across reloads
export class SeededRandom {
  private state: number;

  constructor(seedStr: string) {
    let h = 1779033703 ^ seedStr.length;
    for (let i = 0; i < seedStr.length; i++) {
      h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    this.state = h >>> 0;
  }

  // Returns number between 0 and 1
  public next(): number {
    this.state = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    this.state = (this.state + Math.imul(this.state ^ (this.state >>> 7), 61 | this.state)) ^ this.state;
    return ((this.state ^ (this.state >>> 14)) >>> 0) / 4294967296;
  }

  // Shuffle array immutably
  public shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Pick random element
  public pickOne<T>(array: T[]): T | undefined {
    if (array.length === 0) return undefined;
    const index = Math.floor(this.next() * array.length);
    return array[index];
  }
}

export class QuestionEngine {
  /**
   * Generates a dynamic vocabulary question for lower HSK levels from the authentic HSK word list
   */
  public static generateDynamicVocabQuestion(
    level: HSKLevel,
    section: HSKSectionType,
    rng: SeededRandom,
    idSuffix: string
  ): HSKQuestion {
    const levelWords = HSK_WORDS.filter((w) => w.hskLevel === level);
    const pool = levelWords.length >= 4 ? levelWords : HSK_WORDS;
    
    // Pick 1 target word and 3 distractor words
    const shuffled = rng.shuffle(pool);
    const target = shuffled[0];
    const distractors = shuffled.slice(1, 4);

    const isListening = section === "listening";

    // Alternate between question styles:
    // Style 1: "Từ '吃' có nghĩa là gì?" -> Options: [ăn, uống, đọc, xem]
    // Style 2: "Từ nào có nghĩa là 'ăn'?" -> Options: [吃, 喝, 读, 看]
    const isStyleCharToMeaning = rng.next() > 0.5;

    let questionText = "";
    let options: { id: string; text: string; pinyin?: string }[] = [];
    let correctId = "A";

    if (isListening) {
      // Listening: user hears audio, options are Vietnamese meanings (NO Chinese chars in options)
      questionText = "Nghe từ và chọn nghĩa tiếng Việt chính xác:";
      const rawOptions = rng.shuffle([
        { text: target.meaning, isTarget: true },
        { text: distractors[0]?.meaning || "tốt", isTarget: false },
        { text: distractors[1]?.meaning || "lớn", isTarget: false },
        { text: distractors[2]?.meaning || "nhỏ", isTarget: false },
      ]);

      options = rawOptions.map((opt, idx) => ({
        id: ["A", "B", "C", "D"][idx],
        text: opt.text,
      }));
      const targetOpt = options.find((_, idx) => rawOptions[idx].isTarget);
      correctId = targetOpt ? targetOpt.id : "A";
    } else if (isStyleCharToMeaning) {
      // Reading Style 1: Given Chinese character -> Choose Vietnamese meaning
      questionText = `Chọn nghĩa tiếng Việt của từ “${target.character}”:`;
      const rawOptions = rng.shuffle([
        { text: target.meaning, isTarget: true },
        { text: distractors[0]?.meaning || "tốt; hay", isTarget: false },
        { text: distractors[1]?.meaning || "lớn; to", isTarget: false },
        { text: distractors[2]?.meaning || "nhỏ; bé", isTarget: false },
      ]);

      options = rawOptions.map((opt, idx) => ({
        id: ["A", "B", "C", "D"][idx],
        text: opt.text,
      }));
      const targetOpt = options.find((_, idx) => rawOptions[idx].isTarget);
      correctId = targetOpt ? targetOpt.id : "A";
    } else {
      // Reading Style 2: Given Vietnamese meaning -> Choose Chinese character
      questionText = `Chữ Hán nào dưới đây có nghĩa là “${target.meaning}”?`;
      const rawOptions = rng.shuffle([
        { text: target.character, pinyin: level <= 2 ? target.pinyin : undefined, isTarget: true },
        { text: distractors[0]?.character || "好", pinyin: level <= 2 ? distractors[0]?.pinyin : undefined, isTarget: false },
        { text: distractors[1]?.character || "大", pinyin: level <= 2 ? distractors[1]?.pinyin : undefined, isTarget: false },
        { text: distractors[2]?.character || "小", pinyin: level <= 2 ? distractors[2]?.pinyin : undefined, isTarget: false },
      ]);

      options = rawOptions.map((opt, idx) => ({
        id: ["A", "B", "C", "D"][idx],
        text: opt.text,
        pinyin: opt.pinyin,
      }));
      const targetOpt = options.find((_, idx) => rawOptions[idx].isTarget);
      correctId = targetOpt ? targetOpt.id : "A";
    }

    const question: HSKQuestion = {
      id: `dyn_${level}_${section}_${idSuffix}`,
      level,
      syllabusVersion: "2.0",
      section,
      questionType: isListening ? "listening_vocab_match" : "reading_cloze",
      difficulty: "easy",
      questionText,
      audioText: isListening ? `${target.character}。${target.character}。` : undefined,
      options,
      correctAnswer: correctId,
      explanation: `Đáp án đúng là ${correctId}. Chữ "${target.character}" (${target.pinyin}) có nghĩa là "${target.meaning}".`,
      vocabularyIds: [target.id],
      tags: ["từ vựng", "tự động sinh"],
      qualityScore: 1.0,
      status: "approved",
      source: "curated",
    };

    return question;
  }

  /**
   * Filters and retrieves questions matching criteria with controlled difficulty and deduplication
   */
  public static getQuestionsForSection(params: {
    level: HSKLevel;
    syllabusVersion: SyllabusVersion;
    section: HSKSectionType;
    count: number;
    seed: string;
    targetWeaknesses?: string[];
  }): HSKQuestion[] {
    const { level, section, count, seed, targetWeaknesses } = params;
    const rng = new SeededRandom(`${seed}_${level}_${section}`);

    // 1. Get bank questions for this level and section
    let candidateBank = QUESTION_BANK.filter(
      (q) => q.level === level && q.section === section && q.status !== "rejected"
    );

    // 2. Prioritize weakness questions if specified
    if (targetWeaknesses && targetWeaknesses.length > 0) {
      candidateBank = candidateBank.sort((a, b) => {
        const aMatch = a.tags?.some((t) => targetWeaknesses.includes(t)) || false;
        const bMatch = b.tags?.some((t) => targetWeaknesses.includes(t)) || false;
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
        return 0;
      });
    }

    const selected: HSKQuestion[] = [];
    const usedIds = new Set<string>();

    // 3. Shuffle candidate bank with seed
    const shuffledBank = rng.shuffle(candidateBank);

    for (const q of shuffledBank) {
      if (selected.length >= count) break;
      if (!usedIds.has(q.id)) {
        // Validate with QualityChecker
        const check = QualityChecker.validateQuestion(q);
        if (check.valid || check.score >= 0.8) {
          selected.push(q);
          usedIds.add(q.id);
        }
      }
    }

    // 4. If more questions are required, dynamically generate valid questions
    let dynIndex = 1;
    while (selected.length < count) {
      const dynQ = this.generateDynamicVocabQuestion(level, section, rng, `${seed}_${dynIndex++}`);
      selected.push(dynQ);
    }

    return selected.slice(0, count);
  }
}
