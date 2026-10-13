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
        <span data-hardware-switch aria-hidden="true" />
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
        {TOOL_PADS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            aria-label={t(label)}
            aria-pressed={state.toolsOpen && state.selectedTool === id}
            onClick={() =>
              id === "changes" ? commands.openChanges() : commands.openTool(id)
            }
            title={t(label)}
          >
            <Icon aria-hidden="true" />
            <span>{t(label)}</span>
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
        type="button"
        aria-label={t(I18nKey.CONVERSATION$TOOL_SELECTOR)}
        title={t(I18nKey.CONVERSATION$TOOL_SELECTOR)}
        onClick={() =>
          commands.openTool(TOOL_PADS[(toolIndex + 1) % TOOL_PADS.length].id)
        }
      >
        <img src={jogWheel} alt="" aria-hidden="true" draggable={false} />
        <Files aria-hidden="true" />
        <span data-hardware-handle aria-hidden="true" />
      </button>
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
