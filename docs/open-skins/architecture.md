# Architecture and skin development

## Architecture

OpenHands Agent Server → `@openhands/typescript-client` → existing services/hooks → `workspace-core` → `interfaces`.

- `src/workspace-core/use-session-controls.ts` owns shared stop/resume commands. Both the standard composer and DJ transport consume these functions. Existing mutations preserve local interrupt vs. cloud sandbox-pause behavior.
- `src/workspace-core/use-workspace-controller.ts` exposes state and semantic commands for tools, changes, history, settings, and transport. It adapts desktop drawers and mobile panel navigation.
- `src/interfaces/workspace-interface.tsx` binds runtime state to presentation and lazy settings.
- `src/interfaces/workspace-interface-frame.tsx` changes presentation without replacing the shared conversation child or the providers above it.
- `src/interfaces/skin-console.tsx` contains the compact shared control strip. History, transport, model selection, tool pads, the stepped tool slider, and settings invoke the same controller in every skin. Toolbar model menus open downward; composer menus retain their upward placement.
- `src/interfaces/interface-store.ts` owns the persisted skin preference only. It validates every supported skin and restores Standard for unknown ids. It does not persist conversation data or secrets.
- `src/interfaces/app-skin-applier.tsx` applies standalone app styling to the body so portals and navigation share the selected skin. `app-skins.css` uses explicit Agent Canvas scope markers to preserve the repository’s scoped CSS build.
- `src/interfaces/skin-switcher.tsx` provides the same chooser on home/settings and in the conversation.

Server APIs, credentials, authentication, execution, approvals, file operations, and event reconnection retain their OpenHands owners. Skin components must not add server clients or endpoints. Composer submission and approval UI continue through the shared OpenHands panels.

## Adding another skin

Add a typed id to `WORKSPACE_INTERFACES`, a localized label to the switcher, and visual rules in `app-skins.css` / `workspace-interface.css`. Consume the workspace controller and reusable panels. Keep conversation panels and session providers in a stable React tree; do not key the runtime or composer by the selected interface. Put new semantic actions in workspace-core rather than in the skin. Preserve native keyboard interactions, descriptive labels, disabled states, and approval behavior.

The initial implementation is a modular fork, not a third-party skin plugin SDK. It retains one active conversation view. Independently live decks will require per-session stores and removal of the upstream current-conversation singleton before they can be supported safely.

## Upstream and validation

Based on OpenHands revision `5a8635a3f983503d1e384656ee05b686030b581b`, Agent Canvas 1.27.1, MIT licensed. The `upstream` remote points to OpenHands/OpenHands. The fork is [ZeevRispler/Open-Skins](https://github.com/ZeevRispler/Open-Skins), configured as `origin`.

Tests cover command routing, disabled transport states, persisted layout selection, and preserving draft DOM/focus and a session subscription during skin changes. The dedicated Playwright suite runs the real Agent Server against a local scripted model, verifies successful terminal output, and exercises controls across every skin, native profile switching, interrupt/resume, draft retention, laptop/mobile navigation, and a desktop workspace height above 750px at 1600×1000. The persistent-demo suite separately checks home/settings skin persistence after refresh, keyboard activation, distinct rendered palettes, and sidebar width. These checks use local scripted models, not paid Google calls. Run `npx playwright test --config=playwright.coding-skins.config.ts` after a production build. Real provider authentication and model quality are separate from these key-free execution tests.

## AI-generated hardware visuals

The DJ skin uses a small jog wheel and ambient hardware artwork, preserving screen space for the agent. Cockpit, Retro console and Cyberdeck use CSS instrument, game-console and circuit motifs rather than extra bitmap assets. `src/interfaces/dj/assets/jog-wheel-v1.png` was generated with the built-in image_gen tool from a user-supplied style reference. See the adjacent asset README for the generation prompt. All labels, pads, transport, and selectors remain functional HTML, separate from the decorative image.

## Hardware and presentation

The compact picker shows the current skin and opens a preview gallery. The hardware strip is separate from the agent workspace. `theme-hardware.css` defines cockpit instruments, retro controls and cyberdeck rings; `workspace-interface.css` defines layout and shared controls; `app-skins.css` styles the app shell and dialogs. History switches derive from `historyOpen`; needles, joystick positions and selector rings derive from the selected tool. Reduced-motion disables transitions.

The themed workspace is a constrained flex column so a long conversation cannot push the mobile composer out of view. Browser coverage checks the send button bounds, rendered mechanism movement and live tool panels.

## Repository layout

| Path                           | Purpose                                                 |
| ------------------------------ | ------------------------------------------------------- |
| `src/interfaces/`              | Skin picker, shared hardware controls and visual styles |
| `src/interfaces/dj/assets/`    | DJ artwork and its provenance                           |
| `src/workspace-core/`          | Shared coding commands and state adapter                |
| `docs/open-skins/`             | Setup, agents and architecture guides                   |
| `docs/screenshots/open-skins/` | Current application screenshots                         |
| `specs/coding-skins.md`        | Stable behavior specifications                          |
| `tests/e2e/`                   | Real backend and browser regression tests               |
| `scripts/providers/`           | Optional provider-specific helpers                      |
| `.runtime/`                    | Ignored local runtimes, connection state and test notes |

Upstream frontend, server integration, build, Docker and desktop tooling remain in their existing locations to preserve compatibility.
