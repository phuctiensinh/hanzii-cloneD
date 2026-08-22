import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

  const {
    questionText,
    pinyinText,
    audioText,
    options,
    correctAnswer,
    userAnswer,
    level = 1,
  } = req.body as {
    questionText: string;
    pinyinText?: string;
    audioText?: string;
    options: { id: string; text: string }[];
    correctAnswer: string;
    userAnswer?: string;
    level?: number;
  };

  const apiKey = process.env["GEMINI_API_KEY"];

  if (!apiKey) {
    res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.2,
      },
    });

    const prompt = `You are an expert HSK Chinese teacher.
A student took an HSK Level ${level} exam and needs an in-depth, structured explanation in Vietnamese for this question.

Question details:
- Question: "${questionText}"
- Pinyin: "${pinyinText || "N/A"}"
- Audio dialogue script: "${audioText || "N/A"}"
- Options: ${JSON.stringify(options)}
- Correct Answer: "${correctAnswer}"
- Student's Answer: "${userAnswer || "None"}"

Return ONLY a valid JSON object matching this schema (no markdown, no backticks):
{
  "whyCorrect": "<Detailed Vietnamese explanation why the correct answer is right>",
  "whyUserChoiceWrong": "<Clear explanation why the student's chosen answer was incorrect, or null if they answered correctly>",
  "keyVocabulary": [
    { "word": "<Chinese word>", "pinyin": "<pinyin>", "meaning": "<Vietnamese meaning>" }
  ],
  "keyGrammar": {
    "pattern": "<Grammar pattern formula>",
    "explanation": "<Grammar explanation in Vietnamese>"
  },
  "memoryTip": "<A practical memory tip or trick in Vietnamese>",
  "similarExample": {
    "chinese": "<Chinese example sentence>",
    "pinyin": "<Pinyin for example>",
    "vietnamese": "<Vietnamese translation>"
  }
}`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    const jsonStr = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    const data = JSON.parse(jsonStr);
    res.status(200).json(data);
  } catch (err: any) {
    console.error("[api/hsk-explain] Error:", err);
    res.status(500).json({ error: "Failed to generate AI explanation", details: err.message });
  }
}
