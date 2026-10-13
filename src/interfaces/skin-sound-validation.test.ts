import { afterEach, describe, expect, it, vi } from "vitest";
import { muteSkinSound, playSkinSound, type SoundCue } from "./skin-sound";
import { useInterfaceStore } from "./interface-store";
import { WORKSPACE_INTERFACES } from "./interface-store";

afterEach(() => {
  muteSkinSound();
  vi.restoreAllMocks();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  delete (window as Window & { AudioContext?: typeof AudioContext })
    .AudioContext;
  useInterfaceStore.setState({ soundsEnabled: false });
});

function audioHarness(state = "running") {
  const oscillators: Array<{ type: string; frequency: number | undefined }> =
    [];
  const close = vi.fn().mockResolvedValue(undefined);
  class AudioStub {
    currentTime = 0;
    destination = {};
    state = state;
    resume = vi.fn().mockResolvedValue(undefined);
    close = close;
    createOscillator() {
      const oscillator = {
        type: "sine",
        frequency: {
          setValueAtTime: (frequency: number) => {
            oscillator.frequencyValue = frequency;
          },
          exponentialRampToValueAtTime: vi.fn(),
        },
        frequencyValue: undefined as number | undefined,
        connect: vi.fn(),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        onended: null as (() => void) | null,
      };
      oscillators.push({
        get type() {
          return oscillator.type;
        },
        get frequency() {
          return oscillator.frequencyValue;
        },
      });
      return oscillator;
    }
    createGain() {
      return {
        gain: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
      };
    }
  }
  vi.stubGlobal("AudioContext", AudioStub);
  (window as Window & { AudioContext?: typeof AudioContext }).AudioContext =
    AudioStub as unknown as typeof AudioContext;
  return { oscillators, close };
}

async function flushResume() {
  await Promise.resolve();
  await Promise.resolve();
}

