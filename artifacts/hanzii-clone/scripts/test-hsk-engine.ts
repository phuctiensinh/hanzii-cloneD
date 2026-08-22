import { QualityChecker } from "../lib/hsk/QualityChecker";
import { QuestionEngine, SeededRandom } from "../lib/hsk/QuestionEngine";
import { ExamGenerator } from "../lib/hsk/ExamGenerator";
import { ScoreEngine } from "../lib/hsk/ScoreEngine";
import { HSKLevel } from "../types/hskExam";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${msg}`);
    process.exit(1);
  }
  console.log(`✓ ${msg}`);
}

console.log("=========================================");
console.log("RUNNING HSK EXAM ENGINE AUTOMATED TESTS");
console.log("=========================================\n");

// TEST 1: QualityChecker Validation
console.log("--- 1. Testing QualityChecker ---");
const validCheck = QualityChecker.validateQuestion({
  id: "test_1",
  questionText: "这是一道测试题吗？",
  options: [
    { id: "A", text: "是的" },
    { id: "B", text: "不是" },
  ],
  correctAnswer: "A",
  explanation: "Đáp án A đúng.",
  section: "reading",
});
assert(validCheck.valid === true, "QualityChecker accepts valid question");
assert(validCheck.score >= 0.9, "Quality score for valid question >= 0.9");

const invalidCheck = QualityChecker.validateQuestion({
  id: "test_bad",
  questionText: "",
  options: [{ id: "A", text: "Trùng" }, { id: "B", text: "Trùng" }],
  correctAnswer: "C",
  explanation: "",
});
assert(invalidCheck.valid === false, "QualityChecker rejects question with empty text, duplicate options, missing explanation");
assert(invalidCheck.problems.length >= 3, "QualityChecker identifies all specific problems");

// TEST 2: SeededRandom & Reproducibility
console.log("\n--- 2. Testing SeededRandom & Reproducibility ---");
const rng1 = new SeededRandom("fixed_seed_123");
const rng2 = new SeededRandom("fixed_seed_123");
const rng3 = new SeededRandom("different_seed_456");

const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const shuffle1 = rng1.shuffle(array);
const shuffle2 = rng2.shuffle(array);
const shuffle3 = rng3.shuffle(array);

assert(JSON.stringify(shuffle1) === JSON.stringify(shuffle2), "Identical seed produces identical shuffle");
assert(JSON.stringify(shuffle1) !== JSON.stringify(shuffle3), "Different seed produces different shuffle");

// TEST 3: ExamGenerator for HSK 1 -> 6
console.log("\n--- 3. Testing ExamGenerator for HSK 1 - 6 ---");
const levels: HSKLevel[] = [1, 2, 3, 4, 5, 6];

levels.forEach((lvl) => {
  const exam = ExamGenerator.generateExam({
    level: lvl,
    syllabusVersion: "2.0",
    mode: "mock",
    seed: `test_seed_level_${lvl}`,
  });

  assert(exam.level === lvl, `Exam generated for Level ${lvl}`);
  assert(exam.sections.length >= 2, `Level ${lvl} has at least 2 sections (Listening & Reading)`);
  if (lvl >= 3) {
    const hasWriting = exam.sections.some((s) => s.type === "writing");
    assert(hasWriting, `Level ${lvl} has Writing section`);
  }
  const totalQ = exam.sections.reduce((sum, s) => sum + s.questions.length, 0);
  assert(totalQ === exam.totalQuestions, `Exam total questions count matched (${totalQ})`);
});

// TEST 4: ScoreEngine calculation & Diagnostics
console.log("\n--- 4. Testing ScoreEngine & Diagnostics ---");
const sampleExam = ExamGenerator.generateExam({
  level: 3,
  syllabusVersion: "2.0",
  mode: "mock",
  seed: "score_test_seed",
});

// Simulate answers: 80% correct
const userAnswers: Record<string, string> = {};
let qCount = 0;
sampleExam.sections.forEach((sec) => {
  sec.questions.forEach((q) => {
    qCount++;
    // Make 80% correct, 20% wrong
    if (qCount % 5 !== 0) {
      userAnswers[q.id] = q.correctAnswer;
    } else {
      userAnswers[q.id] = q.correctAnswer === "A" ? "B" : "A";
    }
  });
});

const result = ScoreEngine.calculateResult({
  exam: sampleExam,
  userAnswers,
  timeSpentSeconds: 3600,
});

assert(result.totalScore > 200, `Result calculated valid total score (${result.totalScore}/${result.maxScore})`);
assert(result.isPassed === true, "Result correctly determined PASS status");
assert(result.accuracy === 80, `Result accuracy calculated accurately (${result.accuracy}%)`);
assert(result.sectionScores.length === sampleExam.sections.length, "Result has all section breakdown scores");

// Simulate failing answers (< 180 pts)
const failAnswers: Record<string, string> = {};
sampleExam.sections.forEach((sec) => {
  sec.questions.forEach((q) => {
    failAnswers[q.id] = q.correctAnswer === "A" ? "B" : "A"; // All wrong
  });
});

const failResult = ScoreEngine.calculateResult({
  exam: sampleExam,
  userAnswers: failAnswers,
  timeSpentSeconds: 1200,
});

assert(failResult.isPassed === false, "Failing answers correctly determine FAIL status");
assert(failResult.weaknesses.length > 0, "Weaknesses correctly diagnosed on failed test");
assert(failResult.studyRecommendations.length > 0, "Study recommendations generated");

console.log("\n=========================================");
console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! (100%)");
console.log("=========================================");
