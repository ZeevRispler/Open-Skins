import { SceneVisitors } from "./interfaces/scene-visitors";
import { AgentState } from "./types/agent-state";
import { createRoot } from "react-dom/client";
import { useState } from "react";
import "./i18n";
import "./style.css";
import { useWorkspaceController } from "./workspace-core/use-workspace-controller";
import { WorkspaceInterfaceFrame } from "./interfaces/workspace-interface-frame";
import { AppSkinApplier } from "./interfaces/app-skin-applier";
import {
  ControllerContext,
  SkinModelControl,
} from "./interfaces/skin-model-control";
const AGENT_STATUS_LABELS: Record<AgentState, string> = {
  loading: "Connecting",
  init: "Starting",
  running: "Working",
  awaiting_user_input: "Ready",
  paused: "Paused",
  stopped: "Stopped",
  finished: "Complete",
  rejected: "Declined",
  error: "Needs attention",
  rate_limited: "Waiting for capacity",
  awaiting_user_confirmation: "Needs your approval",
  user_confirmed: "Approved",
  user_rejected: "Declined",
};

function App() {
  const c = useWorkspaceController();
  const { state: s, commands: a } = c;
  const [draft, setDraft] = useState("");
  const [path, setPath] = useState("");
  const [preview, setPreview] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);
  return (
    <ControllerContext.Provider value={c}>
      <AppSkinApplier />
      <div className="app">
        <header className="brand">
          <strong>OPEN SKINS</strong>
          <span>
            {s.backend === "demo"
              ? "Simulated demo · no credits"
              : s.backend + " · companion workspace"}
          </span>
          <button onClick={a.toggleHistory}>History</button>
          <button onClick={a.newSession} disabled={!s.connectionOpen || s.busy}>
            New session
          </button>
          <button onClick={a.openSettings}>Connection</button>
        </header>
        <WorkspaceInterfaceFrame
          controller={c}
          hasDraft={!!draft.trim()}
          sendDraft={async () => {
            if (draft.trim() && (await a.send(draft))) setDraft("");
          }}
          prepareExplanation={() =>
            setDraft((value) =>
              value
                ? value + "\n\nExplain your current approach before continuing."
                : "Explain your current approach before continuing.",
            )
          }
        >
          <div className="workarea" data-workspace-split>
            {s.historyOpen && (
              <aside className="history">
                <h2>Sessions</h2>
                {s.sessions.map((x) => (
                  <button key={x.id} onClick={() => a.selectSession(x)}>
                    {x.title}
                  </button>
                ))}
              </aside>
            )}
            <main className="agent">
              <div className="conversation-atmosphere" aria-hidden="true">
                <i />
                <SceneVisitors />
              </div>
              <header className="agent-heading">
                <h1>{s.session?.title || "Workspace"}</h1>
                <span className="agent-state" role="status">
                  {AGENT_STATUS_LABELS[s.snapshot.state]}
                </span>
              </header>
              <div className="messages">
                {!s.snapshot.messages.length && (
                  <div className="welcome">
                    <h2>Start a conversation</h2>
                    <p>
                      Connect a running OpenHands or OpenCode server, or try the
                      free simulated demo. Your conversation and files stay with
                      you when you switch skins.
                    </p>
                  </div>
                )}
                {s.snapshot.messages.map((m) => (
                  <article key={m.id} data-role={m.role}>
                    <small>
                      {
                        {
                          user: "You",
                          assistant: "Agent",
                          tool: "Tool",
                          system: "System",
                        }[m.role]
                      }
                    </small>
                    <pre>{m.text}</pre>
                  </article>
                ))}
              </div>
              {s.snapshot.approvals.map((p) => (
                <section tabIndex={-1} className="approval" key={p.id}>
                  <strong>{p.title}</strong>
                  {p.questions?.map((q, i) => (
                    <label key={q.text}>
                      {q.text}
                      <select
                        onChange={(e) =>
                          setAnswers((old) => {
                            const next = [...old];
                            next[i] = e.target.value;
                            return next;
                          })
                        }
                      >
                        <option value="">Choose an answer</option>
                        {q.options.map((o) => (
                          <option key={o}>{o}</option>
                        ))}
                      </select>
                    </label>
                  ))}
                  <button onClick={() => a.respond(p, true, answers)}>
                    Approve / answer
                  </button>
                  <button onClick={() => a.respond(p, false)}>Reject</button>
                </section>
              ))}
              {s.error && <p role="alert">{s.error}</p>}
              <form
                className="composer"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!draft.trim()) return;
                  if (await a.send(draft)) setDraft("");
                }}
              >
                <textarea
                  aria-label="Message agent"
                  placeholder="What should your agent build?"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <div>
                  <SkinModelControl />
                  <button
                    type="submit"
                    disabled={!s.connectionOpen || s.busy || s.running}
                  >
                    Send
                  </button>
                  <button
                    type="button"
                    onClick={a.stop}
                    disabled={!s.running || s.busy}
                  >
                    Stop
                  </button>
                  <button
                    type="button"
                    onClick={a.resume}
                    disabled={!s.canResume || s.busy}
                  >
                    Resume
                  </button>
                </div>
              </form>
            </main>
            {s.toolsOpen && (
              <aside className="tools">
                <header>
                  <h2>{s.selectedTool}</h2>
                  <button onClick={a.closeTools} aria-label="Close tools">
                    ×
                  </button>
                </header>
                {s.selectedTool === "files" ? (
                  <>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        void a.readFile(path);
                      }}
                    >
                      <input
                        aria-label="File path"
                        value={path}
                        onChange={(e) => setPath(e.target.value)}
                        placeholder="File path in agent workspace"
                      />
                      <button disabled={!s.session || s.busy}>Open file</button>
                    </form>
                    {s.snapshot.files.map((f) => (
                      <button
                        key={f.path}
                        disabled={f.directory}
                        onClick={() => {
                          setPath(f.path);
                          void a.readFile(f.path);
                        }}
                      >
                        {f.path}
                      </button>
                    ))}
                    <pre>
                      {s.file || "Open a file to inspect its contents."}
                    </pre>
                  </>
                ) : s.selectedTool === "browser" ? (
                  <>
                    <p>Open the preview in your browser.</p>
                    <input
                      aria-label="Preview URL"
                      placeholder="http://localhost:3000"
                      value={preview}
                      onChange={(e) => setPreview(e.target.value)}
                    />
                    <button
                      disabled={!/^https?:\/\//.test(preview)}
                      onClick={() =>
                        window.open(preview, "_blank", "noopener,noreferrer")
                      }
                    >
                      Open preview
                    </button>
                  </>
                ) : (
                  <pre>
                    {(s.selectedTool === "terminal"
                      ? s.snapshot.terminal
                      : s.snapshot.changes) || "No output yet."}
                  </pre>
                )}
              </aside>
            )}
          </div>
        </WorkspaceInterfaceFrame>
        {s.settingsOpen && (
          <dialog open className="settings">
            <h2>Connect your agent</h2>
            <p>
              Authentication stays with your installed agent. Configure server
              addresses and optional server credentials in .env, then restart
              Open Skins.
            </p>
            <label>
              Working directory
              <input
                value={s.directory}
                onChange={(e) => a.setDirectory(e.target.value)}
                placeholder="Backend default"
              />
            </label>
            {(["demo", "openhands", "opencode"] as const).map((kind) => (
              <button
                key={kind}
                disabled={s.busy}
                onClick={() => a.connect(kind)}
              >
                Connect {kind}
              </button>
            ))}
            <button onClick={a.closeSettings}>Close</button>
          </dialog>
        )}
      </div>
    </ControllerContext.Provider>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
