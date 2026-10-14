import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const WORKSPACE_INTERFACES = [
  "standard",
  "dj",
  "cockpit",
  "retro",
  "ferrari",
  "flagship",
] as const;
export type WorkspaceInterface = (typeof WORKSPACE_INTERFACES)[number];
const INTERFACE_STORAGE_KEY = "agent-canvas-workspace-interface";
interface InterfaceState {
  interfaceId: WorkspaceInterface;
  soundsEnabled: boolean;
  setSoundsEnabled: (enabled: boolean) => void;
  setInterface: (id: WorkspaceInterface) => void;
}
// @spec CS-004 — Persist presentation only and validate restored ids.
export const useInterfaceStore = create<InterfaceState>()(
  persist(
    (set) => ({
      interfaceId: "standard",
      soundsEnabled: false,
      setSoundsEnabled: (soundsEnabled) => set({ soundsEnabled }),
      setInterface: (interfaceId) => set({ interfaceId }),
    }),
    {
      name: INTERFACE_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ interfaceId, soundsEnabled }) => ({
        interfaceId,
        soundsEnabled,
      }),
      merge: (persisted, current) => ({
        ...current,
        soundsEnabled:
          (persisted as Partial<InterfaceState> | undefined)?.soundsEnabled ===
          true,
        interfaceId: WORKSPACE_INTERFACES.includes(
          (persisted as Partial<InterfaceState> | undefined)
            ?.interfaceId as WorkspaceInterface,
        )
          ? (persisted as InterfaceState).interfaceId
          : "standard",
      }),
    },
  ),
);
