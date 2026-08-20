import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { HSKExam } from "../constants/hskExams";

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

  const { level = 1 } = req.body as { level?: number };
  const hskLevel = Math.min(6, Math.max(1, Number(level) || 1));

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
        maxOutputTokens: 2500,
        temperature: 0.3,
      },
    });

    const prompt = `You are an official HSK Exam Committee author and Chinese Language Professor.
Generate an authentic, high-quality HSK Exam paper for HSK Level ${hskLevel}.

Format & Structure rules for HSK Level ${hskLevel}:
${
  hskLevel === 1
    ? "- HSK 1: Listening 4 parts, Reading 4 parts. NO writing section. Duration: 35 min."
    : hskLevel === 2
    ? "- HSK 2: Listening 4 parts, Reading 4 parts. NO writing section. Duration: 50 min."
    : hskLevel === 3
    ? "- HSK 3: Listening (Conversations), Reading (Matching & Passages), Writing (Sentence arrangement). Duration: 85 min."
    : hskLevel === 4
    ? "- HSK 4: Listening (Short dialogues & passages), Reading (Cloze & logic), Writing (Sentence arrangement & picture description). Duration: 100 min."
    : hskLevel === 5
    ? "- HSK 5: Listening (Long dialogues & interviews), Reading (Complex passages), Writing (Sentence arrangement & paragraph essay). Duration: 120 min."
    : "- HSK 6: Listening (News & stories), Reading (Grammar病句 & long articles), Writing (Summary essay). Duration: 135 min."
}

Generate 8 to 12 representative questions split across Listening, Reading, and (if applicable for HSK 3-6) Writing sections.
For listening questions, provide "audioText" (the spoken dialogue script).
For writing questions, provide "wordsToArrange" (an array of Chinese words to form a sentence).
For ALL questions, provide "explanation" (a detailed Vietnamese explanation explaining grammar & vocabulary why the correct answer is right).

Return ONLY raw JSON matching this structure (no markdown, no backticks):
{
  "id": "hsk-ai-level${hskLevel}-${Date.now()}",
  "level": ${hskLevel},
  "title": "Đề Thi HSK ${hskLevel} AI Độc Bản (Chuẩn Hanban)",
  "subtitle": "Tự động biên soạn bởi AI Coach cho trình độ HSK ${hskLevel}",
  "isOfficial": true,
  "durationMinutes": ${hskLevel === 1 ? 35 : hskLevel === 2 ? 50 : hskLevel === 3 ? 85 : hskLevel === 4 ? 100 : hskLevel === 5 ? 120 : 135},
  "totalQuestions": 10,
  "passingScore": ${hskLevel <= 2 ? 120 : 180},
  "sections": [
    {
      "id": "sec-listening",
      "title": "Phần 1: Nghe Hiểu (Listening)",
      "type": "listening",
      "instructions": "Nghe hội thoại và chọn đáp án chính xác nhất.",
      "questions": [
        {
          "id": "q1",
          "type": "listening",
          "questionText": "...",
          "pinyinText": "...",
          "audioText": "...",
          "options": [
            {"id": "A", "text": "...", "pinyin": "..."},
            {"id": "B", "text": "...", "pinyin": "..."},
            {"id": "C", "text": "...", "pinyin": "..."},
            {"id": "D", "text": "...", "pinyin": "..."}
          ],
          "correctAnswer": "A",
          "explanation": "<Full Vietnamese explanation>"
        }
      ]
    },
    {
      "id": "sec-reading",
      "title": "Phần 2: Đọc Hiểu (Reading)",
      "type": "reading",
      "instructions": "Đọc đoạn văn hoặc câu hỏi và chọn đáp án đúng.",
      "questions": [
        {
          "id": "q2",
          "type": "reading",
          "questionText": "...",
          "passage": "...",
          "options": [
            {"id": "A", "text": "..."},
            {"id": "B", "text": "..."},
            {"id": "C", "text": "..."},
            {"id": "D", "text": "..."}
          ],
          "correctAnswer": "A",
          "explanation": "<Full Vietnamese explanation>"
        }
      ]
    }
    ${
      hskLevel >= 3
        ? `,
    {
      "id": "sec-writing",
      "title": "Phần 3: Viết & Sắp Xếp Câu (Writing)",
      "type": "writing",
      "instructions": "Sắp xếp các từ cho sẵn thành câu hoàn chỉnh và đúng ngữ pháp.",
      "questions": [
        {
          "id": "q3",
          "type": "writing",
          "questionText": "Sắp xếp các từ thành câu đúng:",
          "wordsToArrange": ["...", "..."],
          "options": [
            {"id": "A", "text": "..."},
            {"id": "B", "text": "..."},
            {"id": "C", "text": "..."},
            {"id": "D", "text": "..."}
          ],
          "correctAnswer": "A",
          "explanation": "<Full Vietnamese explanation>"
        }
      ]
    }`
        : ""
    }
  ]
}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    const result = await model.generateContent(prompt, { signal: controller.signal });
    clearTimeout(timeoutId);

    const raw = result.response.text().trim();
    const jsonStr = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    const examData = JSON.parse(jsonStr) as HSKExam;

    // Normalize exam properties
    examData.level = hskLevel as any;
    examData.totalQuestions = examData.sections.reduce((acc, sec) => acc + (sec.questions?.length || 0), 0);

    res.status(200).json(examData);
  } catch (err: any) {
    console.error("[generate-hsk-exam] Error generating HSK exam:", err);
    res.status(500).json({ error: "Failed to generate HSK exam via AI", details: err.message });
  }
}
