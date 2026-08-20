import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import Svg, { G, Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import colors from "@/constants/colors";
import { getWordById } from "@/constants/data";
import { WritingPad } from "@/components/WritingPad";
import { useCustomWords } from "@/context/CustomWordsContext";

const AnimatedPath = Animated.createAnimatedComponent(Path as any);

interface HanziData {
  strokes: string[];
  medians: number[][][];
}

const STROKE_DURATION = 420;
const STROKE_GAP = 250;

// ── Scoring helpers ──────────────────────────────────────────────────────────

/** Parse "M x y L x y ..." into [{x,y}] */
function parsePoints(pathStr: string): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  const tokens = pathStr.trim().split(/[\s,]+/);
  let i = 0;
  while (i < tokens.length) {
    const cmd = tokens[i];
    if (cmd === "M" || cmd === "L") {
      const x = parseFloat(tokens[i + 1]);
      const y = parseFloat(tokens[i + 2]);
      if (!isNaN(x) && !isNaN(y)) pts.push({ x, y });
      i += 3;
    } else {
      i++;
    }
  }
  return pts;
}

interface ScoreResult {
  total: number;       // 0–100
  countScore: number;  // 0–100 stroke-count accuracy
  directionScore: number; // 0–100 average direction accuracy
  strokeScores: number[];  // per-stroke direction 0–100
  userCount: number;
  refCount: number;
}

function computeScore(userPaths: string[], medians: number[][][], size: number): ScoreResult {
  const refCount = medians.length;
  const userCount = userPaths.length;

  if (refCount === 0 || userCount === 0) {
    return { total: 0, countScore: 0, directionScore: 0, strokeScores: [], userCount, refCount };
  }

  // Stroke count score
  const countScore = Math.round(Math.max(0, 1 - Math.abs(userCount - refCount) / refCount) * 100);

  const matchCount = Math.min(userCount, refCount);
  const strokeScores: number[] = [];

  for (let i = 0; i < matchCount; i++) {
    const userPts = parsePoints(userPaths[i]);
    const refPts = medians[i];

    if (userPts.length < 2 || !refPts || refPts.length < 2) {
      strokeScores.push(50);
      continue;
    }

    // Normalize user stroke direction to [0,1] space
    const uFirst = userPts[0];
    const uLast = userPts[userPts.length - 1];
    const uDx = (uLast.x - uFirst.x) / size;
    const uDy = (uLast.y - uFirst.y) / size;
    const uLen = Math.sqrt(uDx * uDx + uDy * uDy);

    // Normalize reference median direction (hanzi space: X 0-1024, Y flipped 0-900)
    const rFirst = refPts[0];
    const rLast = refPts[refPts.length - 1];
    const rDx = (rLast[0] - rFirst[0]) / 1024;
    const rDy = -((rLast[1] - rFirst[1]) / 900); // flip Y axis
    const rLen = Math.sqrt(rDx * rDx + rDy * rDy);

    if (uLen < 0.02 || rLen < 0.02) {
      // Very short stroke — give partial credit
      strokeScores.push(60);
      continue;
    }

    // Cosine similarity of direction vectors → map [-1,1] to [0,100]
    const dot = (uDx / uLen) * (rDx / rLen) + (uDy / uLen) * (rDy / rLen);
    const cosSim = Math.round(((dot + 1) / 2) * 100);
    strokeScores.push(cosSim);
  }

  const directionScore = strokeScores.length > 0
    ? Math.round(strokeScores.reduce((a, b) => a + b, 0) / strokeScores.length)
    : 0;

  // Weighted: 35% count accuracy, 65% direction accuracy
  const total = Math.round(countScore * 0.35 + directionScore * 0.65);

  return { total, countScore, directionScore, strokeScores, userCount, refCount };
}

function gradeLabel(score: number): { label: string; color: string; emoji: string } {
  if (score >= 90) return { label: "Xuất sắc!", color: "#1B8F4C", emoji: "🏆" };
  if (score >= 75) return { label: "Tốt lắm!", color: "#2E7D32", emoji: "✅" };
  if (score >= 60) return { label: "Khá tốt", color: "#F57F17", emoji: "👍" };
  if (score >= 40) return { label: "Cần cố gắng", color: "#E65100", emoji: "📝" };
  return { label: "Thử lại nhé!", color: "#C62828", emoji: "💪" };
}

// ── Data fetch ───────────────────────────────────────────────────────────────

