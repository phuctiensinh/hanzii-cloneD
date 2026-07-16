import React, { useCallback, useRef, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Svg, { G, Path } from "react-native-svg";

import colors from "@/constants/colors";

interface Props {
  size?: number;
  guideStrokes?: string[];
  onStrokeComplete?: (strokeCount: number) => void;
  onClear?: () => void;
  onCheck?: (paths: string[]) => void;
  strokeColor?: string;
}

export function WritingPad({
  size = 280,
  guideStrokes,
  onStrokeComplete,
  onClear,
  onCheck,
  strokeColor = "#1C1C1E",
}: Props) {
  const [paths, setPaths] = useState<string[]>([]);
  const [livePath, setLivePath] = useState<string>("");

  const currentPoints = useRef<string>("");
  const rafId = useRef<number | null>(null);
  const pathsRef = useRef<string[]>([]);

  const scheduleLiveUpdate = useCallback(() => {
    if (rafId.current !== null) return;
    rafId.current = requestAnimationFrame(() => {
      rafId.current = null;
      setLivePath(currentPoints.current);
    });
  }, []);

  const pan = Gesture.Pan()
    .minDistance(0)
    .runOnJS(true)
    .onStart((e) => {
      currentPoints.current = `M ${e.x.toFixed(1)} ${e.y.toFixed(1)}`;
      setLivePath(currentPoints.current);
    })
    .onUpdate((e) => {
      currentPoints.current += ` L ${e.x.toFixed(1)} ${e.y.toFixed(1)}`;
      scheduleLiveUpdate();
    })
    .onEnd(() => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
      const stroke = currentPoints.current;
      currentPoints.current = "";
      setLivePath("");
      if (stroke) {
        setPaths((prev) => {
          const next = [...prev, stroke];
          pathsRef.current = next;
          onStrokeComplete?.(next.length);
          return next;
        });
      }
    });

  const clear = useCallback(() => {
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    currentPoints.current = "";
    pathsRef.current = [];
    setPaths([]);
    setLivePath("");
    onClear?.();
  }, [onClear]);

  const handleCheck = useCallback(() => {
    onCheck?.(pathsRef.current);
  }, [onCheck]);

  return (
    <View style={styles.wrapper}>
      <GestureDetector gesture={pan}>
        <View
          style={[styles.padBox, { width: size, height: size, borderRadius: size * 0.07 }]}
          collapsable={false}
        >
          {/* Grid */}
          <Svg width={size} height={size} viewBox="0 0 100 100" style={StyleSheet.absoluteFill} pointerEvents="none">
            <Path d="M50 0 L50 100" stroke="#D8D8D8" strokeWidth="0.7" strokeDasharray="4,4" />
            <Path d="M0 50 L100 50" stroke="#D8D8D8" strokeWidth="0.7" strokeDasharray="4,4" />
            <Path d="M0 0 L100 100" stroke="#EEEEEE" strokeWidth="0.5" strokeDasharray="3,6" />
            <Path d="M100 0 L0 100" stroke="#EEEEEE" strokeWidth="0.5" strokeDasharray="3,6" />
          </Svg>

          {/* Faint guide character */}
          {guideStrokes && guideStrokes.length > 0 && (
            <Svg width={size} height={size} viewBox="0 0 1024 1024" style={StyleSheet.absoluteFill} pointerEvents="none">
              <G transform="translate(0,900) scale(1,-1)">
                {guideStrokes.map((path, i) => (
                  <Path key={i} d={path} fill="#E4E4E4" />
                ))}
              </G>
            </Svg>
          )}

          {/* User drawn strokes */}
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={StyleSheet.absoluteFill} pointerEvents="none">
            {paths.map((p, i) => (
              <Path
                key={i}
                d={p}
                stroke={strokeColor}
                strokeWidth={Platform.OS === "web" ? "8" : "10"}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ))}
            {livePath ? (
              <Path
                d={livePath}
                stroke={strokeColor}
                strokeWidth={Platform.OS === "web" ? "8" : "10"}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ) : null}
          </Svg>

          {/* Stroke badge */}
          {paths.length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{paths.length} nét</Text>
            </View>
          )}

          {/* Empty hint */}
          {paths.length === 0 && !livePath && (
            <View style={styles.hint} pointerEvents="none">
              <Text style={styles.hintText}>✍️ Vẽ tại đây</Text>
            </View>
          )}
        </View>
      </GestureDetector>

      {/* Buttons */}
      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.clearBtn} onPress={clear} activeOpacity={0.7}>
          <Text style={styles.clearText}>✕ Xóa</Text>
        </TouchableOpacity>

        {onCheck && (
          <TouchableOpacity
            style={[styles.checkBtn, paths.length === 0 && styles.checkBtnDisabled]}
            onPress={handleCheck}
            activeOpacity={0.8}
            disabled={paths.length === 0}
          >
            <Text style={styles.checkText}>✓ Kiểm tra</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: "center", gap: 14 },
  padBox: {
    backgroundColor: "#FEFEFE",
    borderWidth: 2,
    borderColor: colors.light.border,
    overflow: "hidden",
  },
  badge: {
    position: "absolute", top: 10, right: 10,
    backgroundColor: colors.light.primary,
    borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3,
  },
  badgeText: { color: "#fff", fontSize: 11, fontFamily: "Inter_700Bold" },
  hint: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  hintText: { fontSize: 20, color: "#C0C0C0" },
  btnRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  clearBtn: {
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 22, borderWidth: 1.5,
    borderColor: colors.light.border,
    backgroundColor: colors.light.card,
  },
  clearText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.light.mutedForeground },
  checkBtn: {
    paddingHorizontal: 24, paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: colors.light.primary,
  },
  checkBtnDisabled: { opacity: 0.35 },
  checkText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" },
});
