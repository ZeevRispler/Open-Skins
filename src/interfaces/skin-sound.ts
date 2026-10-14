import { useInterfaceStore, type WorkspaceInterface } from "./interface-store";
import { AgentState } from "#/types/agent-state";

export type SoundCue = "press" | "complete" | "approval" | "error" | "scratch";
let context: AudioContext | undefined;
let lastPress = 0;

// @spec CS-011 — Local cues stay opt-in and never affect coding.
// Synthesized locally: no downloads, provider calls, microphone or audio loops.
export function playSkinSound(skin: WorkspaceInterface, cue: SoundCue) {
  if (
    skin === "standard" ||
    typeof window === "undefined" ||
    !window.AudioContext
  )
    return;
  if (
    document.visibilityState === "hidden" ||
    !useInterfaceStore.getState().soundsEnabled
  )
    return;
  const now = Date.now();
  if ((cue === "press" || cue === "scratch") && now - lastPress < 70) return;
  if (cue === "press" || cue === "scratch") lastPress = now;
  try {
    context ??= new AudioContext();
    const playback = context;
    void playback
      .resume()
      .then(() => {
        if (
          context !== playback ||
          playback.state !== "running" ||
          document.visibilityState === "hidden" ||
          !useInterfaceStore.getState().soundsEnabled
        )
          return;
        const base = {
          dj: 180,
          cockpit: 420,
          retro: 660,
          ferrari: 260,
          flagship: 320,
        }[skin];
        const notes =
          cue === "complete"
            ? [1, 1.25, 1.5]
            : cue === "approval"
              ? [1.5, 1.5]
              : cue === "error"
                ? [1, 0.65]
                : [1];
        const duration =
          cue === "press" ? 0.065 : cue === "scratch" ? 0.1 : 0.14;
        notes.forEach((ratio, index) => {
          const oscillator = playback.createOscillator();
          const gain = playback.createGain();
          const start = playback.currentTime + index * 0.16;
          oscillator.type =
            cue === "scratch"
              ? "sawtooth"
              : skin === "retro"
                ? "square"
                : skin === "cockpit"
                  ? "triangle"
                  : "sine";
          oscillator.frequency.setValueAtTime(base * ratio, start);
          if (cue === "press" || cue === "scratch")
            oscillator.frequency.exponentialRampToValueAtTime(
              base * 0.45,
              start + duration,
            );
          gain.gain.setValueAtTime(0.0001, start);
          gain.gain.exponentialRampToValueAtTime(
            skin === "retro" || cue === "scratch" ? 0.025 : 0.06,
            start + 0.008,
          );
          gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
          oscillator.connect(gain);
          gain.connect(playback.destination);
          oscillator.start(start);
          oscillator.stop(start + duration + 0.02);
          oscillator.onended = () => {
            oscillator.disconnect();
            gain.disconnect();
          };
        });
      })
      .catch(() => {});
  } catch {
    /* Audio being unavailable must never interrupt coding. */
  }
}

export function agentSoundCue(
  previous: AgentState,
  current: AgentState,
): SoundCue | null {
  if (previous === current) return null;
  if (current === AgentState.AWAITING_USER_CONFIRMATION) return "approval";
  if (current === AgentState.ERROR || current === AgentState.RATE_LIMITED)
    return "error";
  if (
    previous === AgentState.RUNNING &&
    (current === AgentState.FINISHED ||
      current === AgentState.AWAITING_USER_INPUT)
  )
    return "complete";
  return null;
}

export function muteSkinSound() {
  lastPress = 0;
  void context?.close().catch(() => {});
  context = undefined;
}