async function fetchStrokeData(char: string): Promise<HanziData | null> {
  try {
    const url = `https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/${encodeURIComponent(char)}.json`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

type Mode = "watch" | "practice";
type ScriptType = "simplified" | "traditional";

// ── Screen ───────────────────────────────────────────────────────────────────

export default function WriteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { customWords } = useCustomWords();
  const word = getWordById(id ?? "") ?? customWords.find((w) => w.id === id);

  const [scriptType, setScriptType] = useState<ScriptType>("simplified");
  const chars = word ? [...(scriptType === "simplified" ? word.character : word.traditional)] : [];
  const [charIndex, setCharIndex] = useState(0);
  const activeChar = chars[charIndex] ?? "";

  const [data, setData] = useState<HanziData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("watch");

  // Stroke animation
  const [currentStroke, setCurrentStroke] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const opacitiesRef = useRef<Animated.Value[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  // Score result
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [padKey, setPadKey] = useState(0); // force WritingPad remount on retry

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const stopAnim = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    animRef.current?.stop();
    animRef.current = null;
  }, []);

  const startAnim = useCallback((d: HanziData, ops: Animated.Value[]) => {
    stopAnim();
    ops.forEach((a) => a.setValue(0));
    setCurrentStroke(-1);
    setIsPlaying(true);
    let idx = 0;

    function nextStroke() {
      if (idx >= d.strokes.length) { setIsPlaying(false); return; }
      const ci = idx;
      setCurrentStroke(ci);
      ops[ci].setValue(0);
      animRef.current = Animated.timing(ops[ci], {
        toValue: 1, duration: STROKE_DURATION, useNativeDriver: true,
      });
      animRef.current.start(({ finished }) => {
        if (!finished) return;
        idx++;
        timerRef.current = setTimeout(nextStroke, STROKE_GAP);
      });
    }
    nextStroke();
  }, [stopAnim]);

  useEffect(() => {
    if (!activeChar) return;
    let cancelled = false;
    setLoading(true);
    setData(null);
    setCurrentStroke(-1);
    setIsPlaying(false);
    setScoreResult(null);
    stopAnim();

    fetchStrokeData(activeChar).then((d) => {
      if (cancelled) return;
      setData(d);
      setLoading(false);
      if (d) {
        opacitiesRef.current = d.strokes.map(() => new Animated.Value(0));
        timerRef.current = setTimeout(() => {
          if (!cancelled) startAnim(d, opacitiesRef.current);
        }, 300);
      }
    });
    return () => { cancelled = true; stopAnim(); };
  }, [activeChar, scriptType]);

  const replay = useCallback(() => {
    if (!data) return;
    startAnim(data, opacitiesRef.current);
  }, [data, startAnim]);

  const stepForward = useCallback(() => {
    if (!data) return;
    stopAnim(); setIsPlaying(false);
    const next = Math.min(currentStroke + 1, data.strokes.length - 1);
    const tgt = opacitiesRef.current[next];
    if (tgt) {
      tgt.setValue(0);
      Animated.timing(tgt, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
    setCurrentStroke(next);
  }, [data, currentStroke, stopAnim]);

  const stepBack = useCallback(() => {
    if (!data || currentStroke < 0) return;
    stopAnim(); setIsPlaying(false);
    opacitiesRef.current[currentStroke]?.setValue(0);
    setCurrentStroke(currentStroke - 1);
  }, [data, currentStroke, stopAnim]);

  const jumpToStroke = useCallback((idx: number) => {
    if (!data) return;
    stopAnim(); setIsPlaying(false);
    opacitiesRef.current.forEach((a, i) => a.setValue(i <= idx ? 1 : 0));
    setCurrentStroke(idx);
  }, [data, stopAnim]);

  const handleCheck = useCallback((userPaths: string[]) => {
    if (!data) return;
    const PAD_SIZE = 280;
    const result = computeScore(userPaths, data.medians, PAD_SIZE);
    setScoreResult(result);
  }, [data]);

  const handleRetry = useCallback(() => {
    setScoreResult(null);
    setPadKey((k) => k + 1);
  }, []);

  if (!word) {
    return (
      <View style={[styles.container, { paddingTop: topPadding }]}>
        <Text style={styles.error}>Không tìm thấy từ</Text>
      </View>
    );
  }

  const SVG_SIZE = 220;
  const PAD_SIZE = 280;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  };

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.light.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerChar}>{scriptType === "simplified" ? word.character : word.traditional}</Text>
          <Text style={styles.headerPinyin}>{word.pinyin}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Multi-char tabs */}
      {chars.length > 1 && (
        <View style={styles.charTabs}>
          {chars.map((c, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.charTab, charIndex === i && styles.charTabActive]}
              onPress={() => { setCharIndex(i); setScoreResult(null); setPadKey((k) => k + 1); }}
            >
              <Text style={[styles.charTabText, charIndex === i && styles.charTabTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Mode toggle */}
      <View style={styles.modeTabs}>
        {(["watch", "practice"] as Mode[]).map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.modeTab, mode === m && styles.modeTabActive]}
            onPress={() => { setMode(m); setScoreResult(null); }}
          >
            <Feather
              name={m === "watch" ? "eye" : "edit-3"}
              size={14}
              color={mode === m ? "#fff" : colors.light.mutedForeground}
            />
            <Text style={[styles.modeTabText, mode === m && styles.modeTabTextActive]}>
              {m === "watch" ? "Xem nét" : "Luyện viết"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/*_script type toggle - only show if traditional differs from simplified */}
      {word && word.traditional !== word.character && (
        <View style={styles.scriptTabs}>
          {(["simplified", "traditional"] as ScriptType[]).map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.scriptTab, scriptType === st && styles.scriptTabActive]}
              onPress={() => { setScriptType(st); setCharIndex(0); setScoreResult(null); setPadKey((k) => k + 1); }}
            >
              <Text style={[styles.scriptTabText, scriptType === st && styles.scriptTabTextActive]}>
                {st === "simplified" ? "Giản thể" : "Phồn thể"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: bottomPadding + 32 }]}>
        {mode === "watch" ? (
          /* ── Watch mode ─────────────────────────── */
          <View style={styles.watchSection}>
            {loading ? (
              <View style={[styles.svgBox, { width: SVG_SIZE, height: SVG_SIZE }]}>
                <ActivityIndicator color={colors.light.primary} size="large" />
              </View>
            ) : !data ? (
              <View style={[styles.svgBox, { width: SVG_SIZE, height: SVG_SIZE }]}>
                <Text style={styles.charFallback}>{activeChar}</Text>
                <Text style={styles.noData}>Không có dữ liệu nét</Text>
              </View>
            ) : (
              <>
                <View style={[styles.svgBox, { width: SVG_SIZE, height: SVG_SIZE }]}>
                  <Svg width={SVG_SIZE} height={SVG_SIZE} viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
                    <Path d="M50 0 L50 100" stroke="#E8E8E8" strokeWidth="0.8" strokeDasharray="3,3" />
                    <Path d="M0 50 L100 50" stroke="#E8E8E8" strokeWidth="0.8" strokeDasharray="3,3" />
                  </Svg>
                  <Svg width={SVG_SIZE} height={SVG_SIZE} viewBox="0 0 1024 1024" style={StyleSheet.absoluteFill}>
                    <G transform="translate(0,900) scale(1,-1)">
                      {data.strokes.map((path, i) => <Path key={i} d={path} fill="#EBEBEB" />)}
                    </G>
                  </Svg>
                  <Svg width={SVG_SIZE} height={SVG_SIZE} viewBox="0 0 1024 1024" style={StyleSheet.absoluteFill}>
                    <G transform="translate(0,900) scale(1,-1)">
                      {data.strokes.map((path, i) => {
                        if (i > currentStroke) return null;
                        return (
                          <AnimatedPath
                            key={i}
                            d={path}
                            fill={i === currentStroke ? colors.light.primary : "#2C2C2E"}
                            style={{ opacity: opacitiesRef.current[i] }}
                          />
                        );
                      })}
                    </G>
                  </Svg>
                </View>

                <Text style={styles.strokeCounter}>
                  Nét {Math.max(0, currentStroke + 1)} / {data.strokes.length}
                </Text>

                <View style={styles.controls}>
                  <TouchableOpacity
                    style={styles.ctrlBtn}
                    onPress={stepBack}
                    disabled={currentStroke < 0}
                    activeOpacity={0.7}
                  >
                    <Feather name="skip-back" size={20} color={currentStroke < 0 ? "#CCC" : colors.light.foreground} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.ctrlBtnPrimary} onPress={replay} activeOpacity={0.8}>
                    <Feather name="rotate-ccw" size={16} color="#fff" />
                    <Text style={styles.ctrlBtnPrimaryText}>{isPlaying ? "Đang chạy..." : "Phát lại"}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.ctrlBtn}
                    onPress={stepForward}
                    disabled={!data || currentStroke >= data.strokes.length - 1}
                    activeOpacity={0.7}
                  >
                    <Feather name="skip-forward" size={20} color={!data || currentStroke >= data.strokes.length - 1 ? "#CCC" : colors.light.foreground} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.gridLabel}>Nhấn để xem từng nét:</Text>
                <View style={styles.strokeGrid}>
                  {data.strokes.map((path, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.strokeCell, i === currentStroke && styles.strokeCellActive]}
                      onPress={() => jumpToStroke(i)}
                      activeOpacity={0.7}
                    >
                      <Svg width={48} height={48} viewBox="0 0 1024 1024">
                        <G transform="translate(0,900) scale(1,-1)">
                          {data.strokes.slice(0, i + 1).map((p, j) => (
                            <Path key={j} d={p} fill={j === i ? colors.light.primary : "#CCC"} />
                          ))}
                        </G>
                      </Svg>
                      <Text style={styles.strokeNum}>{i + 1}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
          </View>
        ) : (
          /* ── Practice mode ──────────────────────── */
          <View style={styles.practiceSection}>
            {scoreResult ? (
              /* Score result card */
              <ScoreCard result={scoreResult} onRetry={handleRetry} />
            ) : (
              <>
                <Text style={styles.practiceTitle}>
                  Viết chữ <Text style={{ color: colors.light.primary }}>{activeChar}</Text>
                </Text>
                {data && (
                  <Text style={styles.practiceSubtitle}>
                    {data.strokes.length} nét · Vẽ xong bấm "Kiểm tra"
                  </Text>
                )}

                <WritingPad
                  key={padKey}
                  size={PAD_SIZE}
                  guideStrokes={data?.strokes}
                  onCheck={handleCheck}
                />

                {data && (
                  <View style={styles.tipBox}>
                    <Feather name="info" size={14} color={colors.light.primary} />
                    <Text style={styles.tipText}>
                      Chữ mờ là gợi ý · Bấm "Xem nét" để xem thứ tự từng nét trước
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ── Score Card component ──────────────────────────────────────────────────────

function ScoreCard({ result, onRetry }: { result: ScoreResult; onRetry: () => void }) {
  const grade = gradeLabel(result.total);

  return (
    <View style={scoreStyles.card}>
      {/* Big score */}
      <View style={[scoreStyles.circle, { borderColor: grade.color }]}>
        <Text style={[scoreStyles.emoji]}>{grade.emoji}</Text>
        <Text style={[scoreStyles.totalNum, { color: grade.color }]}>{result.total}%</Text>
        <Text style={[scoreStyles.gradeLabel, { color: grade.color }]}>{grade.label}</Text>
      </View>

      {/* Breakdown */}
      <View style={scoreStyles.breakdown}>
        <ScoreRow
          label="Số nét"
          value={`${result.userCount} / ${result.refCount} nét`}
          score={result.countScore}
        />
        <ScoreRow
          label="Hướng nét"
          value={`${result.directionScore}%`}
          score={result.directionScore}
        />
      </View>

      {/* Per-stroke breakdown */}
      {result.strokeScores.length > 0 && (
        <View style={scoreStyles.strokeRow}>
          {result.strokeScores.map((s, i) => (
            <View key={i} style={scoreStyles.strokeDot}>
              <View style={[
                scoreStyles.dotCircle,
                { backgroundColor: s >= 70 ? "#2E7D32" : s >= 45 ? "#F57F17" : "#C62828" },
              ]} />
              <Text style={scoreStyles.dotLabel}>Nét {i + 1}</Text>
              <Text style={scoreStyles.dotScore}>{s}%</Text>
            </View>
          ))}
        </View>
      )}

      {/* Retry */}
      <TouchableOpacity style={scoreStyles.retryBtn} onPress={onRetry} activeOpacity={0.8}>
        <Feather name="rotate-ccw" size={16} color="#fff" />
        <Text style={scoreStyles.retryText}>Thử lại</Text>
      </TouchableOpacity>
    </View>
  );
}

function ScoreRow({ label, value, score }: { label: string; value: string; score: number }) {
  const color = score >= 70 ? "#2E7D32" : score >= 45 ? "#F57F17" : "#C62828";
  return (
    <View style={scoreStyles.row}>
      <Text style={scoreStyles.rowLabel}>{label}</Text>
      <View style={scoreStyles.rowRight}>
        <Text style={scoreStyles.rowValue}>{value}</Text>
        <View style={scoreStyles.barBg}>
          <View style={[scoreStyles.barFill, { width: `${score}%` as any, backgroundColor: color }]} />
        </View>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.light.background },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingBottom: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.light.card,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: colors.light.border,
  },
  headerCenter: { alignItems: "center", gap: 2 },
  headerChar: { fontSize: 26, fontWeight: "700", color: colors.light.primary },
  headerPinyin: { fontSize: 13, color: colors.light.mutedForeground, fontFamily: "Inter_400Regular" },
  charTabs: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 6 },
  charTab: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border,
  },
  charTabActive: { backgroundColor: colors.light.primary, borderColor: colors.light.primary },
  charTabText: { fontSize: 18, fontWeight: "700", color: colors.light.mutedForeground },
  charTabTextActive: { color: "#fff" },
  modeTabs: {
    flexDirection: "row", marginHorizontal: 16, marginBottom: 16,
    backgroundColor: colors.light.muted, borderRadius: 12, padding: 4,
  },
  modeTab: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 10, borderRadius: 10,
  },
  modeTabActive: { backgroundColor: colors.light.primary },
  modeTabText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.light.mutedForeground },
  modeTabTextActive: { color: "#fff" },
  scriptTabs: {
    flexDirection: "row", marginHorizontal: 16, marginBottom: 16,
    backgroundColor: colors.light.muted, borderRadius: 12, padding: 4,
  },
  scriptTab: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingVertical: 10, borderRadius: 10,
  },
  scriptTabActive: { backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border },
  scriptTabText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.light.mutedForeground },
  scriptTabTextActive: { color: colors.light.primary },
  scroll: { paddingHorizontal: 16 },
  watchSection: { alignItems: "center", gap: 16 },
  svgBox: {
    backgroundColor: "#FAFAFA", borderRadius: 20,
    borderWidth: 1, borderColor: colors.light.border,
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  charFallback: { fontSize: 80, color: colors.light.primary, fontWeight: "700" },
  noData: { fontSize: 12, color: colors.light.mutedForeground, marginTop: 8 },
  strokeCounter: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: colors.light.foreground },
  controls: { flexDirection: "row", alignItems: "center", gap: 12 },
  ctrlBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border,
    alignItems: "center", justifyContent: "center",
  },
  ctrlBtnPrimary: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: colors.light.primary, borderRadius: 24,
    paddingHorizontal: 22, paddingVertical: 14,
  },
  ctrlBtnPrimaryText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 14 },
  gridLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.light.mutedForeground, alignSelf: "flex-start" },
  strokeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, width: "100%" },
  strokeCell: {
    alignItems: "center", backgroundColor: colors.light.card, borderRadius: 10,
    padding: 4, borderWidth: 1, borderColor: colors.light.border, width: 64, gap: 2,
  },
  strokeCellActive: { borderColor: colors.light.primary, backgroundColor: "#FFF5F5" },
  strokeNum: { fontSize: 11, color: colors.light.mutedForeground, fontFamily: "Inter_600SemiBold" },
  practiceSection: { alignItems: "center", gap: 14 },
  practiceTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: colors.light.foreground },
  practiceSubtitle: { fontSize: 13, color: colors.light.mutedForeground, textAlign: "center" },
  tipBox: {
    flexDirection: "row", gap: 8, alignItems: "flex-start",
    backgroundColor: "#FFF5F5", borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: "#FFCDD2", width: "100%",
  },
  tipText: { flex: 1, fontSize: 13, color: colors.light.foreground, lineHeight: 18 },
  error: { textAlign: "center", marginTop: 60, color: colors.light.mutedForeground, fontSize: 16 },
});

