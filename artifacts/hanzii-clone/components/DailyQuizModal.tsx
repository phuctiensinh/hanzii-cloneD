import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import colors from "@/constants/colors";
import { HSK_WORDS } from "@/constants/data";
import { useSpeech } from "@/hooks/useSpeech";

interface Props {
  visible: boolean;
  onClose: () => void;
}

interface QuizQuestion {
  id: string;
  word: string;
  pinyin: string;
  meaning: string;
  options: string[];
  correctOption: string;
  exampleSentence?: string;
  examplePinyin?: string;
  exampleVietnamese?: string;
}

export function DailyQuizModal({ visible, onClose }: Props) {
  const { speak } = useSpeech();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [isFinished, setIsFinished] = useState(false);

  // Generate 5 random questions
  useEffect(() => {
    if (visible) {
      setCurrentIdx(0);
      setSelectedAnswers({});
      setIsFinished(false);

      const shuffled = [...HSK_WORDS].sort(() => 0.5 - Math.random());
      const selectedWords = shuffled.slice(0, 5);

      const generated: QuizQuestion[] = selectedWords.map((w, idx) => {
        const distractors = HSK_WORDS.filter((item) => item.id !== w.id)
          .sort(() => 0.5 - Math.random())
          .slice(0, 3)
          .map((item) => item.meaning);

        const options = [...distractors, w.meaning].sort(() => 0.5 - Math.random());
        const eg = w.examples && w.examples.length > 0 ? w.examples[0] : undefined;

        return {
          id: `${w.id}-${idx}`,
          word: w.character,
          pinyin: w.pinyin,
          meaning: w.meaning,
          options,
          correctOption: w.meaning,
          exampleSentence: eg?.chinese,
          examplePinyin: eg?.pinyin,
          exampleVietnamese: eg?.vietnamese,
        };
      });

      setQuestions(generated);
    }
  }, [visible]);

  const handleSelectOption = (opt: string) => {
    if (isFinished) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentIdx]: opt }));
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctOption) {
        score++;
      }
    });
    return score;
  };

  if (!visible || questions.length === 0) return null;

  const currentQ = questions[currentIdx];
  const userChoice = selectedAnswers[currentIdx];
  const hasChosen = !!userChoice;
  const totalCorrect = calculateScore();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Feather name="zap" size={20} color="#ED6C02" />
              <Text style={styles.headerTitle}>Thử Thách Nhanh 5 Phút</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={colors.light.mutedForeground} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {!isFinished ? (
              <View style={styles.quizBox}>
                {/* Progress bar */}
                <View style={styles.progressRow}>
                  <Text style={styles.progressText}>
                    Câu {currentIdx + 1} / {questions.length}
                  </Text>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${((currentIdx + 1) / questions.length) * 100}%` },
                      ]}
                    />
                  </View>
                </View>

                {/* Question Card */}
                <View style={styles.wordCard}>
                  <Text style={styles.wordText}>{currentQ.word}</Text>
                  <Text style={styles.pinyinText}>{currentQ.pinyin}</Text>

                  <TouchableOpacity
                    style={styles.speakerBtn}
                    onPress={() => speak(currentQ.word)}
                  >
                    <Feather name="volume-2" size={16} color={colors.light.primary} />
                    <Text style={styles.speakerBtnText}>Nghe phát âm</Text>
                  </TouchableOpacity>
                </View>

                {/* Options List */}
                <View style={styles.optionsList}>
                  {currentQ.options.map((opt, oIdx) => {
                    const isSelected = userChoice === opt;
                    const isCorrectAnswer = opt === currentQ.correctOption;

                    let btnStyle = [styles.optionBtn];
                    let textStyle = [styles.optionText];
                    let badgeText = null;
                    let badgeColor = "";
                    let badgeBg = "";

                    if (hasChosen) {
                      if (isCorrectAnswer) {
                        btnStyle.push(styles.optionBtnCorrect as any);
                        textStyle.push(styles.optionTextCorrect as any);
                        badgeText = "✓ Đáp án đúng";
                        badgeColor = "#2E7D32";
                        badgeBg = "#E8F5E9";
                      } else if (isSelected && !isCorrectAnswer) {
                        btnStyle.push(styles.optionBtnIncorrect as any);
                        textStyle.push(styles.optionTextIncorrect as any);
                        badgeText = "✗ Bạn đã chọn";
                        badgeColor = "#D32F2F";
                        badgeBg = "#FFEBEE";
                      }
                    } else if (isSelected) {
                      btnStyle.push(styles.optionBtnSelected as any);
                      textStyle.push(styles.optionTextSelected as any);
                    }

                    return (
                      <TouchableOpacity
                        key={oIdx}
                        style={btnStyle}
                        onPress={() => handleSelectOption(opt)}
                        activeOpacity={0.8}
                      >
                        <Text style={textStyle}>{opt}</Text>
                        {badgeText && (
                          <View style={[styles.badgeTag, { backgroundColor: badgeBg }]}>
                            <Text style={[styles.badgeTagText, { color: badgeColor }]}>
                              {badgeText}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Instant Explanation Box when option is clicked */}
                {hasChosen && (
                  <View style={styles.explanationBox}>
                    <View style={styles.expHeader}>
                      <Feather name="info" size={16} color={colors.light.primary} />
                      <Text style={styles.expHeaderTitle}>
                        Nghĩa đúng:{" "}
                        <Text style={{ color: "#2E7D32", fontFamily: "Inter_700Bold" }}>
                          {currentQ.correctOption}
                        </Text>
                      </Text>
                    </View>
                    <Text style={styles.expText}>
                      Chữ Hán <Text style={{ fontWeight: "700" }}>{currentQ.word}</Text> ({currentQ.pinyin}) có nghĩa chính xác là "{currentQ.correctOption}".
                    </Text>

                    {!!currentQ.exampleSentence && (
                      <View style={styles.egBox}>
                        <Text style={styles.egTitle}>Ví dụ đặt câu:</Text>
                        <Text style={styles.egChinese}>{currentQ.exampleSentence}</Text>
                        {!!currentQ.examplePinyin && (
                          <Text style={styles.egPinyin}>{currentQ.examplePinyin}</Text>
                        )}
                        {!!currentQ.exampleVietnamese && (
                          <Text style={styles.egVietnamese}>👉 {currentQ.exampleVietnamese}</Text>
                        )}
                      </View>
                    )}
                  </View>
                )}

                <TouchableOpacity
                  disabled={!hasChosen}
                  style={[styles.nextBtn, !hasChosen && styles.nextBtnDisabled]}
                  onPress={handleNext}
                >
                  <Text style={styles.nextBtnText}>
                    {currentIdx < questions.length - 1 ? "Câu tiếp theo" : "Xem tổng kết điểm"}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Results View & Detailed Review List
              <View style={styles.resultBox}>
                <View style={styles.badgeBox}>
                  <Feather name="award" size={48} color="#ED6C02" />
                  <Text style={styles.resultTitle}>Hoàn Thành Thử Thách 5 Phút! 🎉</Text>
                  <Text style={styles.resultSubtitle}>
                    Bạn đã trả lời đúng {totalCorrect}/{questions.length} câu từ vựng!
                  </Text>
                </View>

                <View style={styles.streakBox}>
                  <Feather name="zap" size={24} color="#D32F2F" />
                  <Text style={styles.streakText}>
                    Đã cộng điểm tích lũy chuỗi học hằng ngày (Daily Streak)!
                  </Text>
                </View>

                {/* Answer Review Section */}
                <View style={styles.reviewSection}>
                  <Text style={styles.reviewSectionTitle}>
                    Xem lại đáp án 5 câu vừa ôn tập:
                  </Text>

                  {questions.map((q, idx) => {
                    const ans = selectedAnswers[idx];
                    const isOk = ans === q.correctOption;

                    return (
                      <View
                        key={q.id}
                        style={[
                          styles.reviewCard,
                          { borderColor: isOk ? "#C8E6C9" : "#FFCDD2" },
                        ]}
                      >
                        <View style={styles.reviewCardHeader}>
                          <Text style={styles.reviewNumber}>Câu {idx + 1}: {q.word} ({q.pinyin})</Text>
                          <View
                            style={[
                              styles.reviewTag,
                              { backgroundColor: isOk ? "#E8F5E9" : "#FFEBEE" },
                            ]}
                          >
                            <Text
                              style={[
                                styles.reviewTagText,
                                { color: isOk ? "#2E7D32" : "#D32F2F" },
                              ]}
                            >
                              {isOk ? "✓ Đúng" : "✗ Sai"}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.reviewText}>
                          Bạn chọn:{" "}
                          <Text style={{ fontWeight: "700", color: isOk ? "#2E7D32" : "#D32F2F" }}>
                            {ans || "(Chưa chọn)"}
                          </Text>
                        </Text>
                        <Text style={styles.reviewCorrectText}>
                          Đáp án đúng: <Text style={{ fontWeight: "700", color: "#2E7D32" }}>{q.correctOption}</Text>
                        </Text>
                      </View>
                    );
                  })}
                </View>

                <TouchableOpacity style={styles.finishBtn} onPress={onClose}>
                  <Text style={styles.finishBtnText}>Tuyệt vời! Đóng lại</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 460,
    maxHeight: "85%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: colors.light.foreground,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 20,
  },
  quizBox: {
    gap: 16,
  },
  progressRow: {
    gap: 6,
  },
  progressText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: colors.light.mutedForeground,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "#F0F0F0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#ED6C02",
  },
  wordCard: {
    backgroundColor: "#FFF8F7",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFCDD2",
    gap: 6,
  },
  wordText: {
    fontSize: 36,
    fontFamily: "Inter_700Bold",
    color: colors.light.primary,
  },
  pinyinText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: colors.light.foreground,
  },
  speakerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  speakerBtnText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: colors.light.primary,
  },
  optionsList: {
    gap: 10,
  },
  optionBtn: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
  },
  optionBtnSelected: {
    borderColor: "#ED6C02",
    backgroundColor: "#FFF3E0",
  },
  optionBtnCorrect: {
    borderColor: "#2E7D32",
    backgroundColor: "#E8F5E9",
  },
  optionBtnIncorrect: {
    borderColor: "#D32F2F",
    backgroundColor: "#FFEBEE",
  },
  optionText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: colors.light.foreground,
    flex: 1,
  },
  optionTextSelected: {
    color: "#ED6C02",
  },
  optionTextCorrect: {
    color: "#2E7D32",
    fontFamily: "Inter_700Bold",
  },
  optionTextIncorrect: {
    color: "#D32F2F",
    fontFamily: "Inter_700Bold",
  },
  badgeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeTagText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  explanationBox: {
    backgroundColor: "#FFF8F7",
    borderRadius: 16,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: colors.light.primary,
    gap: 6,
  },
  expHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  expHeaderTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: colors.light.foreground,
  },
  expText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.light.foreground,
  },
  egBox: {
    marginTop: 4,
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 10,
    gap: 2,
  },
  egTitle: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: colors.light.mutedForeground,
  },
  egChinese: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: colors.light.primary,
  },
  egPinyin: {
    fontSize: 12,
    color: colors.light.mutedForeground,
  },
  egVietnamese: {
    fontSize: 12,
    color: colors.light.foreground,
    marginTop: 2,
  },
  nextBtn: {
    backgroundColor: "#ED6C02",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 6,
  },
  nextBtnDisabled: {
    opacity: 0.4,
  },
  nextBtnText: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  resultBox: {
    alignItems: "center",
    paddingVertical: 10,
    gap: 16,
  },
  badgeBox: {
    alignItems: "center",
    gap: 8,
  },
  resultTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: colors.light.foreground,
    textAlign: "center",
  },
  resultSubtitle: {
    fontSize: 15,
    color: colors.light.mutedForeground,
    textAlign: "center",
  },
  streakBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
  },
  streakText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#D32F2F",
  },
  reviewSection: {
    width: "100%",
    gap: 10,
  },
  reviewSectionTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: colors.light.foreground,
  },
  reviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    gap: 4,
  },
  reviewCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reviewNumber: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: colors.light.foreground,
  },
  reviewTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  reviewTagText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  reviewText: {
    fontSize: 13,
    color: colors.light.foreground,
  },
  reviewCorrectText: {
    fontSize: 13,
    color: colors.light.foreground,
  },
  finishBtn: {
    backgroundColor: colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    width: "100%",
    alignItems: "center",
  },
  finishBtnText: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
});
