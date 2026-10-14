import { useRef, useState, type CSSProperties } from "react";
import {
  Files,
  Terminal,
  GitCompare,
  Globe,
  Settings,
  Pause,
  Play,
  History,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import type { WorkspaceController } from "#/workspace-core/use-workspace-controller";
import type { ToolTab } from "#/core/types";
import { SkinModelControl } from "./skin-model-control";
import { AgentState } from "#/types/agent-state";
import jogWheel from "./dj/assets/jog-wheel-v1.png";

const STATUS_LABELS: Partial<Record<AgentState, I18nKey>> = {
  [AgentState.RUNNING]: I18nKey.AGENT_STATUS$RUNNING_TASK,
  [AgentState.LOADING]: I18nKey.AGENT_STATUS$INITIALIZING,
  [AgentState.INIT]: I18nKey.AGENT_STATUS$INITIALIZING,
  [AgentState.PAUSED]: I18nKey.AGENT_STATUS$AGENT_STOPPED,
  [AgentState.ERROR]: I18nKey.AGENT_STATUS$ERROR_OCCURRED,
};
const TOOL_PADS: { id: ToolTab; label: I18nKey; icon: typeof Files }[] = [
  { id: "files", label: I18nKey.COMMON$FILES, icon: Files },
  { id: "terminal", label: I18nKey.COMMON$TERMINAL, icon: Terminal },
  { id: "changes", label: I18nKey.COMMON$CHANGES, icon: GitCompare },
  { id: "browser", label: I18nKey.COMMON$BROWSER, icon: Globe },
];

// @spec CS-010 — Hardware indicators derive from shared history and tool state.
// @spec CS-008 — Compact controls keep the agent workspace dominant.
export function SkinConsole({
  controller,
}: {
  controller: WorkspaceController;
}) {
  const { t } = useTranslation("open-skins");
  const { state, commands } = controller;
  const gesture = useRef<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);
  const [lean, setLean] = useState({ x: 0, y: 0 });
  const directions: Record<string, ToolTab> = {
    ArrowLeft: "files",
    ArrowUp: "terminal",
    ArrowDown: "changes",
    ArrowRight: "browser",
  };
  const toolIndex = Math.max(
    0,
    TOOL_PADS.findIndex((pad) => pad.id === state.selectedTool),
  );
  return (
    <div
      className="dj-console"
      data-tool-index={toolIndex}
      data-running={state.running}
    >
      <button
        className="skin-history"
        type="button"
        aria-label={t(I18nKey.CONVERSATION$HISTORY_CONTROL)}
        title={t(I18nKey.CONVERSATION$HISTORY_CONTROL)}
        aria-pressed={state.historyOpen}
        onClick={commands.toggleHistory}
      >
        <img src={jogWheel} alt="" aria-hidden="true" draggable={false} />
        <History aria-hidden="true" />
        <span className="racing-dial" aria-hidden="true">
          <i className="racing-needle" />
          <b>AGENT</b>
        </span>
        <span className="skin-radar" aria-hidden="true">
          <i className="radar-sweep" />
          <i className="radar-contact" />
        </span>
        <span className="metal-toggle" data-hardware-switch aria-hidden="true">
          <i />
        </span>
      </button>
      <div className="dj-transport">
        <button
          type="button"
          disabled={!state.canResume || state.isResuming}
          onClick={commands.resume}
          aria-label={t(I18nKey.ACTION_BUTTON$RESUME)}
          title={t(I18nKey.ACTION_BUTTON$RESUME)}
        >
          <Play aria-hidden="true" />
          <span>{t(I18nKey.GOAL$RESUME)}</span>
        </button>
        <button
          type="button"
          disabled={!state.running || state.isStopping}
          onClick={commands.stop}
          aria-label={t(I18nKey.BUTTON$STOP)}
          title={t(I18nKey.BUTTON$STOP)}
        >
          <Pause aria-hidden="true" />
          <span>{t(I18nKey.BUTTON$STOP)}</span>
        </button>
      </div>
      <div className="dj-model">
        <SkinModelControl />
      </div>
      <div className="dj-status" role="status">
        <span className="retro-avatar" aria-hidden="true">
          <svg viewBox="0 0 20 24" shapeRendering="crispEdges">
            <path fill="#66ddf4" d="M5 1h10v3H3V3h2z" />
            <path fill="#f5c498" d="M5 4h10v7H5z" />
            <path fill="#21162b" d="M7 6h2v2H7zm5 0h2v2h-2z" />
            <path fill="#82dfb2" d="M4 11h12v7H4z" />
            <path fill="#f5c498" d="M2 12h2v5H2zm14 0h2v5h-2z" />
            <g className="retro-feet" fill="#be8de1">
              <path d="M5 18h4v5H3v-2h2zm6 0h4v3h2v2h-6z" />
            </g>
          </svg>
        </span>
        <span className="dj-equalizer" aria-hidden="true">
          {Array.from({ length: 7 }, (_, i) => (
            <i key={i} style={{ animationDelay: `${i * -0.13}s` }} />
          ))}
        </span>
        <span
          className="dj-led"
          data-active={state.running}
          aria-hidden="true"
        />
        {t(
          !state.connectionOpen && !state.canResume
            ? I18nKey.CHAT_INTERFACE$DISCONNECTED
            : (STATUS_LABELS[state.agentState] ??
                I18nKey.AGENT_STATUS$WAITING_FOR_TASK),
        )}
      </div>
      <div className="dj-pads">
        {TOOL_PADS.map(({ id, label, icon: Icon }, padIndex) => (
          <button
            key={id}
            type="button"
            aria-label={t(label)}
            aria-pressed={state.toolsOpen && state.selectedTool === id}
            onClick={() =>
              state.toolsOpen && state.selectedTool === id
                ? commands.closeTools()
                : id === "changes"
                  ? commands.openChanges()
                  : commands.openTool(id)
            }
            title={t(label)}
          >
            <Icon aria-hidden="true" />
            <span>{t(label)}</span>
            <span className="arcade-pad-code" aria-hidden="true">
              {String.fromCharCode(65 + padIndex)}
            </span>
            <span className="metal-toggle" aria-hidden="true">
              <i />
            </span>
          </button>
        ))}
      </div>
      <label className="dj-tool-selector">
        <input
          type="range"
          min={0}
          max={TOOL_PADS.length - 1}
          step={1}
          value={toolIndex}
          aria-label={t(I18nKey.CONVERSATION$TOOL_SELECTOR)}
          aria-valuetext={t(TOOL_PADS[toolIndex].label)}
          onChange={(event) =>
            commands.openTool(TOOL_PADS[Number(event.target.value)].id)
          }
        />
      </label>
      <button
        className="skin-tool-wheel"
        data-manipulating={lean.x !== 0 || lean.y !== 0}
        type="button"
        aria-describedby="skin-tool-directions"
        onKeyDown={(event) => {
          const tool = directions[event.key];
          if (tool) {
            event.preventDefault();
            setLean({
              x:
                event.key === "ArrowLeft"
                  ? -1
                  : event.key === "ArrowRight"
                    ? 1
                    : 0,
              y:
                event.key === "ArrowUp"
                  ? -1
                  : event.key === "ArrowDown"
                    ? 1
                    : 0,
            });
            commands.openTool(tool);
          }
        }}
        onKeyUp={() => setLean({ x: 0, y: 0 })}
        onBlur={() => setLean({ x: 0, y: 0 })}
        onPointerMove={(event) => {
          const start = gesture.current;
          if (start)
            setLean({
              x: Math.max(-1, Math.min(1, (event.clientX - start.x) / 30)),
              y: Math.max(-1, Math.min(1, (event.clientY - start.y) / 30)),
            });
        }}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          gesture.current = { x: event.clientX, y: event.clientY };
          dragged.current = false;
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerCancel={() => {
          setLean({ x: 0, y: 0 });
          gesture.current = null;
          dragged.current = false;
        }}
        onPointerUp={(event) => {
          setLean({ x: 0, y: 0 });
          const start = gesture.current;
          gesture.current = null;
          if (!start) return;
          const dx = event.clientX - start.x;
          const dy = event.clientY - start.y;
          if (Math.max(Math.abs(dx), Math.abs(dy)) < 12) return;
          dragged.current = true;
          commands.openTool(
            Math.abs(dx) > Math.abs(dy)
              ? dx < 0
                ? "files"
                : "browser"
              : dy < 0
                ? "terminal"
                : "changes",
          );
        }}
        aria-label={t(I18nKey.CONVERSATION$TOOL_SELECTOR)}
        title={t(I18nKey.CONVERSATION$TOOL_SELECTOR)}
        onClick={() => {
          if (dragged.current) {
            dragged.current = false;
            return;
          }
          commands.openTool(TOOL_PADS[(toolIndex + 1) % TOOL_PADS.length].id);
        }}
      >
        <img src={jogWheel} alt="" aria-hidden="true" draggable={false} />
        <Files aria-hidden="true" />
        <span
          data-hardware-handle
          aria-hidden="true"
          style={
            {
              "--lean-x": `${lean.x * 27}deg`,
              "--lean-y": `${-lean.y * 32}deg`,
            } as CSSProperties
          }
        />
        <span className="racing-gear" aria-hidden="true">
          <i />
          <b>{toolIndex + 1}</b>
        </span>
        <span className="lever-directions" aria-hidden="true">
          <i>←</i>
          <i>↑</i>
          <i>↓</i>
          <i>→</i>
        </span>
      </button>
      <span id="skin-tool-directions" className="sr-only">
        Click to cycle tools, or use arrow keys or drag: left Files, up
        Terminal, down Changes, right Browser.
      </span>
      <button
        className="dj-settings"
        type="button"
        disabled={!state.canConfigure}
        onClick={commands.openSettings}
        aria-label={t(I18nKey.SETTINGS$TITLE)}
        title={t(I18nKey.SETTINGS$TITLE)}
      >
        <Settings aria-hidden="true" />
      </button>
    </div>
  );
}
