import { afterEach, describe, expect, it, vi } from "vitest";
import { agentSoundCue, muteSkinSound, playSkinSound } from "./skin-sound";
import { useInterfaceStore } from "./interface-store";
import { AgentState } from "#/types/agent-state";

afterEach(() => {
  muteSkinSound();
  vi.unstubAllGlobals();
  useInterfaceStore.setState({ soundsEnabled: false });
});
// @spec CS-011 — Cues use meaningful state changes and mute stops playback.
describe("skin feedback", () => {
  it("announces meaningful transitions, never pause or repeated streaming state", () => {
    expect(agentSoundCue(AgentState.RUNNING, AgentState.FINISHED)).toBe(
      "complete",
    );
    expect(
      agentSoundCue(AgentState.RUNNING, AgentState.AWAITING_USER_INPUT),
    ).toBe("complete");
    expect(
      agentSoundCue(AgentState.RUNNING, AgentState.AWAITING_USER_CONFIRMATION),
    ).toBe("approval");
    expect(agentSoundCue(AgentState.RUNNING, AgentState.ERROR)).toBe("error");
    expect(agentSoundCue(AgentState.RUNNING, AgentState.PAUSED)).toBeNull();
    expect(agentSoundCue(AgentState.RUNNING, AgentState.RUNNING)).toBeNull();
    expect(
      agentSoundCue(AgentState.PAUSED, AgentState.AWAITING_USER_INPUT),
    ).toBeNull();
  });
  it("creates skin-specific local notes and stops them on mute", async () => {
    const types: string[] = [];
    const close = vi.fn().mockResolvedValue(undefined);
    class AudioStub {
      state = "running";
      currentTime = 0;
      destination = {};
      resume = vi.fn().mockResolvedValue(undefined);
      close = close;
      createOscillator() {
        const oscillator = {
          type: "sine",
          frequency: {
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          },
          connect: vi.fn(),
          disconnect: vi.fn(),
          start: () => types.push(oscillator.type),
          stop: vi.fn(),
          onended: null,
        };
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
    useInterfaceStore.setState({ soundsEnabled: true });
    playSkinSound("retro", "complete");
    await Promise.resolve();
    expect(types).toEqual(["square", "square", "square"]);
    muteSkinSound();
    expect(close).toHaveBeenCalledOnce();
    useInterfaceStore.setState({ soundsEnabled: false });
    playSkinSound("cockpit", "approval");
    await Promise.resolve();
    expect(types).toHaveLength(3);
  });
});
