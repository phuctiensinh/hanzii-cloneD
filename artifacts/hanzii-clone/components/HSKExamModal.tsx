import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import colors from "@/constants/colors";
import { HSKExam, HSKQuestion } from "@/constants/hskExams";
import { useSpeech } from "@/hooks/useSpeech";

interface Props {
  visible: boolean;
  exam: HSKExam | null;
  onClose: () => void;
}

export function HSKExamModal({ visible, exam, onClose }: Props) {
  const { speak } = useSpeech();

  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [arrangedWords, setArrangedWords] = useState<Record<string, string[]>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showQuestionDrawer, setShowQuestionDrawer] = useState(false);

  // Timer interval ref
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset exam state on open
  useEffect(() => {
    if (visible && exam) {
      setCurrentSectionIdx(0);
      setCurrentQuestionIdx(0);
      setUserAnswers({});
      setArrangedWords({});
      setIsSubmitted(false);
      setShowQuestionDrawer(false);
      setTimeLeftSeconds(exam.durationMinutes * 60);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [visible, exam]);

  // Countdown timer logic
  useEffect(() => {
    if (visible && exam && !isSubmitted && timeLeftSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeftSeconds((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            handleSubmitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visible, exam, isSubmitted, timeLeftSeconds]);

  // Flatten all questions for navigation
  const allQuestions: { question: HSKQuestion; sectionTitle: string; index: number }[] = [];
  if (exam) {
    let globalIndex = 1;
    exam.sections.forEach((sec) => {
      sec.questions.forEach((q) => {
        allQuestions.push({ question: q, sectionTitle: sec.title, index: globalIndex++ });
      });
    });
  }

  const currentSection = exam?.sections[currentSectionIdx];
  const currentQuestion = currentSection?.questions[currentQuestionIdx];

  const handleSelectOption = (questionId: string, optionId: string) => {
    if (isSubmitted) return;
    setUserAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  };

  const handleArrangeWordTap = (questionId: string, word: string, availableWords: string[]) => {
    if (isSubmitted) return;
    setArrangedWords((prev) => {
      const current = prev[questionId] || [];
      const updated = current.includes(word)
        ? current.filter((w) => w !== word)
        : [...current, word];
      
      const sentence = updated.join("");
      setUserAnswers((answers) => ({ ...answers, [questionId]: sentence }));
      return { ...prev, [questionId]: updated };
    });
  };

  const handleSubmitExam = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsSubmitted(true);
  }, []);

  const confirmSubmit = () => {
    const answeredCount = Object.keys(userAnswers).length;
    const totalCount = allQuestions.length;

    if (answeredCount < totalCount) {
      Alert.alert(
        "Xác nhận nộp bài",
        `Bạn mới làm ${answeredCount}/${totalCount} câu. Bạn có chắc chắn muốn nộp bài ngay không?`,
        [
          { text: "Làm tiếp", style: "cancel" },
          { text: "Nộp bài", style: "destructive", onPress: handleSubmitExam },
        ]
      );
    } else {
      handleSubmitExam();
    }
  };

  // Calculate score results
  const calculateResult = () => {
    if (!exam) return { totalCorrect: 0, totalQuestions: 0, score: 0, maxScore: 200, passed: false };

    let totalCorrect = 0;
    allQuestions.forEach(({ question }) => {
      const answer = userAnswers[question.id];
      if (answer && answer === question.correctAnswer) {
        totalCorrect++;
      }
    });

    const totalQuestions = allQuestions.length;
    const score = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 200) : 0;
    const passed = score >= exam.passingScore;

    return { totalCorrect, totalQuestions, score, maxScore: 200, passed };
  };

  if (!visible || !exam) return null;

  const result = calculateResult();
  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  const timeFormatted = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
            <Feather name="x" size={22} color={colors.light.foreground} />
          </TouchableOpacity>

          <View style={styles.titleBox}>
            <Text style={styles.examTitle} numberOfLines={1}>
              {exam.title}
            </Text>
            <Text style={styles.examSubtitle}>HSK Cấp {exam.level}</Text>
          </View>

          {!isSubmitted ? (
            <View style={styles.timerBadge}>
              <Feather name="clock" size={14} color="#D32F2F" />
              <Text style={styles.timerText}>{timeFormatted}</Text>
            </View>
          ) : (
            <View style={[styles.timerBadge, { backgroundColor: "#E8F5E9" }]}>
              <Feather name="check-circle" size={14} color="#2E7D32" />
              <Text style={[styles.timerText, { color: "#2E7D32" }]}>Hoàn thành</Text>
            </View>
          )}
        </View>

        {/* Question Navigation Tabs */}
        {!isSubmitted && (
          <View style={styles.navBar}>
            <TouchableOpacity
              style={styles.gridToggleBtn}
              onPress={() => setShowQuestionDrawer(true)}
            >
              <Feather name="grid" size={16} color={colors.light.primary} />
              <Text style={styles.gridToggleText}>
                {Object.keys(userAnswers).length}/{allQuestions.length} Câu
              </Text>
            </TouchableOpacity>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sectionTabs}>
              {exam.sections.map((sec, sIdx) => (
                <TouchableOpacity
                  key={sec.id}
                  style={[
                    styles.sectionTab,
                    currentSectionIdx === sIdx && styles.sectionTabActive,
                  ]}
                  onPress={() => {
                    setCurrentSectionIdx(sIdx);
                    setCurrentQuestionIdx(0);
                  }}
                >
                  <Text
                    style={[
                      styles.sectionTabText,
                      currentSectionIdx === sIdx && styles.sectionTabTextActive,
                    ]}
                  >
                    {sec.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Main Body */}
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          {!isSubmitted ? (
            // ACTIVE TEST VIEW
            currentQuestion && currentSection ? (
              <View style={styles.questionCard}>
                {/* Section Header */}
                <View style={styles.sectionBanner}>
                  <Text style={styles.sectionBannerText}>{currentSection.title}</Text>
                  <Text style={styles.sectionInstruction}>{currentSection.instructions}</Text>
                </View>

                {/* Question Info */}
                <View style={styles.questionHeader}>
                  <Text style={styles.questionNumberText}>
                    Câu hỏi {currentQuestionIdx + 1} / {currentSection.questions.length}
                  </Text>
                  <Text style={styles.questionMainText}>{currentQuestion.questionText}</Text>
                  {!!currentQuestion.pinyinText && (
                    <Text style={styles.questionPinyin}>{currentQuestion.pinyinText}</Text>
                  )}
                </View>

                {/* Listening Audio Button */}
                {currentQuestion.type === "listening" && !!currentQuestion.audioText && (
                  <TouchableOpacity
                    style={styles.audioPlayBtn}
                    onPress={() => speak(currentQuestion.audioText!)}
                  >
                    <Feather name="volume-2" size={20} color="#FFFFFF" />
                    <Text style={styles.audioPlayBtnText}>Phát hội thoại nghe mẫu</Text>
                  </TouchableOpacity>
                )}

                {/* Reading Passage */}
                {!!currentQuestion.passage && (
                  <View style={styles.passageBox}>
                    <Text style={styles.passageTitle}>Đoạn văn đọc hiểu:</Text>
                    <Text style={styles.passageText}>{currentQuestion.passage}</Text>
                  </View>
                )}

                {/* Writing / Sentence Arrangement */}
                {currentQuestion.type === "writing" && currentQuestion.wordsToArrange && (
                  <View style={styles.arrangeSection}>
                    <Text style={styles.arrangeInstruction}>Bấm vào các từ bên dưới để sắp xếp câu:</Text>
                    <View style={styles.arrangedBox}>
                      {(arrangedWords[currentQuestion.id] || []).map((w, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={styles.arrangedChip}
                          onPress={() =>
                            handleArrangeWordTap(
                              currentQuestion.id,
                              w,
                              currentQuestion.wordsToArrange!
                            )
                          }
                        >
                          <Text style={styles.arrangedChipText}>{w}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <View style={styles.availableWordsBox}>
                      {currentQuestion.wordsToArrange.map((w, idx) => {
                        const selected = (arrangedWords[currentQuestion.id] || []).includes(w);
                        return (
                          <TouchableOpacity
                            key={idx}
                            disabled={selected}
                            style={[styles.availableWordChip, selected && styles.wordChipDisabled]}
                            onPress={() =>
                              handleArrangeWordTap(
                                currentQuestion.id,
                                w,
                                currentQuestion.wordsToArrange!
                              )
                            }
                          >
                            <Text style={[styles.wordChipText, selected && styles.wordTextDisabled]}>
                              {w}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Standard Options A, B, C, D */}
                {currentQuestion.options && currentQuestion.options.length > 0 && (
                  <View style={styles.optionsList}>
                    {currentQuestion.options.map((opt) => {
                      const isSelected = userAnswers[currentQuestion.id] === opt.id;
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          style={[
                            styles.optionCard,
                            isSelected && styles.optionCardSelected,
                          ]}
                          onPress={() => handleSelectOption(currentQuestion.id, opt.id)}
                          activeOpacity={0.8}
                        >
                          <View
                            style={[
                              styles.optionRadio,
                              isSelected && styles.optionRadioSelected,
                            ]}
                          >
                            <Text
                              style={[
                                styles.optionRadioText,
                                isSelected && styles.optionRadioTextSelected,
                              ]}
                            >
                              {opt.id}
                            </Text>
                          </View>
                          <View style={styles.optionContent}>
                            <Text
                              style={[
                                styles.optionText,
                                isSelected && styles.optionTextSelected,
                              ]}
                            >
                              {opt.text}
                            </Text>
                            {!!opt.pinyin && (
                              <Text style={styles.optionPinyin}>{opt.pinyin}</Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Prev / Next Question Controls */}
                <View style={styles.questionNavRow}>
                  <TouchableOpacity
                    disabled={currentQuestionIdx === 0 && currentSectionIdx === 0}
                    style={[
                      styles.questionNavBtn,
                      currentQuestionIdx === 0 && currentSectionIdx === 0 && styles.btnDisabled,
                    ]}
                    onPress={() => {
                      if (currentQuestionIdx > 0) {
                        setCurrentQuestionIdx((prev) => prev - 1);
                      } else if (currentSectionIdx > 0) {
                        setCurrentSectionIdx((prev) => prev - 1);
                        setCurrentQuestionIdx(exam.sections[currentSectionIdx - 1].questions.length - 1);
                      }
                    }}
                  >
                    <Feather name="chevron-left" size={18} color={colors.light.foreground} />
                    <Text style={styles.questionNavBtnText}>Câu trước</Text>
                  </TouchableOpacity>

                  {currentQuestionIdx < currentSection.questions.length - 1 ||
                  currentSectionIdx < exam.sections.length - 1 ? (
                    <TouchableOpacity
                      style={styles.questionNavBtnPrimary}
                      onPress={() => {
                        if (currentQuestionIdx < currentSection.questions.length - 1) {
                          setCurrentQuestionIdx((prev) => prev + 1);
                        } else if (currentSectionIdx < exam.sections.length - 1) {
                          setCurrentSectionIdx((prev) => prev + 1);
                          setCurrentQuestionIdx(0);
                        }
                      }}
                    >
                      <Text style={styles.questionNavBtnPrimaryText}>Câu tiếp theo</Text>
                      <Feather name="chevron-right" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity style={styles.submitExamBtn} onPress={confirmSubmit}>
                      <Feather name="check" size={18} color="#FFFFFF" />
                      <Text style={styles.submitExamBtnText}>Nộp bài ngay</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ) : null
          ) : (
            // EXAM RESULT VIEW & EXPLANATIONS
            <View style={styles.resultContainer}>
              <View
                style={[
                  styles.resultCard,
                  { borderColor: result.passed ? "#2E7D32" : "#D32F2F" },
                ]}
              >
                <View
                  style={[
                    styles.resultBadge,
                    { backgroundColor: result.passed ? "#E8F5E9" : "#FFEBEE" },
                  ]}
                >
                  <Feather
                    name={result.passed ? "award" : "alert-circle"}
                    size={32}
                    color={result.passed ? "#2E7D32" : "#D32F2F"}
                  />
                  <Text
                    style={[
                      styles.resultTitle,
                      { color: result.passed ? "#2E7D32" : "#D32F2F" },
                    ]}
                  >
                    {result.passed ? "Chúc mừng! Bạn đã ĐẠT HSK!" : "Chưa Đạt HSK - Cần Cố Gắng"}
                  </Text>
                </View>

                <View style={styles.scoreRow}>
                  <View style={styles.scoreItem}>
                    <Text style={styles.scoreItemNumber}>{result.score}</Text>
                    <Text style={styles.scoreItemLabel}>Tổng điểm / 200</Text>
                  </View>
                  <View style={styles.scoreDivider} />
                  <View style={styles.scoreItem}>
                    <Text style={styles.scoreItemNumber}>
                      {result.totalCorrect}/{result.totalQuestions}
                    </Text>
                    <Text style={styles.scoreItemLabel}>Câu trả lời đúng</Text>
                  </View>
                </View>
              </View>

              {/* Detailed Explanations Header */}
              <View style={styles.explanationHeaderBox}>
                <Feather name="book-open" size={20} color={colors.light.primary} />
                <Text style={styles.explanationHeaderTitle}>Đáp Án & Lời Giải Chi Tiết:</Text>
              </View>

              {/* Questions Detailed Breakdown List */}
              {allQuestions.map(({ question, sectionTitle, index }) => {
                const userAns = userAnswers[question.id];
                const isCorrect = userAns === question.correctAnswer;

                return (
                  <View
                    key={question.id}
                    style={[
                      styles.explanationCard,
                      isCorrect ? styles.cardCorrect : styles.cardIncorrect,
                    ]}
                  >
                    <View style={styles.explanationCardHeader}>
                      <Text style={styles.expNumberText}>
                        Câu {index} ({sectionTitle})
                      </Text>
                      <View
                        style={[
                          styles.expTag,
                          { backgroundColor: isCorrect ? "#E8F5E9" : "#FFEBEE" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.expTagText,
                            { color: isCorrect ? "#2E7D32" : "#D32F2F" },
                          ]}
                        >
                          {isCorrect ? "✓ Đúng" : "✗ Sai"}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.expQuestionText}>{question.questionText}</Text>
                    {!!question.pinyinText && (
                      <Text style={styles.expPinyinText}>{question.pinyinText}</Text>
                    )}

                    <View style={styles.expAnswerComparison}>
                      <Text style={styles.expUserAnswerText}>
                        Bạn chọn:{" "}
                        <Text style={{ fontWeight: "700", color: isCorrect ? "#2E7D32" : "#D32F2F" }}>
                          {userAns || "(Bỏ trống)"}
                        </Text>
                      </Text>
                      <Text style={styles.expCorrectAnswerText}>
                        Đáp án đúng: <Text style={{ fontWeight: "700", color: "#2E7D32" }}>{question.correctAnswer}</Text>
                      </Text>
                    </View>

                    {/* Detailed Explanation */}
                    <View style={styles.expNoteBox}>
                      <Text style={styles.expNoteTitle}>💡 Lời giải thích từ chuyên gia HSK:</Text>
                      <Text style={styles.expNoteContent}>{question.explanation}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Question Grid Modal / Drawer */}
        <Modal visible={showQuestionDrawer} transparent animationType="fade">
          <View style={styles.drawerOverlay}>
            <View style={styles.drawerCard}>
              <View style={styles.drawerHeader}>
                <Text style={styles.drawerTitle}>Bản Đồ Câu Hỏi</Text>
                <TouchableOpacity onPress={() => setShowQuestionDrawer(false)}>
                  <Feather name="x" size={20} color={colors.light.foreground} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.drawerGrid}>
                <View style={styles.gridRow}>
                  {allQuestions.map(({ question, index }) => {
                    const isAnswered = !!userAnswers[question.id];
                    return (
                      <TouchableOpacity
                        key={question.id}
                        style={[
                          styles.gridChip,
                          isAnswered && styles.gridChipAnswered,
                        ]}
                        onPress={() => {
                          setShowQuestionDrawer(false);
                          // Jump to section and question
                          exam.sections.forEach((sec, sIdx) => {
                            const qIdx = sec.questions.findIndex((q) => q.id === question.id);
                            if (qIdx !== -1) {
                              setCurrentSectionIdx(sIdx);
                              setCurrentQuestionIdx(qIdx);
                            }
                          });
                        }}
                      >
                        <Text
                          style={[
                            styles.gridChipText,
                            isAnswered && styles.gridChipTextAnswered,
                          ]}
                        >
                          {index}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 8,
  },
  titleBox: {
    flex: 1,
    paddingHorizontal: 12,
  },
  examTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: colors.light.foreground,
  },
  examSubtitle: {
    fontSize: 12,
    color: colors.light.mutedForeground,
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFEBEE",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  timerText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: "#D32F2F",
  },
  navBar: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  gridToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF5F5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  gridToggleText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: colors.light.primary,
  },
  sectionTabs: {
    flex: 1,
  },
  sectionTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6,
  },
  sectionTabActive: {
    backgroundColor: colors.light.primary,
  },
  sectionTabText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: colors.light.mutedForeground,
  },
  sectionTabTextActive: {
    color: "#FFFFFF",
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
    gap: 16,
  },
  questionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionBanner: {
    backgroundColor: "#FFF8F7",
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.light.primary,
    gap: 4,
  },
  sectionBannerText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: colors.light.primary,
  },
  sectionInstruction: {
    fontSize: 12,
    color: colors.light.mutedForeground,
  },
  questionHeader: {
    gap: 6,
  },
  questionNumberText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: colors.light.mutedForeground,
    textTransform: "uppercase",
  },
  questionMainText: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: colors.light.foreground,
    lineHeight: 26,
  },
  questionPinyin: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: colors.light.mutedForeground,
  },
  audioPlayBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.light.primary,
    borderRadius: 14,
    paddingVertical: 12,
  },
  audioPlayBtnText: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  passageBox: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  passageTitle: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: colors.light.mutedForeground,
  },
  passageText: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.light.foreground,
  },
  arrangeSection: {
    gap: 10,
  },
  arrangeInstruction: {
    fontSize: 13,
    color: colors.light.mutedForeground,
  },
  arrangedBox: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    minHeight: 48,
    backgroundColor: "#FFF8F7",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFCDD2",
    padding: 10,
  },
  arrangedChip: {
    backgroundColor: colors.light.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  arrangedChipText: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
  },
  availableWordsBox: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  availableWordChip: {
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  wordChipDisabled: {
    opacity: 0.3,
  },
  wordChipText: {
    fontFamily: "Inter_600SemiBold",
    color: colors.light.foreground,
  },
  wordTextDisabled: {
    color: colors.light.mutedForeground,
  },
  optionsList: {
    gap: 10,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
    gap: 12,
  },
  optionCardSelected: {
    borderColor: colors.light.primary,
    backgroundColor: "#FFF8F7",
  },
  optionRadio: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#B0B0B0",
    alignItems: "center",
    justifyContent: "center",
  },
  optionRadioSelected: {
    borderColor: colors.light.primary,
    backgroundColor: colors.light.primary,
  },
  optionRadioText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: colors.light.mutedForeground,
  },
  optionRadioTextSelected: {
    color: "#FFFFFF",
  },
  optionContent: {
    flex: 1,
    gap: 2,
  },
  optionText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: colors.light.foreground,
  },
  optionTextSelected: {
    color: colors.light.primary,
  },
  optionPinyin: {
    fontSize: 12,
    color: colors.light.mutedForeground,
  },
  questionNavRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    gap: 12,
  },
  questionNavBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F0F0F0",
  },
  btnDisabled: {
    opacity: 0.4,
  },
  questionNavBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: colors.light.foreground,
  },
  questionNavBtnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.light.primary,
  },
  questionNavBtnPrimaryText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  submitExamBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#2E7D32",
  },
  submitExamBtnText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  resultContainer: {
    gap: 16,
  },
  resultCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    alignItems: "center",
    gap: 16,
  },
  resultBadge: {
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    width: "100%",
    gap: 8,
  },
  resultTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    justifyContent: "space-around",
  },
  scoreItem: {
    alignItems: "center",
  },
  scoreItemNumber: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: colors.light.foreground,
  },
  scoreItemLabel: {
    fontSize: 12,
    color: colors.light.mutedForeground,
  },
  scoreDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E0E0E0",
  },
  explanationHeaderBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  explanationHeaderTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: colors.light.foreground,
  },
  explanationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  cardCorrect: {
    borderColor: "#C8E6C9",
  },
  cardIncorrect: {
    borderColor: "#FFCDD2",
  },
  explanationCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  expNumberText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: colors.light.foreground,
  },
  expTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  expTagText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  expQuestionText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: colors.light.foreground,
  },
  expPinyinText: {
    fontSize: 13,
    color: colors.light.mutedForeground,
  },
  expAnswerComparison: {
    backgroundColor: "#F9F9F9",
    padding: 10,
    borderRadius: 10,
    gap: 4,
  },
  expUserAnswerText: {
    fontSize: 13,
    color: colors.light.foreground,
  },
  expCorrectAnswerText: {
    fontSize: 13,
    color: colors.light.foreground,
  },
  expNoteBox: {
    backgroundColor: "#FFF8F7",
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.light.primary,
    gap: 4,
  },
  expNoteTitle: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: colors.light.primary,
  },
  expNoteContent: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.light.foreground,
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  drawerCard: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "70%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    gap: 14,
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  drawerTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: colors.light.foreground,
  },
  drawerGrid: {
    flex: 1,
  },
  gridRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  gridChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  gridChipAnswered: {
    backgroundColor: colors.light.primary,
  },
  gridChipText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: colors.light.foreground,
  },
  gridChipTextAnswered: {
    color: "#FFFFFF",
  },
});
