import { useEffect, useRef, useState } from "react";
import { DemoAdapter } from "#/adapters/demo";
import { OpenHandsAdapter } from "#/adapters/openhands";
import { OpenCodeAdapter } from "#/adapters/opencode";
import {
  emptySnapshot,
  type AgentAdapter,
  type BackendKind,
  type Session,
  type ToolTab,
  type ModelChoice,
  type Approval,
} from "#/core/types";
import { AgentState } from "#/core/agent-state";
export function useWorkspaceController() {
  const adapter = useRef<AgentAdapter>(new DemoAdapter());
  const epoch = useRef(0);
  const [backend, setBackend] = useState<BackendKind>("demo");
  const [models, setModels] = useState<ModelChoice[]>([]);
  const [model, setModel] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [session, setSession] = useState<Session>();
  const [snapshot, setSnapshot] = useState(emptySnapshot);
  const [connectionOpen, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [pollError, setPollError] = useState("");
  const [busy, setBusy] = useState(false);
  const [historyOpen, setHistory] = useState(false);
  const [settingsOpen, setSettings] = useState(false);
  const [toolsOpen, setTools] = useState(false);
  const [selectedTool, setTool] = useState<ToolTab>("files");
  const [file, setFile] = useState("");
  const [directory, setDirectory] = useState("");
  async function connect(kind: BackendKind) {
    const generation = ++epoch.current;
    setConnected(false);
    setFile("");
    setPollError("");
    setBusy(true);
    setError("");
    adapter.current.dispose();
    const next =
      kind === "openhands"
        ? new OpenHandsAdapter(location.origin + "/bridge/openhands")
        : kind === "opencode"
          ? new OpenCodeAdapter(location.origin + "/bridge/opencode")
          : new DemoAdapter();
    adapter.current = next;
    setBackend(kind);
    setSession(undefined);
    setSnapshot(emptySnapshot());
    try {
      const choices = await next.connect();
      const list = await next.sessions();
      if (epoch.current !== generation) return;
      setModels(choices);
      setModel("");
      setSessions(list);
      setConnected(true);
      setSettings(false);
    } catch (e) {
      if (epoch.current === generation)
        setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (epoch.current === generation) setBusy(false);
    }
  }
  useEffect(() => {
    void connect("demo");
    return () => {
      epoch.current++;
      adapter.current.dispose();
    };
  }, []);
  useEffect(() => {
    if (!session || !connectionOpen) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const current = adapter.current;
    async function poll() {
      try {
        const data = await current.snapshot(session!);
        if (!cancelled) {
          setSnapshot(data);
          setPollError("");
        }
      } catch (e) {
        if (!cancelled)
          setPollError(e instanceof Error ? e.message : String(e));
      }
      if (!cancelled) timer = setTimeout(poll, 900);
    }
    void poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [session, connectionOpen]);
  async function perform(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await action();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function newSession() {
    const next = await adapter.current.create(model, directory || undefined);
    setSession(next);
    setSnapshot(emptySnapshot());
    setSessions(await adapter.current.sessions());
    setHistory(false);
    return next;
  }
  useEffect(() => {
    setFile("");
  }, [session?.id]);
  const running = snapshot.state === AgentState.RUNNING;
  const canResume =
    !!session &&
    adapter.current.capabilities.resume &&
    snapshot.state === AgentState.PAUSED;
  return {
    state: {
      backend,
      models,
      model,
      sessions,
      session,
      snapshot,
      connectionOpen,
      error: error || pollError,
      busy,
      historyOpen,
      settingsOpen,
      toolsOpen,
      selectedTool,
      file,
      directory,
      running,
      canResume,
      isResuming: busy,
      isStopping: busy,
      canConfigure: true,
      agentState: snapshot.state,
    },
    commands: {
      connect,
      setModel,
      setDirectory,
      toggleHistory: () => setHistory((v) => !v),
      openSettings: () => setSettings(true),
      closeSettings: () => setSettings(false),
      closeTools: () => setTools(false),
      openTool: (tool: ToolTab) => {
        setTool(tool);
        setTools(true);
      },
      openChanges: () => {
        setTool("changes");
        setTools(true);
      },
      selectSession: (next: Session) => {
        setSession(next);
        setSnapshot(emptySnapshot());
        setHistory(false);
      },
      newSession: () =>
        perform(async () => {
          await newSession();
        }),
      send: (text: string) =>
        perform(async () => {
          const current = session ?? (await newSession());
          await adapter.current.send(current, text, model);
        }),
      stop: () =>
        perform(async () => {
          if (session) await adapter.current.stop(session);
        }),
      resume: () =>
        perform(async () => {
          if (session && canResume) await adapter.current.resume(session);
        }),
      readFile: (path: string) =>
        perform(async () => {
          if (session) setFile(await adapter.current.readFile(session, path));
        }),
      respond: (approval: Approval, accept: boolean, answers?: string[]) =>
        perform(async () => {
          if (session)
            await adapter.current.respond(session, approval, accept, answers);
        }),
    },
  };
}
export type WorkspaceController = ReturnType<typeof useWorkspaceController>;
