import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { ExamResult, HSKQuestion } from "@/types/hskExam";
import { HSKStorage } from "@/lib/hsk/storage";
import { AIExplanationResult, AIQuestionGenerator } from "@/lib/hsk/AIQuestionGenerator";
import { ExamGenerator } from "@/lib/hsk/ExamGenerator";

type FilterTab = "all" | "wrong" | "flagged";

export default function HSKExamResultScreen() {
  const { examId } = useLocalSearchParams<{ examId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const [result, setResult] = useState<ExamResult | null>(null);
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [aiExplanations, setAiExplanations] = useState<Record<string, AIExplanationResult>>({});
  const [loadingAiIds, setLoadingAiIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (examId) {
      HSKStorage.getResultById(examId).then((res) => {
        if (res) setResult(res);
      });
    }
  }, [examId]);

  // Request on-demand AI explanation for a single question
  const handleRequestAiExplain = async (q: HSKQuestion, userAns?: string) => {
    if (aiExplanations[q.id] || loadingAiIds[q.id]) return;

    setLoadingAiIds((prev) => ({ ...prev, [q.id]: true }));
    try {
      const exp = await AIQuestionGenerator.explainQuestion({
        question: q,
        userAnswer: userAns,
      });
      setAiExplanations((prev) => ({ ...prev, [q.id]: exp }));
    } catch (e) {
      console.warn("AI explain failed:", e);
    } finally {
      setLoadingAiIds((prev) => ({ ...prev, [q.id]: false }));
    }
  };

  // Retake exact same exam
  const handleRetakeExam = async () => {
    if (!result) return;
    await HSKStorage.saveAutoSave({
      exam: result.examSnapshot,
      currentSectionIdx: 0,
      currentQuestionIdx: 0,
      userAnswers: {},
      flaggedQuestionIds: [],
      remainingSeconds: result.examSnapshot.durationMinutes * 60,
      lastUpdated: new Date().toISOString(),
    });
    router.replace("/hsk-test/exam" as any);
  };

  // Generate weakness-focused exam
  const handleGenerateWeaknessExam = async () => {
    if (!result) return;
    const weakNames = result.weaknesses.map((w) => w.name);
    const newExam = ExamGenerator.generateExam({
      level: result.level,
      syllabusVersion: result.syllabusVersion,
      mode: "weakness",
      targetWeaknesses: weakNames,
    });

    await HSKStorage.saveAutoSave({
      exam: newExam,
      currentSectionIdx: 0,
      currentQuestionIdx: 0,
      userAnswers: {},
      flaggedQuestionIds: [],
      remainingSeconds: newExam.durationMinutes * 60,
      lastUpdated: new Date().toISOString(),
    });

    router.replace("/hsk-test/exam" as any);
  };

  if (!result) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.light.primary} />
        <Text style={styles.loadingText}>Đang tải kết quả bài thi...</Text>
      </View>
    );
  }

  const levelMeta = HSK_LEVEL_METAS[result.level];

  // Flatten all questions
  const allQuestions: { question: HSKQuestion; sectionTitle: string; globalIdx: number }[] = [];
  let gCount = 1;
  result.examSnapshot.sections.forEach((sec) => {
    sec.questions.forEach((q) => {
      allQuestions.push({
        question: q,
        sectionTitle: sec.title,
        globalIdx: gCount++,
      });
    });
  });

  // Filter questions
  const displayedQuestions = allQuestions.filter(({ question }) => {
    const userAns = (result.userAnswers[question.id] || "").trim().toUpperCase();
    const isCorrect = userAns === (question.correctAnswer || "").trim().toUpperCase();
    const isFlagged = result.flaggedQuestionIds.includes(question.id);

    if (filterTab === "wrong") return !isCorrect;
    if (filterTab === "flagged") return isFlagged;
    return true;
  });

  const wrongCount = allQuestions.filter(({ question }) => {
    const userAns = (result.userAnswers[question.id] || "").trim().toUpperCase();
    return userAns !== (question.correctAnswer || "").trim().toUpperCase();
  }).length;

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      {/* Top Navbar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          onPress={() => router.replace("/hsk-test" as any)}
          style={styles.backBtn}
        >
          <Feather name="home" size={18} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Kết Quả Đề Thi HSK {result.level}</Text>
        <TouchableOpacity
          onPress={() => router.push({ pathname: "/hsk-test/history" as any })}
          style={styles.navHistoryBtn}
        >
          <Text style={styles.navHistoryText}>Lịch sử</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 1. SCORE OVERVIEW BANNER */}
        <View style={styles.scoreBanner}>
          <View style={styles.scoreTopRow}>
            <View>
              <Text style={styles.bannerExamTitle}>{result.title}</Text>
              <Text style={styles.bannerTimeText}>
                Thời gian làm: {Math.round(result.timeSpentSeconds / 60)} phút • {new Date(result.completedAt).toLocaleDateString("vi-VN")}
              </Text>
            </View>
            <View style={[styles.passBadge, { backgroundColor: result.isPassed ? "#DCFCE7" : "#FEE2E2" }]}>
              <Text style={[styles.passBadgeText, { color: result.isPassed ? "#166534" : "#991B1B" }]}>
                {result.isPassed ? "PASS (ĐẠT)" : "FAIL (CHƯA ĐẠT)"}
              </Text>
            </View>
          </View>

          <View style={styles.bigScoreBox}>
            <Text style={[styles.bigScoreNum, { color: result.isPassed ? "#16A34A" : "#DC2626" }]}>
              {result.totalScore}
            </Text>
            <Text style={styles.bigScoreMax}>/ {result.maxScore} Điểm</Text>
            <View style={styles.accuracyTag}>
              <Text style={styles.accuracyTagText}>Độ chính xác: {result.accuracy}%</Text>
            </View>
          </View>
        </View>

        {/* 2. SECTION SCORES BREAKDOWN */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Phân tích điểm theo phần thi</Text>
          <View style={styles.sectionGrid}>
            {result.sectionScores.map((sec, idx) => (
              <View key={idx} style={styles.sectionScoreItem}>
                <View style={styles.secScoreTop}>
                  <Text style={styles.secScoreTitle}>{sec.title}</Text>
                  <Text style={styles.secScoreVal}>{sec.score}/{sec.maxScore}</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${sec.accuracy}%` as any,
                        backgroundColor: sec.accuracy >= 70 ? "#16A34A" : sec.accuracy >= 50 ? "#D97706" : "#DC2626",
                      },
                    ]}
                  />
                </View>
                <Text style={styles.secCorrectCount}>
                  Đúng {sec.correctCount}/{sec.totalCount} câu ({sec.accuracy}%)
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 3. WEAKNESS DIAGNOSTIC & RECOMMENDATION */}
        {result.weaknesses.length > 0 && (
          <View style={styles.weaknessCard}>
            <View style={styles.weaknessHeader}>
              <Feather name="alert-triangle" size={18} color="#D97706" />
              <Text style={styles.weaknessCardTitle}>Chẩn đoán điểm yếu</Text>
            </View>

            <Text style={styles.weakestSummaryText}>{result.weakestAreaSummary}</Text>

            <View style={styles.recommendationList}>
              <Text style={styles.recommendationHeader}>Đề xuất lộ trình khắc phục:</Text>
              {result.studyRecommendations.map((rec, rIdx) => (
                <View key={rIdx} style={styles.recItem}>
                  <Feather name="arrow-right-circle" size={14} color={colors.light.primary} />
                  <Text style={styles.recText}>{rec}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity style={styles.weaknessExamActionBtn} onPress={handleGenerateWeaknessExam}>
              <Feather name="zap" size={16} color="#FFFFFF" />
              <Text style={styles.weaknessExamActionText}>Tạo đề thi tập trung vào điểm yếu này</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 4. ACTIONS ROW */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.retakeBtn} onPress={handleRetakeExam}>
            <Feather name="rotate-ccw" size={16} color="#374151" />
            <Text style={styles.retakeBtnText}>Làm lại đề này</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.newExamBtn} onPress={() => router.replace("/hsk-test" as any)}>
            <Feather name="plus-circle" size={16} color="#FFFFFF" />
            <Text style={styles.newExamBtnText}>Tạo đề mới</Text>
          </TouchableOpacity>
        </View>

        {/* 5. DETAILED ANSWER REVIEW */}
        <View style={styles.card}>
          <View style={styles.reviewHeader}>
            <Text style={styles.cardTitle}>Xem lại đáp án chi tiết</Text>
            <View style={styles.filterTabs}>
              <TouchableOpacity
                style={[styles.filterTabBtn, filterTab === "all" && styles.filterTabActive]}
                onPress={() => setFilterTab("all")}
              >
                <Text style={[styles.filterTabText, filterTab === "all" && styles.filterTabTextActive]}>
                  Tất cả ({allQuestions.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterTabBtn, filterTab === "wrong" && styles.filterTabActive]}
                onPress={() => setFilterTab("wrong")}
              >
                <Text style={[styles.filterTabText, filterTab === "wrong" && styles.filterTabTextActive]}>
                  Câu sai ({wrongCount})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterTabBtn, filterTab === "flagged" && styles.filterTabActive]}
                onPress={() => setFilterTab("flagged")}
              >
                <Text style={[styles.filterTabText, filterTab === "flagged" && styles.filterTabTextActive]}>
                  Đánh dấu ({result.flaggedQuestionIds.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.questionsList}>
            {displayedQuestions.map(({ question, globalIdx }) => {
              const userAns = (result.userAnswers[question.id] || "").trim().toUpperCase();
              const correctAns = (question.correctAnswer || "").trim().toUpperCase();
              const isCorrect = userAns === correctAns;
              const hasAiExp = !!aiExplanations[question.id];
              const isAiLoading = !!loadingAiIds[question.id];
              const expData = aiExplanations[question.id];

              return (
                <View key={question.id} style={[styles.qItemCard, !isCorrect && styles.qItemCardWrong]}>
                  <View style={styles.qItemHeader}>
                    <View style={styles.qItemBadgeWrap}>
                      <Text style={styles.qItemNum}>Câu {globalIdx}</Text>
                      <View style={[styles.statusPill, { backgroundColor: isCorrect ? "#DCFCE7" : "#FEE2E2" }]}>
                        <Text style={[styles.statusPillText, { color: isCorrect ? "#166534" : "#991B1B" }]}>
                          {isCorrect ? "Chính xác" : "Chưa đúng"}
                        </Text>
                      </View>
                    </View>

                    {/* AI Explain Button */}
                    <TouchableOpacity
                      style={[styles.aiExplainBtn, hasAiExp && styles.aiExplainBtnDone]}
                      onPress={() => handleRequestAiExplain(question, userAns)}
                      disabled={isAiLoading}
                    >
                      {isAiLoading ? (
                        <ActivityIndicator size="small" color={colors.light.primary} />
                      ) : (
                        <>
                          <Feather name="cpu" size={13} color={hasAiExp ? "#059669" : colors.light.primary} />
                          <Text style={[styles.aiExplainBtnText, hasAiExp && { color: "#059669" }]}>
                            {hasAiExp ? "Đã phân tích AI" : "AI Giải thích"}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.qItemText}>{question.questionText}</Text>
                  {question.audioText ? (
                    <Text style={styles.qItemAudioScript}>🎧 Đoạn nghe: {question.audioText}</Text>
                  ) : null}

                  {/* Options state */}
                  <View style={styles.qItemOptions}>
                    {question.options.map((opt) => {
                      const isUserChoice = userAns === opt.id;
                      const isCorrectChoice = correctAns === opt.id;

                      return (
                        <View
                          key={opt.id}
                          style={[
                            styles.reviewOpt,
                            isCorrectChoice && styles.reviewOptCorrect,
                            isUserChoice && !isCorrectChoice && styles.reviewOptWrong,
                          ]}
                        >
                          <Text style={styles.reviewOptId}>{opt.id}.</Text>
                          <Text style={styles.reviewOptText}>{opt.text}</Text>
                          {isCorrectChoice && (
                            <Feather name="check" size={16} color="#16A34A" />
                          )}
                          {isUserChoice && !isCorrectChoice && (
                            <Feather name="x" size={16} color="#DC2626" />
                          )}
                        </View>
                      );
                    })}
                  </View>

                  {/* Standard Explanation */}
                  <View style={styles.expBox}>
                    <Text style={styles.expTitle}>Giải thích chi tiết:</Text>
                    <Text style={styles.expText}>{question.explanation}</Text>
                  </View>

                  {/* ON-DEMAND AI DEEP EXPLANATION BOX */}
                  {hasAiExp && expData && (
                    <View style={styles.aiResultBox}>
                      <View style={styles.aiBoxHeader}>
                        <Feather name="cpu" size={14} color="#059669" />
                        <Text style={styles.aiBoxTitle}>Phân tích nâng cao từ AI Coach</Text>
                      </View>

                      <Text style={styles.aiWhyCorrect}>✓ {expData.whyCorrect}</Text>
                      {expData.whyUserChoiceWrong && (
                        <Text style={styles.aiWhyWrong}>✗ {expData.whyUserChoiceWrong}</Text>
                      )}

                      {expData.keyGrammar && (
                        <View style={styles.aiGrammarRow}>
                          <Text style={styles.aiGrammarTitle}>💡 Ngữ pháp: {expData.keyGrammar.pattern}</Text>
                          <Text style={styles.aiGrammarSub}>{expData.keyGrammar.explanation}</Text>
                        </View>
                      )}

                      {expData.memoryTip && (
                        <Text style={styles.aiTip}>🧠 Mẹo nhớ: {expData.memoryTip}</Text>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  center: { justifyContent: "center", alignItems: "center", gap: 10 },
  loadingText: { fontSize: 13, color: "#6B7280" },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  navTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#111827" },
  navHistoryBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: "#FFF5F5" },
  navHistoryText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.light.primary },
  content: { padding: 16, paddingBottom: 100, gap: 16 },

  // Score Banner
  scoreBanner: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 14,
  },
  scoreTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  bannerExamTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#111827" },
  bannerTimeText: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  passBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  passBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  bigScoreBox: { flexDirection: "row", alignItems: "baseline", gap: 6, backgroundColor: "#F9FAFB", padding: 14, borderRadius: 10 },
  bigScoreNum: { fontSize: 36, fontFamily: "Inter_700Bold" },
  bigScoreMax: { fontSize: 16, color: "#6B7280", fontFamily: "Inter_500Medium" },
  accuracyTag: { marginLeft: "auto", paddingHorizontal: 10, paddingVertical: 5, backgroundColor: "#FFFFFF", borderRadius: 6, borderWidth: 1, borderColor: "#E5E7EB" },
  accuracyTagText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#374151" },

  // Card
  card: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#E5E7EB", gap: 12 },
  cardTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#111827" },
  sectionGrid: { gap: 12 },
  sectionScoreItem: { gap: 4 },
  secScoreTop: { flexDirection: "row", justifyContent: "space-between" },
  secScoreTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#374151" },
  secScoreVal: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#111827" },
  progressBarBg: { height: 7, backgroundColor: "#F3F4F6", borderRadius: 4, overflow: "hidden" },
  progressBarFill: { height: "100%", borderRadius: 4 },
  secCorrectCount: { fontSize: 11, color: "#6B7280" },

  // Weakness Card
  weaknessCard: { backgroundColor: "#FFFBEB", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#FCD34D", gap: 10 },
  weaknessHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  weaknessCardTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#92400E" },
  weakestSummaryText: { fontSize: 13, color: "#78350F", lineHeight: 18 },
  recommendationList: { gap: 4, marginTop: 4 },
  recommendationHeader: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#92400E" },
  recItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  recText: { fontSize: 12, color: "#78350F" },
  weaknessExamActionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: colors.light.primary, paddingVertical: 10, borderRadius: 8, marginTop: 6 },
  weaknessExamActionText: { color: "#FFFFFF", fontSize: 12, fontFamily: "Inter_700Bold" },

  // Action Row
  actionRow: { flexDirection: "row", gap: 10 },
  retakeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, backgroundColor: "#FFFFFF", borderRadius: 8, borderWidth: 1, borderColor: "#D1D5DB" },
  retakeBtnText: { color: "#374151", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  newExamBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, backgroundColor: colors.light.primary, borderRadius: 8 },
  newExamBtnText: { color: "#FFFFFF", fontSize: 13, fontFamily: "Inter_700Bold" },

  // Filter Tabs
  reviewHeader: { gap: 10 },
  filterTabs: { flexDirection: "row", backgroundColor: "#F3F4F6", borderRadius: 8, padding: 3, gap: 4 },
  filterTabBtn: { flex: 1, paddingVertical: 6, alignItems: "center", borderRadius: 6 },
  filterTabActive: { backgroundColor: "#FFFFFF" },
  filterTabText: { fontSize: 11, fontFamily: "Inter_500Medium", color: "#6B7280" },
  filterTabTextActive: { color: "#111827", fontFamily: "Inter_700Bold" },

  // Questions List
  questionsList: { gap: 14 },
  qItemCard: { backgroundColor: "#F9FAFB", borderRadius: 10, padding: 14, borderWidth: 1, borderColor: "#E5E7EB", gap: 8 },
  qItemCardWrong: { borderColor: "#FECACA", backgroundColor: "#FFF8F8" },
  qItemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  qItemBadgeWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  qItemNum: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#374151" },
  statusPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 },
  statusPillText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  aiExplainBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: "#FFF5F5", borderWidth: 1, borderColor: "#FFCDD2" },
  aiExplainBtnDone: { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" },
  aiExplainBtnText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.light.primary },
  qItemText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#111827", lineHeight: 22 },
  qItemAudioScript: { fontSize: 12, color: "#4B5563", fontStyle: "italic", backgroundColor: "#FFFFFF", padding: 6, borderRadius: 6 },
  qItemOptions: { gap: 6 },
  reviewOpt: { flexDirection: "row", alignItems: "center", padding: 8, borderRadius: 6, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5E7EB", gap: 8 },
  reviewOptCorrect: { backgroundColor: "#F0FDF4", borderColor: "#86EFAC" },
  reviewOptWrong: { backgroundColor: "#FEF2F2", borderColor: "#FCA5A5" },
  reviewOptId: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#374151" },
  reviewOptText: { flex: 1, fontSize: 13, color: "#1F2937" },
  expBox: { backgroundColor: "#FFFFFF", borderRadius: 6, padding: 10, borderWidth: 1, borderColor: "#E5E7EB", gap: 2 },
  expTitle: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#6B7280" },
  expText: { fontSize: 12, color: "#374151", lineHeight: 18 },

  // AI Result Box
  aiResultBox: { backgroundColor: "#ECFDF5", borderRadius: 8, padding: 12, borderWidth: 1, borderColor: "#A7F3D0", gap: 6 },
  aiBoxHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  aiBoxTitle: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#065F46" },
  aiWhyCorrect: { fontSize: 12, color: "#047857", lineHeight: 17 },
  aiWhyWrong: { fontSize: 12, color: "#B91C1C", lineHeight: 17 },
  aiGrammarRow: { backgroundColor: "#FFFFFF", padding: 8, borderRadius: 6, gap: 2 },
  aiGrammarTitle: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#111827" },
  aiGrammarSub: { fontSize: 11, color: "#4B5563" },
  aiTip: { fontSize: 11, color: "#065F46", fontStyle: "italic" },
});
