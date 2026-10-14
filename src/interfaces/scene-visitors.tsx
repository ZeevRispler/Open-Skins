import { useInterfaceStore } from "./interface-store";
/** Original, purely decorative silhouettes. No telemetry or agent actions. */
export function SceneVisitors() {
  const skin = useInterfaceStore((s) => s.interfaceId);
  if (skin === "cockpit")
    return (
      <svg className="scene-visitor scene-aircraft" viewBox="0 0 60 40">
        <path d="m4 21 19-5 8-13 5-1-3 14 18-3 5 3-23 7-7 12-4 1 2-11-18 3z" />
      </svg>
    );
  if (skin === "flagship")
    return (
      <svg className="scene-visitor scene-dolphin" viewBox="0 0 70 40">
        <path d="M4 31Q16 13 29 16L36 6l3 11q17 1 22 10l7 2-9 2q-13-9-24-6l5 7-7-1-7-5Q15 25 4 31z" />
      </svg>
    );
  if (skin === "ferrari")
    return (
      <svg className="race-finish" viewBox="0 0 40 40">
        <path d="M8 37V4" stroke="currentColor" strokeWidth="2" />
        <path fill="currentColor" d="M9 4h24v20H9z" />
        <path
          fill="#151719"
          d="M9 4h6v5H9zm12 0h6v5h-6zm-6 5h6v5h-6zm12 0h6v5h-6zM9 14h6v5H9zm12 0h6v5h-6zm-6 5h6v5h-6zm12 0h6v5h-6z"
        />
      </svg>
    );
  return null;
}
