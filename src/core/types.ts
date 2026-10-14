import { AgentState } from "#/core/agent-state";
export type BackendKind = "demo" | "openhands" | "opencode";
export type ToolTab = "files" | "terminal" | "changes" | "browser";
export interface Session {
  id: string;
  title: string;
  directory?: string;
  model?: string;
}
export interface ModelChoice {
  id: string;
  label: string;
}
export interface Message {
  id: string;
  role: "user" | "assistant" | "tool" | "system";
  text: string;
}
export interface Approval {
  id: string;
  title: string;
  kind?: "permission" | "question";
  questions?: { text: string; options: string[] }[];
}
export interface WorkspaceFile {
  path: string;
  directory?: boolean;
}
export interface Snapshot {
  state: AgentState;
  messages: Message[];
  terminal: string;
  changes: string;
  approvals: Approval[];
  files: WorkspaceFile[];
}
export interface Capabilities {
  resume: boolean;
  fileTree: boolean;
  modelDuringSession: boolean;
}
export interface AgentAdapter {
  readonly kind: BackendKind;
  readonly capabilities: Capabilities;
  connect(): Promise<ModelChoice[]>;
  sessions(): Promise<Session[]>;
  create(model?: string, directory?: string): Promise<Session>;
  snapshot(session: Session): Promise<Snapshot>;
  send(session: Session, text: string, model?: string): Promise<void>;
  stop(session: Session): Promise<void>;
  resume(session: Session): Promise<void>;
  readFile(session: Session, path: string): Promise<string>;
  respond(
    session: Session,
    approval: Approval,
    accept: boolean,
    answers?: string[],
  ): Promise<void>;
  dispose(): void;
}
export const emptySnapshot = (): Snapshot => ({
  state: AgentState.AWAITING_USER_INPUT,
  messages: [],
  terminal: "",
  changes: "",
  approvals: [],
  files: [],
});
export function textContent(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value))
    return value.map(textContent).filter(Boolean).join("\n");
  if (value && typeof value === "object") {
    const item = value as Record<string, unknown>;
    for (const key of [
      "text",
      "output",
      "stdout",
      "content",
      "result",
      "message",
    ])
      if (item[key] != null) return textContent(item[key]);
  }
  return "";
}
