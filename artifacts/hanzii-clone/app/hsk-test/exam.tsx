import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import colors from "@/constants/colors";
import { HSK_LEVEL_METAS } from "@/constants/examConfig";
import { HSKExam, HSKQuestion } from "@/types/hskExam";
import { HSKStorage } from "@/lib/hsk/storage";
import { ScoreEngine } from "@/lib/hsk/ScoreEngine";
import { useSpeech } from "@/hooks/useSpeech";

export default function HSKExamRoomScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const { speak } = useSpeech();

  const [exam, setExam] = useState<HSKExam | null>(null);
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [flaggedIds, setFlaggedIds] = useState<string[]>([]);
  const [arrangedWords, setArrangedWords] = useState<Record<string, string[]>>({});
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showNavigatorSheet, setShowNavigatorSheet] = useState(false);
  const [startTimeMs] = useState(Date.now());

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load exam from autosave
  useEffect(() => {
    HSKStorage.getAutoSave().then((saved) => {
      if (saved && saved.exam) {
        setExam(saved.exam);
        setCurrentSectionIdx(saved.currentSectionIdx || 0);
        setCurrentQuestionIdx(saved.currentQuestionIdx || 0);
        setUserAnswers(saved.userAnswers || {});
        setFlaggedIds(saved.flaggedQuestionIds || []);
        setRemainingSeconds(saved.remainingSeconds > 0 ? saved.remainingSeconds : saved.exam.durationMinutes * 60);
      } else {
        Alert.alert("Không tìm thấy đề thi", "Vui lòng chọn cấp độ và tạo đề mới.", [
          { text: "Đồng ý", onPress: () => router.replace("/hsk-test" as any) },
        ]);
      }
    });
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!exam || exam.mode === "practice" || remainingSeconds <= 0) return;

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [exam]);

  // Periodic autosave
  useEffect(() => {
    if (!exam) return;
    HSKStorage.saveAutoSave({
      exam,
      currentSectionIdx,
      currentQuestionIdx,
      userAnswers,
      flaggedQuestionIds: flaggedIds,
      remainingSeconds,
      lastUpdated: new Date().toISOString(),
    });
  }, [exam, currentSectionIdx, currentQuestionIdx, userAnswers, flaggedIds, remainingSeconds]);

  // Flatten questions for global navigation
  const flatQuestions: {
    question: HSKQuestion;
    sectionIdx: number;
    questionIdx: number;
    globalIndex: number;
  }[] = [];

  if (exam) {
    let gIdx = 1;
    exam.sections.forEach((sec, sIdx) => {
      sec.questions.forEach((q, qIdx) => {
        flatQuestions.push({
          question: q,
          sectionIdx: sIdx,
          questionIdx: qIdx,
          globalIndex: gIdx++,
        });
      });
    });
  }

  const currentSection = exam?.sections[currentSectionIdx];
  const currentQuestion = currentSection?.questions[currentQuestionIdx];

  const currentFlat = flatQuestions.find(
    (f) => f.sectionIdx === currentSectionIdx && f.questionIdx === currentQuestionIdx
  );
  const currentGlobalNumber = currentFlat?.globalIndex || 1;
  const totalQuestionsCount = flatQuestions.length;

  // Answer selection
  const handleSelectOption = (optionId: string) => {
    if (!currentQuestion) return;
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionId,
    }));
  };

  // Sentence reorder click
  const handleWordChipTap = (word: string) => {
    if (!currentQuestion) return;
    setArrangedWords((prev) => {
      const current = prev[currentQuestion.id] || [];
      const updated = current.includes(word)
        ? current.filter((w) => w !== word)
        : [...current, word];

      const sentence = updated.join("");
      setUserAnswers((ans) => ({ ...ans, [currentQuestion.id]: sentence }));
      return { ...prev, [currentQuestion.id]: updated };
    });
  };

  // Flag toggle
  const toggleFlag = (qId: string) => {
    setFlaggedIds((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
    );
  };

  // Play audio
  const handlePlayAudio = () => {
    if (!currentQuestion?.audioText) return;
    setIsPlayingAudio(true);
    speak(currentQuestion.audioText);
    setTimeout(() => setIsPlayingAudio(false), 3500);
  };

  // Navigation handlers
  const handleGoToQuestion = (sIdx: number, qIdx: number) => {
    setCurrentSectionIdx(sIdx);
    setCurrentQuestionIdx(qIdx);
    setShowNavigatorSheet(false);
  };

  const handleNext = () => {
    if (!currentSection || !exam) return;
    if (currentQuestionIdx < currentSection.questions.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    } else if (currentSectionIdx < exam.sections.length - 1) {
      setCurrentSectionIdx(currentSectionIdx + 1);
      setCurrentQuestionIdx(0);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(currentQuestionIdx - 1);
    } else if (currentSectionIdx > 0 && exam) {
      const prevSec = exam.sections[currentSectionIdx - 1];
      setCurrentSectionIdx(currentSectionIdx - 1);
      setCurrentQuestionIdx(prevSec.questions.length - 1);
    }
  };

  // Keyboard navigation on web
  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNext();
      else if (e.key === "ArrowLeft") handlePrev();
      else if (e.key === "1" || e.key === "a" || e.key === "A") handleSelectOption("A");
      else if (e.key === "2" || e.key === "b" || e.key === "B") handleSelectOption("B");
      else if (e.key === "3" || e.key === "c" || e.key === "C") handleSelectOption("C");
      else if (e.key === "4" || e.key === "d" || e.key === "D") handleSelectOption("D");
      else if (e.key === "m" || e.key === "M") {
        if (currentQuestion) toggleFlag(currentQuestion.id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentQuestion, currentSectionIdx, currentQuestionIdx, exam]);

  // Submit Exam
  const submitExam = useCallback(async () => {
    if (!exam) return;

    if (timerRef.current) clearInterval(timerRef.current);
    const timeSpent = Math.max(1, Math.round((Date.now() - startTimeMs) / 1000));

    const result = ScoreEngine.calculateResult({
      exam,
      userAnswers,
      timeSpentSeconds: timeSpent,
      flaggedQuestionIds: flaggedIds,
    });

    await HSKStorage.saveResult(result);
    await HSKStorage.clearAutoSave();

    router.replace({
      pathname: `/hsk-test/result/${exam.id}` as any,
    });
  }, [exam, userAnswers, flaggedIds, startTimeMs]);

  const handleAutoSubmit = () => {
    setShowSubmitModal(false);
    Alert.alert("Hết giờ làm bài", "Thời gian làm bài thi đã kết thúc. Hệ thống đang tự động nộp bài!", [
      { text: "Xem kết quả", onPress: submitExam },
    ]);
  };

  // Timer format (HH:MM:SS)
  const formatTimer = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const timerWarning = remainingSeconds < 600 && remainingSeconds > 60;
  const timerAlert = remainingSeconds <= 60 && remainingSeconds > 0;

  const answeredCount = Object.keys(userAnswers).length;
  const unansweredCount = Math.max(0, totalQuestionsCount - answeredCount);

  if (!exam || !currentQuestion) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.loadingText}>Đang tải đề thi...</Text>
      </View>
    );
  }

  const levelMeta = HSK_LEVEL_METAS[exam.level];

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      {/* 1. STICKY TOP EXAM HEADER */}
      <View style={styles.examHeader}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.exitBtn}
            onPress={() => {
              Alert.alert(
                "Tạm dừng bài thi",
                "Tiến độ làm bài đã được tự động lưu. Bạn có chắc muốn thoát phòng thi?",
                [
                  { text: "Tiếp tục làm", style: "cancel" },
                  { text: "Thoát ra ngoài", onPress: () => router.replace("/hsk-test" as any) },
                ]
              );
            }}
          >
            <Feather name="x" size={18} color="#4B5563" />
          </TouchableOpacity>
          <View style={[styles.hskBadge, { backgroundColor: levelMeta.badgeColor }]}>
            <Text style={styles.hskBadgeText}>HSK {exam.level}</Text>
          </View>
          <View style={styles.sectionHeaderInfo}>
            <Text style={styles.sectionTitleText} numberOfLines={1}>{currentSection?.title}</Text>
            <Text style={styles.questionCounterText}>
              Câu {currentGlobalNumber}/{totalQuestionsCount}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {exam.mode !== "practice" && (
            <View style={[styles.timerPill, timerWarning && styles.timerPillWarning, timerAlert && styles.timerPillAlert]}>
              <Feather name="clock" size={14} color={timerAlert ? "#DC2626" : timerWarning ? "#D97706" : "#374151"} />
              <Text style={[styles.timerText, timerWarning && styles.timerTextWarning, timerAlert && styles.timerTextAlert]}>
                {formatTimer(remainingSeconds)}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.drawerToggleBtn}
            onPress={() => setShowNavigatorSheet(true)}
          >
            <Feather name="grid" size={16} color="#374151" />
            <Text style={styles.drawerToggleText}>{answeredCount}/{totalQuestionsCount}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. MAIN EXAM BODY (Desktop split: Left Question, Right Navigator) */}
      <View style={styles.mainLayout}>
        <ScrollView style={styles.questionArea} contentContainerStyle={styles.questionContent} showsVerticalScrollIndicator={false}>
          {/* Instructions */}
          <View style={styles.instructionBox}>
            <Text style={styles.instructionText}>{currentSection?.instructions}</Text>
          </View>

          {/* Reading Passage if available */}
          {(currentQuestion.passage || currentSection?.passage) && (
            <View style={styles.passageCard}>
              <Text style={styles.passageLabel}>Đoạn văn đọc hiểu:</Text>
              <Text style={styles.passageText}>{currentQuestion.passage || currentSection?.passage}</Text>
            </View>
          )}

          {/* Listening Audio Player */}
          {currentQuestion.section === "listening" && currentQuestion.audioText && (
            <View style={styles.audioPlayerCard}>
              <TouchableOpacity
                style={[styles.audioPlayBtn, isPlayingAudio && styles.audioPlayBtnActive]}
                onPress={handlePlayAudio}
                activeOpacity={0.8}
              >
                <Feather name={isPlayingAudio ? "volume-2" : "volume-1"} size={18} color="#FFFFFF" />
                <Text style={styles.audioPlayBtnText}>
                  {isPlayingAudio ? "Đang phát đoạn nghe..." : "Nghe hội thoại"}
                </Text>
              </TouchableOpacity>
              <Text style={styles.audioHintText}>Bấm để nghe đoạn ghi âm giọng đọc chuẩn</Text>
            </View>
          )}

          {/* Question Text */}
          <View style={styles.questionTextCard}>
            <View style={styles.questionTextHeader}>
              <Text style={styles.questionNumberBadge}>Câu {currentGlobalNumber}</Text>
              <TouchableOpacity
                style={[styles.flagBtn, flaggedIds.includes(currentQuestion.id) && styles.flagBtnActive]}
                onPress={() => toggleFlag(currentQuestion.id)}
              >
                <Feather
                  name="bookmark"
                  size={14}
                  color={flaggedIds.includes(currentQuestion.id) ? "#C62828" : "#9CA3AF"}
                />
                <Text
                  style={[
                    styles.flagBtnText,
                    flaggedIds.includes(currentQuestion.id) && styles.flagBtnTextActive,
                  ]}
                >
                  {flaggedIds.includes(currentQuestion.id) ? "Đã đánh dấu" : "Đánh dấu"}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.questionText}>{currentQuestion.questionText}</Text>
            {currentQuestion.pinyinText ? (
              <Text style={styles.pinyinText}>{currentQuestion.pinyinText}</Text>
            ) : null}
          </View>

          {/* Writing: Words to arrange interactive chips */}
          {currentQuestion.wordsToArrange && currentQuestion.wordsToArrange.length > 0 && (
            <View style={styles.arrangeCard}>
              <Text style={styles.arrangeInstruction}>Bấm vào từng từ theo đúng trật tự câu:</Text>
              
              {/* Output arranged box */}
              <View style={styles.arrangeOutputBox}>
                {(arrangedWords[currentQuestion.id] || []).length === 0 ? (
                  <Text style={styles.arrangePlaceholder}>Câu của bạn sẽ xuất hiện ở đây...</Text>
                ) : (
                  <View style={styles.chipRow}>
                    {(arrangedWords[currentQuestion.id] || []).map((w, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.selectedChip}
                        onPress={() => handleWordChipTap(w)}
                      >
                        <Text style={styles.selectedChipText}>{w}</Text>
                        <Feather name="x" size={12} color="#FFFFFF" />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Available word chips pool */}
              <View style={styles.chipPool}>
                {currentQuestion.wordsToArrange.map((w, idx) => {
                  const isUsed = (arrangedWords[currentQuestion.id] || []).includes(w);
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.poolChip, isUsed && styles.poolChipUsed]}
                      onPress={() => handleWordChipTap(w)}
                      disabled={isUsed}
                    >
                      <Text style={[styles.poolChipText, isUsed && styles.poolChipTextUsed]}>{w}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Multiple Choice Options (A, B, C, D) */}
          <View style={styles.optionsList}>
            {currentQuestion.options.map((opt) => {
              const isSelected = userAnswers[currentQuestion.id] === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.optionBtn, isSelected && styles.optionBtnSelected]}
                  onPress={() => handleSelectOption(opt.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.optionIdBox, isSelected && styles.optionIdBoxSelected]}>
                    <Text style={[styles.optionIdText, isSelected && styles.optionIdTextSelected]}>
                      {opt.id}
                    </Text>
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                      {opt.text}
                    </Text>
                    {opt.pinyin ? <Text style={styles.optionPinyin}>{opt.pinyin}</Text> : null}
                  </View>
                  {isSelected && <Feather name="check" size={18} color={colors.light.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Desktop Sidebar Navigator */}
        {Platform.OS === "web" && (
          <View style={styles.desktopSidebar}>
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>Danh sách câu hỏi</Text>
              <Text style={styles.sidebarSub}>{answeredCount}/{totalQuestionsCount} đã làm</Text>
            </View>

            <ScrollView style={styles.sidebarScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.gridNav}>
                {flatQuestions.map((item) => {
                  const isCurrent =
                    item.sectionIdx === currentSectionIdx && item.questionIdx === currentQuestionIdx;
                  const isAnswered = !!userAnswers[item.question.id];
                  const isFlagged = flaggedIds.includes(item.question.id);

                  return (
                    <TouchableOpacity
                      key={item.question.id}
                      style={[
                        styles.navTile,
                        isAnswered && styles.navTileAnswered,
                        isFlagged && styles.navTileFlagged,
                        isCurrent && styles.navTileCurrent,
                      ]}
                      onPress={() => handleGoToQuestion(item.sectionIdx, item.questionIdx)}
                    >
                      <Text
                        style={[
                          styles.navTileText,
                          isAnswered && styles.navTileTextAnswered,
                          isCurrent && styles.navTileTextCurrent,
                        ]}
                      >
                        {item.globalIndex}
                      </Text>
                      {isFlagged && <View style={styles.flagDot} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.sidebarSubmitBtn} onPress={() => setShowSubmitModal(true)}>
              <Text style={styles.sidebarSubmitText}>Nộp Bài Thi</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 3. BOTTOM CONTROL BAR */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.navBtn, currentGlobalNumber === 1 && styles.navBtnDisabled]}
          onPress={handlePrev}
          disabled={currentGlobalNumber === 1}
        >
          <Feather name="arrow-left" size={18} color="#374151" />
          <Text style={styles.navBtnText}>Câu trước</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.submitActionBtn} onPress={() => setShowSubmitModal(true)}>
          <Text style={styles.submitActionText}>Nộp bài ({answeredCount}/{totalQuestionsCount})</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navBtn, currentGlobalNumber === totalQuestionsCount && styles.navBtnDisabled]}
          onPress={handleNext}
          disabled={currentGlobalNumber === totalQuestionsCount}
        >
          <Text style={styles.navBtnText}>Câu tiếp</Text>
          <Feather name="arrow-right" size={18} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* MOBILE BOTTOM SHEET QUESTION NAVIGATOR */}
      <Modal visible={showNavigatorSheet} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.sheetContainer}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Bảng câu hỏi</Text>
                <Text style={styles.sheetSub}>Đã làm {answeredCount}/{totalQuestionsCount} câu</Text>
              </View>
              <TouchableOpacity onPress={() => setShowNavigatorSheet(false)} style={styles.sheetCloseBtn}>
                <Feather name="x" size={20} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.sheetGrid}>
              {flatQuestions.map((item) => {
                const isCurrent =
                  item.sectionIdx === currentSectionIdx && item.questionIdx === currentQuestionIdx;
                const isAnswered = !!userAnswers[item.question.id];
                const isFlagged = flaggedIds.includes(item.question.id);

                return (
                  <TouchableOpacity
                    key={item.question.id}
                    style={[
                      styles.sheetTile,
                      isAnswered && styles.navTileAnswered,
                      isFlagged && styles.navTileFlagged,
                      isCurrent && styles.navTileCurrent,
                    ]}
                    onPress={() => handleGoToQuestion(item.sectionIdx, item.questionIdx)}
                  >
                    <Text
                      style={[
                        styles.navTileText,
                        isAnswered && styles.navTileTextAnswered,
                        isCurrent && styles.navTileTextCurrent,
                      ]}
                    >
                      {item.globalIndex}
                    </Text>
                    {isFlagged && <View style={styles.flagDot} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* SUBMIT CONFIRMATION MODAL */}
      <Modal visible={showSubmitModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmBox}>
            <View style={styles.confirmIconWrap}>
              <Feather name="check-circle" size={28} color={colors.light.primary} />
            </View>
            <Text style={styles.confirmTitle}>Xác nhận nộp bài thi?</Text>
            {unansweredCount > 0 ? (
              <Text style={styles.confirmSub}>
                Bạn vẫn còn <Text style={styles.highlightText}>{unansweredCount} câu chưa trả lời</Text>. Bạn có chắc chắn muốn kết thúc bài thi không?
              </Text>
            ) : (
              <Text style={styles.confirmSub}>
                Bạn đã hoàn thành đầy đủ tất cả các câu hỏi. Bấm nộp bài để xem điểm và phân tích chi tiết.
              </Text>
            )}

            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.continueBtn} onPress={() => setShowSubmitModal(false)}>
                <Text style={styles.continueBtnText}>Tiếp tục làm bài</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitFinalBtn} onPress={submitExam}>
                <Text style={styles.submitFinalText}>Nộp bài ngay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  center: { justifyContent: "center", alignItems: "center" },
  loadingText: { fontSize: 14, color: "#6B7280" },

  // Header
  examHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  exitBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  hskBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  hskBadgeText: { color: "#FFFFFF", fontSize: 11, fontFamily: "Inter_700Bold" },
  sectionHeaderInfo: { flex: 1 },
  sectionTitleText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#111827" },
  questionCounterText: { fontSize: 11, color: "#6B7280" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  timerPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: "#F3F4F6", borderRadius: 8 },
  timerPillWarning: { backgroundColor: "#FEF3C7" },
  timerPillAlert: { backgroundColor: "#FEE2E2" },
  timerText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#111827" },
  timerTextWarning: { color: "#B45309" },
  timerTextAlert: { color: "#DC2626" },
  drawerToggleBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: "#F3F4F6", borderRadius: 8 },
  drawerToggleText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#374151" },

  // Layout
  mainLayout: { flex: 1, flexDirection: "row" },
  questionArea: { flex: 1 },
  questionContent: { padding: 16, paddingBottom: 90, gap: 14 },

  instructionBox: { padding: 10, backgroundColor: "#F3F4F6", borderRadius: 8 },
  instructionText: { fontSize: 12, color: "#4B5563" },

  passageCard: { backgroundColor: "#FFFFFF", borderRadius: 10, padding: 14, borderWidth: 1, borderColor: "#E5E7EB", gap: 6 },
  passageLabel: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#6B7280", textTransform: "uppercase" },
  passageText: { fontSize: 15, color: "#111827", lineHeight: 24 },

  audioPlayerCard: { backgroundColor: "#FFFFFF", borderRadius: 10, padding: 14, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center", gap: 6 },
  audioPlayBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.light.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  audioPlayBtnActive: { opacity: 0.8 },
  audioPlayBtnText: { color: "#FFFFFF", fontSize: 13, fontFamily: "Inter_700Bold" },
  audioHintText: { fontSize: 11, color: "#6B7280" },

  questionTextCard: { backgroundColor: "#FFFFFF", borderRadius: 10, padding: 16, borderWidth: 1, borderColor: "#E5E7EB", gap: 8 },
  questionTextHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  questionNumberBadge: { fontSize: 12, fontFamily: "Inter_700Bold", color: colors.light.primary },
  flagBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: "#F9FAFB" },
  flagBtnActive: { backgroundColor: "#FEE2E2" },
  flagBtnText: { fontSize: 11, color: "#6B7280" },
  flagBtnTextActive: { color: "#C62828", fontFamily: "Inter_600SemiBold" },
  questionText: { fontSize: 17, fontFamily: "Inter_600SemiBold", color: "#111827", lineHeight: 26 },
  pinyinText: { fontSize: 13, color: "#6B7280", fontStyle: "italic" },

  // Arrange Writing
  arrangeCard: { backgroundColor: "#FFFFFF", borderRadius: 10, padding: 14, borderWidth: 1, borderColor: "#E5E7EB", gap: 10 },
  arrangeInstruction: { fontSize: 12, color: "#4B5563" },
  arrangeOutputBox: { minHeight: 48, borderWidth: 1, borderColor: "#D1D5DB", borderRadius: 8, padding: 8, justifyContent: "center", backgroundColor: "#F9FAFB" },
  arrangePlaceholder: { fontSize: 12, color: "#9CA3AF", textAlign: "center" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  selectedChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.light.primary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  selectedChipText: { color: "#FFFFFF", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  chipPool: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  poolChip: { backgroundColor: "#E5E7EB", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  poolChipUsed: { opacity: 0.3 },
  poolChipText: { fontSize: 14, color: "#111827", fontFamily: "Inter_600SemiBold" },
  poolChipTextUsed: { color: "#9CA3AF" },

  // Options List
  optionsList: { gap: 8 },
  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    gap: 12,
  },
  optionBtnSelected: { borderColor: colors.light.primary, backgroundColor: "#FFF5F5" },
  optionIdBox: { width: 30, height: 30, borderRadius: 6, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  optionIdBoxSelected: { backgroundColor: colors.light.primary },
  optionIdText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#374151" },
  optionIdTextSelected: { color: "#FFFFFF" },
  optionContent: { flex: 1 },
  optionText: { fontSize: 15, color: "#1F2937", lineHeight: 22 },
  optionTextSelected: { color: "#111827", fontFamily: "Inter_600SemiBold" },
  optionPinyin: { fontSize: 11, color: "#6B7280", marginTop: 2 },

  // Desktop Sidebar
  desktopSidebar: { width: 280, backgroundColor: "#FFFFFF", borderLeftWidth: 1, borderLeftColor: "#E5E7EB", padding: 14 },
  sidebarHeader: { marginBottom: 12 },
  sidebarTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#111827" },
  sidebarSub: { fontSize: 11, color: "#6B7280" },
  sidebarScroll: { flex: 1 },
  gridNav: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  navTile: { width: 44, height: 44, borderRadius: 8, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E5E7EB" },
  navTileAnswered: { backgroundColor: "#E0F2FE", borderColor: "#BAE6FD" },
  navTileFlagged: { borderColor: "#F87171" },
  navTileCurrent: { borderColor: colors.light.primary, borderWidth: 2 },
  navTileText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#374151" },
  navTileTextAnswered: { color: "#0369A1", fontFamily: "Inter_700Bold" },
  navTileTextCurrent: { color: colors.light.primary, fontFamily: "Inter_700Bold" },
  flagDot: { position: "absolute", top: 3, right: 3, width: 6, height: 6, borderRadius: 3, backgroundColor: "#EF4444" },
  sidebarSubmitBtn: { backgroundColor: colors.light.primary, paddingVertical: 12, borderRadius: 8, alignItems: "center", marginTop: 10 },
  sidebarSubmitText: { color: "#FFFFFF", fontSize: 13, fontFamily: "Inter_700Bold" },

  // Bottom Bar
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  navBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, backgroundColor: "#F3F4F6" },
  navBtnDisabled: { opacity: 0.4 },
  navBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#374151" },
  submitActionBtn: { backgroundColor: colors.light.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  submitActionText: { color: "#FFFFFF", fontSize: 13, fontFamily: "Inter_700Bold" },

  // Modal / Bottom Sheet
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 16 },
  sheetContainer: { width: "100%", maxHeight: "80%", backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, gap: 14 },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sheetTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#111827" },
  sheetSub: { fontSize: 12, color: "#6B7280" },
  sheetCloseBtn: { padding: 6 },
  sheetGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingBottom: 20 },
  sheetTile: { width: 50, height: 50, borderRadius: 10, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E5E7EB" },

  // Confirm Box
  confirmBox: { width: "100%", maxWidth: 400, backgroundColor: "#FFFFFF", borderRadius: 16, padding: 22, alignItems: "center", gap: 10 },
  confirmIconWrap: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#FEE2E2", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  confirmTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#111827" },
  confirmSub: { fontSize: 13, color: "#4B5563", textAlign: "center", lineHeight: 20 },
  highlightText: { color: "#DC2626", fontFamily: "Inter_700Bold" },
  confirmActions: { flexDirection: "row", gap: 10, marginTop: 10, width: "100%" },
  continueBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: "#F3F4F6", alignItems: "center" },
  continueBtnText: { color: "#374151", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  submitFinalBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: colors.light.primary, alignItems: "center" },
  submitFinalText: { color: "#FFFFFF", fontSize: 13, fontFamily: "Inter_700Bold" },
});
