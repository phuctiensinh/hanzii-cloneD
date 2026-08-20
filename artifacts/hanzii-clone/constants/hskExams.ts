export interface HSKQuestionOption {
  id: string;
  text: string;
  pinyin?: string;
  imageUrl?: string;
}

export interface HSKQuestion {
  id: string;
  type: "listening" | "reading" | "writing";
  questionText: string;
  pinyinText?: string;
  audioText?: string; // Text to be spoken for listening questions via Speech synthesis
  passage?: string;   // For reading comprehension passages
  wordsToArrange?: string[]; // For writing/sentence arrangement
  options: HSKQuestionOption[];
  correctAnswer: string; // Option ID or correct sentence string
  explanation: string;   // Detailed explanation in Vietnamese
}

export interface HSKSection {
  id: string;
  title: string;
  type: "listening" | "reading" | "writing";
  instructions: string;
  questions: HSKQuestion[];
}

export interface HSKExam {
  id: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  title: string;
  subtitle: string;
  isOfficial: boolean; // Official mock test vs Mini practice
  durationMinutes: number;
  totalQuestions: number;
  passingScore: number;
  sections: HSKSection[];
}

export const HSK_EXAMS: HSKExam[] = [
  {
    id: "hsk1-official-01",
    level: 1,
    title: "Đề Thi Mẫu HSK 1 Chính Thức #1",
    subtitle: "Trọn bộ 40 câu hỏi Nghe - Đọc hiểu (Cơ bản)",
    isOfficial: true,
    durationMinutes: 35,
    totalQuestions: 10,
    passingScore: 120,
    sections: [
      {
        id: "hsk1-sec-1",
        title: "Phần 1: Nghe Hiểu (Listening)",
        type: "listening",
        instructions: "Nghe hội thoại và chọn đáp án chính xác nhất.",
        questions: [
          {
            id: "q1",
            type: "listening",
            questionText: "Người trong hội thoại đang làm gì?",
            pinyinText: "Nǐ hǎo! Wǒ shì Wáng lǎoshī.",
            audioText: "你好！我是王老师。很高兴认识你。",
            options: [
              { id: "A", text: "Chào hỏi và giới thiệu bản thân là giáo viên Vương", pinyin: "Wáng lǎoshī" },
              { id: "B", text: "Tạm biệt và hẹn gặp lại ngày mai", pinyin: "Zàijiàn" },
              { id: "C", text: "Hỏi mua thức ăn trong nhà hàng", pinyin: "Chīfàn" },
              { id: "D", text: "Cảm ơn vì đã giúp đỡ", pinyin: "Xièxie" },
            ],
            correctAnswer: "A",
            explanation: "Đáp án A đúng. Đoạn hội thoại nói: '你好！我是王老师。很高兴认识你。' (Xin chào! Tôi là thầy Vương. Rất vui được quen biết bạn).",
          },
          {
            id: "q2",
            type: "listening",
            questionText: "Bây giờ là mấy giờ?",
            pinyinText: "Xiànzài jǐ diǎn? Xiànzài bā diǎn.",
            audioText: "现在几点？现在八点。",
            options: [
              { id: "A", text: "7 giờ (七点)" },
              { id: "B", text: "8 giờ (八点)" },
              { id: "C", text: "9 giờ (九点)" },
              { id: "D", text: "10 giờ (十点)" },
            ],
            correctAnswer: "B",
            explanation: "Đáp án B đúng. Đoạn nghe ghi rõ: '现在八点' (Bây giờ là 8 giờ).",
          },
          {
            id: "q3",
            type: "listening",
            questionText: "Cô ấy muốn uống cái gì?",
            pinyinText: "Nǐ xiǎng hē shénme? Wǒ xiǎng hē chá.",
            audioText: "你想喝什么？我想喝茶。",
            options: [
              { id: "A", text: "Nước lọc (水)" },
              { id: "B", text: "Cà phê (咖啡)" },
              { id: "C", text: "Trà (茶)" },
              { id: "D", text: "Sữa tươi (牛奶)" },
            ],
            correctAnswer: "C",
            explanation: "Đáp án C đúng. Đoạn thoại: '我想喝茶' (Tôi muốn uống trà).",
          },
        ],
      },
      {
        id: "hsk1-sec-2",
        title: "Phần 2: Đọc Hiểu (Reading)",
        type: "reading",
        instructions: "Đọc câu tiếng Trung và chọn nghĩa hoặc đáp án đúng.",
        questions: [
          {
            id: "q4",
            type: "reading",
            questionText: "“这个苹果很好吃。” nghĩa là gì?",
            pinyinText: "Zhège píngguǒ hěn hǎochī.",
            options: [
              { id: "A", text: "Quả táo này rất ngon." },
              { id: "B", text: "Quả táo này rất to." },
              { id: "C", text: "Quả táo này rất đắt." },
              { id: "D", text: "Tôi thích ăn táo." },
            ],
            correctAnswer: "A",
            explanation: "Đáp án A đúng. 苹果 (píngguǒ) = quả táo, 好吃 (hǎochī) = ngon.",
          },
          {
            id: "q5",
            type: "reading",
            questionText: "Điền từ thích hợp vào chỗ trống: “他是我的____。” (Anh ấy là... của tôi).",
            pinyinText: "Tā shì wǒ de ____.",
            options: [
              { id: "A", text: "朋友 (Bạn bè)" },
              { id: "B", text: "很高兴 (Rất vui)" },
              { id: "C", text: "不客气 (Không có gì)" },
              { id: "D", text: "谢谢 (Cảm ơn)" },
            ],
            correctAnswer: "A",
            explanation: "Đáp án A đúng. 朋友 (péngyou - bạn bè) phù hợp về mặt ngữ pháp và ý nghĩa.",
          },
          {
            id: "q6",
            type: "reading",
            questionText: "Chọn từ trái nghĩa với “大” (Đại - To/Lớn):",
            pinyinText: "dà",
            options: [
              { id: "A", text: "多 (Nhiều)" },
              { id: "B", text: "小 (Nhỏ/Bé)" },
              { id: "C", text: "高 (Cao)" },
              { id: "D", text: "少 (Ít)" },
            ],
            correctAnswer: "B",
            explanation: "Đáp án B đúng. Từ trái nghĩa của 大 (dà - to) là 小 (xiǎo - nhỏ).",
          },
        ],
      },
      {
        id: "hsk1-sec-3",
        title: "Phần 3: Sắp Xếp Câu & Viết (Writing)",
        type: "writing",
        instructions: "Sắp xếp các từ thành câu hoàn chỉnh và đúng ngữ pháp.",
        questions: [
          {
            id: "q7",
            type: "writing",
            questionText: "Sắp xếp các từ sau thành câu đúng:",
            pinyinText: "Wǒ / Hànyǔ / xuéxí / zài",
            wordsToArrange: ["我", "在", "学习", "汉语"],
            options: [
              { id: "A", text: "我在学习汉语。" },
              { id: "B", text: "我学习汉语在。" },
              { id: "C", text: "汉语学习 me 在。" },
              { id: "D", text: "在学习我汉语。" },
            ],
            correctAnswer: "A",
            explanation: "Đáp án A đúng. Cấu trúc câu diễn tả hành động đang diễn ra: Chủ ngữ (我) + 在 + Động từ (学习) + Tân ngữ (汉语). Nghĩa: 'Tôi đang học tiếng Trung'.",
          },
          {
            id: "q8",
            type: "writing",
            questionText: "Sắp xếp câu hỏi thăm thời tiết hôm nay:",
            pinyinText: "tiānqì / Jīntiān / zěnmeyàng",
            wordsToArrange: ["今天", "天气", "怎么样"],
            options: [
              { id: "A", text: "今天天气怎么样？" },
              { id: "B", text: "怎么样 weather 今天？" },
              { id: "C", text: "天气今天怎么样？" },
              { id: "D", text: "怎么样天气今天？" },
            ],
            correctAnswer: "A",
            explanation: "Đáp án A đúng. Cấu trúc: 今天 (Hôm nay) + 天气 (thời tiết) + 怎么样 (thế nào)?",
          },
        ],
      },
    ],
  },

  {
    id: "hsk2-official-01",
    level: 2,
    title: "Đề Thi Mẫu HSK 2 Chính Thức #1",
    subtitle: "300 từ vựng cơ bản - Luyện giao tiếp sinh hoạt",
    isOfficial: true,
    durationMinutes: 40,
    totalQuestions: 8,
    passingScore: 120,
    sections: [
      {
        id: "hsk2-sec-1",
        title: "Phần 1: Nghe Hiểu (Listening)",
        type: "listening",
        instructions: "Nghe đoạn thoại và chọn câu trả lời đúng.",
        questions: [
          {
            id: "q201",
            type: "listening",
            questionText: "Họ chuẩn bị đi đâu?",
            audioText: "外面下雨了，我们坐出租车去吧。",
            options: [
              { id: "A", text: "Đi bằng xe buýt" },
              { id: "B", text: "Đi taxi vì trời mưa (坐出租车)" },
              { id: "C", text: "Đi bộ dưới mưa" },
              { id: "D", text: "Ở lại nhà" },
            ],
            correctAnswer: "B",
            explanation: "Đáp án B đúng. Đoạn thoại nói: '外面下雨了，我们坐出租车去吧' (Bên ngoài mưa rồi, chúng ta đi taxi nhé).",
          },
          {
            id: "q202",
            type: "listening",
            questionText: "Người nam cảm thấy như thế nào?",
            audioText: "我今天太累了，想早点睡觉。",
            options: [
              { id: "A", text: "Rất đói (很饿)" },
              { id: "B", text: "Rất mệt và muốn ngủ sớm (太累了)" },
              { id: "C", text: "Rất vui vẻ (很高兴)" },
              { id: "D", text: "Đang bị bệnh (生病了)" },
            ],
            correctAnswer: "B",
            explanation: "Đáp án B đúng. 太累了 (tài lèi le - quá mệt) và 想早点睡觉 (muốn ngủ sớm).",
          },
        ],
      },
      {
        id: "hsk2-sec-2",
        title: "Phần 2: Đọc Hiểu (Reading)",
        type: "reading",
        instructions: "Chọn câu có ý nghĩa tương đương.",
        questions: [
          {
            id: "q203",
            type: "reading",
            questionText: "“他比我高，也比我大两岁。” nghĩa là gì?",
            options: [
              { id: "A", text: "Anh ấy cao hơn tôi và lớn hơn tôi 2 tuổi." },
              { id: "B", text: "Tôi cao hơn anh ấy 2 cm." },
              { id: "C", text: "Anh ấy thấp hơn tôi 2 tuổi." },
              { id: "D", text: "Chúng tôi bằng tuổi nhau." },
            ],
            correctAnswer: "A",
            explanation: "Cấu trúc so sánh 比: 他比我高 (Anh ấy cao hơn tôi), 比我大两岁 (lớn hơn tôi 2 tuổi).",
          },
        ],
      },
    ],
  },

  {
    id: "hsk3-official-01",
    level: 3,
    title: "Đề Thi Thử HSK 3 Trung Cấp",
    subtitle: "600 từ vựng - Luyện đọc đoạn văn và hội thoại dài",
    isOfficial: true,
    durationMinutes: 45,
    totalQuestions: 6,
    passingScore: 180,
    sections: [
      {
        id: "hsk3-sec-1",
        title: "Phần 1: Nghe & Chọn Trắc Nghiệm",
        type: "listening",
        instructions: "Nghe thông tin và chọn câu trả lời đúng.",
        questions: [
          {
            id: "q301",
            type: "listening",
            questionText: "Người phụ nữ khuyên người nam làm gì?",
            audioText: "医生说你需要多运动，少吃甜食，这样身体才会好。",
            options: [
              { id: "A", text: "Nên tập thể dục nhiều hơn và ăn ít đồ ngọt" },
              { id: "B", text: "Nên đi du lịch Bắc Kinh" },
              { id: "C", text: "Nên uống thêm cà phê" },
              { id: "D", text: "Nên ngủ 10 tiếng mỗi ngày" },
            ],
            correctAnswer: "A",
            explanation: "Đoạn nghe: 多运动 (tập thể dục nhiều), 少吃甜食 (ăn ít đồ ngọt).",
          },
        ],
      },
    ],
  },

  {
    id: "hsk4-official-01",
    level: 4,
    title: "Đề Thi Mẫu HSK 4 Đọc Hiểu & Ngữ Pháp",
    subtitle: "1200 từ vựng - Thử thách tư duy ngôn ngữ sâu",
    isOfficial: true,
    durationMinutes: 55,
    totalQuestions: 5,
    passingScore: 180,
    sections: [
      {
        id: "hsk4-sec-1",
        title: "Phần Đọc Hiểu Nâng Cao",
        type: "reading",
        instructions: "Đọc đoạn văn và chọn đáp án chính xác.",
        passage: "每个人都有自己的生活方式，只要自己觉得快乐，就不必在乎别人的看法。",
        questions: [
          {
            id: "q401",
            type: "reading",
            questionText: "Theo đoạn văn trên, điều quan trọng nhất trong cuộc sống là gì?",
            options: [
              { id: "A", text: "Bản thân cảm thấy hạnh phúc/vui vẻ (自己觉得快乐)" },
              { id: "B", text: "Kiếm được thật nhiều tiền" },
              { id: "C", text: "Làm theo ý kiến của người khác" },
              { id: "D", text: "Đi du lịch khắp thế giới" },
            ],
            correctAnswer: "A",
            explanation: "Đoạn văn ghi: 只要自己觉得快乐，就不必在乎别人的看法 (Chỉ cần bản thân thấy vui vẻ thì không cần bận tâm ý kiến người khác).",
          },
        ],
      },
    ],
  },

  {
    id: "hsk5-official-01",
    level: 5,
    title: "Đề Thi Thử HSK 5 Cao Cấp",
    subtitle: "2500 từ vựng - Đọc báo và văn bản dài",
    isOfficial: true,
    durationMinutes: 60,
    totalQuestions: 5,
    passingScore: 180,
    sections: [
      {
        id: "hsk5-sec-1",
        title: "Phần 1: Đọc Hiểu & Từ Vựng Chuyên Ngành",
        type: "reading",
        instructions: "Chọn từ đúng điền vào chỗ trống.",
        questions: [
          {
            id: "q501",
            type: "reading",
            questionText: "Điền từ thích hợp: “积极的态度能够帮助我们____困难。”",
            options: [
              { id: "A", text: "克服 (Khắc phục/Vượt qua)" },
              { id: "B", text: "放弃 (Từ bỏ)" },
              { id: "C", text: "减少 (Giảm bớt)" },
              { id: "D", text: "批评 (Phê bình)" },
            ],
            correctAnswer: "A",
            explanation: "克服困难 (kèfú kùnnán) là kết hợp từ cố định có nghĩa 'khắc phục / vượt qua khó khăn'.",
          },
        ],
      },
    ],
  },

  {
    id: "hsk6-official-01",
    level: 6,
    title: "Đề Thi Thử HSK 6 Thâm Niên",
    subtitle: "5000+ từ vựng - Đạt trình độ thành thạo như người bản xứ",
    isOfficial: true,
    durationMinutes: 70,
    totalQuestions: 5,
    passingScore: 180,
    sections: [
      {
        id: "hsk6-sec-1",
        title: "Phần 1: Phân Tích Ngữ Pháp & Sửa Lỗi Sai (病句)",
        type: "reading",
        instructions: "Chọn câu có lỗi sai về ngữ pháp trong các lựa chọn sau.",
        questions: [
          {
            id: "q601",
            type: "reading",
            questionText: "Chọn câu chứa lỗi ngữ pháp (病句):",
            options: [
              { id: "A", text: "通过这次活动，使我认识到了团队合作的重要性。" },
              { id: "B", text: "只要我们坚持不懈，就一定能取得成功。" },
              { id: "C", text: "图书馆里静悄悄的，连针 an 掉在地上都能听见。" },
              { id: "D", text: "他不仅很聪明，而且非常勤奋。" },
            ],
            correctAnswer: "A",
            explanation: "Đáp án A chứa lỗi thiếu chủ ngữ do dùng cả '通过...' và '使...' cùng lúc. Sửa bằng cách bỏ '使' hoặc bỏ '通过'.",
          },
        ],
      },
    ],
  },
];
