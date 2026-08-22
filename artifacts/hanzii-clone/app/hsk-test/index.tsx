import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import colors from "@/constants/colors";
import { HSK_LEVEL_METAS, getExamBlueprint } from "@/constants/examConfig";
import { ExamAutoSaveState, ExamMode, ExamResult, HSKLevel, SyllabusVersion } from "@/types/hskExam";
import { ExamGenerator } from "@/lib/hsk/ExamGenerator";
import { HSKStorage } from "@/lib/hsk/storage";

export default function HSKTestPortalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const [selectedLevel, setSelectedLevel] = useState<HSKLevel>(3);
  const [syllabusVersion, setSyllabusVersion] = useState<SyllabusVersion>("2.0");
  const [examMode, setExamMode] = useState<ExamMode>("mock");
  const [generating, setGenerating] = useState(false);
  const [autoSaveState, setAutoSaveState] = useState<ExamAutoSaveState | null>(null);
  const [recentResults, setRecentResults] = useState<ExamResult[]>([]);
  const [userWeaknesses, setUserWeaknesses] = useState<string[]>([]);

  useEffect(() => {
    // Check for auto-save state and recent history on mount
    HSKStorage.getAutoSave().then((st) => setAutoSaveState(st));
    HSKStorage.getHistory().then((h) => setRecentResults(h.slice(0, 3)));
    HSKStorage.getUserWeaknesses().then((w) => setUserWeaknesses(w));
  }, []);

  const meta = HSK_LEVEL_METAS[selectedLevel];
  const blueprint = getExamBlueprint(selectedLevel, syllabusVersion);

  const handleStartNewExam = async (modeToUse?: ExamMode) => {
    const finalMode = modeToUse || examMode;
    setGenerating(true);

    try {
      // Clear previous autosave if starting new
      await HSKStorage.clearAutoSave();

      const exam = ExamGenerator.generateExam({
        level: selectedLevel,
        syllabusVersion,
        mode: finalMode,
        targetWeaknesses: finalMode === "weakness" ? userWeaknesses : [],
      });

      // Save initial state so room can load it
      await HSKStorage.saveAutoSave({
        exam,
        currentSectionIdx: 0,
        currentQuestionIdx: 0,
        userAnswers: {},
        flaggedQuestionIds: [],
        remainingSeconds: exam.durationMinutes * 60,
        lastUpdated: new Date().toISOString(),
      });

      router.push({ pathname: "/hsk-test/exam" as any });
    } catch (e: any) {
      Alert.alert("Lỗi tạo đề", e.message || "Không thể tạo đề lúc này, vui lòng thử lại.");
    } finally {
      setGenerating(false);
    }
  };

  const handleResumeExam = () => {
    router.push({ pathname: "/hsk-test/exam" as any });
  };

  const handleDiscardAutoSave = async () => {
    await HSKStorage.clearAutoSave();
    setAutoSaveState(null);
  };

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      {/* Top Navigation */}
      <View style={styles.navBar}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace("/(tabs)/hsk");
          }}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={20} color={colors.light.foreground} />
        </TouchableOpacity>
        <View style={styles.titleArea}>
          <Text style={styles.title}>Luyện Thi HSK Tự Động</Text>
          <Text style={styles.subtitle}>Sinh đề thi chuẩn hóa HSK 1 → 6</Text>
        </View>
        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() => router.push({ pathname: "/hsk-test/history" as any })}
        >
          <Feather name="clock" size={16} color={colors.light.primary} />
          <Text style={styles.historyBtnText}>Lịch sử</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* RESUME BANNER IF INCOMPLETE EXAM EXISTS */}
        {autoSaveState && (
          <View style={styles.resumeBanner}>
            <View style={styles.resumeIconWrap}>
              <Feather name="alert-circle" size={20} color="#ED6C02" />
            </View>
            <View style={styles.resumeInfo}>
              <Text style={styles.resumeTitle}>Bạn có bài thi đang làm dở</Text>
              <Text style={styles.resumeSub}>
                HSK {autoSaveState.exam.level} • Đã trả lời {Object.keys(autoSaveState.userAnswers).length}/
                {autoSaveState.exam.totalQuestions} câu
              </Text>
            </View>
            <View style={styles.resumeActions}>
              <TouchableOpacity style={styles.resumeBtn} onPress={handleResumeExam}>
                <Text style={styles.resumeBtnText}>Khôi phục</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.discardBtn} onPress={handleDiscardAutoSave}>
                <Text style={styles.discardBtnText}>Hủy bỏ</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 1. SELECT LEVEL HSK 1 - 6 */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>1. Chọn Cấp Độ Thi</Text>
          <View style={styles.levelGrid}>
            {([1, 2, 3, 4, 5, 6] as HSKLevel[]).map((lvl) => {
              const isSelected = selectedLevel === lvl;
              const lvlMeta = HSK_LEVEL_METAS[lvl];
              return (
                <TouchableOpacity
                  key={lvl}
                  style={[
                    styles.levelCard,
                    isSelected && { borderColor: lvlMeta.badgeColor, backgroundColor: "#FFF8F7" },
                  ]}
                  onPress={() => setSelectedLevel(lvl)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.levelBadge, { backgroundColor: lvlMeta.badgeColor }]}>
                    <Text style={styles.levelBadgeText}>HSK {lvl}</Text>
                  </View>
                  <Text style={styles.levelTag}>{lvlMeta.tag}</Text>
                  <Text style={styles.levelVocab}>{lvlMeta.vocabRange}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 2. SELECT SYLLABUS VERSION & EXAM MODE */}
        <View style={styles.rowSelectors}>
          {/* Syllabus */}
          <View style={styles.halfSelector}>
            <Text style={styles.sectionLabel}>Chuẩn Đề Thi</Text>
            <View style={styles.toggleGroup}>
              {(["2.0", "3.0"] as SyllabusVersion[]).map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[
                    styles.toggleBtn,
                    syllabusVersion === v && styles.toggleBtnActive,
                  ]}
                  onPress={() => setSyllabusVersion(v)}
                >
                  <Text style={[styles.toggleBtnText, syllabusVersion === v && styles.toggleBtnTextActive]}>
                    HSK {v}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Mode */}
          <View style={styles.halfSelector}>
            <Text style={styles.sectionLabel}>Chế Độ Làm Bài</Text>
            <View style={styles.toggleGroup}>
              <TouchableOpacity
                style={[styles.toggleBtn, examMode === "mock" && styles.toggleBtnActive]}
                onPress={() => setExamMode("mock")}
              >
                <Text style={[styles.toggleBtnText, examMode === "mock" && styles.toggleBtnTextActive]}>
                  Thi Chuẩn
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, examMode === "practice" && styles.toggleBtnActive]}
                onPress={() => setExamMode("practice")}
              >
                <Text style={[styles.toggleBtnText, examMode === "practice" && styles.toggleBtnTextActive]}>
                  Luyện Tập
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 3. SELECTED EXAM BLUEPRINT & INFO CARD */}
        <View style={styles.blueprintCard}>
          <View style={styles.bpHeader}>
            <View style={[styles.bpDot, { backgroundColor: meta.badgeColor }]} />
            <Text style={styles.bpTitle}>Cấu trúc đề {meta.name} (HSK {syllabusVersion})</Text>
          </View>

          <Text style={styles.bpDesc}>{meta.description}</Text>

          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Feather name="clock" size={16} color={colors.light.mutedForeground} />
              <Text style={styles.metricVal}>
                {examMode === "practice" ? "Không giới hạn" : `${meta.durationMinutes} phút`}
              </Text>
              <Text style={styles.metricLabel}>Thời gian thi</Text>
            </View>

            <View style={styles.metricItem}>
              <Feather name="help-circle" size={16} color={colors.light.mutedForeground} />
              <Text style={styles.metricVal}>
                {examMode === "practice"
                  ? "Tối ưu 20-30 câu"
                  : `${meta.totalQuestions} câu hỏi`}
              </Text>
              <Text style={styles.metricLabel}>Tổng số câu</Text>
            </View>

            <View style={styles.metricItem}>
              <Feather name="award" size={16} color={colors.light.mutedForeground} />
              <Text style={styles.metricVal}>{meta.passingScore}/{meta.maxScore}</Text>
              <Text style={styles.metricLabel}>Điểm đạt (Pass)</Text>
            </View>
          </View>

          <View style={styles.sectionList}>
            <Text style={styles.sectionListHeader}>Phân đoạn đề thi:</Text>
            {blueprint.sections.map((sec, idx) => (
              <View key={idx} style={styles.secRow}>
                <Feather
                  name={sec.type === "listening" ? "headphones" : sec.type === "reading" ? "book-open" : "edit-3"}
                  size={14}
                  color={colors.light.primary}
                />
                <Text style={styles.secName}>{sec.title}</Text>
                <Text style={styles.secCount}>
                  {sec.questionTypes.reduce((acc, q) => acc + q.count, 0)} câu
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* 4. WEAKNESS TARGETED EXAM PROMOTION */}
        {userWeaknesses.length > 0 && (
          <View style={styles.weaknessBox}>
            <View style={styles.weaknessLeft}>
              <View style={styles.weakBadge}>
                <Feather name="target" size={13} color="#C62828" />
                <Text style={styles.weakBadgeText}>Đề cá nhân hóa</Text>
              </View>
              <Text style={styles.weakTitle}>Tạo đề thi theo điểm yếu</Text>
              <Text style={styles.weakSub}>
                Tự động ưu tiên 70% câu hỏi thuộc {userWeaknesses.slice(0, 2).join(", ")} để khắc phục lỗi sai.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.weakActionBtn}
              onPress={() => handleStartNewExam("weakness")}
              disabled={generating}
            >
              <Text style={styles.weakActionText}>Tạo đề</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 5. GENERATE & START BUTTON */}
        <TouchableOpacity
          style={[styles.startBtn, generating && styles.btnDisabled]}
          onPress={() => handleStartNewExam()}
          disabled={generating}
          activeOpacity={0.85}
        >
          {generating ? (
            <>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.startBtnText}>Đang chuẩn bị đề HSK {selectedLevel}...</Text>
            </>
          ) : (
            <>
              <Feather name="play" size={18} color="#FFFFFF" />
              <Text style={styles.startBtnText}>Tạo Đề Thi & Vào Phòng Thi</Text>
            </>
          )}
        </TouchableOpacity>

        {/* RECENT ATTEMPTS PREVIEW */}
        {recentResults.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Text style={styles.recentTitle}>Kết quả gần đây</Text>
              <TouchableOpacity onPress={() => router.push({ pathname: "/hsk-test/history" as any })}>
                <Text style={styles.seeAllText}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>

            {recentResults.map((item) => (
              <TouchableOpacity
                key={item.examId}
                style={styles.recentItem}
                onPress={() => router.push({ pathname: `/hsk-test/result/${item.examId}` as any })}
              >
                <View style={[styles.itemLevelBadge, { backgroundColor: HSK_LEVEL_METAS[item.level]?.badgeColor || colors.light.primary }]}>
                  <Text style={styles.itemLevelText}>HSK {item.level}</Text>
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.itemDate}>
                    {new Date(item.completedAt).toLocaleDateString("vi-VN")} • {item.accuracy}% chính xác
                  </Text>
                </View>
                <View style={styles.itemScoreBox}>
                  <Text style={[styles.itemScoreText, { color: item.isPassed ? "#43A047" : "#C62828" }]}>
                    {item.totalScore}/{item.maxScore}
                  </Text>
                  <Text style={[styles.itemPassText, { color: item.isPassed ? "#43A047" : "#C62828" }]}>
                    {item.isPassed ? "PASS" : "FAIL"}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    backgroundColor: "#FFFFFF",
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  titleArea: { flex: 1 },
  title: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#111827" },
  subtitle: { fontSize: 12, color: "#6B7280", fontFamily: "Inter_400Regular" },
  historyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  historyBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.light.primary },
  content: { padding: 16, paddingBottom: 100, gap: 16 },

  // Resume Banner
  resumeBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FCD34D",
    gap: 10,
  },
  resumeIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#FEF3C7", alignItems: "center", justifyContent: "center" },
  resumeInfo: { flex: 1 },
  resumeTitle: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#92400E" },
  resumeSub: { fontSize: 11, color: "#B45309", marginTop: 1 },
  resumeActions: { flexDirection: "row", gap: 6 },
  resumeBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "#D97706", borderRadius: 6 },
  resumeBtnText: { color: "#FFFFFF", fontSize: 11, fontFamily: "Inter_600SemiBold" },
  discardBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  discardBtnText: { color: "#6B7280", fontSize: 11 },

  // Section Block
  sectionBlock: { gap: 8 },
  sectionLabel: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#374151" },
  levelGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  levelCard: {
    width: "31.5%",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    alignItems: "center",
    gap: 3,
  },
  levelBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  levelBadgeText: { color: "#FFFFFF", fontSize: 12, fontFamily: "Inter_700Bold" },
  levelTag: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#1F2937", marginTop: 2 },
  levelVocab: { fontSize: 10, color: "#6B7280" },

  // Row Selectors
  rowSelectors: { flexDirection: "row", gap: 12 },
  halfSelector: { flex: 1, gap: 6 },
  toggleGroup: { flexDirection: "row", backgroundColor: "#E5E7EB", borderRadius: 8, padding: 2 },
  toggleBtn: { flex: 1, paddingVertical: 8, alignItems: "center", justifyContent: "center", borderRadius: 6 },
  toggleBtnActive: { backgroundColor: "#FFFFFF" },
  toggleBtnText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#6B7280" },
  toggleBtnTextActive: { color: "#111827", fontFamily: "Inter_700Bold" },

  // Blueprint Card
  blueprintCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 12,
  },
  bpHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  bpDot: { width: 10, height: 10, borderRadius: 5 },
  bpTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#111827" },
  bpDesc: { fontSize: 12, color: "#4B5563", lineHeight: 17 },
  metricsGrid: { flexDirection: "row", backgroundColor: "#F9FAFB", borderRadius: 8, padding: 10, borderWidth: 1, borderColor: "#F3F4F6" },
  metricItem: { flex: 1, alignItems: "center", gap: 3 },
  metricVal: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#111827" },
  metricLabel: { fontSize: 10, color: "#6B7280" },
  sectionList: { gap: 6, borderTopWidth: 1, borderTopColor: "#F3F4F6", paddingTop: 10 },
  sectionListHeader: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#374151" },
  secRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 2 },
  secName: { flex: 1, fontSize: 12, color: "#4B5563" },
  secCount: { fontSize: 12, color: "#6B7280", fontFamily: "Inter_500Medium" },

  // Weakness Box
  weaknessBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF5F5",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FFCDD2",
    gap: 10,
  },
  weaknessLeft: { flex: 1, gap: 4 },
  weakBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  weakBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#C62828", textTransform: "uppercase" },
  weakTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#111827" },
  weakSub: { fontSize: 11, color: "#4B5563", lineHeight: 16 },
  weakActionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.light.primary,
  },
  weakActionText: { color: "#FFFFFF", fontSize: 12, fontFamily: "Inter_700Bold" },

  // Start Button
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.light.primary,
    borderRadius: 10,
    paddingVertical: 14,
  },
  startBtnText: { color: "#FFFFFF", fontSize: 15, fontFamily: "Inter_700Bold" },
  btnDisabled: { opacity: 0.7 },

  // Recent Section
  recentSection: { gap: 8, marginTop: 4 },
  recentHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  recentTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#111827" },
  seeAllText: { fontSize: 12, color: colors.light.primary, fontFamily: "Inter_600SemiBold" },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 10,
  },
  itemLevelBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  itemLevelText: { color: "#FFFFFF", fontSize: 11, fontFamily: "Inter_700Bold" },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#111827" },
  itemDate: { fontSize: 11, color: "#6B7280", marginTop: 2 },
  itemScoreBox: { alignItems: "flex-end" },
  itemScoreText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  itemPassText: { fontSize: 10, fontFamily: "Inter_700Bold", marginTop: 1 },
});
