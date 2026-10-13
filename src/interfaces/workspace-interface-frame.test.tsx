import { useEffect, useState } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { WorkspaceInterfaceFrame } from "./workspace-interface-frame";
import { useInterfaceStore } from "./interface-store";
import type { WorkspaceController } from "#/workspace-core/use-workspace-controller";
import { AgentState } from "#/types/agent-state";
import { I18nKey } from "#/i18n/declaration";

vi.mock("./skin-model-control", () => ({
  SkinModelControl: () => null,
}));

function makeController(): WorkspaceController {
  return {
    state: {
      eventCount: 12,
      contextUsage: 25,
      connectionOpen: true,
      agentState: AgentState.RUNNING,
      canConfigure: true,
      running: true,
      canResume: false,
      isStopping: false,
      isResuming: false,
      selectedTool: "files",
      toolsOpen: true,
      historyOpen: true,
      settingsOpen: false,
    },
    commands: {
      stop: vi.fn(),
      resume: vi.fn(),
      openTool: vi.fn(),
      openChanges: vi.fn(),
      toggleHistory: vi.fn(),
      openSettings: vi.fn(),
      closeSettings: vi.fn(),
    },
  };
}

beforeEach(() => {
  useInterfaceStore.setState({ interfaceId: "standard" });
});

describe("interchangeable workspace interfaces", () => {
  it("preserves the composer DOM, draft, focus, and session subscription while switching", () => {
    const mount = vi.fn();
    const dispose = vi.fn();
    let pushEvent: (event: string) => void = () => {};
    function SessionProbe() {
      const [event, setEvent] = useState("connected");
      pushEvent = setEvent;
      useEffect(() => {
        mount();
        return dispose;
      }, []);
      return (
        <>
          <input aria-label={I18nKey.CONVERSATION$INTERFACE} defaultValue="" />
          <output>{event}</output>
        </>
      );
    }
    render(
      <WorkspaceInterfaceFrame controller={makeController()}>
        <SessionProbe />
      </WorkspaceInterfaceFrame>,
    );
    const draft = screen.getByRole("textbox", {
      name: I18nKey.CONVERSATION$INTERFACE,
    });
    fireEvent.change(draft, { target: { value: "Keep my draft" } });
    draft.focus();
    for (const interfaceId of [
      "dj",
      "cockpit",
      "retro",
      "cyberdeck",
    ] as const) {
      act(() => useInterfaceStore.getState().setInterface(interfaceId));
      expect(screen.getByRole("textbox")).toBe(draft);
      expect(draft).toHaveValue("Keep my draft");
    }
    expect(screen.getByRole("textbox")).toBe(draft);
    expect(draft).toHaveValue("Keep my draft");
    expect(draft).toHaveFocus();
    act(() => pushEvent("streamed response"));
    expect(screen.getByText("streamed response")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: I18nKey.CONVERSATION$INTERFACE }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: I18nKey.CONVERSATION$STANDARD_INTERFACE,
      }),
    );
    expect(draft).toHaveValue("Keep my draft");
    expect(mount).toHaveBeenCalledTimes(1);
    expect(dispose).not.toHaveBeenCalled();
  });

  it("routes DJ pads, slider, platter and transport through shared commands", () => {
    const controller = makeController();
    useInterfaceStore.setState({ interfaceId: "dj" });
    render(
      <WorkspaceInterfaceFrame controller={controller}>
        <div />
      </WorkspaceInterfaceFrame>,
    );
    fireEvent.click(
      screen.getByRole("button", { name: I18nKey.COMMON$TERMINAL }),
    );
    expect(controller.commands.openTool).toHaveBeenCalledWith("terminal");
    fireEvent.click(
      screen.getByRole("button", { name: I18nKey.COMMON$CHANGES }),
    );
    expect(controller.commands.openChanges).toHaveBeenCalledOnce();
    fireEvent.click(
      screen.getByRole("button", { name: I18nKey.CONVERSATION$TOOL_SELECTOR }),
    );
    expect(controller.commands.openTool).toHaveBeenLastCalledWith("terminal");
    fireEvent.change(screen.getByRole("slider"), { target: { value: "3" } });
    expect(controller.commands.openTool).toHaveBeenCalledWith("browser");
    fireEvent.click(
      screen.getByRole("button", {
        name: I18nKey.CONVERSATION$HISTORY_CONTROL,
      }),
    );
    expect(controller.commands.toggleHistory).toHaveBeenCalledOnce();
    fireEvent.click(
      screen.getByRole("button", { name: I18nKey.SETTINGS$TITLE }),
    );
    expect(controller.commands.openSettings).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: I18nKey.BUTTON$STOP }));
    expect(controller.commands.stop).toHaveBeenCalledOnce();
    expect(
      screen.getByRole("button", { name: I18nKey.ACTION_BUTTON$RESUME }),
    ).toBeDisabled();
  });

  it("disables stop when idle or pending and enables resume only when paused", () => {
    const controller = makeController();
    controller.state.running = false;
    controller.state.canResume = true;
    useInterfaceStore.setState({ interfaceId: "dj" });
    const { rerender } = render(
      <WorkspaceInterfaceFrame controller={controller}>
        <div />
      </WorkspaceInterfaceFrame>,
    );
    expect(
      screen.getByRole("button", { name: I18nKey.BUTTON$STOP }),
    ).toBeDisabled();
    fireEvent.click(
      screen.getByRole("button", { name: I18nKey.ACTION_BUTTON$RESUME }),
    );
    expect(controller.commands.resume).toHaveBeenCalledOnce();
    controller.state.running = true;
    controller.state.isStopping = true;
    rerender(
      <WorkspaceInterfaceFrame controller={controller}>
        <div />
      </WorkspaceInterfaceFrame>,
    );
    expect(
      screen.getByRole("button", { name: I18nKey.BUTTON$STOP }),
    ).toBeDisabled();
  });

  it.each(["dj", "cockpit", "retro", "cyberdeck"])(
    "restores %s without owning session state",
    async (interfaceId) => {
      const key = useInterfaceStore.persist.getOptions().name;
      if (!key) throw new Error("Missing persistence name");
      localStorage.setItem(
        key,
        JSON.stringify({ state: { interfaceId }, version: 0 }),
      );
      await useInterfaceStore.persist.rehydrate();
      expect(useInterfaceStore.getState().interfaceId).toBe(interfaceId);
    },
  );
});
