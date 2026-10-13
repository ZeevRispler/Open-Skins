import { useRef, type KeyboardEvent } from "react";
import { ChevronDown, Check, Palette, Volume2, VolumeX } from "lucide-react";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import "./workspace-interface.css";
import "./app-skins.css";
import "./theme-hardware.css";
import "./skin-feedback.css";
import "./cockpit-retro-activity.css";
import { muteSkinSound, playSkinSound } from "./skin-sound";
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

// @spec CS-009 — The skin gallery stays hidden until requested.
// @spec CS-007 — One skin preference controls every app surface.
export function SkinSwitcher() {
  const { t } = useTranslation("open-skins");
  const { interfaceId, setInterface, soundsEnabled, setSoundsEnabled } =
    useInterfaceStore();
  const picker = useRef<HTMLDetailsElement>(null);
  const closeOnEscape = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape" && picker.current) {
      picker.current.open = false;
      picker.current.querySelector("summary")?.focus();
    }
  };
  return (
    <header className="interface-switcher">
      {interfaceId !== "standard" && (
        <button
          type="button"
          aria-label={t(I18nKey.CONVERSATION$SOUNDS)}
          title={t(I18nKey.CONVERSATION$SOUNDS)}
          aria-pressed={soundsEnabled}
          onClick={() => {
            setSoundsEnabled(!soundsEnabled);
            if (!soundsEnabled) playSkinSound(interfaceId, "press");
            else muteSkinSound();
          }}
        >
          {soundsEnabled ? (
            <Volume2 aria-hidden="true" />
          ) : (
            <VolumeX aria-hidden="true" />
          )}
        </button>
      )}
      <details
        ref={picker}
        onBlur={(event) => {
          if (
            !event.currentTarget.contains(event.relatedTarget as Node | null) &&
            picker.current
          )
            picker.current.open = false;
        }}
      >
        <summary
          role="button"
          aria-label={t(I18nKey.CONVERSATION$INTERFACE)}
          onKeyDown={closeOnEscape}
        >
          <Palette aria-hidden="true" />
          <span>{t(SKIN_LABELS[interfaceId])}</span>
          <ChevronDown aria-hidden="true" />
        </summary>
        <div role="group" aria-label={t(I18nKey.CONVERSATION$INTERFACE)}>
          {WORKSPACE_INTERFACES.map((id) => (
            <button
              key={id}
              type="button"
              onKeyDown={closeOnEscape}
              aria-pressed={interfaceId === id}
              data-skin-option={id}
              onClick={() => {
                setInterface(id);
                if (id === "standard") muteSkinSound();
                if (soundsEnabled) playSkinSound(id, "press");
                if (picker.current) {
                  picker.current.open = false;
                  picker.current.querySelector("summary")?.focus();
                }
              }}
            >
              <span aria-hidden="true" data-skin-preview={id} />
              {t(SKIN_LABELS[id])}
              {interfaceId === id && <Check aria-hidden="true" />}
            </button>
          ))}
        </div>
      </details>
    </header>
  );
}
