import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import "./workspace-interface.css";
import "./app-skins.css";
import {
  WORKSPACE_INTERFACES,
  useInterfaceStore,
  type WorkspaceInterface,
} from "./interface-store";

const SKIN_LABELS: Record<WorkspaceInterface, I18nKey> = {
  standard: I18nKey.CONVERSATION$STANDARD_INTERFACE,
  dj: I18nKey.CONVERSATION$DJ_INTERFACE,
  cockpit: I18nKey.CONVERSATION$COCKPIT_INTERFACE,
  retro: I18nKey.CONVERSATION$RETRO_INTERFACE,
  cyberdeck: I18nKey.CONVERSATION$CYBERDECK_INTERFACE,
};

// @spec CS-007 — One skin preference controls every app surface.
export function SkinSwitcher() {
  const { t } = useTranslation("openhands");
  const { interfaceId, setInterface } = useInterfaceStore();
  return (
    <header className="interface-switcher">
      <span>{t(I18nKey.CONVERSATION$INTERFACE)}</span>
      <div role="group" aria-label={t(I18nKey.CONVERSATION$INTERFACE)}>
        {WORKSPACE_INTERFACES.map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={interfaceId === id}
            onClick={() => setInterface(id)}
          >
            {t(SKIN_LABELS[id])}
          </button>
        ))}
      </div>
    </header>
  );
}
