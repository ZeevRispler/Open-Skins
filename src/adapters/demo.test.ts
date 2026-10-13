import { afterEach, describe, it, expect, vi } from "vitest";
import { DemoAdapter } from "./demo";
import { AgentState } from "#/types/agent-state";
afterEach(() => vi.useRealTimers());
describe("shared demo contract", () => {
  it("stops a pending turn and resumes exactly once without losing history", async () => {
    vi.useFakeTimers();
    const a = new DemoAdapter();
    const s = await a.create();
    await a.send(s, "slow demo");
    await a.stop(s);
    await vi.advanceTimersByTimeAsync(12000);
    expect((await a.snapshot(s)).state).toBe(AgentState.PAUSED);
    expect((await a.snapshot(s)).messages).toHaveLength(1);
    await a.resume(s);
    await vi.advanceTimersByTimeAsync(1200);
    expect((await a.snapshot(s)).messages).toHaveLength(2);
    expect(await a.readFile(s, "demo.py")).toContain("Open Skins");
    a.dispose();
  });
  it("rejects permission without creating files", async () => {
    const a = new DemoAdapter();
    const s = await a.create();
    await a.send(s, "approval");
    const snap = await a.snapshot(s);
    await a.respond(s, snap.approvals[0], false);
    expect((await a.snapshot(s)).files).toEqual([]);
    expect((await a.snapshot(s)).approvals).toEqual([]);
    a.dispose();
  });
});
