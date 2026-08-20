import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useCallback, useRef } from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import colors from "@/constants/colors";
import { getWordById } from "@/constants/data";
import { useLearning } from "@/context/LearningContext";
import { useCustomWords } from "@/context/CustomWordsContext";
import { HSKBadge } from "@/components/HSKBadge";
import { SpeakerButton } from "@/components/SpeakerButton";
import { StrokeOrderView } from "@/components/StrokeOrderView";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Toast } from "@/components/Toast";
import { PronunciationModal } from "@/components/PronunciationModal";

export default function CharacterDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { toggleSaved, markLearned, unmarkLearned, isSaved, isLearned } = useLearning();
  const { getCustomWordById, deleteWord } = useCustomWords();

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: "success" | "info" | "error" }>({
    visible: false,
    message: "",
    type: "success",
  });
  const [pronounceModal, setPronounceModal] = useState<{
    visible: boolean;
    targetText: string;
    pinyin: string;
    translation: string;
  }>({
    visible: false,
    targetText: "",
    pinyin: "",
    translation: "",
  });

  const openPronunciation = (targetText: string, pinyin: string, translation: string) => {
    setPronounceModal({ visible: true, targetText, pinyin, translation });
  };
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, type: "success" | "info" | "error" = "success") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ visible: true, message, type });
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2200);
  }, []);

  const word = getWordById(id ?? "") ?? getCustomWordById(id ?? "");
  if (!word) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.errorText}>Không tìm thấy từ</Text>
      </View>
    );
  }

  const saved = isSaved(word.id);
  const learned = isLearned(word.id);

  const handleSave = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleSaved(word.id);
    if (saved) {
      showToast(`Đã bỏ lưu "${word.character}"`, "info");
    } else {
      showToast(`Đã lưu "${word.character}" vào danh sách`, "success");
    }
  };

  const handleLearn = () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (learned) {
      unmarkLearned(word.id, word.hskLevel);
      showToast(`Đã bỏ đánh dấu "${word.character}"`, "info");
    } else {
      markLearned(word.id, word.hskLevel);
      showToast(`Đã học "${word.character}" 🎉`, "success");
    }
  };

  const goToWrite = () => {
    router.push({ pathname: "/write/[id]", params: { id: word.id } });
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  const handleDeleteConfirmed = () => {
    setConfirmVisible(false);
    deleteWord(word.id);
    handleBack();
  };

  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;
  const firstChar = [...word.character][0];

  return (
    <View style={styles.container}>
      {/* Custom header */}
      <View style={[styles.navBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={handleBack} style={styles.navBtn}>
          <Feather name="arrow-left" size={22} color={colors.light.foreground} />
        </TouchableOpacity>
        <View style={styles.navRight}>
          {word.isCustom && (
            <View style={styles.customTag}>
              <Feather name="user" size={11} color={colors.light.primary} />
              <Text style={styles.customTagText}>Từ của tôi</Text>
            </View>
          )}
          {word.isCustom ? (
            <TouchableOpacity onPress={() => setConfirmVisible(true)} style={styles.navBtn}>
              <Feather name="trash-2" size={20} color="#E53935" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleSave} style={styles.navBtn}>
              <Feather
                name={saved ? "bookmark" : "bookmark"}
                size={22}
                color={saved ? colors.light.primary : colors.light.mutedForeground}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPadding + 120 }]}>
        {/* Character hero */}
        <View style={styles.hero}>
          <Text style={styles.character}>{word.character}</Text>
          {word.traditional !== word.character && (
            <Text style={styles.traditional}>繁體: {word.traditional}</Text>
          )}
          <Text style={styles.pinyin}>{word.pinyin}</Text>
          <View style={styles.heroBottom}>
            <HSKBadge level={word.hskLevel} />
            <SpeakerButton text={word.character} size={20} />
            <TouchableOpacity
              style={styles.micPill}
              onPress={() => openPronunciation(word.character, word.pinyin, word.meaning)}
              activeOpacity={0.8}
            >
              <Feather name="mic" size={14} color={colors.light.primary} />
              <Text style={styles.micPillText}>Luyện đọc từ</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stroke order */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Thứ tự nét</Text>
            <TouchableOpacity onPress={goToWrite} style={styles.writePill}>
              <Feather name="edit-3" size={12} color={colors.light.primary} />
              <Text style={styles.writePillText}>Luyện viết</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.strokeCard}>
            <StrokeOrderView character={firstChar} size={160} autoPlay />
            {[...word.character].length > 1 && (
              <Text style={styles.multiCharNote}>
                Đang xem nét cho: <Text style={{ color: colors.light.primary }}>{firstChar}</Text> · Nhấn "Luyện viết" để xem tất cả
              </Text>
            )}
          </View>
        </View>

        {/* Meaning */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Nghĩa tiếng Việt</Text>
          <View style={styles.meaningBox}>
            <Text style={styles.meaning}>{word.meaning}</Text>
          </View>
        </View>

        {/* Examples */}
        {word.examples.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Câu ví dụ</Text>
            {word.examples.map((ex, i) => (
              <View key={i} style={styles.exampleCard}>
                <View style={styles.exHeader}>
                  <Text style={styles.exChinese}>{ex.chinese}</Text>
                  <View style={styles.exActions}>
                    <SpeakerButton text={ex.chinese} size={15} />
                    <TouchableOpacity
                      style={styles.exMicBtn}
                      onPress={() => openPronunciation(ex.chinese, ex.pinyin, ex.vietnamese)}
                      activeOpacity={0.8}
                    >
                      <Feather name="mic" size={14} color={colors.light.primary} />
                      <Text style={styles.exMicBtnText}>Luyện đọc câu</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.exPinyin}>{ex.pinyin}</Text>
                <View style={styles.divider} />
                <Text style={styles.exViet}>{ex.vietnamese}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Info grid */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Thông tin</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Bính âm</Text>
              <Text style={styles.infoValue}>{word.pinyin}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Cấp độ HSK</Text>
              <Text style={styles.infoValue}>HSK {word.hskLevel}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Chữ giản thể</Text>
              <Text style={styles.infoValue}>{word.character}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Chữ phồn thể</Text>
              <Text style={styles.infoValue}>{word.traditional}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom action buttons */}
      <View style={[styles.bottomBar, { paddingBottom: bottomPadding + 16 }]}>
        <TouchableOpacity style={styles.writeBtn} onPress={goToWrite} activeOpacity={0.8}>
          <Feather name="edit-3" size={18} color={colors.light.primary} />
          <Text style={styles.writeBtnText}>Luyện viết</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, learned && styles.actionBtnActive]}
          onPress={handleLearn}
          activeOpacity={0.8}
        >
          <Feather name={learned ? "check-circle" : "circle"} size={18} color={learned ? "#fff" : colors.light.primary} />
          <Text style={[styles.actionBtnText, learned && styles.actionBtnTextActive]}>
            {learned ? "Đã học" : "Đánh dấu đã học"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Custom confirm modal (replaces window.confirm / Alert) */}
      <ConfirmModal
        visible={confirmVisible}
        title="Xoá từ này?"
        message={`Từ "${word.character}" sẽ bị xoá khỏi danh sách của bạn.`}
        confirmText="Xoá"
        cancelText="Huỷ"
        destructive
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmVisible(false)}
      />

      {/* Toast notification */}
      <Toast visible={toast.visible} message={toast.message} type={toast.type} />

      {/* Pronunciation AI Assessment Modal */}
      <PronunciationModal
        visible={pronounceModal.visible}
        targetText={pronounceModal.targetText}
        pinyin={pronounceModal.pinyin}
        translation={pronounceModal.translation}
        onClose={() => setPronounceModal((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  micPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: "#FFCDD2",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  micPillText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: colors.light.primary,
  },
  exActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  exMicBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: "#FFCDD2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
  },
  exMicBtnText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: colors.light.primary,
  },
  navBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: colors.light.background,
  },
  navBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.light.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.light.border },
  navRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  customTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  customTagText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.light.primary },
  content: { paddingHorizontal: 20 },
  hero: {
    alignItems: "center",
    paddingVertical: 28,
    gap: 8,
    backgroundColor: colors.light.card,
    borderRadius: 24,
    marginBottom: 24,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  heroBottom: { flexDirection: "row", alignItems: "center", gap: 10 },
  character: { fontSize: 90, color: colors.light.primary, fontWeight: "700", lineHeight: 110 },
  traditional: { fontSize: 15, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular" },
  pinyin: { fontSize: 22, color: colors.light.foreground, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  sectionLabel: { fontSize: 13, color: colors.light.mutedForeground, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.8 },
  writePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  writePillText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.light.primary },
  strokeCard: {
    backgroundColor: colors.light.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.light.border,
    alignItems: "center",
    gap: 8,
  },
  multiCharNote: { fontSize: 12, color: colors.light.mutedForeground, textAlign: "center" },
  meaningBox: {
    backgroundColor: colors.light.card,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  meaning: { fontSize: 17, color: colors.light.foreground, fontFamily: "Inter_600SemiBold", lineHeight: 26 },
  exampleCard: {
    backgroundColor: colors.light.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.light.border,
    gap: 4,
  },
  exHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  exChinese: { fontSize: 18, color: colors.light.foreground, fontFamily: "Inter_700Bold", flex: 1 },
  exPinyin: { fontSize: 13, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular" },
  divider: { height: 1, backgroundColor: colors.light.border, marginVertical: 6 },
  exViet: { fontSize: 14, color: colors.light.foreground, fontFamily: "Inter_500Medium" },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  infoItem: {
    flex: 1,
    minWidth: "44%",
    backgroundColor: colors.light.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.light.border,
    gap: 4,
  },
  infoLabel: { fontSize: 11, color: colors.light.mutedForeground, fontFamily: "Inter_500Medium" },
  infoValue: { fontSize: 15, color: colors.light.foreground, fontFamily: "Inter_600SemiBold" },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.light.background,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.light.border,
    flexDirection: "row",
    gap: 10,
  },
  writeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFF5F5",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: "#FFCDD2",
  },
  writeBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: colors.light.primary },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.light.secondary,
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderColor: colors.light.primary,
  },
  actionBtnActive: { backgroundColor: colors.light.primary, borderColor: colors.light.primary },
  actionBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: colors.light.primary },
  actionBtnTextActive: { color: "#fff" },
  errorText: { fontSize: 16, color: colors.light.mutedForeground, textAlign: "center", marginTop: 40 },
});
