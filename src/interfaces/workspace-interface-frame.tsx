import { useEffect, useRef, type ReactNode } from "react";
import { agentSoundCue, playSkinSound } from "./skin-sound";
import type { WorkspaceController } from "#/workspace-core/use-workspace-controller";
import { useInterfaceStore } from "./interface-store";
import { SkinConsole } from "./skin-console";
import { SkinSwitcher } from "./skin-switcher";
import { FlagshipRig } from "./flagship-rig";
import { AmbientInstruments } from "./ambient-instruments";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";

// @spec CS-001 — Keep shared panels mounted while presentation changes.
export function WorkspaceInterfaceFrame({
  children,
  controller,
  hasDraft,
  sendDraft,
  prepareExplanation,
}: {
  children: ReactNode;
  controller: WorkspaceController;
  hasDraft: boolean;
  sendDraft: () => void;
  prepareExplanation: () => void;
}) {
  const { t } = useTranslation("open-skins");
  const interfaceId = useInterfaceStore((state) => state.interfaceId);
  const soundsEnabled = useInterfaceStore((state) => state.soundsEnabled);
  const previous = useRef(controller.state.agentState);
  const previousSession = useRef(controller.state.session?.id);
  useEffect(() => {
    const cue =
      previousSession.current === controller.state.session?.id
        ? agentSoundCue(previous.current, controller.state.agentState)
        : null;
    previousSession.current = controller.state.session?.id;
    previous.current = controller.state.agentState;
    if (soundsEnabled && cue) playSkinSound(interfaceId, cue);
  }, [
    controller.state.agentState,
    controller.state.session?.id,
    interfaceId,
    soundsEnabled,
  ]);
  return (
    <section
      className="workspace-interface"
      data-interface={interfaceId}
      data-agent-state={controller.state.agentState}
      onClickCapture={(event) => {
        if (!soundsEnabled || !(event.target instanceof Element)) return;
        const button = event.target.closest("button");
        if (button && !button.disabled && button.closest(".dj-controls"))
          playSkinSound(interfaceId, "press");
      }}
      onChangeCapture={(event) => {
        if (
          soundsEnabled &&
          event.target instanceof HTMLInputElement &&
          event.target.type === "range"
        )
          playSkinSound(interfaceId, "press");
      }}
    >
      <SkinSwitcher />
      <header className="arcade-marquee" aria-hidden="true">
        <span>{t(I18nKey.CONVERSATION$ARCADE_PLAYER)}</span>
        <strong>{t(I18nKey.CONVERSATION$ARCADE_MARQUEE)}</strong>
        <span>{t(I18nKey.CONVERSATION$ARCADE_PROMPT)}</span>
      </header>
      {interfaceId === "flagship" && (
        <header className="ship-title">
          {t(I18nKey.CONVERSATION$FLAGSHIP_MARQUEE)}
        </header>
      )}
      <div className="workspace-interface-body">
        <aside className="dj-controls" hidden={interfaceId === "standard"}>
          <SkinConsole controller={controller} />
        </aside>
        <div className="workspace-stage">
          <div className="workspace-panels">{children}</div>
          <AmbientInstruments />
          {interfaceId === "flagship" && (
            <FlagshipRig
              controller={controller}
              hasDraft={hasDraft}
              sendDraft={sendDraft}
              prepareExplanation={prepareExplanation}
            />
          )}
        </div>
      </div>
    </section>
  );
}
