import { useEffect } from "react";
import { useInterfaceStore } from "./interface-store";
import "./app-skins.css";

const APP_SKIN_ATTRIBUTE = "data-coding-skin";
// @spec CS-007 — Theme portals and navigation, without touching agent state.
export function AppSkinApplier() {
  const skin = useInterfaceStore((state) => state.interfaceId);
  useEffect(() => {
    const previous = document.body.getAttribute(APP_SKIN_ATTRIBUTE);
    document.body.setAttribute(APP_SKIN_ATTRIBUTE, skin);
    return () => {
      if (previous === null) document.body.removeAttribute(APP_SKIN_ATTRIBUTE);
      else document.body.setAttribute(APP_SKIN_ATTRIBUTE, previous);
    };
  }, [skin]);
  return null;
}
