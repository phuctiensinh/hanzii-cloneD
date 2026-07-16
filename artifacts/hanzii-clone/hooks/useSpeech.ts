import { Platform } from "react-native";
import * as Speech from "expo-speech";

export function useSpeech() {
  const speak = (text: string) => {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "zh-CN";
        utterance.rate = 0.85;
        window.speechSynthesis.speak(utterance);
      }
    } else {
      Speech.stop();
      Speech.speak(text, { language: "zh-CN", rate: 0.85 });
    }
  };

  return { speak };
}
