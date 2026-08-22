import { ExamBlueprint, HSKLevel, SyllabusVersion } from "@/types/hskExam";

export interface HSKLevelMeta {
  level: HSKLevel;
  name: string;
  badgeColor: string;
  tag: string;
  durationMinutes: number;
  totalQuestions: number;
  passingScore: number;
  maxScore: number;
  vocabRange: string;
  description: string;
  targetAbility: string;
  sectionNames: string[];
}

export const HSK_LEVEL_METAS: Record<HSKLevel, HSKLevelMeta> = {
  1: {
    level: 1,
    name: "HSK 1",
    badgeColor: "#E53935",
    tag: "Sơ cấp 1",
    durationMinutes: 35,
    totalQuestions: 40,
    passingScore: 120,
    maxScore: 200,
    vocabRange: "150 từ vựng",
    description: "Nhận biết các từ và câu tiếng Trung rất đơn giản, đáp ứng nhu cầu giao tiếp cụ thể.",
    targetAbility: "Hiểu câu chào hỏi, số đếm, tên đồ vật thông dụng và các chỉ dẫn cơ bản.",
    sectionNames: ["Nghe hiểu (20 câu)", "Đọc hiểu (20 câu)"],
  },
  2: {
    level: 2,
    name: "HSK 2",
    badgeColor: "#FB8C00",
    tag: "Sơ cấp 2",
    durationMinutes: 50,
    totalQuestions: 45,
    passingScore: 120,
    maxScore: 200,
    vocabRange: "300 từ vựng",
    description: "Giao tiếp đơn giản và trực tiếp trong các tình huống sinh hoạt thường ngày.",
    targetAbility: "Trao đổi về thông tin cá nhân, mua sắm, hỏi đường và lịch trình sinh hoạt.",
    sectionNames: ["Nghe hiểu (20 câu)", "Đọc hiểu (25 câu)"],
  },
  3: {
    level: 3,
    name: "HSK 3",
    badgeColor: "#43A047",
    tag: "Sơ trung cấp",
    durationMinutes: 85,
    totalQuestions: 80,
    passingScore: 180,
    maxScore: 300,
    vocabRange: "600 từ vựng",
    description: "Hoàn thành giao tiếp cơ bản trong cuộc sống, học tập và công việc.",
    targetAbility: "Xử lý hầu hết các tình huống khi du lịch tại Trung Quốc, diễn đạt ý kiến và sắp xếp câu đúng ngữ pháp.",
    sectionNames: ["Nghe hiểu (40 câu)", "Đọc hiểu (30 câu)", "Viết câu (10 câu)"],
  },
  4: {
    level: 4,
    name: "HSK 4",
    badgeColor: "#1E88E5",
    tag: "Trung cấp",
    durationMinutes: 100,
    totalQuestions: 100,
    passingScore: 180,
    maxScore: 300,
    vocabRange: "1200 từ vựng",
    description: "Thảo luận về các chủ đề đa dạng, giao tiếp lưu loát với người bản xứ.",
    targetAbility: "Đọc hiểu bài viết ngắn, nắm vững câu chữ 把, chữ 被, câu so sánh 比 và viết câu hoàn chỉnh.",
    sectionNames: ["Nghe hiểu (45 câu)", "Đọc hiểu (40 câu)", "Viết & Ngữ pháp (15 câu)"],
  },
  5: {
    level: 5,
    name: "HSK 5",
    badgeColor: "#8E24AA",
    tag: "Cao cấp",
    durationMinutes: 120,
    totalQuestions: 100,
    passingScore: 180,
    maxScore: 300,
    vocabRange: "2500 từ vựng",
    description: "Đọc báo chí tiếng Trung, thưởng thức phim ảnh và thuyết trình hoàn chỉnh bằng tiếng Trung.",
    targetAbility: "Phân tích văn bản phức tạp, hiểu ngụ ý trong hội thoại và viết câu phức logic.",
    sectionNames: ["Nghe hiểu (45 câu)", "Đọc hiểu chuyên sâu (45 câu)", "Viết câu phức (10 câu)"],
  },
  6: {
    level: 6,
    name: "HSK 6",
    badgeColor: "#455A64",
    tag: "Thành thạo",
    durationMinutes: 135,
    totalQuestions: 101,
    passingScore: 180,
    maxScore: 300,
    vocabRange: "5000+ từ vựng",
    description: "Dễ dàng hiểu thông tin nghe hoặc đọc, biểu đạt quan điểm trôi chảy, tự nhiên cả văn nói và văn viết.",
    targetAbility: "Nhận biết và sửa lỗi ngữ pháp (病句), hiểu văn bản triết lý/kinh tế/khoa học, hành văn chuẩn bản xứ.",
    sectionNames: ["Nghe hiểu (50 câu)", "Đọc & Sửa lỗi 病句 (50 câu)", "Viết tóm tắt (1 câu)"],
  },
};

