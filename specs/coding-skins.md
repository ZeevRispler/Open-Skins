# Coding Skins interfaces

- CS-001: Standard and DJ layouts share the same mounted conversation panels and session providers. Switching layouts preserves composer DOM, drafts, and active subscriptions.
- CS-002: DJ transport and standard composer use shared stop/resume commands with existing backend semantics. Controls disable during their pending operation and when the agent state does not permit them.
- CS-003: DJ tool pads and the tool slider operate the existing shared tool panels. At mobile widths, tools open the existing panel route.
- CS-004: Layout preference persists independently of conversations. Invalid stored layout ids fall back to Standard.
- CS-005: The history platter uses desktop sidebar controls or the mobile navigation drawer. Settings use the existing modal and model selection uses the existing picker.

The current version retains one active conversation. Simultaneously live decks and external skin plugin loading are future work.
