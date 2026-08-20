import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import colors from "@/constants/colors";
import { HSK_LEVELS, HSK_WORDS } from "@/constants/data";
import { HSK_EXAMS, HSKExam } from "@/constants/hskExams";
import { useLearning } from "@/context/LearningContext";
import { HSKExamModal } from "@/components/HSKExamModal";
import { DailyQuizModal } from "@/components/DailyQuizModal";

type ActiveTab = "daily" | "exams" | "words";

export default function HSKScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { progress } = useLearning();

  const [activeTab, setActiveTab] = useState<ActiveTab>("exams");
  const [selectedHskLevel, setSelectedHskLevel] = useState<number>(1);
  const [selectedExam, setSelectedExam] = useState<HSKExam | null>(null);
  const [showExamModal, setShowExamModal] = useState(false);
  const [showDailyQuizModal, setShowDailyQuizModal] = useState(false);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  // Filter exams by selected HSK level
  const filteredExams = HSK_EXAMS.filter((ex) => ex.level === selectedHskLevel);

  // Get Spaced Repetition words (Words long overdue for review)
  const spacedWords = HSK_WORDS.slice(0, 5);

  const handleStartExam = (exam: HSKExam) => {
    setSelectedExam(exam);
    setShowExamModal(true);
  };

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Luyện Thi & Ôn Tập HSK</Text>
        <Text style={styles.subtitle}>Hệ thống bộ đề chuẩn quốc tế Hanban / CTI</Text>
      </View>

      {/* Main Tab Navigation Bar */}
      <View style={styles.tabBarContainer}>
        <TouchableOpacity
          style={[styles.mainTabBtn, activeTab === "exams" && styles.mainTabBtnActive]}
          onPress={() => setActiveTab("exams")}
        >
          <Feather
            name="file-text"
            size={16}
            color={activeTab === "exams" ? colors.light.primary : colors.light.mutedForeground}
          />
          <Text
            style={[styles.mainTabText, activeTab === "exams" && styles.mainTabTextActive]}
          >
            Đề Thi HSK
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mainTabBtn, activeTab === "daily" && styles.mainTabBtnActive]}
          onPress={() => setActiveTab("daily")}
        >
          <Feather
            name="calendar"
            size={16}
            color={activeTab === "daily" ? colors.light.primary : colors.light.mutedForeground}
          />
          <Text
            style={[styles.mainTabText, activeTab === "daily" && styles.mainTabTextActive]}
          >
            Ôn Hằng Ngày
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mainTabBtn, activeTab === "words" && styles.mainTabBtnActive]}
          onPress={() => setActiveTab("words")}
        >
          <Feather
            name="book"
            size={16}
            color={activeTab === "words" ? colors.light.primary : colors.light.mutedForeground}
          />
          <Text
            style={[styles.mainTabText, activeTab === "words" && styles.mainTabTextActive]}
          >
            Từ Vựng
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* TAB 1: MOCK EXAMS CENTER */}
        {activeTab === "exams" && (
          <View style={styles.tabSection}>
            {/* Level Filter Selector */}
            <View style={styles.levelSelectorBox}>
              <Text style={styles.levelSelectorTitle}>Chọn cấp độ thi HSK:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.levelRow}>
                {[1, 2, 3, 4, 5, 6].map((lvl) => {
                  const isSelected = selectedHskLevel === lvl;
                  const lvlColor = colors.hsk[lvl - 1];
                  return (
                    <TouchableOpacity
                      key={lvl}
                      style={[
                        styles.levelChip,
                        isSelected && { backgroundColor: lvlColor, borderColor: lvlColor },
                      ]}
                      onPress={() => setSelectedHskLevel(lvl)}
                    >
                      <Text
                        style={[
                          styles.levelChipText,
                          isSelected && styles.levelChipTextSelected,
                        ]}
                      >
                        HSK {lvl}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* List of Mock Exams */}
            <View style={styles.examList}>
              <Text style={styles.sectionHeaderTitle}>
                Bộ đề thi mẫu HSK {selectedHskLevel} chuẩn:
              </Text>

              {filteredExams.length > 0 ? (
                filteredExams.map((ex) => (
                  <View key={ex.id} style={styles.examCard}>
                    <View style={styles.examCardTop}>
                      <View style={styles.officialTag}>
                        <Feather name="award" size={13} color="#2E7D32" />
                        <Text style={styles.officialTagText}>Đề mẫu chính thức</Text>
                      </View>
                      <Text style={styles.examDurationText}>
                        <Feather name="clock" size={12} color={colors.light.mutedForeground} />{" "}
                        {ex.durationMinutes} phút
                      </Text>
                    </View>

                    <Text style={styles.examCardTitle}>{ex.title}</Text>
                    <Text style={styles.examCardSubtitle}>{ex.subtitle}</Text>

                    <View style={styles.examMetaRow}>
                      <View style={styles.metaItem}>
                        <Feather name="help-circle" size={13} color={colors.light.mutedForeground} />
                        <Text style={styles.metaText}>{ex.totalQuestions} câu hỏi</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Feather name="check-square" size={13} color={colors.light.mutedForeground} />
                        <Text style={styles.metaText}>Đạt từ {ex.passingScore}/200đ</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.startExamBtn}
                      onPress={() => handleStartExam(ex)}
                      activeOpacity={0.8}
                    >
                      <Feather name="play-circle" size={16} color="#FFFFFF" />
                      <Text style={styles.startExamBtnText}>Vào phòng thi ngay</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <View style={styles.emptyExamBox}>
                  <Text style={styles.emptyExamText}>
                    Đang cập nhật bộ đề thi chuẩn HSK {selectedHskLevel} mới nhất...
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* TAB 2: DAILY REVIEW & QUICK QUIZ */}
        {activeTab === "daily" && (
          <View style={styles.tabSection}>
            {/* Daily Challenge Banner */}
            <View style={styles.dailyBanner}>
              <View style={styles.dailyBannerLeft}>
                <View style={styles.dailyBadge}>
                  <Feather name="zap" size={14} color="#ED6C02" />
                  <Text style={styles.dailyBadgeText}>Mục tiêu hôm nay</Text>
                </View>
                <Text style={styles.dailyBannerTitle}>Thử thách nhanh 5 phút</Text>
                <Text style={styles.dailyBannerSubtitle}>
                  Ôn 5 từ vựng ngẫu nhiên để duy trì chuỗi học hằng ngày
                </Text>
              </View>

              <TouchableOpacity
                style={styles.dailyQuizActionBtn}
                onPress={() => setShowDailyQuizModal(true)}
              >
                <Text style={styles.dailyQuizActionText}>Bắt đầu ngay</Text>
                <Feather name="arrow-right" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Spaced Repetition Review Box */}
            <View style={styles.spacedReviewCard}>
              <View style={styles.spacedHeader}>
                <Feather name="refresh-cw" size={16} color={colors.light.primary} />
                <Text style={styles.spacedTitle}>Từ vựng cần ôn lại (Spaced Repetition):</Text>
              </View>
              <Text style={styles.spacedSub}>
                Các từ vựng bạn đã từng học nhưng lâu chưa luyện lại:
              </Text>

              <View style={styles.spacedList}>
                {spacedWords.map((w) => (
                  <View key={w.id} style={styles.spacedItem}>
                    <Text style={styles.spacedChar}>{w.character}</Text>
                    <View style={styles.spacedInfo}>
                      <Text style={styles.spacedPinyin}>{w.pinyin}</Text>
                      <Text style={styles.spacedMeaning}>{w.meaning}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.spacedPlayBtn}
                      onPress={() => router.push({ pathname: "/character/[id]", params: { id: w.id } })}
                    >
                      <Feather name="eye" size={14} color={colors.light.primary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* TAB 3: HSK VOCABULARY CORE */}
        {activeTab === "words" && (
          <View style={styles.tabSection}>
            {HSK_LEVELS.map((lvl) => {
              const p = progress[lvl.level];
              const learned = p?.learned ?? 0;
              const levelWords = HSK_WORDS.filter((w) => w.hskLevel === lvl.level);
              const total = levelWords.length;
              const pct = total > 0 ? Math.round((learned / total) * 100) : 0;
              const color = colors.hsk[lvl.level - 1];

              return (
                <TouchableOpacity
                  key={lvl.level}
                  style={[styles.card, { borderTopColor: color }]}
                  onPress={() => router.push({ pathname: "/hsk/[level]", params: { level: lvl.level } })}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardTop}>
                    <View style={[styles.badge, { backgroundColor: color }]}>
                      <Text style={styles.badgeText}>HSK {lvl.level}</Text>
                    </View>
                    <Text style={styles.pct}>{pct}%</Text>
                  </View>
                  <Text style={styles.cardName}>{lvl.description}</Text>
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Feather name="book" size={13} color={colors.light.mutedForeground} />
                      <Text style={styles.metaText}>{total} từ trong app</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Feather name="check-circle" size={13} color="#43A047" />
                      <Text style={styles.metaText}>{learned} đã học</Text>
                    </View>
                  </View>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${pct}%` as any, backgroundColor: color },
                      ]}
                    />
                  </View>
                  <View style={styles.cardFooter}>
                    <Text style={styles.actionText}>Xem danh sách</Text>
                    <TouchableOpacity
                      style={[styles.studyBtn, { backgroundColor: color }]}
                      onPress={() =>
                        router.push({ pathname: "/study/[level]", params: { level: lvl.level } })
                      }
                    >
                      <Feather name="play" size={13} color="#fff" />
                      <Text style={styles.studyBtnText}>Học ngay</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* HSK EXAM PLAYER MODAL */}
      <HSKExamModal
        visible={showExamModal}
        exam={selectedExam}
        onClose={() => setShowExamModal(false)}
      />

      {/* DAILY QUIZ MODAL */}
      <DailyQuizModal
        visible={showDailyQuizModal}
        onClose={() => setShowDailyQuizModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", color: colors.light.foreground },
  subtitle: {
    fontSize: 13,
    color: colors.light.mutedForeground,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  tabBarContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
    gap: 8,
  },
  mainTabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
  },
  mainTabBtnActive: {
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  mainTabText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: colors.light.mutedForeground,
  },
  mainTabTextActive: {
    color: colors.light.primary,
    fontFamily: "Inter_700Bold",
  },
  content: { paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 120 },
  tabSection: { gap: 16 },
  levelSelectorBox: { gap: 8 },
  levelSelectorTitle: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: colors.light.foreground,
  },
  levelRow: { flexDirection: "row" },
  levelChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F0F0F0",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginRight: 8,
  },
  levelChipText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: colors.light.mutedForeground,
  },
  levelChipTextSelected: {
    color: "#FFFFFF",
  },
  examList: { gap: 12 },
  sectionHeaderTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: colors.light.foreground,
    marginTop: 4,
  },
  examCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.light.border,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  examCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  officialTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  officialTagText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: "#2E7D32",
  },
  examDurationText: {
    fontSize: 12,
    color: colors.light.mutedForeground,
    fontFamily: "Inter_500Medium",
  },
  examCardTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: colors.light.foreground,
  },
  examCardSubtitle: {
    fontSize: 13,
    color: colors.light.mutedForeground,
    fontFamily: "Inter_400Regular",
  },
  examMetaRow: {
    flexDirection: "row",
    gap: 16,
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 12, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular" },
  startExamBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.light.primary,
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 4,
  },
  startExamBtnText: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  emptyExamBox: {
    padding: 24,
    alignItems: "center",
    backgroundColor: "#F9F9F9",
    borderRadius: 16,
  },
  emptyExamText: {
    fontSize: 13,
    color: colors.light.mutedForeground,
    textAlign: "center",
  },
  dailyBanner: {
    backgroundColor: "#FFF8F7",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#FFCDD2",
    gap: 14,
  },
  dailyBannerLeft: { gap: 6 },
  dailyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF3E0",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dailyBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: "#ED6C02",
  },
  dailyBannerTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: colors.light.foreground,
  },
  dailyBannerSubtitle: {
    fontSize: 13,
    color: colors.light.mutedForeground,
    lineHeight: 18,
  },
  dailyQuizActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#ED6C02",
    borderRadius: 14,
    paddingVertical: 12,
  },
  dailyQuizActionText: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 14,
  },
  spacedReviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.light.border,
    gap: 10,
  },
  spacedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  spacedTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: colors.light.foreground,
  },
  spacedSub: {
    fontSize: 12,
    color: colors.light.mutedForeground,
  },
  spacedList: {
    gap: 8,
    marginTop: 4,
  },
  spacedItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F9F9F9",
    borderRadius: 12,
    gap: 12,
  },
  spacedChar: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: colors.light.primary,
    minWidth: 40,
  },
  spacedInfo: {
    flex: 1,
  },
  spacedPinyin: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: colors.light.foreground,
  },
  spacedMeaning: {
    fontSize: 12,
    color: colors.light.mutedForeground,
  },
  spacedPlayBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#FFF5F5",
  },
  card: {
    backgroundColor: colors.light.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.light.border,
    borderTopWidth: 4,
    gap: 10,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  badge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  badgeText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 13 },
  pct: { fontSize: 20, fontFamily: "Inter_700Bold", color: colors.light.foreground },
  cardName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.light.foreground },
  metaRow: { flexDirection: "row", gap: 18 },
  progressTrack: { height: 6, backgroundColor: colors.light.muted, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  actionText: { fontSize: 13, color: colors.light.primary, fontFamily: "Inter_600SemiBold" },
  studyBtn: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  studyBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 13 },
});
