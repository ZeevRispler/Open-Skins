import { useEffect, useRef, type ReactNode } from "react";
import { agentSoundCue, playSkinSound } from "./skin-sound";
import type { WorkspaceController } from "#/workspace-core/use-workspace-controller";
import { useInterfaceStore } from "./interface-store";
import { SkinConsole } from "./skin-console";
import { SkinSwitcher } from "./skin-switcher";

// @spec CS-001 — Keep shared panels mounted while presentation changes.
export function WorkspaceInterfaceFrame({
  children,
  controller,
}: {
  children: ReactNode;
  controller: WorkspaceController;
}) {
  const interfaceId = useInterfaceStore((state) => state.interfaceId);
  const soundsEnabled = useInterfaceStore((state) => state.soundsEnabled);
  const previous = useRef(controller.state.agentState);
  useEffect(() => {
    const cue = agentSoundCue(previous.current, controller.state.agentState);
    previous.current = controller.state.agentState;
    if (soundsEnabled && cue) playSkinSound(interfaceId, cue);
  }, [controller.state.agentState, interfaceId, soundsEnabled]);
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
      <div className="workspace-interface-body">
        <aside className="dj-controls" hidden={interfaceId === "standard"}>
          <SkinConsole controller={controller} />
        </aside>
        <div className="workspace-panels">{children}</div>
      </div>
    </section>
  );
}
