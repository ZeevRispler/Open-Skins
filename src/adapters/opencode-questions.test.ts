import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  global: { health: vi.fn() },
  provider: { list: vi.fn() },
  session: {
    messages: vi.fn(),
    status: vi.fn(),
    diff: vi.fn(),
    promptAsync: vi.fn(),
    abort: vi.fn(),
  },
  permission: { list: vi.fn(), reply: vi.fn() },
  question: { list: vi.fn(), reply: vi.fn(), reject: vi.fn() },
  file: { list: vi.fn() },
}));

vi.mock("@opencode-ai/sdk/v2/client", () => ({
  createOpencodeClient: () => api,
}));

import { OpenCodeAdapter } from "./opencode";
import { AgentState } from "#/types/agent-state";

describe("OpenCode question and provider contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.session.messages.mockResolvedValue({ data: [] });
    api.session.status.mockResolvedValue({ data: {} });
    api.session.diff.mockResolvedValue({ data: [] });
    api.permission.list.mockResolvedValue({ data: [] });
    api.question.list.mockResolvedValue({ data: [] });
    api.file.list.mockResolvedValue({ data: [] });
  });

  it("normalizes pending questions and sends selected answers or rejects them", async () => {
    api.question.list.mockResolvedValue({
      data: [
        {
          id: "question-1",
          sessionID: "session-1",
          questions: [
            {
              question: "Which file should I update?",
              options: [{ label: "README.md" }, { label: "app.ts" }],
            },
            {
              question: "Should I add a test?",
              options: [{ label: "Yes" }, { label: "No" }],
            },
          ],
        },
      ],
    });
    const adapter = new OpenCodeAdapter("http://localhost");
    const session = { id: "session-1", title: "Test", directory: "/workspace" };

    const snapshot = await adapter.snapshot(session);
    expect(snapshot.state).toBe(AgentState.AWAITING_USER_CONFIRMATION);
    expect(snapshot.approvals).toEqual([
      {
        id: "question-1",
        title: "Agent question",
        kind: "question",
        questions: [
          {
            text: "Which file should I update?",
            options: ["README.md", "app.ts"],
          },
          { text: "Should I add a test?", options: ["Yes", "No"] },
        ],
      },
    ]);

    await adapter.respond(session, snapshot.approvals[0], true, [
      "README.md",
      "Yes",
    ]);
    expect(api.question.reply).toHaveBeenCalledWith({
      requestID: "question-1",
      directory: "/workspace",
      answers: [["README.md"], ["Yes"]],
    });
    await adapter.respond(session, snapshot.approvals[0], false);
    expect(api.question.reject).toHaveBeenCalledWith({
      requestID: "question-1",
      directory: "/workspace",
    });
  });

  it("filters disconnected providers and sends the chosen model, with abort support", async () => {
    api.global.health.mockResolvedValue({});
    api.provider.list.mockResolvedValue({
      data: {
        connected: ["local"],
        all: [
          {
            id: "local",
            models: { fixture: { name: "Local Fixture" } },
          },
          {
            id: "remote",
            models: { paid: { name: "Remote Model" } },
          },
        ],
      },
    });
    const adapter = new OpenCodeAdapter("http://localhost");
    await expect(adapter.connect()).resolves.toEqual([
      { id: "local/fixture", label: "Local Fixture" },
    ]);

    const session = { id: "session-1", title: "Test", directory: "/workspace" };
    await adapter.send(session, "Use this model", "local/fixture");
    expect(api.session.promptAsync).toHaveBeenCalledWith({
      sessionID: "session-1",
      directory: "/workspace",
      parts: [{ type: "text", text: "Use this model" }],
      model: { providerID: "local", modelID: "fixture" },
    });
    await adapter.stop(session);
    expect(api.session.abort).toHaveBeenCalledWith({
      sessionID: "session-1",
      directory: "/workspace",
    });
    expect(adapter.capabilities).toMatchObject({
      resume: false,
      fileTree: true,
      modelDuringSession: true,
    });
  });
});
