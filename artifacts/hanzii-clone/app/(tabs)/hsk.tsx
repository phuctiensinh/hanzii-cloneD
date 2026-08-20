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
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import colors from "@/constants/colors";
import { HSK_WORDS } from "@/constants/data";
import { HSK_EXAMS, HSKExam } from "@/constants/hskExams";
import { HSKExamModal } from "@/components/HSKExamModal";
import { DailyQuizModal } from "@/components/DailyQuizModal";

type ActiveTab = "exams" | "daily";

export default function HSKScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<ActiveTab>("exams");
  const [selectedHskLevel, setSelectedHskLevel] = useState<number>(1);
  const [selectedExam, setSelectedExam] = useState<HSKExam | null>(null);
  const [showExamModal, setShowExamModal] = useState(false);
  const [showDailyQuizModal, setShowDailyQuizModal] = useState(false);
  const [generatingAiExam, setGeneratingAiExam] = useState(false);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  // Get Spaced Repetition words
  const spacedWords = HSK_WORDS.slice(0, 5);

  // Generate a brand new AI exam for chosen HSK level
  const handleGenerateAiExam = async (levelToGen: number) => {
    setGeneratingAiExam(true);

    try {
      const response = await fetch("/api/generate-hsk-exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level: levelToGen }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const aiExam: HSKExam = await response.json();
      setSelectedExam(aiExam);
      setShowExamModal(true);
    } catch (err: any) {
      console.warn("[HSKScreen] AI exam generation fallback to static exam:", err);
      // Fallback to static exam if server error or API unavailable
      const fallbackExam = HSK_EXAMS.find((ex) => ex.level === levelToGen) || HSK_EXAMS[0];
      setSelectedExam(fallbackExam);
      setShowExamModal(true);
      Alert.alert(
        "Thông báo bộ đề mẫu",
        `Đã tải bộ đề thi HSK ${levelToGen} mẫu chuẩn chuẩn bị sẵn cho bạn!`
      );
    } finally {
      setGeneratingAiExam(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Luyện Thi & Ôn Tập HSK</Text>
        <Text style={styles.subtitle}>Hệ thống bộ đề thi AI độc bản chuẩn quốc tế Hanban / CTI</Text>
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
          <Text style={[styles.mainTabText, activeTab === "exams" && styles.mainTabTextActive]}>
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
          <Text style={[styles.mainTabText, activeTab === "daily" && styles.mainTabTextActive]}>
            Ôn Hằng Ngày
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* TAB 1: AI EXAM GENERATOR (Clean Unified Design) */}
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

            {/* AI Exam Generator Banner (Unified Light Card Theme) */}
            <View style={styles.aiGenCard}>
              <View style={styles.aiGenHeader}>
                <View style={styles.aiGenBadge}>
                  <Feather name="cpu" size={14} color={colors.light.primary} />
                  <Text style={styles.aiGenBadgeText}>AI Exam Generator</Text>
                </View>
                <Text style={styles.aiGenTitle}>
                  Tạo bộ đề thi HSK {selectedHskLevel} độc bản bằng AI
                </Text>
                <Text style={styles.aiGenSub}>
                  Mỗi lần bấm vào thi, hệ thống AI sẽ biên soạn ngẫu nhiên 100% đề thi mới bám sát cấu trúc HSK {selectedHskLevel} chuẩn quốc tế của Hanban.
                </Text>
              </View>

              <TouchableOpacity
                disabled={generatingAiExam}
                style={[styles.aiGenBtn, generatingAiExam && styles.btnDisabled]}
                onPress={() => handleGenerateAiExam(selectedHskLevel)}
                activeOpacity={0.85}
              >
                {generatingAiExam ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.aiGenBtnText}>AI đang biên soạn đề HSK {selectedHskLevel}...</Text>
                  </>
                ) : (
                  <>
                    <Feather name="zap" size={18} color="#FFFFFF" />
                    <Text style={styles.aiGenBtnText}>Tạo đề mới & Vào thi ngay (AI)</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* TAB 2: DAILY PRACTICE & QUIZ */}
        {activeTab === "daily" && (
          <View style={styles.tabSection}>
            <View style={styles.dailyBanner}>
              <View style={styles.dailyBannerLeft}>
                <View style={styles.dailyBadge}>
                  <Feather name="zap" size={14} color="#ED6C02" />
                  <Text style={styles.dailyBadgeText}>Mục tiêu hôm nay</Text>
                </View>
                <Text style={styles.dailyBannerTitle}>Thử thách nhanh 5 phút</Text>
                <Text style={styles.dailyBannerSubtitle}>
                  Ôn 5 từ vựng ngẫu nhiên để duy trì chuỗi học hằng ngày (Daily Streak)
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
  header: { paddingHorizontal: 20, paddingBottom: 10 },
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
    gap: 10,
  },
  mainTabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
  },
  mainTabBtnActive: {
    backgroundColor: "#FFF5F5",
    borderWidth: 1.5,
    borderColor: colors.light.primary,
  },
  mainTabText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: colors.light.mutedForeground,
  },
  mainTabTextActive: {
    color: colors.light.primary,
    fontFamily: "Inter_700Bold",
  },
  content: { paddingHorizontal: 16, paddingVertical: 14, paddingBottom: 120 },
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
  aiGenCard: {
    backgroundColor: "#FFF8F7",
    borderRadius: 20,
    padding: 22,
    borderWidth: 1.5,
    borderColor: "#FFCDD2",
    gap: 16,
  },
  aiGenHeader: {
    gap: 8,
  },
  aiGenBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFEEEF",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  aiGenBadgeText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: colors.light.primary,
  },
  aiGenTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: colors.light.foreground,
  },
  aiGenSub: {
    fontSize: 13,
    color: colors.light.mutedForeground,
    lineHeight: 19,
  },
  aiGenBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.light.primary,
    borderRadius: 14,
    paddingVertical: 14,
  },
  aiGenBtnText: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 15,
  },
  btnDisabled: {
    opacity: 0.6,
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
});
