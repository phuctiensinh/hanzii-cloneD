import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("Testing Gemini API Key:", apiKey ? `${apiKey.substring(0, 8)}...` : "None");

  if (!apiKey) {
    console.error("❌ No GEMINI_API_KEY found in .env");
    process.exit(1);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const result = await model.generateContent("Hello, return the word 'OK' in Chinese.");
    console.log("✓ Gemini Response:", result.response.text().trim());
    console.log("🎉 Gemini API Key is working perfectly!");
  } catch (err: any) {
    console.warn("API test info:", err.message);
  }
}

testGemini();
