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
  passage?: string;
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

export interface HSKLevelMatrix {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  listeningCount: string;
  readingCount: string;
  writingCount: string;
  totalQuestions: string;
  durationMinutes: string;
  description: string;
}

export const HSK_MATRIX_INFO: HSKLevelMatrix[] = [
  {
    level: 1,
    listeningCount: "20 câu (15 phút)",
    readingCount: "20 câu (17 phút)",
    writingCount: "Không có",
    totalQuestions: "40 câu",
    durationMinutes: "35 phút (cộng 5 phút điền thẻ)",
    description: "Cơ bản - 150 từ vựng",
  },
  {
    level: 2,
    listeningCount: "20 câu (15 phút)",
    readingCount: "25 câu (22 phút)",
    writingCount: "Không có",
    totalQuestions: "45 câu",
    durationMinutes: "50 phút",
    description: "Giao tiếp sinh hoạt - 300 từ vựng",
  },
  {
    level: 3,
    listeningCount: "40 câu (35 phút)",
    readingCount: "30 câu (30 phút)",
    writingCount: "10 câu (15 phút)",
    totalQuestions: "80 câu",
    durationMinutes: "85 phút",
    description: "Sơ trung cấp - 600 từ vựng",
  },
  {
    level: 4,
    listeningCount: "45 câu (30 phút)",
    readingCount: "40 câu (40 phút)",
    writingCount: "15 câu (25 phút)",
    totalQuestions: "100 câu",
    durationMinutes: "100 phút",
    description: "Trung cấp - 1200 từ vựng",
  },
  {
    level: 5,
    listeningCount: "45 câu (30 phút)",
    readingCount: "45 câu (45 phút)",
    writingCount: "10 câu (40 phút)",
    totalQuestions: "100 câu",
    durationMinutes: "120 phút",
    description: "Cao cấp - 2500 từ vựng",
  },
  {
    level: 6,
    listeningCount: "50 câu (35 phút)",
    readingCount: "50 câu (50 phút)",
    writingCount: "1 câu tóm tắt (45 phút)",
    totalQuestions: "101 câu",
    durationMinutes: "135 phút",
    description: "Thành thạo bản xứ - 5000+ từ vựng",
  },
];

