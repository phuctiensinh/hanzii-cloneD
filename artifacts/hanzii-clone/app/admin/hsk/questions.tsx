import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import colors from "@/constants/colors";
import { HSKLevel, HSKQuestion, QuestionStatus } from "@/types/hskExam";
import { HSKStorage } from "@/lib/hsk/storage";
import { useSpeech } from "@/hooks/useSpeech";

export default function AdminHSKQuestionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const { speak } = useSpeech();

  const [questions, setQuestions] = useState<HSKQuestion[]>([]);
  const [levelFilter, setLevelFilter] = useState<number | "all">("all");
  const [statusFilter, setStatusFilter] = useState<QuestionStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const loadQuestions = async () => {
    const list = await HSKStorage.getAllQuestions();
    setQuestions(list);
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: QuestionStatus) => {
    await HSKStorage.updateQuestionStatus(id, newStatus);
    await loadQuestions();
  };

  const handleDelete = (id: string) => {
    Alert.alert("Xóa câu hỏi", "Bạn có chắc chắn muốn xóa câu hỏi này khỏi hệ thống?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          await HSKStorage.deleteQuestion(id);
          await loadQuestions();
        },
      },
    ]);
  };

  const filteredQuestions = questions.filter((q) => {
    if (levelFilter !== "all" && q.level !== levelFilter) return false;
    if (statusFilter !== "all" && q.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const qText = (q.questionText || "").toLowerCase();
      const pText = (q.pinyinText || "").toLowerCase();
      const query = searchQuery.toLowerCase().trim();
      if (!qText.includes(query) && !pText.includes(query)) return false;
    }
    return true;
  });

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      {/* Navbar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={18} color="#374151" />
        </TouchableOpacity>
        <View style={styles.titleArea}>
          <Text style={styles.navTitle}>Quản Lý Ngân Hàng Câu Hỏi</Text>
          <Text style={styles.navSub}>{questions.length} câu hỏi trong hệ thống</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={styles.searchBox}>
          <Feather name="search" size={16} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm nội dung câu hỏi..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Feather name="x" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Level Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          <TouchableOpacity
            style={[styles.filterChip, levelFilter === "all" && styles.filterChipActive]}
            onPress={() => setLevelFilter("all")}
          >
            <Text style={[styles.filterChipText, levelFilter === "all" && styles.filterChipTextActive]}>
              Tất cả level
            </Text>
          </TouchableOpacity>
          {([1, 2, 3, 4, 5, 6] as HSKLevel[]).map((lvl) => (
            <TouchableOpacity
              key={lvl}
              style={[styles.filterChip, levelFilter === lvl && styles.filterChipActive]}
              onPress={() => setLevelFilter(lvl)}
            >
              <Text style={[styles.filterChipText, levelFilter === lvl && styles.filterChipTextActive]}>
                HSK {lvl}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Status Filters */}
        <View style={styles.statusToggleRow}>
          {(["all", "approved", "pending", "rejected"] as (QuestionStatus | "all")[]).map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.statusToggleBtn, statusFilter === st && styles.statusToggleActive]}
              onPress={() => setStatusFilter(st)}
            >
              <Text style={[styles.statusToggleText, statusFilter === st && styles.statusToggleTextActive]}>
                {st === "all" ? "Tất cả" : st === "approved" ? "Đã duyệt" : st === "pending" ? "Chờ duyệt" : "Từ chối"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Questions List */}
        <View style={styles.list}>
          {filteredQuestions.map((q) => (
            <View key={q.id} style={styles.qCard}>
              <View style={styles.qCardHeader}>
                <View style={styles.qMetaWrap}>
                  <View style={styles.lvlBadge}>
                    <Text style={styles.lvlBadgeText}>HSK {q.level}</Text>
                  </View>
                  <Text style={styles.secBadge}>{q.section.toUpperCase()}</Text>
                  <Text style={styles.typeBadge}>{q.questionType}</Text>
                </View>

                <View style={[styles.statusBadge, q.status === "approved" ? styles.bgGreen : q.status === "pending" ? styles.bgYellow : styles.bgRed]}>
                  <Text style={[styles.statusBadgeText, q.status === "approved" ? styles.textGreen : q.status === "pending" ? styles.textYellow : styles.textRed]}>
                    {q.status || "approved"}
                  </Text>
                </View>
              </View>

              <Text style={styles.qText}>{q.questionText}</Text>
              {q.pinyinText ? <Text style={styles.pinyin}>{q.pinyinText}</Text> : null}

              {q.audioText && (
                <TouchableOpacity
                  style={styles.audioRow}
                  onPress={() => q.audioText && speak(q.audioText)}
                >
                  <Feather name="volume-2" size={14} color={colors.light.primary} />
                  <Text style={styles.audioText}>{q.audioText}</Text>
                </TouchableOpacity>
              )}

              {/* Options */}
              <View style={styles.optionsWrap}>
                {q.options.map((opt) => (
                  <View
                    key={opt.id}
                    style={[
                      styles.optItem,
                      opt.id === q.correctAnswer && styles.optCorrect,
                    ]}
                  >
                    <Text style={styles.optId}>{opt.id}.</Text>
                    <Text style={styles.optVal}>{opt.text}</Text>
                    {opt.id === q.correctAnswer && (
                      <Feather name="check" size={14} color="#16A34A" />
                    )}
                  </View>
                ))}
              </View>

              <Text style={styles.explanationText}>💡 {q.explanation}</Text>

              {/* Action Buttons */}
              <View style={styles.qCardActions}>
                {q.status !== "approved" && (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.approveBtn]}
                    onPress={() => handleUpdateStatus(q.id, "approved")}
                  >
                    <Feather name="check" size={14} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>Duyệt câu hỏi</Text>
                  </TouchableOpacity>
                )}

                {q.status !== "rejected" && (
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.rejectBtn]}
                    onPress={() => handleUpdateStatus(q.id, "rejected")}
                  >
                    <Feather name="x" size={14} color="#DC2626" />
                    <Text style={[styles.actionBtnText, { color: "#DC2626" }]}>Từ chối</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.actionBtn, styles.deleteBtn]}
                  onPress={() => handleDelete(q.id)}
                >
                  <Feather name="trash-2" size={14} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
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
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    gap: 12,
  },
  backBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  titleArea: { flex: 1 },
  navTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#111827" },
  navSub: { fontSize: 11, color: "#6B7280" },
  content: { padding: 16, paddingBottom: 100, gap: 12 },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, color: "#111827" },

  chipRow: { flexDirection: "row" },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: "#E5E7EB", marginRight: 6 },
  filterChipActive: { backgroundColor: colors.light.primary },
  filterChipText: { fontSize: 11, fontFamily: "Inter_500Medium", color: "#4B5563" },
  filterChipTextActive: { color: "#FFFFFF", fontFamily: "Inter_700Bold" },

  statusToggleRow: { flexDirection: "row", backgroundColor: "#E5E7EB", borderRadius: 8, padding: 2 },
  statusToggleBtn: { flex: 1, paddingVertical: 6, alignItems: "center", borderRadius: 6 },
  statusToggleActive: { backgroundColor: "#FFFFFF" },
  statusToggleText: { fontSize: 11, color: "#6B7280", fontFamily: "Inter_500Medium" },
  statusToggleTextActive: { color: "#111827", fontFamily: "Inter_700Bold" },

  list: { gap: 12 },
  qCard: { backgroundColor: "#FFFFFF", borderRadius: 10, padding: 14, borderWidth: 1, borderColor: "#E5E7EB", gap: 8 },
  qCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  qMetaWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  lvlBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: colors.light.primary },
  lvlBadgeText: { color: "#FFFFFF", fontSize: 10, fontFamily: "Inter_700Bold" },
  secBadge: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#4B5563", backgroundColor: "#F3F4F6", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  typeBadge: { fontSize: 10, color: "#6B7280" },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", textTransform: "capitalize" },
  bgGreen: { backgroundColor: "#DCFCE7" },
  textGreen: { color: "#166534" },
  bgYellow: { backgroundColor: "#FEF3C7" },
  textYellow: { color: "#92400E" },
  bgRed: { backgroundColor: "#FEE2E2" },
  textRed: { color: "#991B1B" },

  qText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#111827" },
  pinyin: { fontSize: 12, color: "#6B7280", fontStyle: "italic" },
  audioRow: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FFF5F5", padding: 6, borderRadius: 6 },
  audioText: { fontSize: 12, color: "#374151" },

  optionsWrap: { gap: 4 },
  optItem: { flexDirection: "row", alignItems: "center", padding: 6, borderRadius: 6, backgroundColor: "#F9FAFB", gap: 6 },
  optCorrect: { backgroundColor: "#F0FDF4", borderWidth: 1, borderColor: "#86EFAC" },
  optId: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#374151" },
  optVal: { flex: 1, fontSize: 12, color: "#1F2937" },
  explanationText: { fontSize: 11, color: "#6B7280", lineHeight: 16 },

  qCardActions: { flexDirection: "row", gap: 8, borderTopWidth: 1, borderTopColor: "#F3F4F6", paddingTop: 8 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  approveBtn: { backgroundColor: "#16A34A" },
  rejectBtn: { backgroundColor: "#FEE2E2", borderWidth: 1, borderColor: "#FCA5A5" },
  deleteBtn: { backgroundColor: "#F3F4F6", marginLeft: "auto" },
  actionBtnText: { color: "#FFFFFF", fontSize: 11, fontFamily: "Inter_600SemiBold" },
});
