import { createContext, useContext } from "react";
import type { WorkspaceController } from "#/workspace-core/use-workspace-controller";
export const ControllerContext = createContext<WorkspaceController | null>(
  null,
);
export function SkinModelControl() {
  const c = useContext(ControllerContext);
  if (!c) return null;
  return (
    <select
      aria-label={c.state.backend === "openhands" ? "Agent profile" : "Model"}
      value={c.state.model}
      disabled={
        c.state.busy || (!!c.state.session && c.state.backend === "openhands")
      }
      onChange={(e) => c.commands.setModel(e.target.value)}
    >
      <option value="">Backend default</option>
      {c.state.models.map((m) => (
        <option key={m.id} value={m.id}>
          {m.label}
        </option>
      ))}
    </select>
  );
}
