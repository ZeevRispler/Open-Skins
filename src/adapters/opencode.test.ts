import { describe, it, expect, vi } from "vitest";
const api = {
  global: { health: vi.fn() },
  provider: { list: vi.fn() },
  session: { messages: vi.fn(), status: vi.fn(), diff: vi.fn() },
  permission: { list: vi.fn(), reply: vi.fn() },
  question: { list: vi.fn(), reply: vi.fn(), reject: vi.fn() },
  file: { list: vi.fn() },
};
vi.mock("@opencode-ai/sdk/v2/client", () => ({
  createOpencodeClient: () => api,
}));
import { OpenCodeAdapter } from "./opencode";
import { AgentState } from "#/core/agent-state";
describe("OpenCode adapter contract", () => {
  it("normalizes pending permission, latest state and actual patch output", async () => {
    api.session.messages.mockResolvedValue({
      data: [
        {
          info: {
            id: "old",
            role: "assistant",
            error: { name: "UnknownError" },
          },
          parts: [],
        },
        {
          info: { id: "new", role: "assistant" },
          parts: [{ type: "text", text: "Done" }],
        },
      ],
    });
    api.session.status.mockResolvedValue({ data: {} });
    api.session.diff.mockResolvedValue({
      data: [{ file: "a.txt", patch: "+ new", additions: 1, deletions: 0 }],
    });
    api.permission.list.mockResolvedValue({
      data: [
        { id: "p", sessionID: "s", permission: "bash", patterns: ["echo hi"] },
      ],
    });
    api.question.list.mockResolvedValue({ data: [] });
    api.file.list.mockResolvedValue({ data: [] });
    const a = new OpenCodeAdapter("http://localhost");
    const s = { id: "s", title: "Test" };
    const snapshot = await a.snapshot(s);
    expect(snapshot.state).toBe(AgentState.AWAITING_USER_CONFIRMATION);
    expect(snapshot.changes).toContain("+ new");
    await a.respond(s, snapshot.approvals[0], true);
    expect(api.permission.reply).toHaveBeenCalledWith({
      requestID: "p",
      directory: undefined,
      reply: "once",
    });
    api.permission.list.mockResolvedValue({ data: [] });
    expect((await a.snapshot(s)).state).toBe(AgentState.AWAITING_USER_INPUT);
    expect(a.capabilities.resume).toBe(false);
    await expect(a.resume()).rejects.toThrow("does not expose pause/resume");
  });
});