describe("skin sound regression coverage", () => {
  it("keeps sounds opt-in by default and standard skin silent", async () => {
    const audio = audioHarness();
    useInterfaceStore.setState({ soundsEnabled: false });
    playSkinSound("retro", "complete");
    useInterfaceStore.setState({ soundsEnabled: true });
    playSkinSound("standard", "complete");
    await flushResume();
    expect(audio.oscillators).toHaveLength(0);
  });

  it("plays each cue for every sound skin with the expected note count and tone", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-01-01T00:00:01Z"));
    const audio = audioHarness();
    useInterfaceStore.setState({ soundsEnabled: true });
    const sounds = WORKSPACE_INTERFACES.filter((skin) => skin !== "standard");
    const cues: SoundCue[] = ["press", "complete", "approval", "error"];
    const expectedCounts: Record<SoundCue, number> = {
      press: 1,
      complete: 3,
      approval: 2,
      error: 2,
    };
    for (const skin of sounds) {
      for (const cue of cues) {
        if (cue === "press") vi.setSystemTime(Date.now() + 100);
        const before = audio.oscillators.length;
        playSkinSound(skin, cue);
        await flushResume();
        expect(audio.oscillators.slice(before)).toHaveLength(
          expectedCounts[cue],
        );
        expect(
          audio.oscillators
            .slice(before)
            .every(
              (note) =>
                note.type ===
                (skin === "retro"
                  ? "square"
                  : skin === "cockpit"
                    ? "triangle"
                    : "sine"),
            ),
        ).toBe(true);
      }
    }
    expect(audio.oscillators).toHaveLength(
      sounds.length *
        cues.reduce((total, cue) => total + expectedCounts[cue], 0),
    );
  });

  it("stays silent while the document is hidden", async () => {
    const audio = audioHarness();
    useInterfaceStore.setState({ soundsEnabled: true });
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    playSkinSound("dj", "error");
    await flushResume();
    expect(audio.oscillators).toHaveLength(0);
  });

  it("stays silent if the document becomes hidden while resume is pending", async () => {
    let resolveResume!: () => void;
    const audio = audioHarness();
    vi.stubGlobal(
      "AudioContext",
      class {
        state = "running";
        currentTime = 0;
        destination = {};
        resume = vi.fn(
          () =>
            new Promise<void>((resolve) => {
              resolveResume = resolve;
            }),
        );
        close = audio.close;
        createOscillator = () => {
          const osc = {
            type: "sine",
            frequency: {
              setValueAtTime: vi.fn(),
              exponentialRampToValueAtTime: vi.fn(),
            },
            connect: vi.fn(),
            disconnect: vi.fn(),
            start: vi.fn(),
            stop: vi.fn(),
            onended: null,
          };
          audio.oscillators.push({ type: osc.type, frequency: undefined });
          return osc;
        };
        createGain = () => ({
          gain: {
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          },
          connect: vi.fn(),
          disconnect: vi.fn(),
        });
      },
    );
    (window as Window & { AudioContext?: typeof AudioContext }).AudioContext =
      AudioContext;
    useInterfaceStore.setState({ soundsEnabled: true });
    playSkinSound("dj", "complete");
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    resolveResume();
    await flushResume();
    expect(audio.oscillators).toHaveLength(0);
  });

  it("does not replay a stale cue after mute and re-enable while resume is pending", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2028-01-01T00:00:01Z"));
    const pending: Array<() => void> = [];
    const notes: string[] = [];
    const close = vi.fn().mockResolvedValue(undefined);
    class DeferredAudio {
      state = "running";
      currentTime = 0;
      destination = {};
      resume = vi.fn(
        () => new Promise<void>((resolve) => pending.push(resolve)),
      );
      close = close;
      createOscillator() {
        const osc = {
          type: "sine",
          frequency: {
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          },
          connect: vi.fn(),
          disconnect: vi.fn(),
          start: vi.fn(() => notes.push("note")),
          stop: vi.fn(),
          onended: null,
        };
        return osc;
      }
      createGain() {
        return {
          gain: {
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          },
          connect: vi.fn(),
          disconnect: vi.fn(),
        };
      }
    }
    vi.stubGlobal("AudioContext", DeferredAudio);
    (window as Window & { AudioContext?: typeof AudioContext }).AudioContext =
      DeferredAudio as unknown as typeof AudioContext;
    useInterfaceStore.setState({ soundsEnabled: true });
    playSkinSound("dj", "complete");
    muteSkinSound();
    playSkinSound("dj", "press");
    pending[1]();
    await flushResume();
    pending[0]();
    await flushResume();
    expect(notes).toHaveLength(1);
    expect(close).toHaveBeenCalledOnce();
  });

  it("handles missing AudioContext and rejected resume without throwing", async () => {
    useInterfaceStore.setState({ soundsEnabled: true });
    vi.stubGlobal("AudioContext", undefined);
    delete (window as Window & { AudioContext?: typeof AudioContext })
      .AudioContext;
    expect(() => playSkinSound("dj", "complete")).not.toThrow();

    const audio = audioHarness();
    audio.oscillators.length = 0;
    const rejected = vi.fn().mockRejectedValue(new Error("audio unavailable"));
    // The shared context is constructed with this implementation on first play.
    vi.stubGlobal(
      "AudioContext",
      class {
        state = "running";
        currentTime = 0;
        destination = {};
        resume = rejected;
        close = vi.fn().mockResolvedValue(undefined);
        createOscillator = vi.fn();
        createGain = vi.fn();
      },
    );
    (window as Window & { AudioContext?: typeof AudioContext }).AudioContext =
      AudioContext;
    muteSkinSound();
    playSkinSound("dj", "complete");
    await flushResume();
    expect(rejected).toHaveBeenCalledOnce();
    expect(audio.oscillators).toHaveLength(0);
  });

  it("throttles rapid press cues and mute closes the context", async () => {
    vi.spyOn(Date, "now")
      .mockReturnValueOnce(5_000_000_000_000)
      .mockReturnValueOnce(5_000_000_000_020);
    const audio = audioHarness();
    useInterfaceStore.setState({ soundsEnabled: true });
    playSkinSound("dj", "press");
    await flushResume();
    playSkinSound("dj", "press");
    await flushResume();
    expect(audio.oscillators).toHaveLength(1);
    muteSkinSound();
    expect(audio.close).toHaveBeenCalledOnce();
  });
});
