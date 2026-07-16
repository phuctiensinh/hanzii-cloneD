import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
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
import { useCustomWords } from "@/context/CustomWordsContext";
import { Example } from "@/types";

const HSK_LEVELS = [1, 2, 3, 4, 5, 6];
const HSK_LABELS = ["Cơ bản", "Đơn giản", "Thông thường", "Lưu loát", "Cao cấp", "Thành thạo"];

const API_BASE = (() => {
  if (typeof window !== "undefined") return "";
  return "http://localhost:80";
})();

export default function AddWordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addWord } = useCustomWords();

  const [viInput, setViInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [filled, setFilled] = useState(false);

  const [character, setCharacter] = useState("");
  const [traditional, setTraditional] = useState("");
  const [pinyin, setPinyin] = useState("");
  const [meaning, setMeaning] = useState("");
  const [hskLevel, setHskLevel] = useState(1);
  const [examples, setExamples] = useState<Example[]>([{ chinese: "", pinyin: "", vietnamese: "" }]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const autoFill = async () => {
    if (!viInput.trim()) {
      Alert.alert("Nhập từ trước", "Vui lòng nhập từ tiếng Việt cần tra.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/translate-word`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: viInput.trim() }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setCharacter(data.character ?? "");
      setTraditional(data.traditional ?? "");
      setPinyin(data.pinyin ?? "");
      setMeaning(data.meaning ?? viInput.trim());
      setHskLevel(data.hskLevel ?? 6);
      if (data.example?.chinese) {
        setExamples([data.example]);
      }
      setFilled(true);
    } catch {
      Alert.alert("Lỗi", "Không thể tự động điền. Kiểm tra kết nối và thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!character.trim()) { Alert.alert("Thiếu thông tin", "Vui lòng tự động điền hoặc nhập chữ Hán."); return; }
    if (!meaning.trim()) { Alert.alert("Thiếu thông tin", "Vui lòng nhập nghĩa tiếng Việt."); return; }
    const filteredExamples = examples.filter((ex) => ex.chinese.trim() || ex.vietnamese.trim());
    addWord({ character: character.trim(), traditional: traditional.trim() || character.trim(), pinyin: pinyin.trim(), meaning: meaning.trim(), hskLevel, examples: filteredExamples });
    router.back();
  };

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.light.foreground} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Thêm từ mới</Text>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Lưu</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]} keyboardShouldPersistTaps="handled">

          {/* Main input */}
          <View style={styles.card}>
            <Text style={styles.sectionLabel}>Nhập từ tiếng Việt</Text>
            <View style={styles.autoFillRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={viInput}
                onChangeText={setViInput}
                placeholder="e.g. yêu thương, máy tính..."
                placeholderTextColor={colors.light.mutedForeground}
                autoCorrect={false}
                onSubmitEditing={autoFill}
                returnKeyType="search"
              />
              <TouchableOpacity style={[styles.fillBtn, loading && styles.fillBtnDisabled]} onPress={autoFill} disabled={loading} activeOpacity={0.85}>
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Feather name="zap" size={15} color="#fff" />
                    <Text style={styles.fillBtnText}>AI điền</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.hint}>AI sẽ tự tạo chữ Hán, bính âm, HSK, ví dụ.</Text>
          </View>

          {/* Result fields — shown after auto-fill or manual entry */}
          {(filled || character) ? (
            <>
              <View style={styles.resultBanner}>
                <Feather name="check-circle" size={14} color="#2E7D32" />
                <Text style={styles.resultBannerText}>Đã điền tự động — bạn có thể chỉnh sửa bên dưới</Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionLabel}>Chữ Hán</Text>
                <View style={styles.fieldRow}>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Giản thể</Text>
                    <TextInput style={styles.input} value={character} onChangeText={setCharacter} placeholder="e.g. 爱" placeholderTextColor={colors.light.mutedForeground} autoCorrect={false} />
                  </View>
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Phồn thể</Text>
                    <TextInput style={styles.input} value={traditional} onChangeText={setTraditional} placeholder="e.g. 愛" placeholderTextColor={colors.light.mutedForeground} autoCorrect={false} />
                  </View>
                </View>
                <Text style={styles.fieldLabel}>Bính âm</Text>
                <TextInput style={styles.input} value={pinyin} onChangeText={setPinyin} placeholder="e.g. ài" placeholderTextColor={colors.light.mutedForeground} autoCorrect={false} autoCapitalize="none" />
                <Text style={styles.fieldLabel}>Nghĩa tiếng Việt</Text>
                <TextInput style={[styles.input, styles.inputMultiline]} value={meaning} onChangeText={setMeaning} placeholder="e.g. yêu; tình yêu" placeholderTextColor={colors.light.mutedForeground} multiline numberOfLines={2} autoCorrect={false} />
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionLabel}>Cấp độ HSK</Text>
                <View style={styles.hskRow}>
                  {HSK_LEVELS.map((lvl) => (
                    <TouchableOpacity key={lvl} style={[styles.hskBtn, hskLevel === lvl && { backgroundColor: colors.hsk[lvl - 1], borderColor: colors.hsk[lvl - 1] }]} onPress={() => setHskLevel(lvl)} activeOpacity={0.75}>
                      <Text style={[styles.hskBtnNum, hskLevel === lvl && styles.hskBtnActive]}>{lvl}</Text>
                      <Text style={[styles.hskBtnLabel, hskLevel === lvl && styles.hskBtnActive]}>{HSK_LABELS[lvl - 1]}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {examples[0]?.chinese ? (
                <View style={styles.card}>
                  <Text style={styles.sectionLabel}>Câu ví dụ (có thể sửa)</Text>
                  <Text style={styles.fieldLabel}>Tiếng Trung</Text>
                  <TextInput style={styles.input} value={examples[0].chinese} onChangeText={(v) => setExamples([{ ...examples[0], chinese: v }])} autoCorrect={false} />
                  <Text style={styles.fieldLabel}>Bính âm</Text>
                  <TextInput style={styles.input} value={examples[0].pinyin} onChangeText={(v) => setExamples([{ ...examples[0], pinyin: v }])} autoCorrect={false} autoCapitalize="none" />
                  <Text style={styles.fieldLabel}>Tiếng Việt</Text>
                  <TextInput style={styles.input} value={examples[0].vietnamese} onChangeText={(v) => setExamples([{ ...examples[0], vietnamese: v }])} autoCorrect={false} />
                </View>
              ) : null}

              <TouchableOpacity style={styles.bigSaveBtn} onPress={handleSave} activeOpacity={0.85}>
                <Feather name="check-circle" size={20} color="#fff" />
                <Text style={styles.bigSaveBtnText}>Lưu từ mới</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>✨</Text>
              <Text style={styles.emptyText}>Nhập từ tiếng Việt và bấm "AI điền" để tự động tạo chữ Hán, bính âm và ví dụ.</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  navBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12 },
  navBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.light.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.light.border },
  navTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: colors.light.foreground },
  saveBtn: { paddingHorizontal: 18, paddingVertical: 8, backgroundColor: colors.light.primary, borderRadius: 20 },
  saveBtnText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 14 },
  content: { padding: 16, gap: 14 },
  card: { backgroundColor: colors.light.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.light.border, gap: 10 },
  sectionLabel: { fontSize: 13, color: colors.light.mutedForeground, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.8 },
  autoFillRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  fillBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.light.primary, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12 },
  fillBtnDisabled: { opacity: 0.6 },
  fillBtnText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 14 },
  hint: { fontSize: 12, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular" },
  resultBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#E8F5E9", borderRadius: 12, padding: 10, borderWidth: 1, borderColor: "#A5D6A7" },
  resultBannerText: { fontSize: 13, color: "#2E7D32", fontFamily: "Inter_500Medium", flex: 1 },
  fieldRow: { flexDirection: "row", gap: 10 },
  fieldGroup: { flex: 1, gap: 4 },
  fieldLabel: { fontSize: 13, color: colors.light.foreground, fontFamily: "Inter_600SemiBold", marginTop: 2 },
  input: { backgroundColor: colors.light.background, borderRadius: 10, borderWidth: 1, borderColor: colors.light.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: colors.light.foreground, fontFamily: "Inter_400Regular" },
  inputMultiline: { minHeight: 60, textAlignVertical: "top", paddingTop: 10 },
  hskRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  hskBtn: { flex: 1, minWidth: "28%", alignItems: "center", paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: colors.light.border, backgroundColor: colors.light.background, gap: 2 },
  hskBtnNum: { fontSize: 18, fontFamily: "Inter_700Bold", color: colors.light.foreground },
  hskBtnLabel: { fontSize: 10, fontFamily: "Inter_500Medium", color: colors.light.mutedForeground },
  hskBtnActive: { color: "#fff" },
  bigSaveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: colors.light.primary, borderRadius: 16, paddingVertical: 18, marginTop: 4 },
  bigSaveBtnText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 16 },
  emptyState: { alignItems: "center", paddingVertical: 48, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 15, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 24, lineHeight: 22 },
});
