import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import colors from "@/constants/colors";
import { HSK_LEVELS, HSK_WORDS } from "@/constants/data";
import { useLearning } from "@/context/LearningContext";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { learnedWords, savedWords, streak, progress, lastStudyDate } = useLearning();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const totalWords = HSK_WORDS.length;
  const overallPct = totalWords > 0 ? Math.round((learnedWords.length / totalWords) * 100) : 0;

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Tiến trình học</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>汉</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Người học tiếng Trung</Text>
            <Text style={styles.profileSub}>
              {lastStudyDate ? `Học lần cuối: ${lastStudyDate}` : "Bắt đầu học ngay!"}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: "#FFF3E0" }]}>
              <Feather name="zap" size={20} color="#FF8F00" />
            </View>
            <Text style={styles.statNum}>{streak}</Text>
            <Text style={styles.statLabel}>Ngày liên tiếp</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: "#E8F5E9" }]}>
              <Feather name="check-circle" size={20} color="#43A047" />
            </View>
            <Text style={styles.statNum}>{learnedWords.length}</Text>
            <Text style={styles.statLabel}>Từ đã học</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: "#FCE4EC" }]}>
              <Feather name="bookmark" size={20} color="#E91E63" />
            </View>
            <Text style={styles.statNum}>{savedWords.length}</Text>
            <Text style={styles.statLabel}>Từ đã lưu</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: "#E3F2FD" }]}>
              <Feather name="percent" size={20} color="#1E88E5" />
            </View>
            <Text style={styles.statNum}>{overallPct}%</Text>
            <Text style={styles.statLabel}>Hoàn thành</Text>
          </View>
        </View>

        {/* Overall progress bar */}
        <View style={styles.overallCard}>
          <View style={styles.overallTop}>
            <Text style={styles.overallLabel}>Tổng tiến trình</Text>
            <Text style={styles.overallPct}>{learnedWords.length}/{totalWords}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${overallPct}%` as any }]} />
          </View>
        </View>

        {/* Per-level breakdown */}
        <Text style={styles.sectionTitle}>Tiến trình theo cấp độ</Text>
        {HSK_LEVELS.map((lvl) => {
          const p = progress[lvl.level];
          const learned = p?.learned ?? 0;
          const levelWords = HSK_WORDS.filter((w) => w.hskLevel === lvl.level);
          const total = levelWords.length;
          const pct = total > 0 ? Math.round((learned / total) * 100) : 0;
          const color = colors.hsk[lvl.level - 1];

          return (
            <View key={lvl.level} style={styles.levelRow}>
              <View style={[styles.levelDot, { backgroundColor: color }]}>
                <Text style={styles.levelNum}>{lvl.level}</Text>
              </View>
              <View style={styles.levelInfo}>
                <View style={styles.levelTop}>
                  <Text style={styles.levelName}>HSK {lvl.level}</Text>
                  <Text style={styles.levelCount}>{learned}/{total}</Text>
                </View>
                <View style={styles.progressTrackSmall}>
                  <View
                    style={[styles.progressFillSmall, { width: `${pct}%` as any, backgroundColor: color }]}
                  />
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", color: colors.light.foreground },
  content: { paddingHorizontal: 16, paddingBottom: 120, gap: 0 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.light.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.light.border,
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 28, color: "#fff", fontWeight: "700" },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 17, fontFamily: "Inter_700Bold", color: colors.light.foreground },
  profileSub: { fontSize: 13, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 3 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    minWidth: "44%",
    backgroundColor: colors.light.card,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  statIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  statNum: { fontSize: 24, fontFamily: "Inter_700Bold", color: colors.light.foreground },
  statLabel: { fontSize: 12, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center" },
  overallCard: {
    backgroundColor: colors.light.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.light.border,
    gap: 12,
  },
  overallTop: { flexDirection: "row", justifyContent: "space-between" },
  overallLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.light.foreground },
  overallPct: { fontSize: 15, fontFamily: "Inter_700Bold", color: colors.light.primary },
  progressTrack: { height: 8, backgroundColor: colors.light.muted, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.light.primary, borderRadius: 4 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: colors.light.foreground, marginBottom: 14 },
  levelRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.light.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.light.border,
    gap: 14,
  },
  levelDot: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  levelNum: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 16 },
  levelInfo: { flex: 1, gap: 6 },
  levelTop: { flexDirection: "row", justifyContent: "space-between" },
  levelName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.light.foreground },
  levelCount: { fontSize: 12, color: colors.light.mutedForeground, fontFamily: "Inter_500Medium" },
  progressTrackSmall: { height: 5, backgroundColor: colors.light.muted, borderRadius: 3, overflow: "hidden" },
  progressFillSmall: { height: "100%", borderRadius: 3 },
});
