import { useState } from "react";
import { useNavigation } from "#/context/navigation-context";
import type { ConversationTab } from "#/stores/conversation-store";
import { useOptionalSidebarMobileNav } from "#/components/features/sidebar/sidebar-mobile-nav-context";
import {
  useBreakpoint,
  SIDEBAR_RAIL_COLLAPSE_MAX_WIDTH,
} from "#/hooks/use-breakpoint";
import { useSettings } from "#/hooks/query/use-settings";
import { getLockedCloudHost } from "#/api/agent-server-config";
import { useSelectConversationTab } from "#/hooks/use-select-conversation-tab";
import { useAgentState } from "#/hooks/use-agent-state";
import { useSessionControls } from "./use-session-controls";
import { useSidebarStore } from "#/stores/sidebar-store";
import { AgentState } from "#/types/agent-state";

/** The UI-facing contract; interfaces consume commands, never server clients. */
// @spec CS-003 — Adapt shared panels to desktop and mobile navigation.
export function useWorkspaceController() {
  const tools = useSelectConversationTab();
  const { navigate, conversationId } = useNavigation();
  const isMobilePanel = useBreakpoint();
  const revealPanel = () => {
    if (isMobilePanel && conversationId)
      navigate(`/conversations/${conversationId}/panel`);
  };
  const openTool = (tab: ConversationTab) => {
    if (tab === "commits") tools.navigateToChanges();
    else tools.navigateToTab(tab);
    revealPanel();
  };
  const mobileNav = useOptionalSidebarMobileNav();
  const isMobileSidebar = useBreakpoint(SIDEBAR_RAIL_COLLAPSE_MAX_WIDTH);
  const { data: settings } = useSettings();
  const session = useSessionControls();
  const { curAgentState } = useAgentState();
  const toggleHistory = useSidebarStore((state) => state.toggleCollapsed);
  const historyOpen = useSidebarStore((state) => !state.collapsed);
  const [settingsOpen, setSettingsOpen] = useState(false);
  return {
    state: {
      agentState: curAgentState,
      canConfigure: Boolean(settings) && getLockedCloudHost() === null,
      running: curAgentState === AgentState.RUNNING,
      canResume: curAgentState === AgentState.PAUSED,
      isStopping: session.isStopping,
      isResuming: session.isResuming,
      selectedTool: tools.selectedTab,
      toolsOpen: tools.isRightPanelShown,
      historyOpen: isMobileSidebar
        ? (mobileNav?.isOpen ?? historyOpen)
        : historyOpen,
      settingsOpen,
    },
    commands: {
      stop: session.stop,
      resume: session.resume,
      openTool,
      openChanges: () => openTool("commits"),
      toggleHistory:
        isMobileSidebar && mobileNav ? mobileNav.toggle : toggleHistory,
      openSettings: () => setSettingsOpen(true),
      closeSettings: () => setSettingsOpen(false),
    },
  };
}
export type WorkspaceController = ReturnType<typeof useWorkspaceController>;
