import { Client } from "pg";
import * as fs from "fs";
import * as path from "path";
import { QUESTION_BANK } from "../constants/questionBank";

async function main() {
  const connectionString =
    process.env.DATABASE_URL ||
    "postgresql://postgres:Thanhdat%40310306@db.txrwrflymlhvodgtjjqj.supabase.co:5432/postgres";

  console.log("Connecting to Supabase PostgreSQL at db.txrwrflymlhvodgtjjqj.supabase.co...");

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log("✓ Connected to Supabase PostgreSQL successfully!\n");

    // 1. Tables are already initialized in Supabase. Proceed with Seeding / Updating Question Bank
    console.log("Syncing database tables and question bank...");

    // 2. Seed Question Bank
    console.log(`Seeding ${QUESTION_BANK.length} HSK questions into hsk_question_bank...`);
    let insertCount = 0;

    for (const q of QUESTION_BANK) {
      const query = `
        INSERT INTO public.hsk_question_bank (
          id, level, syllabus_version, section, question_type, difficulty,
          question_text, pinyin_text, audio_text, audio_url, image_url, passage,
          words_to_arrange, options, correct_answer, explanation, vocabulary_ids,
          grammar_ids, tags, quality_score, status, source, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, NOW()
        )
        ON CONFLICT (id) DO UPDATE SET
          question_text = EXCLUDED.question_text,
          pinyin_text = EXCLUDED.pinyin_text,
          audio_text = EXCLUDED.audio_text,
          options = EXCLUDED.options,
          correct_answer = EXCLUDED.correct_answer,
          explanation = EXCLUDED.explanation,
          tags = EXCLUDED.tags,
          quality_score = EXCLUDED.quality_score,
          status = EXCLUDED.status,
          updated_at = NOW();
      `;

      await client.query(query, [
        q.id,
        q.level,
        q.syllabusVersion || "2.0",
        q.section,
        q.questionType,
        q.difficulty,
        q.questionText,
        q.pinyinText || null,
        q.audioText || null,
        q.audioUrl || null,
        q.imageUrl || null,
        q.passage || null,
        q.wordsToArrange ? JSON.stringify(q.wordsToArrange) : null,
        JSON.stringify(q.options),
        q.correctAnswer,
        q.explanation,
        JSON.stringify(q.vocabularyIds || []),
        JSON.stringify(q.grammarIds || []),
        JSON.stringify(q.tags || []),
        q.qualityScore || 1.0,
        q.status || "approved",
        q.source || "curated",
      ]);
      insertCount++;
    }

    console.log(`✓ Seeded ${insertCount} questions successfully!\n`);

    // 3. Verify counts
    const qCountRes = await client.query("SELECT COUNT(*) FROM public.hsk_question_bank");
    const profilesRes = await client.query("SELECT COUNT(*) FROM public.profiles");

    console.log("=========================================");
    console.log("SUPABASE DATABASE STATUS:");
    console.log(`- Questions in hsk_question_bank: ${qCountRes.rows[0].count}`);
    console.log(`- Profiles registered: ${profilesRes.rows[0].count}`);
    console.log("=========================================");

    await client.end();
  } catch (err: any) {
    console.error("❌ Database migration error:", err.message);
    if (client) await client.end().catch(() => {});
    process.exit(1);
  }
}

main();
