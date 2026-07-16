import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { text } = req.body as { text?: string };
  if (!text?.trim()) {
    res.status(400).json({ error: "text is required" });
    return;
  }

  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) {
    res.status(500).json({ error: "GEMINI_API_KEY not configured" });
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `You are a Chinese-Vietnamese dictionary assistant. Given a Vietnamese word or phrase, return ONLY a JSON object (no markdown, no explanation) with these fields:
- character: simplified Chinese characters
- traditional: traditional Chinese characters
- pinyin: pinyin with tone marks (e.g. "ài", "nǐ hǎo")
- meaning: concise Vietnamese meaning/definition
- hskLevel: HSK level 1-6 (use 6 if unsure)
- exampleChinese: a short example sentence in Chinese
- examplePinyin: pinyin for the example sentence
- exampleVietnamese: Vietnamese translation of the example sentence

Vietnamese input: "${text.trim()}"

Return only the JSON object, nothing else.`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    const jsonStr = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    const data = JSON.parse(jsonStr);

    res.json({
      character: data.character ?? text,
      traditional: data.traditional ?? data.character ?? text,
      pinyin: data.pinyin ?? "",
      meaning: data.meaning ?? text,
      hskLevel: Math.min(6, Math.max(1, Number(data.hskLevel) || 6)),
      example: {
        chinese: data.exampleChinese ?? "",
        pinyin: data.examplePinyin ?? "",
        vietnamese: data.exampleVietnamese ?? "",
      },
    });
  } catch {
    res.status(500).json({ error: "Translation failed" });
  }
}
