import { createOpencodeClient } from "@opencode-ai/sdk/v2/client";
import { AgentState } from "#/types/agent-state";
import {
  emptySnapshot,
  type AgentAdapter,
  type Session,
  type Snapshot,
  type Approval,
} from "#/core/types";
export class OpenCodeAdapter implements AgentAdapter {
  readonly kind = "opencode" as const;
  readonly capabilities = {
    resume: false,
    fileTree: true,
    modelDuringSession: true,
  };
  private client: ReturnType<typeof createOpencodeClient>;
  private stopped = new Set<string>();
  constructor(host: string) {
    this.client = createOpencodeClient({ baseUrl: host, throwOnError: true });
  }
  async connect() {
    await this.client.global.health();
    const providers = (await this.client.provider.list()).data!;
    return providers.all
      .filter((p) => providers.connected.includes(p.id))
      .flatMap((p) =>
        Object.entries(p.models).map(([id, model]) => ({
          id: p.id + "/" + id,
          label: model.name || id,
        })),
      );
  }
  async sessions() {
    return ((await this.client.session.list()).data ?? []).map((s) => ({
      id: s.id,
      title: s.title,
      directory: s.directory,
    }));
  }
  async create(_model?: string, directory?: string) {
    const s = (
      await this.client.session.create({
        ...(directory ? { directory } : {}),
        title: "Open Skins",
      })
    ).data!;
    return { id: s.id, title: s.title, directory: s.directory };
  }
  async send(s: Session, text: string, model?: string) {
    this.stopped.delete(s.id);
    const slash = model?.indexOf("/") ?? -1;
    await this.client.session.promptAsync({
      sessionID: s.id,
      directory: s.directory,
      parts: [{ type: "text", text }],
      ...(slash > 0
        ? {
            model: {
              providerID: model!.slice(0, slash),
              modelID: model!.slice(slash + 1),
            },
          }
        : {}),
    });
  }
  async stop(s: Session) {
    await this.client.session.abort({
      sessionID: s.id,
      directory: s.directory,
    });
    this.stopped.add(s.id);
  }
  async resume() {
    throw new Error(
      "OpenCode does not expose pause/resume. Send a new message to continue.",
    );
  }
  async snapshot(s: Session): Promise<Snapshot> {
    const q = { sessionID: s.id, directory: s.directory };
    const [messages, status, permissions, questions, diff] = await Promise.all([
      this.client.session.messages(q),
      this.client.session.status({ directory: s.directory }),
      this.client.permission.list({ directory: s.directory }),
      this.client.question.list({ directory: s.directory }),
      this.client.session.diff(q),
    ]);
    const out = emptySnapshot();
    const active = status.data?.[s.id]?.type;
    out.state =
      active === "busy" || active === "retry"
        ? AgentState.RUNNING
        : this.stopped.has(s.id)
          ? AgentState.PAUSED
          : AgentState.AWAITING_USER_INPUT;
    const turns = messages.data ?? [];
    const latest = turns.at(-1);
    for (const m of turns) {
      const text = m.parts
        .filter((p) => p.type === "text")
        .map((p) => (p.type === "text" ? p.text : ""))
        .join("\n");
      if (text) out.messages.push({ id: m.info.id, role: m.info.role, text });
      for (const p of m.parts) {
        if (p.type === "tool") {
          const input = JSON.stringify(p.state.input, null, 2);
          const output =
            p.state.status === "completed"
              ? p.state.output
              : p.state.status === "error"
                ? p.state.error
                : "";
          out.messages.push({
            id: p.id,
            role: "tool",
            text: p.tool + "\n" + input + "\n" + output,
          });
          if (p.tool === "bash") out.terminal += input + "\n" + output + "\n";
        }
      }
      if (
        m.info.role === "assistant" &&
        m.info.error &&
        m.info.error.name !== "MessageAbortedError"
      ) {
        if (m === latest && active !== "busy" && active !== "retry")
          out.state = AgentState.ERROR;
        out.messages.push({
          id: m.info.id + "-error",
          role: "system",
          text: JSON.stringify(m.info.error),
        });
      }
    }
    out.approvals = (permissions.data ?? [])
      .filter((p) => p.sessionID === s.id)
      .map((p) => ({
        id: p.id,
        title: p.permission + ": " + p.patterns.join(", "),
        kind: "permission",
      }));
    out.approvals.push(
      ...(questions.data ?? [])
        .filter((p) => p.sessionID === s.id)
        .map((p) => ({
          id: p.id,
          title: "Agent question",
          kind: "question" as const,
          questions: p.questions.map((i) => ({
            text: i.question,
            options: i.options.map((o) => o.label),
          })),
        })),
    );
    if (out.approvals.length) out.state = AgentState.AWAITING_USER_CONFIRMATION;
    out.changes = (diff.data ?? [])
      .map(
        (d) =>
          `${d.file ?? "File"} (+${d.additions}/-${d.deletions})\n${d.patch ?? ""}`,
      )
      .join("\n\n");
    out.files =
      (
        await this.client.file.list({ directory: s.directory, path: "" })
      ).data?.map((f) => ({
        path: f.path,
        directory: f.type === "directory",
      })) ?? [];
    return out;
  }
  async readFile(s: Session, path: string) {
    const file = (await this.client.file.read({ directory: s.directory, path }))
      .data!;
    if (file.type !== "text" || file.encoding === "base64")
      throw new Error("Binary file: open it in your editor");
    return file.content;
  }
  async respond(s: Session, a: Approval, accept: boolean, answers?: string[]) {
    if (a.kind === "question") {
      if (accept)
        await this.client.question.reply({
          requestID: a.id,
          directory: s.directory,
          answers: (answers ?? []).map((text) => [text]),
        });
      else
        await this.client.question.reject({
          requestID: a.id,
          directory: s.directory,
        });
    } else
      await this.client.permission.reply({
        requestID: a.id,
        directory: s.directory,
        reply: accept ? "once" : "reject",
      });
  }
  dispose() {}
}
