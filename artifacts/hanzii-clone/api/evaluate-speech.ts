import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface EvaluateRequest {
  targetText?: string;
  pinyin?: string;
  spokenText?: string;
  audioData?: string;
}

export interface EvaluationResult {
  score: number;
  rating: "EXCELLENT" | "GOOD" | "NEEDS_WORK";
  spokenPinyin: string;
  feedback: string;
  details?: {
    char: string;
    status: "correct" | "incorrect" | "missing";
    note?: string;
  }[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { targetText, pinyin, spokenText } = req.body as EvaluateRequest;

  if (!targetText?.trim()) {
    res.status(400).json({ error: "targetText is required" });
    return;
  }

  const cleanTarget = targetText.trim();
  const cleanSpoken = (spokenText || "").trim();
  const cleanPinyin = (pinyin || "").trim();

  // Extract pure Chinese characters
  const targetChars = cleanTarget.replace(/[^\u4e00-\u9fa5]/g, "");
  const spokenChars = cleanSpoken.replace(/[^\u4e00-\u9fa5]/g, "");

  // FAST-PATH 1: Exact Chinese character match → Instant 100% response!
  if (targetChars && targetChars === spokenChars) {
    res.status(200).json({
      score: 100,
      rating: "EXCELLENT",
      spokenPinyin: cleanPinyin || cleanSpoken,
      feedback: `Xuất sắc! Bạn đã phát âm chính xác 100% câu/từ "${cleanTarget}". Âm điệu và thanh điệu rất chuẩn xác! 🎉`,
      details: Array.from(targetChars).map((c) => ({ char: c, status: "correct" as const, note: "Chính xác" })),
    });
    return;
  }

  // Try using Gemini AI for detailed feedback
  const apiKey = process.env["GEMINI_API_KEY"];

  if (apiKey && cleanSpoken) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-flash-latest",
        generationConfig: {
          maxOutputTokens: 350,
          temperature: 0.2,
        },
      });

      const prompt = `You are an expert Chinese pronunciation and phonetics coach for Vietnamese learners.
Analyze the user's spoken Mandarin Chinese against the target text/sentence.

Target Text (Chinese): "${cleanTarget}"
Target Pinyin: "${cleanPinyin}"
User Spoken Transcript: "${cleanSpoken}"

Compare each word/character. Point out EXACT mistakes (wrong words, wrong tones, skipped words).
Return ONLY a raw JSON object (no markdown, no backticks):
{
  "score": <number 0-100 based on character match & phonetic accuracy>,
  "rating": "<"EXCELLENT" if score >= 85, "GOOD" if score >= 65, else "NEEDS_WORK">",
  "spokenPinyin": "<Pinyin representation of what user actually said>",
  "feedback": "<Detailed, constructive feedback in Vietnamese (2-4 sentences). Explicitly mention which words were mispronounced or skipped (e.g. 'Từ 高堂 đọc nhầm thành 高达'), compare pinyin/tones, and give clear phonetic guidance on how to fix it>",
  "details": [
    {
      "char": "<character in target>",
      "status": "<"correct" | "incorrect" | "missing">",
      "note": "<brief note in Vietnamese e.g. 'Đọc đúng' or 'Đọc nhầm thành 高达' or 'Chưa đọc'>"
    }
  ]
}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const result = await model.generateContent(prompt, { signal: controller.signal });
      clearTimeout(timeoutId);

      const raw = result.response.text().trim();
      const jsonStr = raw
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/```\s*$/i, "")
        .trim();

      const data = JSON.parse(jsonStr) as EvaluationResult;

      res.status(200).json({
        score: Math.min(100, Math.max(0, Number(data.score) || 0)),
        rating: data.rating || (data.score >= 85 ? "EXCELLENT" : data.score >= 65 ? "GOOD" : "NEEDS_WORK"),
        spokenPinyin: data.spokenPinyin || cleanSpoken,
        feedback: data.feedback || "Chú ý luyện tập thêm các từ đọc chưa khớp để hoàn thiện thanh điệu!",
        details: Array.isArray(data.details) ? data.details : [],
      });
      return;
    } catch (err) {
      console.warn("[evaluate-speech] Gemini API warning, fallback used:", err);
    }
  }

  // Fallback scoring logic
  const fallback = calculateFallbackScore(cleanTarget, cleanSpoken, cleanPinyin);
  res.status(200).json(fallback);
}

function calculateFallbackScore(target: string, spoken: string, pinyin: string): EvaluationResult {
  if (!spoken) {
    return {
      score: 0,
      rating: "NEEDS_WORK",
      spokenPinyin: "---",
      feedback: "Chưa nhận diện được giọng nói. Bạn hãy nhấn micro, phát âm to và rõ ràng hơn nhé!",
      details: Array.from(target.replace(/[^\u4e00-\u9fa5]/g, "")).map((c) => ({
        char: c,
        status: "missing" as const,
        note: "Chưa phát âm",
      })),
    };
  }

  const targetChars = Array.from(target.replace(/[^\u4e00-\u9fa5]/g, ""));
  const spokenChars = Array.from(spoken.replace(/[^\u4e00-\u9fa5]/g, ""));

  let matchCount = 0;
  const missingWords: string[] = [];

  const details = targetChars.map((char) => {
    const isMatch = spokenChars.includes(char);
    if (isMatch) {
      matchCount++;
      return { char, status: "correct" as const, note: "Đúng" };
    } else {
      missingWords.push(char);
      return { char, status: "incorrect" as const, note: "Đọc thiếu / chưa chính xác" };
    }
  });

  const baseRatio = targetChars.length > 0 ? matchCount / targetChars.length : spoken === target ? 1 : 0.5;
  const score = Math.round(baseRatio * 100);

  let rating: "EXCELLENT" | "GOOD" | "NEEDS_WORK" = "NEEDS_WORK";
  let feedback = "";

  if (score >= 85) {
    rating = "EXCELLENT";
    feedback = "Xuất sắc! Bạn phát âm rất chuẩn xác và rõ ràng. Tiếp tục duy trì nhé!";
  } else if (score >= 65) {
    rating = "GOOD";
    feedback = `Khá tốt! Bạn đã đọc đúng phần lớn các từ (${matchCount}/${targetChars.length}). Cần chú ý phát âm lại các từ: ${Array.from(new Set(missingWords)).slice(0, 4).join(", ")}.`;
  } else {
    rating = "NEEDS_WORK";
    feedback = `Cần cố gắng thêm! Bạn đọc chưa khớp một số chữ Hán (${missingWords.slice(0, 5).join(", ")}...). Bạn hãy nhấn nút loa để nghe lại phát âm mẫu chuẩn rồi thử lại nhé!`;
  }

  return {
    score,
    rating,
    spokenPinyin: spoken,
    feedback,
    details,
  };
}
