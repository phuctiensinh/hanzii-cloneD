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

        return {
          id: `${w.id}-${idx}`,
          word: w.character,
          pinyin: w.pinyin,
          meaning: w.meaning,
          options,
          correctOption: w.meaning,
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
                    const isSelected = selectedAnswers[currentIdx] === opt;
                    return (
                      <TouchableOpacity
                        key={oIdx}
                        style={[
                          styles.optionBtn,
                          isSelected && styles.optionBtnSelected,
                        ]}
                        onPress={() => handleSelectOption(opt)}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            isSelected && styles.optionTextSelected,
                          ]}
                        >
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity
                  disabled={!selectedAnswers[currentIdx]}
                  style={[
                    styles.nextBtn,
                    !selectedAnswers[currentIdx] && styles.nextBtnDisabled,
                  ]}
                  onPress={handleNext}
                >
                  <Text style={styles.nextBtnText}>
                    {currentIdx < questions.length - 1 ? "Câu tiếp theo" : "Xem kết quả"}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Results View
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
                    Đã duy trì chuỗi học hằng ngày (Daily Streak)!
                  </Text>
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
    maxWidth: 440,
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
  optionText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: colors.light.foreground,
    textAlign: "center",
  },
  optionTextSelected: {
    color: "#ED6C02",
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
    paddingVertical: 20,
    gap: 20,
  },
  badgeBox: {
    alignItems: "center",
    gap: 10,
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
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#D32F2F",
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
