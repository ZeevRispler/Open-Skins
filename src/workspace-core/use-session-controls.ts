import { useIsMutating } from "@tanstack/react-query";
import { useOptionalConversationId } from "#/hooks/use-conversation-id";
import {
  usePauseConversation,
  PAUSE_CONVERSATION_MUTATION_KEY,
} from "#/hooks/mutation/use-pause-conversation";
import {
  useResumeConversation,
  RESUME_CONVERSATION_MUTATION_KEY,
} from "#/hooks/mutation/use-resume-conversation";

/** Shared transport actions. Presentation never chooses endpoints or backend semantics. */
// @spec CS-002 — Reuse backend-aware transport in every interface.
export function useSessionControls() {
  const { conversationId } = useOptionalConversationId();
  const isStopping =
    useIsMutating({ mutationKey: PAUSE_CONVERSATION_MUTATION_KEY }) > 0;
  const isResuming =
    useIsMutating({ mutationKey: RESUME_CONVERSATION_MUTATION_KEY }) > 0;
  const pause = usePauseConversation();
  const resume = useResumeConversation();
  return {
    stop: () => {
      if (conversationId && !isStopping) pause.mutate({ conversationId });
    },
    resume: () => {
      if (conversationId && !isResuming) resume.mutate({ conversationId });
    },
    isStopping,
    isResuming,
  };
}
