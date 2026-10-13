import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type WorkspaceInterface = "standard" | "dj";
const INTERFACE_STORAGE_KEY = "agent-canvas-workspace-interface";
interface InterfaceState {
  interfaceId: WorkspaceInterface;
  setInterface: (id: WorkspaceInterface) => void;
}
// @spec CS-004 — Persist presentation only and validate restored ids.
export const useInterfaceStore = create<InterfaceState>()(
  persist(
    (set) => ({
      interfaceId: "standard",
      setInterface: (interfaceId) => set({ interfaceId }),
    }),
    {
      name: INTERFACE_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ interfaceId }) => ({ interfaceId }),
      merge: (persisted, current) => ({
        ...current,
        interfaceId:
          (persisted as Partial<InterfaceState> | undefined)?.interfaceId ===
          "dj"
            ? "dj"
            : "standard",
      }),
    },
  ),
);