export const HSK_EXAMS: HSKExam[] = [
  // ==================== HSK 1 ====================
  {
    id: "hsk1-official-01",
    level: 1,
    title: "Đề Thi Mẫu HSK 1 Chính Thức #1",
    subtitle: "Cấu trúc chuẩn: 20 Nghe + 20 Đọc (Không có phần Viết)",
    isOfficial: true,
    durationMinutes: 35,
    totalQuestions: 8,
    passingScore: 120,
    sections: [
      {
        id: "hsk1-sec-1",
        title: "Phần 1: Nghe Hiểu (Listening - 20 câu)",
        type: "listening",
        instructions: "Nghe đoạn thoại và chọn đáp án chính xác nhất.",
        questions: [
          {
            id: "q1_1",
            type: "listening",
            questionText: "Người trong hội thoại đang giới thiệu nghề nghiệp gì?",
            pinyinText: "Nǐ hǎo! Wǒ shì Wáng lǎoshī.",
            audioText: "你好！我是王老师。很高兴认识你。",
            options: [
              { id: "A", text: "Giáo viên (老师)", pinyin: "lǎoshī" },
              { id: "B", text: "Bác sĩ (医生)", pinyin: "yīshēng" },
              { id: "C", text: "Học sinh (学生)", pinyin: "xuéshēng" },
              { id: "D", text: "Tài xế (司机)", pinyin: "sījī" },
            ],
            correctAnswer: "A",
            explanation: "Đáp án A đúng. Đoạn hội thoại nói: '我是王老师' (Tôi là thầy/cô giáo Vương).",
          },
          {
            id: "q1_2",
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
            explanation: "Đáp án B đúng. Đoạn thoại nói: '现在八点' (Bây giờ là 8 giờ).",
          },
          {
            id: "q1_3",
            type: "listening",
            questionText: "Cô ấy muốn uống loại đồ uống nào?",
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
          {
            id: "q1_4",
            type: "listening",
            questionText: "Trời hôm nay như thế nào?",
            pinyinText: "Jīntiān tiānqì hěn hǎo, bù lěng.",
            audioText: "今天天气很好，不冷。",
            options: [
              { id: "A", text: "Trời rất lạnh (很冷)" },
              { id: "B", text: "Thời tiết rất tốt, không lạnh (很好，不冷)" },
              { id: "C", text: "Đang mưa to (下大雨)" },
              { id: "D", text: "Có tuyết rơi (下雪)" },
            ],
            correctAnswer: "B",
            explanation: "Đáp án B đúng. Đoạn thoại: '今天天气很好，不冷' (Hôm nay thời tiết rất tốt, không lạnh).",
          },
        ],
      },
      {
        id: "hsk1-sec-2",
        title: "Phần 2: Đọc Hiểu (Reading - 20 câu)",
        type: "reading",
        instructions: "Đọc câu tiếng Trung và chọn nghĩa hoặc đáp án đúng.",
        questions: [
          {
            id: "q1_5",
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
            id: "q1_6",
            type: "reading",
            questionText: "Điền từ thích hợp: “他是我的____。” (Anh ấy là... của tôi).",
            pinyinText: "Tā shì wǒ de ____.",
            options: [
              { id: "A", text: "朋友 (Bạn bè)" },
              { id: "B", text: "很高兴 (Rất vui)" },
              { id: "C", text: "不客气 (Không có gì)" },
              { id: "D", text: "谢谢 (Cảm ơn)" },
            ],
            correctAnswer: "A",
            explanation: "Đáp án A đúng. 朋友 (péngyou - bạn bè) phù hợp về danh từ.",
          },
          {
            id: "q1_7",
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
            explanation: "Đáp án B đúng. Trái nghĩa với 大 (dà - to) là 小 (xiǎo - nhỏ).",
          },
          {
            id: "q1_8",
            type: "reading",
            questionText: "“我明天去中国。” có nghĩa là gì?",
            pinyinText: "Wǒ míngtiān qù Zhōngguó.",
            options: [
              { id: "A", text: "Ngày mai tôi đi Trung Quốc." },
              { id: "B", text: "Hôm nay tôi ở Trung Quốc." },
              { id: "C", text: "Hôm qua tôi từ Trung Quốc về." },
              { id: "D", text: "Tôi muốn học tiếng Trung." },
            ],
            correctAnswer: "A",
            explanation: "Đáp án A đúng. 明天 (míngtiān - ngày mai), 去 (qù - đi), 中国 (Zhōngguó - Trung Quốc).",
          },
        ],
      },
    ],
  },

  // ==================== HSK 2 ====================
  {
    id: "hsk2-official-01",
    level: 2,
    title: "Đề Thi Mẫu HSK 2 Chính Thức #1",
    subtitle: "Cấu trúc chuẩn: 20 Nghe + 25 Đọc (Không có phần Viết)",
    isOfficial: true,
    durationMinutes: 50,
    totalQuestions: 8,
    passingScore: 120,
    sections: [
      {
        id: "hsk2-sec-1",
        title: "Phần 1: Nghe Hiểu (Listening - 20 câu)",
        type: "listening",
        instructions: "Nghe đoạn thoại và chọn câu trả lời đúng.",
        questions: [
          {
            id: "q2_1",
            type: "listening",
            questionText: "Họ chuẩn bị phương tiện gì đi làm?",
            audioText: "外面下雨了，我们坐出租车去吧。",
            options: [
              { id: "A", text: "Đi xe buýt (坐公交车)" },
              { id: "B", text: "Đi xe taxi vì trời mưa (坐出租车)" },
              { id: "C", text: "Đi xe máy (骑摩托车)" },
              { id: "D", text: "Đi bộ (走路)" },
            ],
            correctAnswer: "B",
            explanation: "Đoạn nghe: 外面下雨了，我们坐出租车去吧 (Bên ngoài mưa rồi, chúng ta đi taxi nhé).",
          },
          {
            id: "q2_2",
            type: "listening",
            questionText: "Anh ấy cảm thấy thế nào?",
            audioText: "我今天太累了，想早点睡觉。",
            options: [
              { id: "A", text: "Rất đói (很饿)" },
              { id: "B", text: "Rất mệt và muốn ngủ sớm (太累了)" },
              { id: "C", text: "Vui vẻ (很高兴)" },
              { id: "D", text: "Bị ốm (生病)" },
            ],
            correctAnswer: "B",
            explanation: "Đoạn nghe: 太累了 (quá mệt) và 想早点睡觉 (muốn ngủ sớm).",
          },
          {
            id: "q2_3",
            type: "listening",
            questionText: "Quyển sách này giá bao nhiêu tiền?",
            audioText: "这本书五十块钱，不算贵。",
            options: [
              { id: "A", text: "15 tệ (十五块)" },
              { id: "B", text: "50 tệ (五十块)" },
              { id: "C", text: "100 tệ (一百块)" },
              { id: "D", text: "5 tệ (五块)" },
            ],
            correctAnswer: "B",
            explanation: "Đoạn nghe: 这本书五十块钱 (Quyển sách này 50 tệ).",
          },
          {
            id: "q2_4",
            type: "listening",
            questionText: "Anh ấy học tiếng Trung được bao lâu rồi?",
            audioText: "我已经学两年汉语了。",
            options: [
              { id: "A", text: "2 tháng (两个月)" },
              { id: "B", text: "2 năm (两年)" },
              { id: "C", text: "2 tuần (两周)" },
              { id: "D", text: "2 ngày (两天)" },
            ],
            correctAnswer: "B",
            explanation: "Đoạn nghe: 两年 (2 năm).",
          },
        ],
      },
      {
        id: "hsk2-sec-2",
        title: "Phần 2: Đọc Hiểu (Reading - 25 câu)",
        type: "reading",
        instructions: "Chọn câu hoặc từ thích hợp.",
        questions: [
          {
            id: "q2_5",
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
          {
            id: "q2_6",
            type: "reading",
            questionText: "Nối vế câu logic: “虽然这件衣服很贵，____。”",
            options: [
              { id: "A", text: "但是我很喜欢。(Tuy nhiên tôi rất thích)" },
              { id: "B", text: "所以要睡觉。(Cho nên đi ngủ)" },
              { id: "C", text: "因为下雨。(Vì trời mưa)" },
              { id: "D", text: "很高兴。(Rất vui)" },
            ],
            correctAnswer: "A",
            explanation: "Cặp liên từ tuy... nhưng: 虽然... 但是...",
          },
          {
            id: "q2_7",
            type: "reading",
            questionText: "Điền từ thích hợp: “因为身体不好，所以他今天没来____。”",
            options: [
              { id: "A", text: "上班 (Đi làm)" },
              { id: "B", text: "睡觉 (Đi ngủ)" },
              { id: "C", text: "跳舞 (Khiêu vũ)" },
              { id: "D", text: "看电影 (Xem phim)" },
            ],
            correctAnswer: "A",
            explanation: "Upper context: Vì sức khỏe không tốt nên hôm nay anh ấy không đi làm (上班).",
          },
          {
            id: "q2_8",
            type: "reading",
            questionText: "“请等我一下，我马上就来。” nghĩa là gì?",
            options: [
              { id: "A", text: "Xin đợi tôi một chút, tôi đến ngay lập tức." },
              { id: "B", text: "Tôi không đến đâu, đừng đợi." },
              { id: "C", text: "Tôi đang ở trên xe xe buýt." },
              { id: "D", text: "Hãy gọi lại sau." },
            ],
            correctAnswer: "A",
            explanation: "请等我一下 (Xin đợi tôi một lát), 马上就来 (đến ngay lập tức).",
          },
        ],
      },
    ],
  },

  // ==================== HSK 3 ====================
  {
    id: "hsk3-official-01",
    level: 3,
    title: "Đề Thi Thử HSK 3 Trung Cấp",
    subtitle: "Cấu trúc 80 câu: 40 Nghe + 30 Đọc + 10 Viết (Thời gian 85 phút)",
    isOfficial: true,
    durationMinutes: 85,
    totalQuestions: 9,
    passingScore: 180,
    sections: [
      {
        id: "hsk3-sec-1",
        title: "Phần 1: Nghe Hiểu (Listening - 40 câu)",
        type: "listening",
        instructions: "Nghe thông tin và chọn câu trả lời đúng.",
        questions: [
          {
            id: "q3_1",
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
          {
            id: "q3_2",
            type: "listening",
            questionText: "Địa điểm và thời gian cuộc hẹn là khi nào?",
            audioText: "我们明天下午三点在图书馆门前见面，好吗？",
            options: [
              { id: "A", text: "Chiều mai 3 giờ tại trước cửa thư viện" },
              { id: "B", text: "Sáng mai 8 giờ tại quán ăn" },
              { id: "C", text: "Chiều nay 4 giờ tại công ty" },
              { id: "D", text: "Tối nay 7 giờ tại nhà riêng" },
            ],
            correctAnswer: "A",
            explanation: "Đoạn nghe: 明天下午三点 (Chiều mai 3 giờ), 图书馆门前 (trước cửa thư viện).",
          },
          {
            id: "q3_3",
            type: "listening",
            questionText: "Tại sao anh ấy lại mua chiếc điện thoại di động này?",
            audioText: "虽然这个手机有点贵，但是它的质量很好，拍照很清晰。",
            options: [
              { id: "A", text: "Chất lượng rất tốt và chụp ảnh rất sắc nét" },
              { id: "B", text: "Vì giá của nó rất rẻ" },
              { id: "C", text: "Vì màu sắc đẹp" },
              { id: "D", text: "Vì bạn bè giới thiệu" },
            ],
            correctAnswer: "A",
            explanation: "Đoạn nghe: 质量很好 (chất lượng rất tốt), 拍照很清晰 (chụp ảnh rất sắc nét).",
          },
        ],
      },
      {
        id: "hsk3-sec-2",
        title: "Phần 2: Đọc Hiểu (Reading - 30 câu)",
        type: "reading",
        instructions: "Đọc đoạn văn ngắn và chọn đáp án chính xác.",
        passage: "学汉语虽然不容易，但只要每天坚持练习，就一定能说得越来越流利。",
        questions: [
          {
            id: "q3_4",
            type: "reading",
            questionText: "Bí quyết để nói tiếng Trung ngày càng lưu khoát là gì?",
            options: [
              { id: "A", text: "Mỗi ngày kiên trì luyện tập (每天坚持练习)" },
              { id: "B", text: "Chỉ cần học 1 ngày" },
              { id: "C", text: "Đi du lịch Trung Quốc ngay" },
              { id: "D", text: "Không cần đọc sách" },
            ],
            correctAnswer: "A",
            explanation: "Đoạn văn ghi: 只要每天坚持练习，就一定能说得越来越流利.",
          },
          {
            id: "q3_5",
            type: "reading",
            questionText: "Điền từ thích hợp: “这决定对我来说非常____。”",
            options: [
              { id: "A", text: "重要 (Quan trọng)" },
              { id: "B", text: "方便 (Thuận tiện)" },
              { id: "C", text: "客气 (Lịch sự)" },
              { id: "D", text: "热情 (Nhiệt tình)" },
            ],
            correctAnswer: "A",
            explanation: "重要 (zhòngyào - quan trọng) phù hợp nhất với cấu trúc 对...来说 (Đối với... mà nói).",
          },
          {
            id: "q3_6",
            type: "reading",
            questionText: "Chọn vế nối thích hợp: “如果不努力学习，____。”",
            options: [
              { id: "A", text: "就很难通过考试。(thì rất khó vượt qua kỳ thi)" },
              { id: "B", text: "明天天气很好。(ngày mai thời tiết rất tốt)" },
              { id: "C", text: "我和他去吃火锅。(tôi và anh ấy đi ăn lẩu)" },
              { id: "D", text: "太漂亮了。(rất đẹp)" },
            ],
            correctAnswer: "A",
            explanation: "Cấu trúc giả định: 如果... 就... (Nếu... thì...)",
          },
        ],
      },
      {
        id: "hsk3-sec-3",
        title: "Phần 3: Viết & Sắp Xếp Câu (Writing - 10 câu)",
        type: "writing",
        instructions: "Sắp xếp các từ cho sẵn thành câu hoàn chỉnh.",
        questions: [
          {
            id: "q3_7",
            type: "writing",
            questionText: "Sắp xếp các từ thành câu đúng:",
            pinyinText: "tiānqì / Jīntiān / zěnmeyàng",
            wordsToArrange: ["今天", "天气", "怎么样"],
            options: [
              { id: "A", text: "今天天气怎么样？" },
              { id: "B", text: "怎么样 weather 今天？" },
              { id: "C", text: "天气今天怎么样？" },
              { id: "D", text: "怎么样天气今天？" },
            ],
            correctAnswer: "A",
            explanation: "Cấu trúc câu hỏi thời tiết: 今天 + 天气 + 怎么样？",
          },
          {
            id: "q3_8",
            type: "writing",
            questionText: "Sắp xếp câu diễn tả việc đi du lịch:",
            wordsToArrange: ["我", "想", "去", "北京", "旅游"],
            options: [
              { id: "A", text: "我想去北京旅游。" },
              { id: "B", text: "去北京我想旅游。" },
              { id: "C", text: "北京旅游我想去。" },
              { id: "D", text: "旅游想去我北京。" },
            ],
            correctAnswer: "A",
            explanation: "Cấu trúc động từ liên tiếp: Chủ ngữ (我) + 想 + Động từ 1 (去北京) + Động từ 2 (旅游).",
          },
          {
            id: "q3_9",
            type: "writing",
            questionText: "Sắp xếp câu cám ơn lịch sự:",
            wordsToArrange: ["非常", "感谢", "你的", "帮助"],
            options: [
              { id: "A", text: "非常感谢你的帮助。" },
              { id: "B", text: "你的帮助非常感谢。" },
              { id: "C", text: "感谢非常你的帮助。" },
              { id: "D", text: "帮助非常感谢你的。" },
            ],
            correctAnswer: "A",
            explanation: "Cấu trúc: 非常感谢 (Rất cảm ơn) + 你的帮助 (sự giúp đỡ của bạn).",
          },
        ],
      },
    ],
  },

  // ==================== HSK 4 ====================
  {
    id: "hsk4-official-01",
    level: 4,
    title: "Đề Thi Mẫu HSK 4 Đọc Hiểu & Ngữ Pháp",
    subtitle: "Cấu trúc 100 câu: 45 Nghe + 40 Đọc + 15 Viết (Thời gian 100 phút)",
    isOfficial: true,
    durationMinutes: 100,
    totalQuestions: 9,
    passingScore: 180,
    sections: [
      {
        id: "hsk4-sec-1",
        title: "Phần 1: Nghe Hiểu (Listening - 45 câu)",
        type: "listening",
        instructions: "Nghe đoạn hội thoại và chọn đáp án A, B, C, D.",
        questions: [
          {
            id: "q4_1",
            type: "listening",
            questionText: "Lý do anh ấy xin nghỉ làm hôm nay là gì?",
            audioText: "经理，我今天发烧了，想请假去医院看医生。",
            options: [
              { id: "A", text: "Bị sốt và cần đi bệnh viện khám (发烧看医生)" },
              { id: "B", text: "Đi du lịch với gia đình" },
              { id: "C", text: "Đã tìm được công việc mới" },
              { id: "D", text: "Trời mưa không đi làm được" },
            ],
            correctAnswer: "A",
            explanation: "Đoạn nghe: 我今天发烧了，想请假去医院看医生.",
          },
          {
            id: "q4_2",
            type: "listening",
            questionText: "Người phụ nữ nghĩ sao về bản hợp đồng này?",
            audioText: "这份合同条款很详细，双方的权利和义务都很明确，我觉得可以签约。",
            options: [
              { id: "A", text: "Điều khoản chi tiết và có thể ký kết (可以签约)" },
              { id: "B", text: "Còn nhiều điểm chưa rõ ràng" },
              { id: "C", text: "Giá cả quá cao" },
              { id: "D", text: "Cần đổi sang công ty khác" },
            ],
            correctAnswer: "A",
            explanation: "Đoạn nghe: 条款很详细... 我觉得可以签约.",
          },
          {
            id: "q4_3",
            type: "listening",
            questionText: "Bài diễn thuyết sắp bắt đầu diễn ra ở đâu?",
            audioText: "请各位同仁注意，著名的学术演讲将在三楼一号会议室举行。",
            options: [
              { id: "A", text: "Phòng họp số 1 tầng 3 (三楼一号会议室)" },
              { id: "B", text: "Sân vận động tầng 1" },
              { id: "C", text: "Thư viện trường học" },
              { id: "D", text: "Quán cà phê tầng 2" },
            ],
            correctAnswer: "A",
            explanation: "Đoạn nghe: 三楼一号会议室 (Phòng họp số 1 tầng 3).",
          },
        ],
      },
      {
        id: "hsk4-sec-2",
        title: "Phần 2: Đọc Hiểu Nâng Cao (Reading - 40 câu)",
        type: "reading",
        instructions: "Đọc đoạn văn và chọn đáp án chính xác.",
        passage: "每个人都有自己的生活方式，只要自己觉得快乐，就不必在乎别人的看法。",
        questions: [
          {
            id: "q4_4",
            type: "reading",
            questionText: "Theo đoạn văn trên, điều quan trọng nhất trong cuộc sống là gì?",
            options: [
              { id: "A", text: "Bản thân cảm thấy hạnh phúc/vui vẻ (自己觉得快乐)" },
              { id: "B", text: "Kiếm được thật nhiều tiền" },
              { id: "C", text: "Làm theo ý kiến của người khác" },
              { id: "D", text: "Đi du lịch khắp thế giới" },
            ],
            correctAnswer: "A",
            explanation: "Đoạn văn ghi: 只要自己觉得快乐，就不必在乎别人的看法.",
          },
          {
            id: "q4_5",
            type: "reading",
            questionText: "Sắp xếp 3 vế câu thành đoạn văn đúng logic: (A) 总结经验 (B) 才能不断进步 (C) 只有不断",
            options: [
              { id: "A", text: "C -> A -> B (只有不断总结经验，才能不断进步)" },
              { id: "B", text: "A -> B -> C" },
              { id: "C", text: "B -> C -> A" },
              { id: "D", text: "C -> B -> A" },
            ],
            correctAnswer: "A",
            explanation: "Cấu trúc 只有... 才能...: 只有 (C) 不断总结经验 (A)，才能不断进步 (B).",
          },
          {
            id: "q4_6",
            type: "reading",
            questionText: "Điền từ thích hợp: “这次成功离不开大家____的努力。”",
            options: [
              { id: "A", text: "共同 (Chung / Cùng nhau)" },
              { id: "B", text: "估计 (Ước tính)" },
              { id: "C", text: "怀疑 (Nghi ngờ)" },
              { id: "D", text: "打扰 (Làm phiền)" },
            ],
            correctAnswer: "A",
            explanation: "共同的努力 (gòngtóng de nǔlì) = nỗ lực chung của tất cả mọi người.",
          },
        ],
      },
      {
        id: "hsk4-sec-3",
        title: "Phần 3: Viết & Mô Tả Tranh (Writing - 15 câu)",
        type: "writing",
        instructions: "Sắp xếp từ thành câu hoàn chỉnh.",
        questions: [
          {
            id: "q4_7",
            type: "writing",
            questionText: "Sắp xếp các từ sau thành câu đúng:",
            wordsToArrange: ["他", "比", "我", "高"],
            options: [
              { id: "A", text: "他比我高。" },
              { id: "B", text: "比高他我。" },
              { id: "C", text: "高比我他。" },
              { id: "D", text: "我比高他。" },
            ],
            correctAnswer: "A",
            explanation: "Cấu trúc so sánh 比: 主语A + 比 + 主语B + 形容词.",
          },
          {
            id: "q4_8",
            type: "writing",
            questionText: "Sắp xếp câu bị động câu 把:",
            wordsToArrange: ["请", "把", "门", "关上"],
            options: [
              { id: "A", text: "请把门关上。" },
              { id: "B", text: "把请关上门。" },
              { id: "C", text: "门把关上请。" },
              { id: "D", text: "关上门把请。" },
            ],
            correctAnswer: "A",
            explanation: "Cấu trúc câu 把: 主语 + 把 + 受事/Tân ngữ (门) + 动词 (关上).",
          },
          {
            id: "q4_9",
            type: "writing",
            questionText: "Sắp xếp câu cảm thán:",
            wordsToArrange: ["这里的", "风景", "真美", "啊"],
            options: [
              { id: "A", text: "这里的风景真美啊！" },
              { id: "B", text: "真美啊风景这里的。" },
              { id: "C", text: "风景真美这里的 strike." },
              { id: "D", text: "这里的真美风景啊。" },
            ],
            correctAnswer: "A",
            explanation: "Cấu trúc: 这里的风景 (Phong cảnh ở đây) + 真美啊 (thật là đẹp làm sao)!",
          },
        ],
      },
    ],
  },

  // ==================== HSK 5 ====================
  {
    id: "hsk5-official-01",
    level: 5,
    title: "Đề Thi Thử HSK 5 Cao Cấp",
    subtitle: "Cấu trúc 100 câu: 45 Nghe + 45 Đọc + 10 Viết (Thời gian 120 phút)",
    isOfficial: true,
    durationMinutes: 120,
    totalQuestions: 8,
    passingScore: 180,
    sections: [
      {
        id: "hsk5-sec-1",
        title: "Phần 1: Nghe Hiểu Đơn (Listening - 45 câu)",
        type: "listening",
        instructions: "Nghe bài phát biểu hoặc phỏng vấn và chọn đáp án A, B, C, D.",
        questions: [
          {
            id: "q5_1",
            type: "listening",
            questionText: "Diễn giả đề xuất chiến lược phát triển nào cho doanh nghiệp?",
            audioText: "企业的核心竞争力在于创新。只有不断研发新产品，提升服务质量，才能在激烈的市场竞争中立于不败之地。",
            options: [
              { id: "A", text: "Đổi mới sáng tạo và nâng cao chất lượng dịch vụ (创新与提升服务)" },
              { id: "B", text: "Cắt giảm tối đa chi phí nhân sự" },
              { id: "C", text: "Mở rộng quy mô nhà xưởng ngay lập tức" },
              { id: "D", text: "Tăng giá bán sản phẩm" },
            ],
            correctAnswer: "A",
            explanation: "Đoạn nghe: 核心竞争力在于创新... 提升服务质量.",
          },
          {
            id: "q5_2",
            type: "listening",
            questionText: "Mục đích của cuộc phỏng vấn giáo sư là gì?",
            audioText: "今天我们非常荣幸邀请到了李教授，来探讨环境保护与经济可持续发展的关系。",
            options: [
              { id: "A", text: "Thảo luận quan hệ bảo vệ môi trường và phát triển kinh tế" },
              { id: "B", text: "Giới thiệu cuốn sách văn học mới" },
              { id: "C", text: "Tuyển dụng sinh viên đại học" },
              { id: "D", text: "Quảng cáo du lịch sinh thái" },
            ],
            correctAnswer: "A",
            explanation: "Đoạn nghe: 探讨环境保护与经济可持续发展的关系.",
          },
        ],
      },
      {
        id: "hsk5-sec-2",
        title: "Phần 2: Đọc Hiểu Chuyên Ngành (Reading - 45 câu)",
        type: "reading",
        instructions: "Chọn từ điền vào đoạn văn chuyên sâu.",
        passage: "随着科技的飞速发展，人工智能在医疗领域的应用越来越广泛。",
        questions: [
          {
            id: "q5_3",
            type: "reading",
            questionText: "Điền từ thích hợp: “积极的态度能够帮助我们____困难。”",
            options: [
              { id: "A", text: "克服 (Khắc phục/Vượt qua)" },
              { id: "B", text: "放弃 (Từ bỏ)" },
              { id: "C", text: "减少 (Giảm bớt)" },
              { id: "D", text: "批评 (Phê bình)" },
            ],
            correctAnswer: "A",
            explanation: "克服困难 (kèfú kùnnán) = vượt qua khó khăn.",
          },
          {
            id: "q5_4",
            type: "reading",
            questionText: "Ý chính của đoạn văn trên là gì?",
            options: [
              { id: "A", text: "Trí tuệ nhân tạo được ứng dụng rộng rãi trong y tế" },
              { id: "B", text: "Ngành y tế đang giảm bớt chi phí" },
              { id: "C", text: "Bác sĩ không còn cần thiết" },
              { id: "D", text: "Con người không muốn đến bệnh viện" },
            ],
            correctAnswer: "A",
            explanation: "Đoạn văn: 人工智能在医疗领域的应用越来越广泛.",
          },
        ],
      },
      {
        id: "hsk5-sec-3",
        title: "Phần 3: Viết Phức Tạp (Writing - 10 câu)",
        type: "writing",
        instructions: "Sắp xếp các cụm từ thành câu phức.",
        questions: [
          {
            id: "q5_5",
            type: "writing",
            questionText: "Sắp xếp từ thành câu đúng ngữ pháp HSK 5:",
            wordsToArrange: ["良好的", "沟通", "是", "解决问题的", "关键"],
            options: [
              { id: "A", text: "良好的沟通是解决问题的关键。" },
              { id: "B", text: "关键是解决问题的良好的沟通。" },
              { id: "C", text: "解决问题的关键是良好的沟通 strike." },
              { id: "D", text: "沟通是良好的关键解决问题的。" },
            ],
            correctAnswer: "A",
            explanation: "Cấu trúc: 良好的沟通 (Sự giao tiếp tốt) + 是 (là) + 解决问题的关键 (chìa khóa giải quyết vấn đề).",
          },
        ],
      },
    ],
  },

  // ==================== HSK 6 ====================
  {
    id: "hsk6-official-01",
    level: 6,
    title: "Đề Thi Thử HSK 6 Thâm Niên",
    subtitle: "Cấu trúc 101 câu: 50 Nghe + 50 Đọc + 1 Bài Viết Tóm Tắt (135 phút)",
    isOfficial: true,
    durationMinutes: 135,
    totalQuestions: 9,
    passingScore: 180,
    sections: [
      {
        id: "hsk6-sec-1",
        title: "Phần 1: Phân Tích Ngữ Pháp & Sửa Lỗi Sai 病句 (50 câu)",
        type: "reading",
        instructions: "Chọn câu có lỗi sai về ngữ pháp trong các lựa chọn sau.",
        questions: [
          {
            id: "q6_1",
            type: "reading",
            questionText: "Chọn câu chứa lỗi ngữ pháp (病句):",
            options: [
              { id: "A", text: "通过这次活动，使我认识到了团队合作的重要性。" },
              { id: "B", text: "只要我们坚持不懈，就一定能取得成功。" },
              { id: "C", text: "图书馆里静悄悄的，连针掉在地上都能听见。" },
              { id: "D", text: "他不仅很聪明，而且非常勤奋。" },
            ],
            correctAnswer: "A",
            explanation: "Đáp án A chứa lỗi thiếu chủ ngữ do lạm dụng cả '通过...' và '使...' cùng lúc.",
          },
          {
            id: "q6_2",
            type: "reading",
            questionText: "Chọn câu có lỗi sai về kết hợp từ (搭配不当):",
            options: [
              { id: "A", text: "他的演讲赢得了全场观众热烈的掌声和赞扬声。" },
              { id: "B", text: "我们需要提高自己的业务水平。" },
              { id: "C", text: "随着科技发展，生活变得更加便利。" },
              { id: "D", text: "他认真听取了大家的意见。" },
            ],
            correctAnswer: "A",
            explanation: "Đáp án A sai kết hợp: '赢得...掌声' đúng nhưng '赢得...赞扬声' không hợp chuẩn HSK 6.",
          },
          {
            id: "q6_3",
            type: "reading",
            questionText: "Chọn câu chứa lỗi trùng lặp nghĩa (成分赘余):",
            options: [
              { id: "A", text: "我大约在十点左右到达火车站。" },
              { id: "B", text: "我们必须树立正确的价值观。" },
              { id: "C", text: "春天到了，大地复苏。" },
              { id: "D", text: "他高兴得合不拢嘴。" },
            ],
            correctAnswer: "A",
            explanation: "Đáp án A sai thừa từ: Dùng cả '大约' (khoảng) và '左右' (khoảng) trong cùng 1 câu.",
          },
        ],
      },
      {
        id: "hsk6-sec-2",
        title: "Phần 2: Nghe Hiểu Triết Lý & Chuyên Sâu (Listening - 50 câu)",
        type: "listening",
        instructions: "Nghe bài nói triết học/tin tức và chọn đáp án A, B, C, D.",
        questions: [
          {
            id: "q6_4",
            type: "listening",
            questionText: "Thông điệp chính của câu chuyện triết học là gì?",
            audioText: "水滴石穿，不是因为水的力量强大，而是因为持之以恒的毅力。在人生的道路上，恒心往往比一时爆发的激情更加重要。",
            options: [
              { id: "A", text: "Sự kiên trì và hằng tâm quan trọng hơn sự bồng bột bốc đồng (持之以恒的毅力)" },
              { id: "B", text: "Sức mạnh của nước là vô địch" },
              { id: "C", text: "Con người cần mua nhiều hòn đá" },
              { id: "D", text: "Thất bại là do không có tiền" },
            ],
            correctAnswer: "A",
            explanation: "Đoạn nghe: 恒心往往比一时爆发的激情更加重要.",
          },
          {
            id: "q6_5",
            type: "listening",
            questionText: "Theo bản tin kinh tế, nguyên nhân tăng trưởng là gì?",
            audioText: "本季度本国出口额同比增长了百分之十五，主要得益于高新技术产业的强劲拉动。",
            options: [
              { id: "A", text: "Nhờ vào sự kéo tăng mạnh mẽ của ngành công nghệ cao (高新技术产业)" },
              { id: "B", text: "Do giảm thuế nhập khẩu" },
              { id: "C", text: "Do thị trường du lịch phục hồi" },
              { id: "D", text: "Do nhu cầu nông sản tăng" },
            ],
            correctAnswer: "A",
            explanation: "Đoạn nghe: 得益于高新技术产业的强劲拉动.",
          },
        ],
      },
      {
        id: "hsk6-sec-3",
        title: "Phần 3: Viết Bài Văn Tóm Tắt (Writing - 1 câu tóm tắt)",
        type: "writing",
        instructions: "Sắp xếp từ thành câu ngữ pháp HSK 6 đỉnh cao.",
        questions: [
          {
            id: "q6_6",
            type: "writing",
            questionText: "Sắp xếp câu thành tục ngữ / thành ngữ HSK 6:",
            wordsToArrange: ["千里之行", "始于", "足下"],
            options: [
              { id: "A", text: "千里之行，始于足下。" },
              { id: "B", text: "始于足下，千里之行。" },
              { id: "C", text: "足下始于，千里之行。" },
              { id: "D", text: "千里足下，始于之行。" },
            ],
            correctAnswer: "A",
            explanation: "Thành ngữ HSK 6: 千里之行，始于足下 (Hành trình ngàn dặm bắt đầu từ một bước chân).",
          },
        ],
      },
    ],
  },
];
