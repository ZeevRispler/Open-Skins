import { lazy, Suspense, type ReactNode } from "react";
import { useSettings } from "#/hooks/query/use-settings";
import { useWorkspaceController } from "#/workspace-core/use-workspace-controller";
import { WorkspaceInterfaceFrame } from "./workspace-interface-frame";
import "./workspace-interface.css";

const SettingsModal = lazy(() =>
  import("#/components/shared/modals/settings/settings-modal").then((m) => ({
    default: m.SettingsModal,
  })),
);

/** The runtime and shared panels remain mounted across presentation changes. */
export function WorkspaceInterface({ children }: { children: ReactNode }) {
  const controller = useWorkspaceController();
  const { data: settings } = useSettings();
  return (
    <WorkspaceInterfaceFrame controller={controller}>
      {children}
      {controller.state.settingsOpen && settings ? (
        <Suspense fallback={null}>
          <SettingsModal
            settings={settings}
            onClose={controller.commands.closeSettings}
          />
        </Suspense>
      ) : null}
    </WorkspaceInterfaceFrame>
  );
}
