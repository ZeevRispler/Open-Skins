import {
  AgentProfilesClient,
  ConversationClient,
  FileClient,
  ServerClient,
} from "@openhands/typescript-client/clients";
import type { ConversationInfo } from "@openhands/typescript-client";
import { AgentState } from "#/types/agent-state";
import {
  emptySnapshot,
  textContent,
  type AgentAdapter,
  type Session,
  type Snapshot,
  type Approval,
} from "#/core/types";
const pausedToolMessage =
  "Tool call interrupted before completion. The conversation was paused.";
export class OpenHandsAdapter implements AgentAdapter {
  readonly kind = "openhands" as const;
  readonly capabilities = {
    resume: true,
    fileTree: false,
    modelDuringSession: false,
  };
  private conversations: ConversationClient;
  private agents: AgentProfilesClient;
  private server: ServerClient;
  private active?: string;
  constructor(private host: string) {
    this.conversations = new ConversationClient({ host });
    this.agents = new AgentProfilesClient({ host });
    this.server = new ServerClient({ host });
  }
  async connect() {
    await this.server.getServerInfo();
    const data = await this.agents.listAgentProfiles();
    this.active = data.active_agent_profile_id ?? undefined;
    return data.profiles.flatMap((p) =>
      p.id
        ? [
            {
              id: p.id,
              label: p.name + (p.id === this.active ? " · default" : ""),
            },
          ]
        : [],
    );
  }
  async sessions() {
    return (
      await this.conversations.searchConversations({ limit: 50 })
    ).items.map(this.session);
  }
  private session = (c: ConversationInfo): Session => ({
    id: c.id,
    title: c.title || c.id.slice(0, 8),
    directory: (c.workspace as { working_dir?: string } | null)?.working_dir,
  });
  async create(model?: string, directory?: string) {
    if (!directory)
      throw new Error(
        "Choose a working directory in Connection before creating an OpenHands session.",
      );
    const id = model || this.active;
    if (!id) throw new Error("Configure an agent profile in OpenHands first");
    const c = await this.conversations.createConversation({
      agent_profile_id: id,
      workspace: { ...(directory ? { working_dir: directory } : {}) },
      max_iterations: 500,
      stuck_detection: true,
    });
    return this.session(c);
  }
  async send(s: Session, text: string) {
    await this.conversations.sendEvent(
      s.id,
      { role: "user", content: [{ type: "text", text }] },
      { run: true },
    );
  }
  async stop(s: Session) {
    await this.conversations.interruptConversation(s.id);
  }
  async resume(s: Session) {
    await this.conversations.runConversation(s.id);
  }
  async snapshot(s: Session): Promise<Snapshot> {
    const [info, page] = await Promise.all([
      this.conversations.getConversation(s.id),
      this.conversations.searchEvents(s.id, {
        limit: 100,
        sort_order: "TIMESTAMP_DESC",
      }),
    ]);
    const out = emptySnapshot();
    const status = String(info.execution_status);
    out.state =
      (
        {
          running: AgentState.RUNNING,
          paused: AgentState.PAUSED,
          finished: AgentState.FINISHED,
          error: AgentState.ERROR,
          waiting_for_confirmation: AgentState.AWAITING_USER_CONFIRMATION,
        } as Record<string, AgentState>
      )[status] ?? AgentState.AWAITING_USER_INPUT;
    const events = [...page.items];
    let nextPage = page.next_page_id;
    for (let i = 1; i < 4 && nextPage; i++) {
      const next = await this.conversations.searchEvents(s.id, {
        limit: 100,
        sort_order: "TIMESTAMP_DESC",
        page_id: nextPage,
      });
      events.push(...next.items);
      nextPage = next.next_page_id;
    }
    for (const raw of events.reverse()) {
      const event = raw as unknown as Record<string, unknown>;
      const id = String(event.id ?? crypto.randomUUID());
      const kind = event.kind;
      if (kind === "MessageEvent") {
        const m = event.llm_message as { role: string; content: unknown };
        const text = textContent(m.content);
        if (text)
          out.messages.push({
            id,
            role: m.role === "user" ? "user" : "assistant",
            text,
          });
      }
      if (kind === "ActionEvent") {
        const text = JSON.stringify(event.action, null, 2);
        out.messages.push({ id, role: "tool", text });
        if (/edit|write|patch/.test(String(event.tool_name)))
          out.changes += text + "\n";
      }
      if (kind === "ObservationEvent") {
        const observation = textContent(event.observation);
        if (observation) {
          out.terminal += observation + "\n";
          out.messages.push({ id, role: "tool", text: observation });
        }
      }
      if (kind === "AgentErrorEvent") {
        const text = String(event.error);
        out.messages.push({
          id,
          role: "system",
          text: text === pausedToolMessage ? "Tool stopped by user." : text,
        });
      }
      if (kind === "AcpToolCallEvent") {
        const text = textContent(event.content);
        if (text) {
          out.terminal += text + "\n";
          out.messages.push({ id, role: "tool", text });
        }
      }
    }
    if (out.state === AgentState.AWAITING_USER_CONFIRMATION)
      out.approvals = [
        { id: s.id, title: "Agent requests permission to continue" },
      ];
    return out;
  }
  async readFile(s: Session, path: string) {
    const files = new FileClient({ host: this.host, conversationId: s.id });
    try {
      return await files.downloadTextFile(
        path.startsWith("/")
          ? path
          : (s.directory ? s.directory.replace(/\/$/, "") + "/" : "") + path,
      );
    } finally {
      files.close();
    }
  }
  async respond(s: Session, _a: Approval, accept: boolean) {
    await this.conversations.respondToConfirmation(s.id, { accept });
  }
  dispose() {
    this.conversations.close();
    this.agents.close();
    this.server.close();
  }
}
