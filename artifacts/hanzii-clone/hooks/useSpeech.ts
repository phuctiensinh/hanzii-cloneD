import { Platform } from "react-native";
import * as Speech from "expo-speech";

let activeAudio: HTMLAudioElement | null = null;

export function useSpeech() {
  const speak = (text: string) => {
    if (Platform.OS === "web") {
      if (typeof window === "undefined") return;

      // Stop any currently playing audio
      if (activeAudio) {
        activeAudio.pause();
        activeAudio.currentTime = 0;
        activeAudio = null;
      }

      // Use our server-side TTS proxy — works in all WebViews (Messenger, Zalo, etc.)
      // because the audio is served from the same origin with no CORS restrictions.
      const url = `/api/tts?text=${encodeURIComponent(text)}`;
      const audio = new Audio(url);
      activeAudio = audio;
      audio.play().catch(() => {
        // Fallback: Web Speech API (works on desktop browsers but not all WebViews)
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = "zh-CN";
          utterance.rate = 0.85;
          window.speechSynthesis.speak(utterance);
        }
      });
    } else {
      Speech.stop();
      Speech.speak(text, { language: "zh-CN", rate: 0.85 });
    }
  };

  return { speak };
}
