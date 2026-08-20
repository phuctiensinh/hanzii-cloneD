import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
  Animated,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import colors from "@/constants/colors";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeech } from "@/hooks/useSpeech";
import { EvaluationResult } from "@/api/evaluate-speech";

interface Props {
  visible: boolean;
  targetText: string;
  pinyin?: string;
  translation?: string;
  onClose: () => void;
}

export function PronunciationModal({
  visible,
  targetText,
  pinyin = "",
  translation = "",
  onClose,
}: Props) {
  const { speak } = useSpeech();
  const {
    isListening,
    transcript,
    interimTranscript,
    error: recError,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({ lang: "zh-CN" });

  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [evalError, setEvalError] = useState<string | null>(null);

  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  // Pulse animation when recording
  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isListening, pulseAnim]);

  // Reset when modal opens
  useEffect(() => {
    if (visible) {
      resetTranscript();
      setResult(null);
      setEvaluating(false);
      setEvalError(null);
    } else {
      stopListening();
    }
  }, [visible, resetTranscript, stopListening]);

  // Handle evaluation when transcript is finalized and user stops listening
  const handleEvaluate = useCallback(async (spoken: string) => {
    if (!spoken.trim()) return;

    // Instant local scoring (0ms delay for immediate user feedback)
    const targetChars = Array.from(targetText.replace(/[^\u4e00-\u9fa5]/g, ""));
    const spokenChars = Array.from(spoken.replace(/[^\u4e00-\u9fa5]/g, ""));
    let matchCount = 0;
    targetChars.forEach((c) => {
      if (spokenChars.includes(c)) matchCount++;
    });
    const ratio = targetChars.length > 0 ? matchCount / targetChars.length : spoken === targetText ? 1 : 0.5;
    const initialScore = Math.round(ratio * 100);

    const instantResult: EvaluationResult = {
      score: initialScore,
      rating: initialScore >= 85 ? "EXCELLENT" : initialScore >= 65 ? "GOOD" : "NEEDS_WORK",
      spokenPinyin: spoken,
      feedback: initialScore >= 85
        ? "Phát âm rất chuẩn! Đang nhận xét chi tiết..."
        : "Đang phân tích thanh điệu & phát âm chi tiết...",
    };

    setResult(instantResult);
    setEvaluating(true);
    setEvalError(null);

    try {
      const response = await fetch("/api/evaluate-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetText,
          pinyin,
          spokenText: spoken,
        }),
      });

      if (response.ok) {
        const data: EvaluationResult = await response.json();
        setResult(data);
      }
    } catch (err: any) {
      console.warn("[PronunciationModal] AI evaluation fallback used:", err);
    } finally {
      setEvaluating(false);
    }
  }, [targetText, pinyin]);

  const handleToggleMic = () => {
    if (isListening) {
      stopListening();
      const spoken = (transcript + " " + interimTranscript).trim();
      if (spoken) {
        handleEvaluate(spoken);
      }
    } else {
      resetTranscript();
      setResult(null);
      setEvalError(null);
      startListening();
    }
  };

  // Auto evaluate when user stops listening and transcript is available
  useEffect(() => {
    if (!isListening && (transcript || interimTranscript) && !result && !evaluating) {
      const spoken = (transcript + " " + interimTranscript).trim();
      if (spoken) {
        handleEvaluate(spoken);
      }
    }
  }, [isListening, transcript, interimTranscript, result, evaluating, handleEvaluate]);

  if (!visible) return null;

  const currentSpoken = (transcript + " " + interimTranscript).trim();

  const getScoreColor = (score: number) => {
    if (score >= 85) return "#2E7D32"; // Green
    if (score >= 65) return "#ED6C02"; // Orange
    return "#D32F2F"; // Red
  };

  const getRatingBadge = (rating: string) => {
    switch (rating) {
      case "EXCELLENT":
        return { text: "Xuất sắc 🌟", bg: "#E8F5E9", color: "#2E7D32" };
      case "GOOD":
        return { text: "Khá tốt 👍", bg: "#FFF3E0", color: "#ED6C02" };
      default:
        return { text: "Cần luyện thêm 💪", bg: "#FFEBEE", color: "#D32F2F" };
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Feather name="mic" size={20} color={colors.light.primary} />
              <Text style={styles.titleText}>Chấm điểm phát âm AI</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={colors.light.mutedForeground} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {/* Target Sample Card */}
            <View style={styles.targetCard}>
              <Text style={styles.targetLabel}>Mẫu phát âm:</Text>
              <Text style={styles.targetText}>{targetText}</Text>
              {!!pinyin && <Text style={styles.targetPinyin}>{pinyin}</Text>}
              {!!translation && <Text style={styles.targetTranslation}>{translation}</Text>}

              <TouchableOpacity
                style={styles.speakerBtn}
                onPress={() => speak(targetText)}
                activeOpacity={0.8}
              >
                <Feather name="volume-2" size={16} color={colors.light.primary} />
                <Text style={styles.speakerBtnText}>Nghe mẫu chuẩn</Text>
              </TouchableOpacity>
            </View>

            {/* Mic Controls / Listening Indicator */}
            <View style={styles.micSection}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity
                  style={[
                    styles.micButton,
                    isListening && styles.micButtonActive,
                    evaluating && styles.micButtonDisabled,
                  ]}
                  onPress={handleToggleMic}
                  disabled={evaluating}
                  activeOpacity={0.8}
                >
                  <Feather
                    name={isListening ? "square" : "mic"}
                    size={32}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </Animated.View>

              <Text style={styles.micInstruction}>
                {isListening
                  ? "Đang lắng nghe... Nhấn lại để hoàn thành"
                  : evaluating
                  ? "AI đang phân tích & chấm điểm..."
                  : "Nhấn vào micro và đọc to câu trên"}
              </Text>

              {/* Browser warning if Web Speech not supported */}
              {!isSupported && Platform.OS === "web" && (
                <Text style={styles.warningText}>
                  ⚠️ Trình duyệt của bạn không hỗ trợ Web Speech API. Bạn nên thử trên Google Chrome hoặc Safari trên iOS/Android.
                </Text>
              )}

              {/* Speech Recognition Error */}
              {!!recError && <Text style={styles.errorText}>{recError}</Text>}

              {/* Realtime transcript preview */}
              {!!currentSpoken && (
                <View style={styles.liveTranscriptBox}>
                  <Text style={styles.liveTranscriptLabel}>Tiếng Trung nghe được:</Text>
                  <Text style={styles.liveTranscriptText}>{currentSpoken}</Text>
                </View>
              )}
            </View>

            {/* Evaluation Results */}
            {evaluating && (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={colors.light.primary} />
                <Text style={styles.loadingText}>AI đang đánh giá phát âm của bạn...</Text>
              </View>
            )}

            {result && !evaluating && (
              <View style={styles.resultContainer}>
                {/* Score Gauge */}
                <View style={styles.scoreRow}>
                  <View style={[styles.scoreBadge, { borderColor: getScoreColor(result.score) }]}>
                    <Text style={[styles.scoreNumber, { color: getScoreColor(result.score) }]}>
                      {result.score}
                    </Text>
                    <Text style={styles.scoreUnit}>/100</Text>
                  </View>
                  <View style={styles.ratingBox}>
                    {(() => {
                      const badge = getRatingBadge(result.rating);
                      return (
                        <View style={[styles.ratingTag, { backgroundColor: badge.bg }]}>
                          <Text style={[styles.ratingTagText, { color: badge.color }]}>
                            {badge.text}
                          </Text>
                        </View>
                      );
                    })()}
                    <Text style={styles.spokenPinyinText}>Phiên âm: {result.spokenPinyin}</Text>
                  </View>
                </View>

                {/* Character-by-character phonetic breakdown */}
                {result.details && result.details.length > 0 && (
                  <View style={styles.detailsBox}>
                    <View style={styles.detailsHeader}>
                      <Feather name="check-square" size={15} color={colors.light.primary} />
                      <Text style={styles.detailsTitle}>Phân tích chi tiết từng từ:</Text>
                    </View>
                    <View style={styles.chipContainer}>
                      {result.details.map((item, idx) => {
                        const isOk = item.status === "correct";
                        return (
                          <View
                            key={idx}
                            style={[
                              styles.charChip,
                              isOk ? styles.charChipCorrect : styles.charChipIncorrect,
                            ]}
                          >
                            <Text style={[styles.charText, isOk ? styles.charTextCorrect : styles.charTextIncorrect]}>
                              {item.char}
                            </Text>
                            <Text style={[styles.charBadge, isOk ? styles.charBadgeCorrect : styles.charBadgeIncorrect]}>
                              {isOk ? "✓ Đúng" : "✗ Sửa"}
                            </Text>
                            {!!item.note && item.note !== "Đúng" && (
                              <Text style={styles.charNote}>{item.note}</Text>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* AI Feedback */}
                <View style={styles.feedbackBox}>
                  <View style={styles.feedbackHeader}>
                    <Feather name="award" size={16} color={colors.light.primary} />
                    <Text style={styles.feedbackTitle}>Hướng dẫn chỉnh sửa từ AI Coach:</Text>
                  </View>
                  <Text style={styles.feedbackText}>{result.feedback}</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            {(result || currentSpoken) && (
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => {
                  resetTranscript();
                  setResult(null);
                  setEvalError(null);
                  startListening();
                }}
              >
                <Feather name="refresh-cw" size={16} color={colors.light.primary} />
                <Text style={styles.retryBtnText}>Thử lại</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
              <Text style={styles.doneBtnText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 480,
    maxHeight: "85%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.border,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  titleText: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: colors.light.foreground,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 20,
    gap: 16,
  },
  targetCard: {
    backgroundColor: "#FFF8F7",
    borderWidth: 1,
    borderColor: "#FFCDD2",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 6,
  },
  targetLabel: {
    fontSize: 12,
    color: colors.light.mutedForeground,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  targetText: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.light.primary,
    textAlign: "center",
  },
  targetPinyin: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: colors.light.foreground,
  },
  targetTranslation: {
    fontSize: 14,
    color: colors.light.mutedForeground,
    fontFamily: "Inter_400Regular",
  },
  speakerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  speakerBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: colors.light.primary,
  },
  micSection: {
    alignItems: "center",
    paddingVertical: 12,
    gap: 10,
  },
  micButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  micButtonActive: {
    backgroundColor: "#D32F2F",
  },
  micButtonDisabled: {
    opacity: 0.6,
  },
  micInstruction: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: colors.light.mutedForeground,
    textAlign: "center",
  },
  warningText: {
    fontSize: 12,
    color: "#E65100",
    backgroundColor: "#FFF3E0",
    padding: 10,
    borderRadius: 10,
    textAlign: "center",
  },
  errorText: {
    fontSize: 13,
    color: "#D32F2F",
    textAlign: "center",
  },
  liveTranscriptBox: {
    width: "100%",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    alignItems: "center",
  },
  liveTranscriptLabel: {
    fontSize: 11,
    color: colors.light.mutedForeground,
  },
  liveTranscriptText: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: colors.light.foreground,
    marginTop: 2,
  },
  loadingBox: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: colors.light.mutedForeground,
    fontFamily: "Inter_500Medium",
  },
  resultContainer: {
    gap: 14,
    marginTop: 4,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.light.border,
    gap: 16,
  },
  scoreBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreNumber: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  scoreUnit: {
    fontSize: 10,
    color: colors.light.mutedForeground,
    marginTop: -4,
  },
  ratingBox: {
    flex: 1,
    gap: 6,
  },
  ratingTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingTagText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  spokenPinyinText: {
    fontSize: 13,
    color: colors.light.mutedForeground,
    fontFamily: "Inter_500Medium",
  },
  detailsBox: {
    backgroundColor: "#FAFAFA",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.light.border,
    gap: 10,
  },
  detailsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailsTitle: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: colors.light.foreground,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  charChip: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    alignItems: "center",
    minWidth: 50,
  },
  charChipCorrect: {
    backgroundColor: "#E8F5E9",
    borderColor: "#C8E6C9",
  },
  charChipIncorrect: {
    backgroundColor: "#FFEBEE",
    borderColor: "#FFCDD2",
  },
  charText: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  charTextCorrect: {
    color: "#2E7D32",
  },
  charTextIncorrect: {
    color: "#D32F2F",
  },
  charBadge: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    marginTop: 2,
  },
  charBadgeCorrect: {
    color: "#2E7D32",
  },
  charBadgeIncorrect: {
    color: "#D32F2F",
  },
  charNote: {
    fontSize: 10,
    color: colors.light.mutedForeground,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  feedbackBox: {
    backgroundColor: "#F4F5F7",
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  feedbackHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  feedbackTitle: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: colors.light.foreground,
  },
  feedbackText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.light.foreground,
    fontFamily: "Inter_400Regular",
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.light.border,
    gap: 12,
  },
  retryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: "#FFCDD2",
    borderRadius: 14,
    paddingVertical: 12,
  },
  retryBtnText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: colors.light.primary,
  },
  doneBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.light.primary,
    borderRadius: 14,
    paddingVertical: 12,
  },
  doneBtnText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
});
