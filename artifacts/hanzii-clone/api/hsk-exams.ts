import type { VercelRequest, VercelResponse } from "@vercel/node";
import { HSKExam, HSKLevel, SyllabusVersion, ExamMode } from "../types/hskExam";
import { ExamGenerator } from "../lib/hsk/ExamGenerator";
import { ScoreEngine } from "../lib/hsk/ScoreEngine";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const { action = "generate" } = req.query as { action?: string };

  try {
    if (req.method === "POST" && action === "generate") {
      const {
        level = 1,
        syllabusVersion = "2.0",
        mode = "mock",
        targetWeaknesses = [],
        seed,
      } = req.body as {
        level?: number;
        syllabusVersion?: SyllabusVersion;
        mode?: ExamMode;
        targetWeaknesses?: string[];
        seed?: string;
      };

      const hskLevel = Math.min(6, Math.max(1, Number(level) || 1)) as HSKLevel;
      const exam = ExamGenerator.generateExam({
        level: hskLevel,
        syllabusVersion,
        mode,
        targetWeaknesses,
        seed,
      });

      res.status(200).json(exam);
      return;
    }

    if (req.method === "POST" && action === "submit") {
      const { exam, userAnswers, timeSpentSeconds, flaggedQuestionIds } = req.body as {
        exam: HSKExam;
        userAnswers: Record<string, string>;
        timeSpentSeconds: number;
        flaggedQuestionIds?: string[];
      };

      if (!exam || !userAnswers) {
        res.status(400).json({ error: "Missing exam or userAnswers data" });
        return;
      }

      // Secure server-side calculation
      const result = ScoreEngine.calculateResult({
        exam,
        userAnswers,
        timeSpentSeconds: timeSpentSeconds || 0,
        flaggedQuestionIds,
      });

      res.status(200).json(result);
      return;
    }

    res.status(404).json({ error: "Invalid action or method" });
  } catch (err: any) {
    console.error("[api/hsk-exams] Error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
}
