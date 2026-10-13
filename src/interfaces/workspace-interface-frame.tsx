import type { ReactNode } from "react";
import type { WorkspaceController } from "#/workspace-core/use-workspace-controller";
import { useInterfaceStore } from "./interface-store";
import { SkinConsole } from "./dj/dj-console";
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
  return (
    <section className="workspace-interface" data-interface={interfaceId}>
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
