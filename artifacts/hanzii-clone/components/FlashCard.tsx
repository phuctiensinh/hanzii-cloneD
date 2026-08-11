import React, { useCallback, useRef, useState } from "react";
import { Animated, StyleSheet, Text, TouchableWithoutFeedback, TouchableOpacity, View } from "react-native";

import colors from "@/constants/colors";
import { Word } from "@/types";
import { HSKBadge } from "./HSKBadge";
import { SpeakerButton } from "./SpeakerButton";

interface Props {
  word: Word;
  onFlip?: (showing: "front" | "back") => void;
  /** Called when the card needs to reset to front (e.g. on word change) */
  resetKey?: string | number;
}

export function FlashCard({ word, onFlip, resetKey }: Props) {
  const [flipped, setFlipped] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // Reset card to front whenever the word changes
  const prevResetKey = useRef(resetKey);
  if (prevResetKey.current !== resetKey) {
    prevResetKey.current = resetKey;
    rotateAnim.setValue(0);
    setFlipped(false);
  }

  const flip = useCallback(() => {
    const toValue = flipped ? 0 : 1;
    Animated.spring(rotateAnim, {
      toValue,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
    setFlipped(!flipped);
    onFlip?.(flipped ? "front" : "back");
  }, [flipped, rotateAnim, onFlip]);

  const frontRotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });
  const backRotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ["180deg", "360deg"] });

  return (
    <TouchableWithoutFeedback onPress={flip}>
      <View style={styles.cardWrapper}>
        <Animated.View
          style={[styles.card, styles.front, { transform: [{ rotateY: frontRotate }] }]}
        >
          <View style={styles.cardHeader}>
            <HSKBadge level={word.hskLevel} />
            <SpeakerButton text={word.character} size={20} />
          </View>
          <Text style={styles.character}>{word.character}</Text>
          <Text style={styles.traditional}>{word.traditional !== word.character ? `繁 ${word.traditional}` : ""}</Text>
          <View style={styles.hintRow}>
            <Text style={styles.hint}>Nhấn để xem nghĩa</Text>
          </View>
        </Animated.View>

        <Animated.View
          style={[styles.card, styles.back, { transform: [{ rotateY: backRotate }] }]}
        >
          <View style={styles.cardHeader}>
            <HSKBadge level={word.hskLevel} />
            <SpeakerButton
              text={word.character}
              size={20}
              color="#FFFFFF"
              style={styles.backSpeaker}
            />
          </View>
          <Text style={styles.pinyinLarge}>{word.pinyin}</Text>
          <Text style={styles.meaningLarge}>{word.meaning}</Text>
          {word.examples.length > 0 && (
            <View style={styles.exampleBox}>
              {/* Speaker for example sentence */}
              <View style={styles.exampleHeader}>
                <Text style={styles.exampleChinese}>{word.examples[0].chinese}</Text>
                <TouchableOpacity
                  onPress={(e) => {
                    if (e && e.stopPropagation) e.stopPropagation();
                  }}
                  activeOpacity={1}
                >
                  <SpeakerButton
                    text={word.examples[0].chinese}
                    size={14}
                    color="rgba(255,255,255,0.9)"
                    style={styles.exampleSpeaker}
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.examplePinyin}>{word.examples[0].pinyin}</Text>
              <Text style={styles.exampleViet}>{word.examples[0].vietnamese}</Text>
            </View>
          )}
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    width: "100%",
    maxWidth: 400,
    aspectRatio: 0.72,
    alignSelf: "center",
  },
  card: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 24,
    padding: 28,
    backfaceVisibility: "hidden",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  front: { backgroundColor: "#FFFFFF" },
  back: { backgroundColor: colors.light.primary },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    position: "absolute",
    top: 28,
    left: 28,
    right: 28,
  },
  backSpeaker: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  character: {
    fontSize: 96,
    fontWeight: "700",
    color: colors.light.primary,
    marginVertical: 16,
    lineHeight: 110,
  },
  traditional: {
    fontSize: 14,
    color: colors.light.mutedForeground,
    fontFamily: "Inter_400Regular",
  },
  hintRow: { position: "absolute", bottom: 28 },
  hint: {
    fontSize: 13,
    color: colors.light.mutedForeground,
    fontFamily: "Inter_400Regular",
  },
  pinyinLarge: {
    fontSize: 32,
    color: "rgba(255,255,255,0.85)",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
    marginTop: 16,
  },
  meaningLarge: {
    fontSize: 20,
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginBottom: 24,
  },
  exampleBox: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    padding: 16,
    width: "100%",
    gap: 4,
  },
  exampleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  exampleChinese: {
    flex: 1,
    fontSize: 16,
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
  },
  exampleSpeaker: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderColor: "rgba(255,255,255,0.3)",
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  examplePinyin: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    fontFamily: "Inter_400Regular",
  },
  exampleViet: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    fontFamily: "Inter_500Medium",
  },
});
