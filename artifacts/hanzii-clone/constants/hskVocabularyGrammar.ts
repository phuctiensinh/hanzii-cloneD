import { HSKLevel } from "@/types/hskExam";

export interface GrammarPoint {
  id: string;
  level: HSKLevel;
  pattern: string;
  name: string;
  explanation: string;
  exampleChinese: string;
  examplePinyin: string;
  exampleVietnamese: string;
  tags: string[];
}

export const HSK_GRAMMAR_POINTS: GrammarPoint[] = [
  // HSK 1 Grammar
  {
    id: "g_hsk1_shi",
    level: 1,
    pattern: "A 是 B",
    name: "Câu phán đoán 是",
    explanation: "Dùng để biểu thị quan hệ đồng nhất hoặc phân loại (A là B).",
    exampleChinese: "我是学生。",
    examplePinyin: "Wǒ shì xuésheng.",
    exampleVietnamese: "Tôi là học sinh.",
    tags: ["cơ bản", "phán đoán"],
  },
  {
    id: "g_hsk1_bu",
    level: 1,
    pattern: "不 + Động từ / Tính từ",
    name: "Phủ định bằng 不",
    explanation: "Dùng '不' để phủ định hành động ở hiện tại, tương lai hoặc thói quen.",
    exampleChinese: "我不喝咖啡。",
    examplePinyin: "Wǒ bù hē kāfēi.",
    exampleVietnamese: "Tôi không uống cà phê.",
    tags: ["cơ bản", "phủ định"],
  },
  {
    id: "g_hsk1_de",
    level: 1,
    pattern: "Danh từ / Đại từ + 的 + Danh từ",
    name: "Trợ từ sở hữu 的",
    explanation: "Biểu thị quan hệ sở hữu hoặc bổ nghĩa cho danh từ.",
    exampleChinese: "这是我的老师。",
    examplePinyin: "Zhè shì wǒ de lǎoshī.",
    exampleVietnamese: "Đây là giáo viên của tôi.",
    tags: ["trợ từ", "sở hữu"],
  },
  {
    id: "g_hsk1_ma",
    level: 1,
    pattern: "Mệnh đề + 吗？",
    name: "Câu hỏi nghi vấn 吗",
    explanation: "Đặt '吗' ở cuối câu trần thuật để tạo câu hỏi có/không.",
    exampleChinese: "你好吗？",
    examplePinyin: "Nǐ hǎo ma?",
    exampleVietnamese: "Bạn có khỏe không?",
    tags: ["câu hỏi", "nghi vấn"],
  },

  // HSK 2 Grammar
  {
    id: "g_hsk2_bi",
    level: 2,
    pattern: "A + 比 + B + Tính từ",
    name: "Câu so sánh 比",
    explanation: "Biểu thị sự so sánh giữa A và B về một tính chất.",
    exampleChinese: "他比我高。",
    examplePinyin: "Tā bǐ wǒ gāo.",
    exampleVietnamese: "Anh ấy cao hơn tôi.",
    tags: ["so sánh", "tính từ"],
  },
  {
    id: "g_hsk2_suiran_danshi",
    level: 2,
    pattern: "虽然……但是……",
    name: "Liên từ chuyển ý Tuy... Nhưng",
    explanation: "Liên kết 2 phân câu có quan hệ nhượng bộ và đối lập.",
    exampleChinese: "虽然很累，但是很高兴。",
    examplePinyin: "Suīrán hěn lèi, dànshì hěn gāoxìng.",
    exampleVietnamese: "Tuy rất mệt nhưng rất vui.",
    tags: ["liên từ", "chuyển ý"],
  },
  {
    id: "g_hsk2_yinwei_suoyi",
    level: 2,
    pattern: "因为……所以……",
    name: "Liên từ nhân quả Vì... Nên",
    explanation: "Biểu thị mối quan hệ nguyên nhân và kết quả.",
    exampleChinese: "因为下雨，所以我没去。",
    examplePinyin: "Yīnwèi xià yǔ, suǒyǐ wǒ méi qù.",
    exampleVietnamese: "Vì trời mưa nên tôi không đi.",
    tags: ["liên từ", "nhân quả"],
  },
  {
    id: "g_hsk2_zhengzai",
    level: 2,
    pattern: "正在 / 正 / 在 + Động từ + (呢)",
    name: "Thì hiện tại tiếp diễn 正在",
    explanation: "Biểu thị hành động đang diễn ra tại thời điểm nói.",
    exampleChinese: "他正在看书呢。",
    examplePinyin: "Tā zhèngzài kàn shū ne.",
    exampleVietnamese: "Anh ấy đang đọc sách.",
    tags: ["thời gian", "tiếp diễn"],
  },

  // HSK 3 Grammar
  {
    id: "g_hsk3_ba",
    level: 3,
    pattern: "Chủ ngữ + 把 + Tân ngữ + Động từ + Thành phần khác",
    name: "Câu chữ 把",
    explanation: "Nhấn mạnh sự xử lý, tác động của chủ ngữ lên tân ngữ làm thay đổi vị trí, trạng thái.",
    exampleChinese: "请把门关上。",
    examplePinyin: "Qǐng bǎ mén guān shàng.",
    exampleVietnamese: "Xin hãy đóng cửa lại.",
    tags: ["câu chữ 把", "trọng điểm"],
  },
  {
    id: "g_hsk3_bei",
    level: 3,
    pattern: "Chủ ngữ (Tân ngữ chịu tác động) + 被 + Chủ thể gây ra + Động từ",
    name: "Câu bị động chữ 被",
    explanation: "Biểu thị chủ ngữ chịu sự tác động hoặc ảnh hưởng bởi chủ thể khác.",
    exampleChinese: "苹果被他吃了。",
    examplePinyin: "Píngguǒ bèi tā chī le.",
    exampleVietnamese: "Quả táo đã bị anh ấy ăn mất rồi.",
    tags: ["bị động", "trọng điểm"],
  },
  {
    id: "g_hsk3_ruguo_jiu",
    level: 3,
    pattern: "如果 / 要是……就……",
    name: "Cấu trúc giả thiết Nếu... Thì",
    explanation: "Nêu lên một điều kiện giả định và kết quả tương ứng.",
    exampleChinese: "如果明天下雨，我们就不去公园。",
    examplePinyin: "Rúguǒ míngtiān xià yǔ, wǒmen jiù bù qù gōngyuán.",
    exampleVietnamese: "Nếu ngày mai trời mưa, chúng tôi sẽ không đi công viên.",
    tags: ["giả thiết", "liên từ"],
  },
  {
    id: "g_hsk3_yue_yue",
    level: 3,
    pattern: "越……越……",
    name: "Cấu trúc Càng... Càng...",
    explanation: "Biểu thị mức độ phát triển thuận chiều theo thời gian hoặc điều kiện.",
    exampleChinese: "汉语越学越有意思。",
    examplePinyin: "Hànyǔ yuè xué yuè yǒu yìsi.",
    exampleVietnamese: "Tiếng Hán càng học càng thấy thú vị.",
    tags: ["mức độ", "tăng tiến"],
  },

  // HSK 4 Grammar
  {
    id: "g_hsk4_zhiyou_caineng",
    level: 4,
    pattern: "只有……才……",
    name: "Cấu trúc điều kiện duy nhất Chỉ có... Mới...",
    explanation: "Biểu thị điều kiện duy nhất cần thiết để đạt được kết quả.",
    exampleChinese: "只有努力学习，才能取得好成绩。",
    examplePinyin: "Zhǐyǒu nǔlì xuéxí, cái néng qǔdé hǎo chéngjì.",
    exampleVietnamese: "Chỉ có chăm chỉ học tập mới đạt được thành tích tốt.",
    tags: ["điều kiện duy nhất", "trung cấp"],
  },
  {
    id: "g_hsk4_bujin_erqie",
    level: 4,
    pattern: "不仅……而且……",
    name: "Cấu trúc tăng tiến Không những... Mà còn...",
    explanation: "Biểu thị ý nghĩa ở phân câu sau sâu hơn hoặc rộng hơn phân câu trước.",
    exampleChinese: "他不仅会说汉语，而且说得非常流利。",
    examplePinyin: "Tā bùjǐn huì shuō Hànyǔ, érqiě shuō de fēicháng liúlì.",
    exampleVietnamese: "Anh ấy không những biết nói tiếng Hán mà còn nói rất lưu loát.",
    tags: ["tăng tiến", "liên từ"],
  },
  {
    id: "g_hsk4_dui_laishuo",
    level: 4,
    pattern: "对……来说",
    name: "Cấu trúc Đối với... Mà nói",
    explanation: "Đứng đầu câu đưa ra góc nhìn, quan điểm của một đối tượng cụ thể.",
    exampleChinese: "对我来说，这道题太难了。",
    examplePinyin: "Duì wǒ lái shuō, zhè dào tí tài nán le.",
    exampleVietnamese: "Đối với tôi mà nói, câu hỏi này quá khó.",
    tags: ["quan điểm", "giới từ"],
  },

  // HSK 5 Grammar
  {
    id: "g_hsk5_jiran_jiu",
    level: 5,
    pattern: "既然……就……",
    name: "Cấu trúc Đã... Thì...",
    explanation: "Biểu thị một tiền đề đã thành sự thật và đưa ra kết luận hoặc đề xuất hợp lý.",
    exampleChinese: "既然你已经决定了，我们就全力支持你。",
    examplePinyin: "Jìrán nǐ yǐjīng juédìng le, wǒmen jiù quánlì zhīchí nǐ.",
    exampleVietnamese: "Đã là bạn quyết định rồi thì chúng tôi sẽ toàn lực ủng hộ bạn.",
    tags: ["tiền đề", "cao cấp"],
  },
  {
    id: "g_hsk5_wulun_dou",
    level: 5,
    pattern: "无论 / 不管……都……",
    name: "Cấu trúc Bất luận / Dù cho... Đều...",
    explanation: "Biểu thị kết quả không thay đổi trong bất kỳ hoàn cảnh nào.",
    exampleChinese: "无论遇到什么困难，他都不会放弃。",
    examplePinyin: "Wúlùn yù dào shénme kùnnan, tā dōu bù huì fàngqì.",
    exampleVietnamese: "Dù gặp phải khó khăn gì, anh ấy cũng sẽ không bao giờ từ bỏ.",
    tags: ["điều kiện vô điều kiện", "cao cấp"],
  },

  // HSK 6 Grammar
  {
    id: "g_hsk6_bingju_zhuyu",
    level: 6,
    pattern: "Phân tích câu thiếu chủ ngữ do lạm dụng giới từ",
    name: "Sửa lỗi ngữ pháp 病句: Thiếu chủ ngữ",
    explanation: "Lỗi dùng '通过……使……' hoặc '经过……让……' khiến câu mất chủ ngữ thực sự.",
    exampleChinese: "通过这次活动，使我增长了见识。（错误 → 应删去'使'）",
    examplePinyin: "Tōngguò zhè cì huó dòng, shǐ wǒ zēngzhǎng le jiànshi.",
    exampleVietnamese: "Sai lầm phổ biến khi dùng cả 通过 và 使 làm câu bị khuyết chủ ngữ.",
    tags: ["bệnh cú", "sửa lỗi", "HSK 6"],
  },
  {
    id: "g_hsk6_dapei",
    level: 6,
    pattern: "Phân tích kết hợp từ sai lệch (搭配不当)",
    name: "Sửa lỗi ngữ pháp 病句: Kết hợp từ không tương thích",
    explanation: "Động từ và tân ngữ hoặc phó từ và tính từ không thể đi kèm theo chuẩn văn phong bản xứ.",
    exampleChinese: "提高水平 (Đúng) vs 提高效率 (Đúng) vs 提高知识 (Sai ❌ → 应改为'丰富知识')",
    examplePinyin: "tígāo shuǐpíng vs fēngfù zhīshi",
    exampleVietnamese: "Lỗi kết hợp từ sai lệch thường gặp nhất trong đề thi HSK 6.",
    tags: ["kết hợp từ", "bản xứ", "HSK 6"],
  },
];

export function getGrammarByLevel(level: HSKLevel): GrammarPoint[] {
  return HSK_GRAMMAR_POINTS.filter((g) => g.level <= level);
}
