import { useChatInputModelState } from "#/hooks/use-chat-input-model-state";
import { ChatInputModel } from "#/components/features/chat/components/chat-input-model";
import { ChatInputLlmProfilePicker } from "#/components/features/chat/components/chat-input-llm-profile-picker";

/** ACP agents select their own models; native agents switch saved LLM profiles. */
export function SkinModelControl() {
  const { isAcpContext } = useChatInputModelState();
  return isAcpContext ? (
    <ChatInputModel position="bottom" />
  ) : (
    <ChatInputLlmProfilePicker position="bottom" />
  );
}
