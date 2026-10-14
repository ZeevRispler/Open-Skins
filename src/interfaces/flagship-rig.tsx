import type { WorkspaceController } from "#/workspace-core/use-workspace-controller";
import { playSkinSound } from "./skin-sound";

export function FlagshipRig({
  controller,
  hasDraft,
  sendDraft,
  prepareExplanation,
}: {
  controller: WorkspaceController;
  hasDraft: boolean;
  sendDraft: () => void;
  prepareExplanation: () => void;
}) {
  const { state, commands } = controller;
  const approval = state.snapshot.approvals.length > 0;
  const signals = [
    ...(approval ? ["amber"] : []),
    ...(state.running ? ["green"] : []),
    ...(["paused", "stopped"].includes(state.agentState) ? ["red"] : []),
    ...(state.toolsOpen && state.selectedTool === "files" ? ["blue"] : []),
    ...(hasDraft ? ["white"] : []),
  ];
  const signal = signals[0];
  const symbols: Record<string, string> = {
    green: "➜",
    red: "■",
    blue: "≈",
    white: "?",
    pirate: "☠",
    amber: "!",
  };
  const labels: Record<string, string> = {
    green: "Under way",
    red: "Stopped",
    blue: "At anchor",
    white: "Explanation prepared",
    pirate: "New exploration",
    amber: "Decision needed",
  };
  function act(id: string, action: () => void) {
    void id;
    playSkinSound("flagship", "press");
    action();
  }
  return (
    <aside className="flagship-rig" aria-label="Ship signals">
      <div className="ship-watch">
        <div className="ship-mast" aria-hidden="true">
          <i className="ship-pole" />
          <i className="ship-rope" />
          <i className="ship-pulley" />
          {signal && (
            <div
              className="ship-hoist"
              data-signal={signal}
              data-raised={state.running || approval}
            >
              <div className="ship-cloth">
                <span>{symbols[signal]}</span>
              </div>
            </div>
          )}
          {signals.slice(1, 3).map((id, index) => (
            <div
              key={id}
              className="ship-hoist ship-secondary"
              data-signal={id}
              style={{ top: `${160 + index * 85}px` }}
            >
              <div className="ship-cloth">
                <span>{symbols[id]}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="ship-signal-status" role="status">
          {labels[signal] ?? "At anchor"}
        </p>
      </div>
      <div className="ship-signals">
        <button
          disabled={
            state.busy ||
            state.running ||
            !state.connectionOpen ||
            (!hasDraft && !state.canResume)
          }
          onClick={() => act("green", hasDraft ? sendDraft : commands.resume)}
          title={
            hasDraft ? "Send your drafted message" : "Resume (where supported)"
          }
        >
          {" "}
          <span aria-hidden="true" className="mini-flag green">
            ➜
          </span>
          {hasDraft ? "Send draft" : "Resume"}
        </button>
        <button
          disabled={!state.running || state.busy}
          onClick={() => act("red", commands.stop)}
        >
          <span aria-hidden="true" className="mini-flag red">
            ■
          </span>
          Stop
        </button>
        <button
          disabled={!approval}
          onClick={() => {
            document.querySelector<HTMLElement>(".approval")?.focus();
            document
              .querySelector(".approval")
              ?.scrollIntoView({ block: "nearest" });
          }}
        >
          <span aria-hidden="true" className="mini-flag amber">
            !
          </span>
          Decision
        </button>
        <button
          aria-pressed={state.toolsOpen && state.selectedTool === "files"}
          onClick={() =>
            act("blue", () =>
              state.toolsOpen && state.selectedTool === "files"
                ? commands.closeTools()
                : commands.openTool("files"),
            )
          }
        >
          <span aria-hidden="true" className="mini-flag blue">
            ≈
          </span>
          Files
        </button>
        <button
          onClick={() => act("white", prepareExplanation)}
          title="Append an explanation request to your draft; does not send it"
        >
          <span aria-hidden="true" className="mini-flag white">
            ?
          </span>
          Explain
        </button>
        <button
          disabled={
            !state.connectionOpen || state.busy || state.running || hasDraft
          }
          onClick={() =>
            act("pirate", () => {
              void commands.newSession();
            })
          }
          title={
            hasDraft
              ? "Finish or clear your draft before starting a new exploration"
              : "Create a new session"
          }
        >
          <span aria-hidden="true" className="mini-flag pirate">
            ☠
          </span>
          Explore
        </button>
      </div>
      <small>CAPTAIN’S SIGNALS</small>
    </aside>
  );
}
