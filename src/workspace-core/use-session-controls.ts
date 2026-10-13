import { useOptionalConversationId } from "#/hooks/use-conversation-id";
import { usePauseConversation } from "#/hooks/mutation/use-pause-conversation";
import { useResumeConversation } from "#/hooks/mutation/use-resume-conversation";

/** Shared transport actions. Presentation never chooses endpoints or backend semantics. */
// @spec CS-002 — Reuse backend-aware transport in every interface.
export function useSessionControls() {
  const { conversationId } = useOptionalConversationId();
  const pause = usePauseConversation();
  const resume = useResumeConversation();
  return {
    stop: () => {
      if (conversationId && !pause.isPending) pause.mutate({ conversationId });
    },
    resume: () => {
      if (conversationId && !resume.isPending)
        resume.mutate({ conversationId });
    },
    isStopping: pause.isPending,
    isResuming: resume.isPending,
  };
}
