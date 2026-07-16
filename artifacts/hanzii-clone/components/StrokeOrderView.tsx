import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { G, Path } from "react-native-svg";

import colors from "@/constants/colors";

// ⚠️ Must be defined at module level — never inside render or map()
const AnimatedPath = Animated.createAnimatedComponent(Path as any);

interface HanziData {
  strokes: string[];
  medians: number[][][];
}

const CACHE: Record<string, HanziData | null> = {};

async function fetchStrokeData(char: string): Promise<HanziData | null> {
  if (char in CACHE) return CACHE[char];
  try {
    const encoded = encodeURIComponent(char);
    const url = `https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/${encoded}.json`;
    const res = await fetch(url);
    if (!res.ok) { CACHE[char] = null; return null; }
    const data: HanziData = await res.json();
    CACHE[char] = data;
    return data;
  } catch {
    CACHE[char] = null;
    return null;
  }
}

interface Props {
  character: string;
  size?: number;
  autoPlay?: boolean;
  strokeColor?: string;
  guideColor?: string;
}

const STROKE_DURATION = 380;
const STROKE_GAP = 220;

export function StrokeOrderView({
  character,
  size = 180,
  autoPlay = true,
  strokeColor = colors.light.primary,
  guideColor = "#DCDCDC",
}: Props) {
  const [data, setData] = useState<HanziData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStroke, setCurrentStroke] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);

  // Stable animated values — recreated only when stroke count changes
  const opacitiesRef = useRef<Animated.Value[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setData(null);
    setCurrentStroke(-1);
    setIsPlaying(false);
    fetchStrokeData(character).then((d) => {
      if (cancelled) return;
      setData(d);
      setLoading(false);
      if (d) {
        opacitiesRef.current = d.strokes.map(() => new Animated.Value(0));
        if (autoPlay) {
          // slight delay so component is mounted
          timerRef.current = setTimeout(() => {
            if (!cancelled) startAnim(d, opacitiesRef.current);
          }, 150);
        }
      }
    });
    return () => {
      cancelled = true;
      stopAnim();
    };
  }, [character]);

  function stopAnim() {
    if (timerRef.current) clearTimeout(timerRef.current);
    animRef.current?.stop();
  }

  function startAnim(d: HanziData, ops: Animated.Value[]) {
    stopAnim();
    ops.forEach((a) => a.setValue(0));
    setCurrentStroke(-1);
    setIsPlaying(true);

    let idx = 0;

    function nextStroke() {
      if (idx >= d.strokes.length) {
        setIsPlaying(false);
        return;
      }
      const currentIdx = idx;
      setCurrentStroke(currentIdx);
      ops[currentIdx].setValue(0);

      animRef.current = Animated.timing(ops[currentIdx], {
        toValue: 1,
        duration: STROKE_DURATION,
        useNativeDriver: true,
      });
      animRef.current.start(({ finished }) => {
        if (!finished) return;
        idx++;
        timerRef.current = setTimeout(nextStroke, STROKE_GAP);
      });
    }

    nextStroke();
  }

  const replay = useCallback(() => {
    if (!data) return;
    startAnim(data, opacitiesRef.current);
  }, [data]);

  if (loading) {
    return (
      <View style={[styles.center, { width: size, height: size }]}>
        <ActivityIndicator size="small" color={strokeColor} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.center, { width: size, height: size }]}>
        <Text style={{ fontSize: size * 0.55, color: strokeColor, fontWeight: "700" }}>
          {character}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={[styles.svgBox, { width: size, height: size, borderRadius: size * 0.1 }]}>
        {/* Grid */}
        <Svg width={size} height={size} viewBox="0 0 100 100" style={StyleSheet.absoluteFill}>
          <Path d="M50 0 L50 100" stroke="#E8E8E8" strokeWidth="0.8" strokeDasharray="3,3" />
          <Path d="M0 50 L100 50" stroke="#E8E8E8" strokeWidth="0.8" strokeDasharray="3,3" />
        </Svg>

        {/* Full character as faint guide */}
        <Svg width={size} height={size} viewBox="0 0 1024 1024" style={StyleSheet.absoluteFill}>
          <G transform="translate(0,900) scale(1,-1)">
            {data.strokes.map((d, i) => (
              <Path key={i} d={d} fill={guideColor} />
            ))}
          </G>
        </Svg>

        {/* Animated strokes revealed one by one */}
        <Svg width={size} height={size} viewBox="0 0 1024 1024" style={StyleSheet.absoluteFill}>
          <G transform="translate(0,900) scale(1,-1)">
            {data.strokes.map((d, i) => {
              if (i > currentStroke) return null;
              return (
                <AnimatedPath
                  key={i}
                  d={d}
                  fill={i === currentStroke ? strokeColor : "#444"}
                  style={{ opacity: opacitiesRef.current[i] }}
                />
              );
            })}
          </G>
        </Svg>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <Text style={styles.counter}>
          {Math.max(0, currentStroke + 1)}/{data.strokes.length} nét
        </Text>
        <TouchableOpacity style={styles.replayBtn} onPress={replay} activeOpacity={0.7}>
          <Text style={[styles.replayText, { color: strokeColor }]}>
            {isPlaying ? "⏸ Đang chạy" : "▶ Xem lại"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: "center", gap: 10 },
  center: { alignItems: "center", justifyContent: "center" },
  svgBox: {
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: colors.light.border,
    overflow: "hidden",
  },
  controls: { flexDirection: "row", alignItems: "center", gap: 16 },
  counter: { fontSize: 13, color: colors.light.mutedForeground, fontFamily: "Inter_500Medium" },
  replayBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.light.card,
    borderWidth: 1,
    borderColor: colors.light.border,
  },
  replayText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
