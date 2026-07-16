import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import colors from "@/constants/colors";
import { getWordsByHSK } from "@/constants/data";
import { useLearning } from "@/context/LearningContext";
import { FlashCard } from "@/components/FlashCard";

export default function StudyScreen() {
  const { level } = useLocalSearchParams<{ level: string }>();
  const lvl = Number(level);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { markLearned, isLearned } = useLearning();

  const allWords = getWordsByHSK(lvl);
  const [index, setIndex] = useState(0);
  const [sessionLearned, setSessionLearned] = useState(0);
  const [done, setDone] = useState(false);
  const [showingBack, setShowingBack] = useState(false);

  const color = colors.hsk[(lvl - 1) % colors.hsk.length];
  const current = allWords[index];
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const handleKnow = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (!isLearned(current.id)) {
      markLearned(current.id, lvl);
      setSessionLearned((n) => n + 1);
    }
    if (index + 1 >= allWords.length) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
      setShowingBack(false);
    }
  }, [current, index, allWords.length, isLearned, markLearned, lvl]);

  const handleSkip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (index + 1 >= allWords.length) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
      setShowingBack(false);
    }
  }, [index, allWords.length]);

  if (allWords.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: topPadding }]}>
        <Text style={styles.emptyText}>Không có từ nào trong HSK {lvl}</Text>
      </View>
    );
  }

  if (done) {
    return (
      <View style={[styles.container, { paddingTop: topPadding, paddingBottom: bottomPadding }]}>
        <View style={styles.doneCard}>
          <View style={[styles.doneIcon, { backgroundColor: color + "20" }]}>
            <Feather name="star" size={40} color={color} />
          </View>
          <Text style={styles.doneTitle}>Hoàn thành!</Text>
          <Text style={styles.doneSubtitle}>
            Bạn đã học {sessionLearned} từ mới trong HSK {lvl}
          </Text>
          <View style={styles.doneStats}>
            <View style={styles.doneStat}>
              <Text style={styles.doneStatNum}>{allWords.length}</Text>
              <Text style={styles.doneStatLabel}>Tổng từ</Text>
            </View>
            <View style={styles.doneDivider} />
            <View style={styles.doneStat}>
              <Text style={styles.doneStatNum}>{sessionLearned}</Text>
              <Text style={styles.doneStatLabel}>Đã học</Text>
            </View>
            <View style={styles.doneDivider} />
            <View style={styles.doneStat}>
              <Text style={styles.doneStatNum}>{allWords.length - sessionLearned}</Text>
              <Text style={styles.doneStatLabel}>Bỏ qua</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.restartBtn, { backgroundColor: color }]}
            onPress={() => { setIndex(0); setSessionLearned(0); setDone(false); setShowingBack(false); }}
          >
            <Feather name="refresh-cw" size={16} color="#fff" />
            <Text style={styles.restartBtnText}>Học lại</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Feather name="x" size={20} color={colors.light.foreground} />
        </TouchableOpacity>
        <View style={styles.progressArea}>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${((index) / allWords.length) * 100}%` as any, backgroundColor: color },
              ]}
            />
          </View>
          <Text style={styles.progressText}>{index + 1}/{allWords.length}</Text>
        </View>
      </View>

      {/* Card */}
      <View style={styles.cardArea}>
        <FlashCard word={current} onFlip={(s) => setShowingBack(s === "back")} />
      </View>

      {/* Hint */}
      <Text style={styles.hint}>Nhấn vào thẻ để xem nghĩa</Text>

      {/* Buttons */}
      <View style={[styles.btnRow, { paddingBottom: bottomPadding + 20 }]}>
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={0.8}>
          <Feather name="arrow-right" size={20} color={colors.light.mutedForeground} />
          <Text style={styles.skipText}>Bỏ qua</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.knowBtn, { backgroundColor: color }]} onPress={handleKnow} activeOpacity={0.8}>
          <Feather name="check" size={20} color="#fff" />
          <Text style={styles.knowText}>Đã biết</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.light.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  progressArea: { flex: 1, gap: 6 },
  progressTrack: { height: 6, backgroundColor: colors.light.muted, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  progressText: { fontSize: 12, color: colors.light.mutedForeground, fontFamily: "Inter_500Medium", textAlign: "right" },
  cardArea: { flex: 1, paddingHorizontal: 20, justifyContent: "center" },
  hint: { textAlign: "center", fontSize: 13, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular", marginVertical: 12 },
  btnRow: { flexDirection: "row", paddingHorizontal: 20, gap: 12 },
  skipBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.light.card,
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  skipText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: colors.light.mutedForeground },
  knowBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 16,
    paddingVertical: 16,
  },
  knowText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  emptyText: { textAlign: "center", marginTop: 40, color: colors.light.mutedForeground, fontSize: 16 },
  // Done screen
  doneCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  doneIcon: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center" },
  doneTitle: { fontSize: 32, fontFamily: "Inter_700Bold", color: colors.light.foreground },
  doneSubtitle: { fontSize: 15, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center" },
  doneStats: {
    flexDirection: "row",
    backgroundColor: colors.light.card,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.light.border,
    gap: 16,
    width: "100%",
  },
  doneStat: { flex: 1, alignItems: "center", gap: 4 },
  doneStatNum: { fontSize: 26, fontFamily: "Inter_700Bold", color: colors.light.foreground },
  doneStatLabel: { fontSize: 12, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular" },
  doneDivider: { width: 1, height: 40, backgroundColor: colors.light.border },
  restartBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: "100%",
    justifyContent: "center",
  },
  restartBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  backBtn: { paddingVertical: 12 },
  backBtnText: { fontSize: 15, color: colors.light.mutedForeground, fontFamily: "Inter_500Medium" },
});
