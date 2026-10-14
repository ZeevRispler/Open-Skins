import { beforeEach, describe, expect, it, vi } from "vitest";
import { AgentState } from "#/core/agent-state";

const api = vi.hoisted(() => ({
  conversation: {
    createConversation: vi.fn(),
    getConversation: vi.fn(),
    searchEvents: vi.fn(),
    respondToConfirmation: vi.fn(),
  },
  agents: { listAgentProfiles: vi.fn() },
  server: { getServerInfo: vi.fn() },
  file: { downloadTextFile: vi.fn(), close: vi.fn() },
}));

vi.mock("@openhands/typescript-client/clients", () => ({
  ConversationClient: class {
    constructor() {
      return api.conversation;
    }
  },
  AgentProfilesClient: class {
    constructor() {
      return api.agents;
    }
  },
  ServerClient: class {
    constructor() {
      return api.server;
    }
  },
  FileClient: class {
    constructor() {
      return api.file;
    }
  },
}));

import { OpenHandsAdapter } from "./openhands";

describe("OpenHands adapter contract", () => {
  beforeEach(() => vi.clearAllMocks());

  it("requires a workspace and configured profile before creating a session", async () => {
    api.server.getServerInfo.mockResolvedValue({});
    api.agents.listAgentProfiles.mockResolvedValue({
      active_agent_profile_id: "default",
      profiles: [{ id: "default", name: "Default" }],
    });
    api.conversation.createConversation.mockResolvedValue({
      id: "session-1",
      title: "Test",
      workspace: { working_dir: "/workspace" },
    });
    const adapter = new OpenHandsAdapter("http://localhost");
    await adapter.connect();

    await expect(adapter.create("default")).rejects.toThrow(
      "Choose a working directory",
    );
    expect(api.conversation.createConversation).not.toHaveBeenCalled();

    await expect(
      adapter.create(undefined, "/workspace"),
    ).resolves.toMatchObject({
      id: "session-1",
      directory: "/workspace",
    });
    expect(api.conversation.createConversation).toHaveBeenCalledWith(
      expect.objectContaining({
        agent_profile_id: "default",
        workspace: { working_dir: "/workspace" },
      }),
    );
  });

  it("surfaces confirmation requests and forwards the user's decision", async () => {
    api.conversation.getConversation.mockResolvedValue({
      execution_status: "waiting_for_confirmation",
    });
    api.conversation.searchEvents.mockResolvedValue({
      items: [],
      next_page_id: undefined,
    });
    const adapter = new OpenHandsAdapter("http://localhost");
    const session = { id: "session-1", title: "Test", directory: "/workspace" };

    const snapshot = await adapter.snapshot(session);
    expect(snapshot.state).toBe(AgentState.AWAITING_USER_CONFIRMATION);
    expect(snapshot.approvals).toEqual([
      { id: "session-1", title: "Agent requests permission to continue" },
    ]);

    await adapter.respond(session, snapshot.approvals[0], false);
    expect(api.conversation.respondToConfirmation).toHaveBeenCalledWith(
      "session-1",
      { accept: false },
    );
    expect(adapter.capabilities.resume).toBe(true);
  });
});
