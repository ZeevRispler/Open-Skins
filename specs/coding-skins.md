# Open Skins interfaces

- CS-001: Standard and DJ layouts share the same mounted conversation panels and session providers. Switching layouts preserves composer DOM, drafts, and active subscriptions.
- CS-002: DJ transport and standard composer use shared stop/resume commands with existing backend semantics. Controls disable during their pending operation and when the agent state does not permit them.
- CS-003: DJ tool pads and the tool slider operate the existing shared tool panels. At mobile widths, tools open the existing panel route.
- CS-004: Layout preference persists independently of conversations. Invalid stored layout ids fall back to Standard.
- CS-005: The history platter uses desktop sidebar controls or the mobile navigation drawer. Settings use the existing modal and model selection uses the existing picker.
- CS-006: The key-free demo uses a local scripted model with the real Agent Server. Its state, ports, and workspace are separate from the live provider stack.
- CS-007: A single persisted skin preference styles the app shell, sidebar, home, settings, dialogs, and conversation. Standard restores the normal color theme. Cockpit, Retro console, and Cyberdeck join DJ as interchangeable skins.
- CS-008: Themed controls occupy a compact strip; at a 1600×1000 desktop viewport the shared agent workspace retains at least 750 pixels of vertical space. Decorative motifs stay in the chrome, leaving conversation text unobscured.

The current version retains one active conversation. Simultaneously live decks and external skin plugin loading are future work.