// Exam blueprints per level and syllabus version
export const EXAM_BLUEPRINTS: Record<string, ExamBlueprint> = {
  // HSK 1 - 2.0
  "HSK1_2.0": {
    level: 1,
    syllabusVersion: "2.0",
    durationMinutes: 35,
    passingScore: 120,
    maxScore: 200,
    totalQuestions: 40,
    description: "Cấu trúc chuẩn HSK 1: 20 câu Nghe + 20 câu Đọc (Không thi Viết)",
    vocabularyCount: 150,
    sections: [
      {
        type: "listening",
        title: "Phần 1: Nghe Hiểu (Listening)",
        instructions: "Nghe đoạn thoại hoặc từ vựng và chọn đáp án chính xác nhất.",
        questionTypes: [
          { type: "listening_picture_match", count: 5, description: "Nghe câu đoán ngữ cảnh/hình ảnh" },
          { type: "listening_true_false", count: 5, description: "Nghe câu xác định đúng/sai" },
          { type: "listening_dialogue_short", count: 5, description: "Nghe hội thoại 2 lượt chọn đáp án" },
          { type: "listening_dialogue_question", count: 5, description: "Nghe đoạn thoại trả lời câu hỏi" },
        ],
      },
      {
        type: "reading",
        title: "Phần 2: Đọc Hiểu (Reading)",
        instructions: "Đọc câu tiếng Trung và chọn đáp án đúng.",
        questionTypes: [
          { type: "reading_picture_match", count: 5, description: "Xem hình ảnh chọn từ thích hợp" },
          { type: "reading_cloze", count: 5, description: "Điền từ thích hợp vào chỗ trống" },
          { type: "reading_match", count: 5, description: "Nối câu hỏi với câu trả lời phù hợp" },
          { type: "reading_comprehension_short", count: 5, description: "Đọc câu chọn ý nghĩa tương đương" },
        ],
      },
    ],
  },

  // HSK 2 - 2.0
  "HSK2_2.0": {
    level: 2,
    syllabusVersion: "2.0",
    durationMinutes: 50,
    passingScore: 120,
    maxScore: 200,
    totalQuestions: 45,
    description: "Cấu trúc chuẩn HSK 2: 20 câu Nghe + 25 câu Đọc (Không thi Viết)",
    vocabularyCount: 300,
    sections: [
      {
        type: "listening",
        title: "Phần 1: Nghe Hiểu (Listening)",
        instructions: "Nghe hội thoại và chọn câu trả lời đúng.",
        questionTypes: [
          { type: "listening_true_false", count: 5, description: "Nghe câu xác nhận đúng sai" },
          { type: "listening_dialogue_match", count: 5, description: "Nghe hội thoại chọn tranh tương ứng" },
          { type: "listening_dialogue_short", count: 5, description: "Nghe hội thoại 2 người chọn đáp án" },
          { type: "listening_dialogue_long", count: 5, description: "Nghe hội thoại 4-5 câu trả lời câu hỏi" },
        ],
      },
      {
        type: "reading",
        title: "Phần 2: Đọc Hiểu (Reading)",
        instructions: "Chọn câu hoặc từ thích hợp.",
        questionTypes: [
          { type: "reading_cloze", count: 5, description: "Chọn từ điền vào chỗ trống" },
          { type: "reading_match", count: 5, description: "Nối câu phù hợp ngữ cảnh" },
          { type: "reading_sentence_logic", count: 5, description: "Liên kết logic các vế câu" },
          { type: "reading_comprehension_short", count: 10, description: "Đọc đoạn ngắn trả lời câu hỏi" },
        ],
      },
    ],
  },

  // HSK 3 - 2.0
  "HSK3_2.0": {
    level: 3,
    syllabusVersion: "2.0",
    durationMinutes: 85,
    passingScore: 180,
    maxScore: 300,
    totalQuestions: 80,
    description: "Cấu trúc chuẩn HSK 3: 40 câu Nghe + 30 câu Đọc + 10 câu Viết",
    vocabularyCount: 600,
    sections: [
      {
        type: "listening",
        title: "Phần 1: Nghe Hiểu (Listening)",
        instructions: "Nghe thông tin và chọn câu trả lời đúng.",
        questionTypes: [
          { type: "listening_dialogue_match", count: 10, description: "Nghe hội thoại chọn hình ảnh/chủ đề" },
          { type: "listening_true_false", count: 10, description: "Nghe đoạn phát biểu nhận định đúng/sai" },
          { type: "listening_dialogue_short", count: 10, description: "Nghe đối thoại ngắn chọn đáp án" },
          { type: "listening_dialogue_long", count: 10, description: "Nghe đối thoại dài chọn đáp án" },
        ],
      },
      {
        type: "reading",
        title: "Phần 2: Đọc Hiểu (Reading)",
        instructions: "Đọc đoạn văn ngắn và chọn đáp án chính xác.",
        questionTypes: [
          { type: "reading_match", count: 10, description: "Nối 2 đoạn thoại phù hợp ý nghĩa" },
          { type: "reading_cloze", count: 10, description: "Chọn từ trong khung điền vào câu" },
          { type: "reading_comprehension_short", count: 10, description: "Đọc đoạn văn 2-3 câu trả lời câu hỏi" },
        ],
      },
      {
        type: "writing",
        title: "Phần 3: Viết & Sắp Xếp Câu (Writing)",
        instructions: "Sắp xếp các từ cho sẵn thành câu hoàn chỉnh và đúng ngữ pháp.",
        questionTypes: [
          { type: "writing_reorder", count: 5, description: "Sắp xếp các từ thành câu hoàn chỉnh (连词成句)" },
          { type: "writing_character_fill", count: 5, description: "Điền chữ Hán thích hợp theo pinyin" },
        ],
      },
    ],
  },

  // HSK 4 - 2.0
  "HSK4_2.0": {
    level: 4,
    syllabusVersion: "2.0",
    durationMinutes: 100,
    passingScore: 180,
    maxScore: 300,
    totalQuestions: 100,
    description: "Cấu trúc chuẩn HSK 4: 45 câu Nghe + 40 câu Đọc + 15 câu Viết",
    vocabularyCount: 1200,
    sections: [
      {
        type: "listening",
        title: "Phần 1: Nghe Hiểu (Listening)",
        instructions: "Nghe đoạn hội thoại/phát biểu và chọn đáp án chính xác.",
        questionTypes: [
          { type: "listening_true_false", count: 10, description: "Nghe đoạn ngắn phán đoán đúng sai" },
          { type: "listening_dialogue_short", count: 15, description: "Nghe hội thoại ngắn 2 câu" },
          { type: "listening_dialogue_long", count: 20, description: "Nghe hội thoại dài hoặc bài phát biểu" },
        ],
      },
      {
        type: "reading",
        title: "Phần 2: Đọc Hiểu (Reading)",
        instructions: "Đọc đoạn văn, sắp xếp câu và chọn đáp án đúng.",
        questionTypes: [
          { type: "reading_cloze", count: 10, description: "Chọn từ điền vào chỗ trống" },
          { type: "reading_order_paragraphs", count: 10, description: "Sắp xếp 3 vế câu (A, B, C) theo thứ tự logic" },
          { type: "reading_comprehension_short", count: 20, description: "Đọc đoạn văn vừa trả lời 1-2 câu hỏi" },
        ],
      },
      {
        type: "writing",
        title: "Phần 3: Viết & Cấu Trúc Ngữ Pháp (Writing)",
        instructions: "Sắp xếp từ thành câu đúng cấu trúc câu 把, 被, 比, liên từ phức.",
        questionTypes: [
          { type: "writing_reorder_grammar", count: 10, description: "Sắp xếp từ thành câu ngữ pháp chuẩn HSK 4" },
          { type: "writing_picture_sentence", count: 5, description: "Dùng từ cho sẵn viết câu theo tranh" },
        ],
      },
    ],
  },

  // HSK 5 - 2.0
  "HSK5_2.0": {
    level: 5,
    syllabusVersion: "2.0",
    durationMinutes: 120,
    passingScore: 180,
    maxScore: 300,
    totalQuestions: 100,
    description: "Cấu trúc chuẩn HSK 5: 45 câu Nghe + 45 câu Đọc + 10 câu Viết",
    vocabularyCount: 2500,
    sections: [
      {
        type: "listening",
        title: "Phần 1: Nghe Hiểu Cao Cấp (Listening)",
        instructions: "Nghe bài phỏng vấn, tin tức và chọn đáp án chính xác.",
        questionTypes: [
          { type: "listening_dialogue_long", count: 20, description: "Nghe hội thoại dài 4-5 lượt lời" },
          { type: "listening_passage_speech", count: 25, description: "Nghe bài thuyết trình, phỏng vấn chuyên sâu" },
        ],
      },
      {
        type: "reading",
        title: "Phần 2: Đọc Hiểu Chuyên Ngành (Reading)",
        instructions: "Đọc văn bản chuyên sâu và chọn từ/đáp án thích hợp.",
        questionTypes: [
          { type: "reading_passage_cloze", count: 15, description: "Điền từ/cụm từ vào đoạn văn dài" },
          { type: "reading_match_main_idea", count: 10, description: "Đọc đoạn văn chọn câu có ý nghĩa nhất quán" },
          { type: "reading_deep_comprehension", count: 20, description: "Đọc bài luận/truyện ngụ ngôn trả lời câu hỏi" },
        ],
      },
      {
        type: "writing",
        title: "Phần 3: Viết Câu Phức & Diễn Đạt (Writing)",
        instructions: "Sắp xếp cụm từ thành câu phức và viết đoạn văn theo từ khóa.",
        questionTypes: [
          { type: "writing_reorder_complex", count: 8, description: "Sắp xếp câu phức HSK 5" },
          { type: "writing_mini_paragraph", count: 2, description: "Viết đoạn văn 80 chữ dùng từ khóa cho sẵn" },
        ],
      },
    ],
  },

  // HSK 6 - 2.0
  "HSK6_2.0": {
    level: 6,
    syllabusVersion: "2.0",
    durationMinutes: 135,
    passingScore: 180,
    maxScore: 300,
    totalQuestions: 101,
    description: "Cấu trúc chuẩn HSK 6: 50 câu Nghe + 50 câu Đọc (có sửa lỗi 病句) + 1 Viết tóm tắt",
    vocabularyCount: 5000,
    sections: [
      {
        type: "listening",
        title: "Phần 1: Nghe Hiểu Bản Xứ (Listening)",
        instructions: "Nghe phóng sự, triết lý, tin tức thời sự.",
        questionTypes: [
          { type: "listening_short_broadcast", count: 15, description: "Nghe bản tin ngắn chọn nội dung khớp" },
          { type: "listening_interview", count: 15, description: "Nghe phỏng vấn chuyên gia, nhân vật nổi tiếng" },
          { type: "listening_philosophy_story", count: 20, description: "Nghe câu chuyện triết lý, văn hóa, khoa học" },
        ],
      },
      {
        type: "reading",
        title: "Phần 2: Đọc Hiểu & Sửa Lỗi Ngữ Pháp (Reading)",
        instructions: "Chọn câu chứa lỗi ngữ pháp 病句, điền từ chuyên sâu và đọc bài viết dài.",
        questionTypes: [
          { type: "reading_error_detection", count: 10, description: "Chọn câu chứa lỗi sai ngữ pháp / 病句" },
          { type: "reading_passage_cloze_advanced", count: 10, description: "Điền thành ngữ/từ ngữ chuyên sâu vào bài viết" },
          { type: "reading_sentence_insert", count: 10, description: "Chọn vị trí điền câu thích hợp trong đoạn văn" },
          { type: "reading_academic_comprehension", count: 20, description: "Đọc hiểu văn bản học thuật/kinh tế/xã hội" },
        ],
      },
      {
        type: "writing",
        title: "Phần 3: Viết Bài Văn Tóm Tắt (Writing)",
        instructions: "Tóm tắt bài văn 1000 chữ thành bài viết 400 chữ đúng cấu trúc và ý chính.",
        questionTypes: [
          { type: "writing_summary_reorder", count: 1, description: "Bài tập tóm tắt & sắp xếp thành ngữ đỉnh cao HSK 6" },
        ],
      },
    ],
  },
};

// Also support HSK 3.0 syllabus configurations
export function getExamBlueprint(level: HSKLevel, syllabusVersion: SyllabusVersion = "2.0"): ExamBlueprint {
  const key = `HSK${level}_${syllabusVersion}`;
  if (EXAM_BLUEPRINTS[key]) {
    return EXAM_BLUEPRINTS[key];
  }
  // Fallback to 2.0 blueprint if 3.0 specific blueprint not customized yet
  return EXAM_BLUEPRINTS[`HSK${level}_2.0`] || EXAM_BLUEPRINTS["HSK1_2.0"];
}
