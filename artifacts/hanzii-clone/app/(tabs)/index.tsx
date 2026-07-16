import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Modal,
  Platform,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import colors from "@/constants/colors";
import { HSK_WORDS, searchWords } from "@/constants/data";
import { Word } from "@/types";
import { HSKBadge } from "@/components/HSKBadge";
import { WordListItem } from "@/components/WordListItem";
import { SpeakerButton } from "@/components/SpeakerButton";
import { useLearning } from "@/context/LearningContext";
import { useCustomWords } from "@/context/CustomWordsContext";

const POPULAR = HSK_WORDS.filter((w) => w.hskLevel === 1).slice(0, 10);

// ────────────────────────────────────────────────────────────────
// DrawSearch modal — lets user draw a character and search by it
// ────────────────────────────────────────────────────────────────
function DrawSearchModal({
  visible,
  onClose,
  onSearch,
}: {
  visible: boolean;
  onClose: () => void;
  onSearch: (q: string) => void;
}) {
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>("");
  const currentPoints = useRef<string>("");
  const [candidates, setCandidates] = useState<string[]>([]);

  // Simple stroke-based candidates from common chars
  const COMMON_CHARS = [
    "一","二","三","四","五","六","七","八","九","十",
    "人","大","小","上","下","中","国","你","我","他",
    "好","不","是","有","在","来","去","看","说","做",
    "爱","吃","喝","学","习","书","水","火","山","日",
    "月","木","口","手","心","女","男","子","父","母",
    "王","天","地","年","月","时","分","秒","今","明",
    "家","学","校","朋","友","话","请","谢","对","错",
  ];

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        currentPoints.current = `M ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
        setCurrentPath(currentPoints.current);
      },
      onPanResponderMove: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        currentPoints.current += ` L ${locationX.toFixed(1)} ${locationY.toFixed(1)}`;
        setCurrentPath(currentPoints.current);
      },
      onPanResponderRelease: () => {
        if (currentPoints.current) {
          setPaths((prev) => {
            const next = [...prev, currentPoints.current];
            // Suggest chars with similar stroke count
            const strokeCount = next.length;
            const nearby = COMMON_CHARS.filter((_, i) => {
              // rough mapping: index correlates to complexity
              const approx = Math.floor(i / 6) + 1;
              return Math.abs(approx - strokeCount) <= 1;
            }).slice(0, 12);
            setCandidates(nearby.length > 0 ? nearby : COMMON_CHARS.slice(0, 12));
            return next;
          });
        }
        currentPoints.current = "";
        setCurrentPath("");
      },
    })
  ).current;

  const clearPad = () => {
    setPaths([]);
    setCurrentPath("");
    currentPoints.current = "";
    setCandidates([]);
  };

  const selectChar = (c: string) => {
    onSearch(c);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={draw.overlay}>
        <View style={draw.sheet}>
          <View style={draw.sheetHeader}>
            <Text style={draw.sheetTitle}>Vẽ để tìm kiếm</Text>
            <TouchableOpacity onPress={() => { clearPad(); onClose(); }} style={draw.closeBtn}>
              <Feather name="x" size={20} color={colors.light.foreground} />
            </TouchableOpacity>
          </View>
          <Text style={draw.hint}>Vẽ chữ Hán vào ô bên dưới</Text>

          {/* Drawing canvas */}
          <View style={draw.padBox} {...panResponder.panHandlers}>
            {/* Grid guide */}
            <Svg width={260} height={260} viewBox="0 0 100 100" style={StyleSheet.absoluteFill} pointerEvents="none">
              <Path d="M 50 0 L 50 100" stroke="#E0E0E0" strokeWidth="0.6" strokeDasharray="3,4" />
              <Path d="M 0 50 L 100 50" stroke="#E0E0E0" strokeWidth="0.6" strokeDasharray="3,4" />
              <Path d="M 0 0 L 100 100" stroke="#F0F0F0" strokeWidth="0.4" strokeDasharray="2,6" />
              <Path d="M 100 0 L 0 100" stroke="#F0F0F0" strokeWidth="0.4" strokeDasharray="2,6" />
            </Svg>
            {/* User strokes */}
            <Svg width={260} height={260} style={StyleSheet.absoluteFill} pointerEvents="none">
              {paths.map((p, i) => (
                <Path key={i} d={p} stroke="#1A1A1A" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              ))}
              {currentPath ? (
                <Path d={currentPath} stroke="#1A1A1A" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              ) : null}
            </Svg>
            {paths.length === 0 && !currentPath && (
              <Text style={draw.padPlaceholder}>✍️ Vẽ tại đây</Text>
            )}
            {paths.length > 0 && (
              <View style={draw.strokeBadge}>
                <Text style={draw.strokeBadgeText}>{paths.length} nét</Text>
              </View>
            )}
          </View>

          {/* Clear */}
          <TouchableOpacity style={draw.clearBtn} onPress={clearPad}>
            <Feather name="trash-2" size={14} color={colors.light.mutedForeground} />
            <Text style={draw.clearText}>Xóa</Text>
          </TouchableOpacity>

          {/* Candidates */}
          {candidates.length > 0 && (
            <View style={draw.candidatesSection}>
              <Text style={draw.candidatesLabel}>Chọn chữ gần đúng:</Text>
              <View style={draw.candidatesGrid}>
                {candidates.map((c, i) => (
                  <TouchableOpacity key={i} style={draw.candidateBtn} onPress={() => selectChar(c)} activeOpacity={0.7}>
                    <Text style={draw.candidateChar}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {paths.length === 0 && (
            <View style={draw.tipRow}>
              <Feather name="info" size={13} color={colors.light.mutedForeground} />
              <Text style={draw.tipText}>Vẽ từng nét, ứng dụng sẽ gợi ý chữ phù hợp</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ────────────────────────────────────────────────────────────────
// Main screen
// ────────────────────────────────────────────────────────────────
export default function DictionaryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isSaved, isLearned } = useLearning();
  const { customWords } = useCustomWords();
  const [query, setQuery] = useState("");
  const [drawVisible, setDrawVisible] = useState(false);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  const goToChar = (word: Word) =>
    router.push({ pathname: "/character/[id]", params: { id: word.id } });

  const hskResults = searchWords(query);
  const customResults = query.trim()
    ? customWords.filter((w) => {
        const q = query.toLowerCase();
        return (
          w.character.toLowerCase().includes(q) ||
          w.pinyin.toLowerCase().includes(q) ||
          w.meaning.toLowerCase().includes(q)
        );
      })
    : [];
  const results = [...customResults, ...hskResults];

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>汉</Text>
        <Text style={styles.title}>Từ điển</Text>
      </View>

      {/* Search bar + draw button + add button */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color={colors.light.mutedForeground} style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder="Nhập chữ Hán, bính âm hoặc nghĩa..."
            placeholderTextColor={colors.light.mutedForeground}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Feather name="x" size={18} color={colors.light.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.drawBtn} onPress={() => setDrawVisible(true)} activeOpacity={0.8}>
          <Feather name="edit-3" size={20} color={colors.light.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push("/add-word")} activeOpacity={0.8}>
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {query.length > 0 ? (
        results.length > 0 ? (
          <FlatList
            data={results}
            keyExtractor={(w) => w.id}
            renderItem={({ item }) => (
              <WordListItem
                word={item}
                onPress={() => goToChar(item)}
                isSaved={isSaved(item.id)}
                isLearned={isLearned(item.id)}
              />
            )}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          />
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>Không tìm thấy kết quả cho "{query}"</Text>
            <TouchableOpacity style={styles.drawSuggest} onPress={() => setDrawVisible(true)}>
              <Feather name="edit-3" size={14} color={colors.light.primary} />
              <Text style={styles.drawSuggestText}>Thử vẽ chữ để tìm?</Text>
            </TouchableOpacity>
          </View>
        )
      ) : (
        <ScrollView contentContainerStyle={styles.homeContent} keyboardShouldPersistTaps="handled">
          {/* Custom words section */}
          {customWords.length > 0 && (
            <>
              <View style={styles.myWordsTitleRow}>
                <Text style={styles.sectionTitle}>Từ của tôi</Text>
                <TouchableOpacity style={styles.addSmallBtn} onPress={() => router.push("/add-word")} activeOpacity={0.8}>
                  <Feather name="plus" size={14} color={colors.light.primary} />
                  <Text style={styles.addSmallText}>Thêm</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.popularGrid}>
                {customWords.slice(0, 9).map((word) => (
                  <TouchableOpacity
                    key={word.id}
                    style={[styles.popularCard, styles.customCard]}
                    onPress={() => goToChar(word)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.customBadge}>
                      <Feather name="user" size={8} color={colors.light.primary} />
                    </View>
                    <Text style={styles.popularChar}>{word.character}</Text>
                    <Text style={styles.popularPinyin}>{word.pinyin}</Text>
                    <Text style={styles.popularMeaning} numberOfLines={1}>{word.meaning}</Text>
                    <SpeakerButton text={word.character} size={14} />
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <Text style={styles.sectionTitle}>Từ thông dụng</Text>
          <View style={styles.popularGrid}>
            {POPULAR.map((word) => (
              <TouchableOpacity
                key={word.id}
                style={styles.popularCard}
                onPress={() => goToChar(word)}
                activeOpacity={0.7}
              >
                <Text style={styles.popularChar}>{word.character}</Text>
                <Text style={styles.popularPinyin}>{word.pinyin}</Text>
                <Text style={styles.popularMeaning} numberOfLines={1}>{word.meaning}</Text>
                <SpeakerButton text={word.character} size={14} />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Khám phá theo cấp độ</Text>
          {[1, 2, 3, 4, 5, 6].map((level) => {
            const color = colors.hsk[level - 1];
            return (
              <TouchableOpacity
                key={level}
                style={[styles.levelRow, { borderLeftColor: color }]}
                onPress={() => router.push({ pathname: "/hsk/[level]", params: { level } })}
                activeOpacity={0.7}
              >
                <View style={[styles.levelDot, { backgroundColor: color }]}>
                  <Text style={styles.levelNum}>{level}</Text>
                </View>
                <View style={styles.levelInfo}>
                  <Text style={styles.levelName}>HSK {level}</Text>
                  <Text style={styles.levelDesc}>
                    {["Cơ bản", "Giao tiếp đơn giản", "Thông thường", "Lưu loát", "Cao cấp", "Thành thạo"][level - 1]}
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.light.mutedForeground} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Draw search modal */}
      <DrawSearchModal
        visible={drawVisible}
        onClose={() => setDrawVisible(false)}
        onSearch={(q) => setQuery(q)}
      />
    </View>
  );
}

// ────── Draw modal styles
const draw = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.light.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    alignItems: "center",
    gap: 12,
  },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%" },
  sheetTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: colors.light.foreground },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.light.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  hint: { fontSize: 14, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular" },
  padBox: {
    width: 260,
    height: 260,
    backgroundColor: "#FEFEFE",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.light.border,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  padPlaceholder: { fontSize: 22, color: "#CCC" },
  strokeBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: colors.light.primary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  strokeBadgeText: { color: "#fff", fontSize: 11, fontFamily: "Inter_700Bold" },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.light.border,
    backgroundColor: colors.light.card,
  },
  clearText: { fontSize: 13, color: colors.light.mutedForeground, fontFamily: "Inter_500Medium" },
  candidatesSection: { width: "100%", gap: 8 },
  candidatesLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.light.mutedForeground },
  candidatesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  candidateBtn: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.light.card,
    borderWidth: 1,
    borderColor: colors.light.border,
    alignItems: "center",
    justifyContent: "center",
  },
  candidateChar: { fontSize: 26, color: colors.light.foreground, fontWeight: "700" },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  tipText: { fontSize: 12, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular" },
});

// ────── Main screen styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 10,
  },
  logo: { fontSize: 32, color: colors.light.primary, fontWeight: "700" },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", color: colors.light.foreground },
  searchRow: { paddingHorizontal: 16, paddingBottom: 16, flexDirection: "row", gap: 10, alignItems: "center" },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.light.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.light.border,
    gap: 10,
  },
  searchIcon: { marginRight: 2 },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.light.foreground,
    fontFamily: "Inter_400Regular",
  },
  drawBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#FFF5F5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFCDD2",
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  myWordsTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    marginTop: 4,
  },
  addSmallBtn: {
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
  addSmallText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.light.primary },
  customCard: { borderColor: "#FFCDD2", borderWidth: 1.5, position: "relative" },
  customBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FFF5F5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  listContent: { paddingBottom: 120 },
  homeContent: { paddingHorizontal: 16, paddingBottom: 120 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: colors.light.foreground, marginBottom: 14, marginTop: 4 },
  popularGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 28 },
  popularCard: {
    backgroundColor: colors.light.card,
    borderRadius: 14,
    padding: 14,
    width: "30%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  popularChar: { fontSize: 32, color: colors.light.primary, fontWeight: "700", marginBottom: 4 },
  popularPinyin: { fontSize: 11, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular" },
  popularMeaning: { fontSize: 11, color: colors.light.foreground, fontFamily: "Inter_500Medium", textAlign: "center", marginTop: 2 },
  levelRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.light.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: colors.light.border,
    gap: 14,
  },
  levelDot: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  levelNum: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 16 },
  levelInfo: { flex: 1 },
  levelName: { fontSize: 16, fontFamily: "Inter_700Bold", color: colors.light.foreground },
  levelDesc: { fontSize: 13, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 15, color: colors.light.mutedForeground, textAlign: "center", paddingHorizontal: 40 },
  drawSuggest: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  drawSuggestText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.light.primary },
});
