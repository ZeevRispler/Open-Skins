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
import type { ConversationTab } from "#/stores/conversation-store";
import { DjModelControl } from "./dj-model-control";

import jogWheel from "./assets/jog-wheel-v1.png";
import { AgentState } from "#/types/agent-state";

const STATUS_LABELS: Partial<Record<AgentState, I18nKey>> = {
  [AgentState.RUNNING]: I18nKey.AGENT_STATUS$RUNNING_TASK,
  [AgentState.LOADING]: I18nKey.AGENT_STATUS$INITIALIZING,
  [AgentState.INIT]: I18nKey.AGENT_STATUS$INITIALIZING,
  [AgentState.PAUSED]: I18nKey.AGENT_STATUS$AGENT_STOPPED,
  [AgentState.ERROR]: I18nKey.AGENT_STATUS$ERROR_OCCURRED,
  [AgentState.AWAITING_USER_CONFIRMATION]:
    I18nKey.AGENT_STATUS$WAITING_FOR_USER_CONFIRMATION,
};
const TOOL_PADS: { id: ConversationTab; label: I18nKey; icon: typeof Files }[] =
  [
    { id: "files", label: I18nKey.COMMON$FILES, icon: Files },
    { id: "terminal", label: I18nKey.COMMON$TERMINAL, icon: Terminal },
    { id: "commits", label: I18nKey.COMMON$CHANGES, icon: GitCompare },
    { id: "browser", label: I18nKey.COMMON$BROWSER, icon: Globe },
  ];

// @spec CS-005 — Console controls invoke shared workspace actions.
export function DjConsole({ controller }: { controller: WorkspaceController }) {
  const { t } = useTranslation("openhands");
  const { state, commands } = controller;
  const toolIndex = Math.max(
    0,
    TOOL_PADS.findIndex((pad) => pad.id === state.selectedTool),
  );
  return (
    <div className="dj-console">
      <section data-dj-part="deck" data-deck="history">
        <header data-dj-part="deck-heading">
          <History aria-hidden="true" />
          {t(I18nKey.CONVERSATION$HISTORY_CONTROL)}
        </header>
        <div data-dj-part="readout">
          <span>{t(I18nKey.CONVERSATION$EVENTS)}</span>
          <strong>{state.eventCount}</strong>
        </div>
        <button
          type="button"
          className="dj-platter"
          aria-label={t(I18nKey.CONVERSATION$HISTORY_CONTROL)}
          aria-pressed={state.historyOpen}
          onClick={commands.toggleHistory}
        >
          <img src={jogWheel} alt="" aria-hidden="true" draggable={false} />
          <span className="dj-platter-label">
            <History aria-hidden="true" />
            <span>{t(I18nKey.CONVERSATION$HISTORY_CONTROL)}</span>
          </span>
        </button>
        <div className="dj-transport">
          <button
            type="button"
            disabled={!state.canResume || state.isResuming}
            onClick={commands.resume}
            aria-label={t(I18nKey.ACTION_BUTTON$RESUME)}
          >
            <Play aria-hidden="true" />
            {t(I18nKey.GOAL$RESUME)}
          </button>
          <button
            type="button"
            disabled={!state.running || state.isStopping}
            onClick={commands.stop}
            aria-label={t(I18nKey.BUTTON$STOP)}
          >
            <Pause aria-hidden="true" />
            {t(I18nKey.BUTTON$STOP)}
          </button>
        </div>
      </section>
      <section data-dj-part="mixer">
        <div className="dj-console-heading">
          {t(I18nKey.CONVERSATION$DJ_INTERFACE)}
        </div>
        <div className="dj-status" role="status">
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
        <div className="dj-model">
          <span data-dj-part="control-label">
            {t(I18nKey.SCHEMA$LLM$MODEL$LABEL)}
          </span>
          <DjModelControl />
        </div>
        <div data-dj-part="context-meter">
          <span>{t(I18nKey.CONVERSATION$CONTEXT_WINDOW)}</span>
          <meter
            min={0}
            max={100}
            value={state.contextUsage ?? 0}
            aria-label={t(I18nKey.CONVERSATION$CONTEXT_WINDOW)}
          />
          <output>
            {state.contextUsage === null
              ? t(I18nKey.CONVERSATION$CONTEXT_WINDOW_UNKNOWN)
              : `${Math.round(state.contextUsage)}%`}
          </output>
        </div>
        <div data-dj-part="mixer-controls">
          <button
            type="button"
            className="dj-settings"
            disabled={!state.canConfigure}
            onClick={commands.openSettings}
          >
            <span data-dj-part="knob">
              <Settings aria-hidden="true" />
            </span>
            {t(I18nKey.SETTINGS$TITLE)}
          </button>
          <label className="dj-tool-selector">
            <span>{t(I18nKey.CONVERSATION$TOOL_SELECTOR)}</span>
            <input
              type="range"
              min={0}
              max={TOOL_PADS.length - 1}
              step={1}
              value={toolIndex}
              aria-valuetext={t(TOOL_PADS[toolIndex].label)}
              onChange={(event) =>
                commands.openTool(TOOL_PADS[Number(event.target.value)].id)
              }
            />
          </label>
        </div>
      </section>
      <section data-dj-part="deck" data-deck="tools">
        <header data-dj-part="deck-heading">
          <Files aria-hidden="true" />
          {t(I18nKey.CONVERSATION$TOOL_SELECTOR)}
        </header>
        <div data-dj-part="readout">
          <span>{t(I18nKey.CONVERSATION$TOOL_SELECTOR)}</span>
          <strong>{t(TOOL_PADS[toolIndex].label)}</strong>
        </div>
        <button
          type="button"
          className="dj-platter"
          aria-label={t(I18nKey.CONVERSATION$TOOL_SELECTOR)}
          onClick={() => commands.openTool(TOOL_PADS[toolIndex].id)}
        >
          <img src={jogWheel} alt="" aria-hidden="true" draggable={false} />
          <span className="dj-platter-label">
            <Files aria-hidden="true" />
            <span>{t(TOOL_PADS[toolIndex].label)}</span>
          </span>
        </button>
        <div className="dj-pads">
          {TOOL_PADS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={state.toolsOpen && state.selectedTool === id}
              onClick={() =>
                id === "commits"
                  ? commands.openChanges()
                  : commands.openTool(id)
              }
            >
              <Icon aria-hidden="true" />
              {t(label)}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
