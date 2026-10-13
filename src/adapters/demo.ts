import type { AgentAdapter, Session, Snapshot, Approval } from "#/core/types";
import { emptySnapshot } from "#/core/types";
import { AgentState } from "#/types/agent-state";
export class DemoAdapter implements AgentAdapter {
  readonly kind = "demo" as const;
  readonly capabilities = {
    resume: true,
    fileTree: true,
    modelDuringSession: true,
  };
  private data = new Map<
    string,
    {
      session: Session;
      snapshot: Snapshot;
      timer?: ReturnType<typeof setTimeout>;
      prompt: string;
    }
  >();
  async connect() {
    return [{ id: "demo", label: "Local demo · no credits" }];
  }
  async sessions() {
    return [...this.data.values()].map((v) => v.session).reverse();
  }
  async create() {
    const session = { id: crypto.randomUUID(), title: "New demo" };
    this.data.set(session.id, {
      session,
      snapshot: emptySnapshot(),
      prompt: "",
    });
    return session;
  }
  async snapshot(s: Session) {
    return structuredClone(this.data.get(s.id)!.snapshot);
  }
  private finish(id: string) {
    const d = this.data.get(id)!;
    d.snapshot.state = AgentState.FINISHED;
    d.snapshot.messages.push({
      id: crypto.randomUUID(),
      role: "assistant",
      text: "Demo complete. The simulated workspace contains demo.py. Connect an agent for real coding.",
    });
    d.snapshot.files = [{ path: "demo.py" }];
    d.snapshot.terminal = 'Demo simulation: print("Open Skins")\nOpen Skins\n';
    d.snapshot.changes = '+ print("Open Skins")';
  }
  async send(s: Session, text: string) {
    const d = this.data.get(s.id)!;
    d.prompt = text;
    d.session.title = text.slice(0, 60);
    d.snapshot.messages.push({ id: crypto.randomUUID(), role: "user", text });
    d.snapshot.state = AgentState.RUNNING;
    if (text.toLowerCase().includes("approval")) {
      d.snapshot.state = AgentState.AWAITING_USER_CONFIRMATION;
      d.snapshot.approvals = [
        {
          id: "demo-approval",
          title: "Create demo.py in the simulated workspace",
        },
      ];
      return;
    }
    if (text.toLowerCase().includes("error")) {
      d.snapshot.state = AgentState.ERROR;
      d.snapshot.messages.push({
        id: crypto.randomUUID(),
        role: "system",
        text: "Demonstration error. No real files were modified.",
      });
      return;
    }
    d.timer = setTimeout(
      () => this.finish(s.id),
      text.toLowerCase().includes("slow") ? 10000 : 1100,
    );
  }
  async stop(s: Session) {
    const d = this.data.get(s.id)!;
    clearTimeout(d.timer);
    d.snapshot.state = AgentState.PAUSED;
  }
  async resume(s: Session) {
    const d = this.data.get(s.id)!;
    d.snapshot.state = AgentState.RUNNING;
    d.timer = setTimeout(() => this.finish(s.id), 1100);
  }
  async readFile(_s: Session, path: string) {
    if (path !== "demo.py") throw new Error("File not found");
    return 'print("Open Skins")\n';
  }
  async respond(s: Session, _a: Approval, accept: boolean) {
    const d = this.data.get(s.id)!;
    d.snapshot.approvals = [];
    if (accept) this.finish(s.id);
    else {
      d.snapshot.state = AgentState.AWAITING_USER_INPUT;
      d.snapshot.messages.push({
        id: crypto.randomUUID(),
        role: "system",
        text: "Permission denied.",
      });
    }
  }
  dispose() {
    for (const d of this.data.values()) clearTimeout(d.timer);
  }
}
