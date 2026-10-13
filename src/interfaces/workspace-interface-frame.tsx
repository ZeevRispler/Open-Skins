import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import type { WorkspaceController } from "#/workspace-core/use-workspace-controller";
import { useInterfaceStore } from "./interface-store";
import { DjConsole } from "./dj/dj-console";

// @spec CS-001 — Keep shared panels mounted while presentation changes.
export function WorkspaceInterfaceFrame({
  children,
  controller,
}: {
  children: ReactNode;
  controller: WorkspaceController;
}) {
  const { t } = useTranslation("openhands");
  const { interfaceId, setInterface } = useInterfaceStore();
  return (
    <section className="workspace-interface" data-interface={interfaceId}>
      <header className="interface-switcher">
        <span>{t(I18nKey.CONVERSATION$INTERFACE)}</span>
        <div role="group" aria-label={t(I18nKey.CONVERSATION$INTERFACE)}>
          <button
            type="button"
            aria-pressed={interfaceId === "standard"}
            onClick={() => setInterface("standard")}
          >
            {t(I18nKey.CONVERSATION$STANDARD_INTERFACE)}
          </button>
          <button
            type="button"
            aria-pressed={interfaceId === "dj"}
            onClick={() => setInterface("dj")}
          >
            {t(I18nKey.CONVERSATION$DJ_INTERFACE)}
          </button>
        </div>
      </header>
      <div className="workspace-interface-body">
        <aside className="dj-controls" hidden={interfaceId !== "dj"}>
          <DjConsole controller={controller} />
        </aside>
        <div className="workspace-panels">{children}</div>
      </div>
    </section>
  );
}