const scoreStyles = StyleSheet.create({
  card: {
    width: "100%", alignItems: "center", gap: 20,
    backgroundColor: colors.light.card,
    borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: colors.light.border,
  },
  circle: {
    width: 160, height: 160, borderRadius: 80,
    borderWidth: 5,
    alignItems: "center", justifyContent: "center",
    gap: 2, backgroundColor: "#fff",
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 12,
    elevation: 3,
  },
  emoji: { fontSize: 28 },
  totalNum: { fontSize: 38, fontFamily: "Inter_700Bold", lineHeight: 42 },
  gradeLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  breakdown: { width: "100%", gap: 14 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  rowLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.light.foreground, width: 90 },
  rowRight: { flex: 1, gap: 6 },
  rowValue: { fontSize: 13, color: colors.light.mutedForeground, fontFamily: "Inter_500Medium" },
  barBg: { height: 8, borderRadius: 4, backgroundColor: "#EBEBEB", overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4 },
  strokeRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, width: "100%", justifyContent: "center" },
  strokeDot: { alignItems: "center", gap: 4, minWidth: 52 },
  dotCircle: { width: 14, height: 14, borderRadius: 7 },
  dotLabel: { fontSize: 11, color: colors.light.mutedForeground, fontFamily: "Inter_500Medium" },
  dotScore: { fontSize: 12, fontFamily: "Inter_700Bold", color: colors.light.foreground },
  retryBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: colors.light.primary,
    borderRadius: 22, paddingHorizontal: 28, paddingVertical: 12,
    marginTop: 4,
  },
  retryText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 15 },
});
