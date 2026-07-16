import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import colors from "@/constants/colors";
import { HSK_LEVELS, HSK_WORDS } from "@/constants/data";
import { useLearning } from "@/context/LearningContext";

export default function HSKScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { progress } = useLearning();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Từ vựng HSK</Text>
        <Text style={styles.subtitle}>Hệ thống chuẩn quốc tế</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
                <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: color }]} />
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.actionText}>Xem danh sách</Text>
                <TouchableOpacity
                  style={[styles.studyBtn, { backgroundColor: color }]}
                  onPress={() => router.push({ pathname: "/study/[level]", params: { level: lvl.level } })}
                >
                  <Feather name="play" size={13} color="#fff" />
                  <Text style={styles.studyBtnText}>Học ngay</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", color: colors.light.foreground },
  subtitle: { fontSize: 14, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 2 },
  content: { paddingHorizontal: 16, paddingBottom: 120 },
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
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 12, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular" },
  progressTrack: { height: 6, backgroundColor: colors.light.muted, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  actionText: { fontSize: 13, color: colors.light.primary, fontFamily: "Inter_600SemiBold" },
  studyBtn: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  studyBtnText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 13 },
});
