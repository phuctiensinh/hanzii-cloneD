import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
import { HSK_LEVEL_METAS } from "@/constants/examConfig";
import { ExamResult, HSKLevel } from "@/types/hskExam";
import { HSKStorage } from "@/lib/hsk/storage";

export default function HSKHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const [history, setHistory] = useState<ExamResult[]>([]);
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<number | "all">("all");

  useEffect(() => {
    HSKStorage.getHistory().then((h) => setHistory(h));
  }, []);

  const filteredHistory = history.filter((item) =>
    selectedLevelFilter === "all" ? true : item.level === selectedLevelFilter
  );

  const totalExams = history.length;
  const passedExams = history.filter((h) => h.isPassed).length;
  const avgAccuracy = totalExams > 0
    ? Math.round(history.reduce((acc, h) => acc + h.accuracy, 0) / totalExams)
    : 0;

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      {/* Navbar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace("/hsk-test" as any);
          }}
          style={styles.backBtn}
        >
          <Feather name="arrow-left" size={18} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Lịch Sử Thi & Tiến Trình</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* STATS SUMMARY BAR */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{totalExams}</Text>
            <Text style={styles.statLabel}>Đề đã làm</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: "#16A34A" }]}>{passedExams}</Text>
            <Text style={styles.statLabel}>Đạt (PASS)</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: colors.light.primary }]}>{avgAccuracy}%</Text>
            <Text style={styles.statLabel}>Độ chính xác TB</Text>
          </View>
        </View>

        {/* FILTER BY LEVEL CHIPS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          <TouchableOpacity
            style={[styles.filterChip, selectedLevelFilter === "all" && styles.filterChipActive]}
            onPress={() => setSelectedLevelFilter("all")}
          >
            <Text style={[styles.filterChipText, selectedLevelFilter === "all" && styles.filterChipTextActive]}>
              Tất cả
            </Text>
          </TouchableOpacity>

          {([1, 2, 3, 4, 5, 6] as HSKLevel[]).map((lvl) => (
            <TouchableOpacity
              key={lvl}
              style={[styles.filterChip, selectedLevelFilter === lvl && styles.filterChipActive]}
              onPress={() => setSelectedLevelFilter(lvl)}
            >
              <Text style={[styles.filterChipText, selectedLevelFilter === lvl && styles.filterChipTextActive]}>
                HSK {lvl}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* EXAM ATTEMPTS LIST */}
        {filteredHistory.length === 0 ? (
          <View style={styles.emptyCard}>
            <Feather name="file-text" size={40} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Chưa có lịch sử làm bài</Text>
            <Text style={styles.emptySub}>Hãy tạo một đề thi mới để bắt đầu kiểm tra trình độ của bạn!</Text>
            <TouchableOpacity style={styles.createBtn} onPress={() => router.push("/hsk-test" as any)}>
              <Text style={styles.createBtnText}>Tạo đề thi ngay</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.historyList}>
            {filteredHistory.map((item) => {
              const meta = HSK_LEVEL_METAS[item.level];
              return (
                <TouchableOpacity
                  key={item.examId}
                  style={styles.historyCard}
                  onPress={() => router.push({ pathname: `/hsk-test/result/${item.examId}` as any })}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardTop}>
                    <View style={[styles.lvlBadge, { backgroundColor: meta?.badgeColor || colors.light.primary }]}>
                      <Text style={styles.lvlBadgeText}>HSK {item.level}</Text>
                    </View>
                    <View style={styles.cardHeaderInfo}>
                      <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.cardDate}>
                        {new Date(item.completedAt).toLocaleString("vi-VN")} • {Math.round(item.timeSpentSeconds / 60)} phút
                      </Text>
                    </View>
                    <View style={[styles.passTag, { backgroundColor: item.isPassed ? "#DCFCE7" : "#FEE2E2" }]}>
                      <Text style={[styles.passTagText, { color: item.isPassed ? "#166534" : "#991B1B" }]}>
                        {item.isPassed ? "PASS" : "FAIL"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardBottom}>
                    <View style={styles.scoreRow}>
                      <Text style={styles.scoreNumText}>{item.totalScore}/{item.maxScore} Điểm</Text>
                      <Text style={styles.accuracyText}>{item.accuracy}% chính xác</Text>
                    </View>

                    <View style={styles.sectionsRow}>
                      {item.sectionScores.map((sec, sIdx) => (
                        <Text key={sIdx} style={styles.sectionMiniScore}>
                          {sec.type === "listening" ? "🎧 Nghe" : sec.type === "reading" ? "📖 Đọc" : "✍️ Viết"}: {sec.score}đ
                        </Text>
                      ))}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  backBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  navTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#111827" },
  content: { padding: 16, paddingBottom: 100, gap: 16 },

  // Stats Card
  statsCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },
  statItem: { flex: 1, alignItems: "center", gap: 2 },
  statNum: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#111827" },
  statLabel: { fontSize: 11, color: "#6B7280" },
  statDivider: { width: 1, height: 32, backgroundColor: "#E5E7EB" },

  // Chip Row
  chipRow: { flexDirection: "row" },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "#E5E7EB", marginRight: 8 },
  filterChipActive: { backgroundColor: colors.light.primary },
  filterChipText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#4B5563" },
  filterChipTextActive: { color: "#FFFFFF", fontFamily: "Inter_700Bold" },

  // Empty Card
  emptyCard: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 32, alignItems: "center", gap: 10, borderWidth: 1, borderColor: "#E5E7EB" },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#374151" },
  emptySub: { fontSize: 12, color: "#6B7280", textAlign: "center", lineHeight: 18 },
  createBtn: { backgroundColor: colors.light.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, marginTop: 6 },
  createBtnText: { color: "#FFFFFF", fontSize: 13, fontFamily: "Inter_700Bold" },

  // History List
  historyList: { gap: 10 },
  historyCard: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#E5E7EB", gap: 10 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  lvlBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  lvlBadgeText: { color: "#FFFFFF", fontSize: 11, fontFamily: "Inter_700Bold" },
  cardHeaderInfo: { flex: 1 },
  cardTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#111827" },
  cardDate: { fontSize: 11, color: "#6B7280", marginTop: 2 },
  passTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  passTagText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  cardBottom: { borderTopWidth: 1, borderTopColor: "#F3F4F6", paddingTop: 8, gap: 4 },
  scoreRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  scoreNumText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#111827" },
  accuracyText: { fontSize: 12, color: "#6B7280" },
  sectionsRow: { flexDirection: "row", gap: 10 },
  sectionMiniScore: { fontSize: 11, color: "#4B5563" },
});
