# Coding Skins

An OpenHands Agent Canvas fork with interchangeable functional interfaces. The first version provides Standard and DJ console layouts for the same conversation, tools, and agent backend.

## Run

Requires Node 24+ and npm. Install the pinned dependencies with `npm ci`.

- `npm run dev`: launch the OpenHands local stack and frontend. Follow the normal agent/provider onboarding. This may download the Python agent server and automation runtime.
- `npm run dev:mock`: frontend preview using OpenHands fixtures; no live coding agent. Open `/conversations/canvas-demo`, skip initial onboarding, and choose **DJ console** in the interface switcher.
- `npm run build`: standalone production frontend.
- `npm run build:lib`: embeddable component library.
- `node scripts/start-demo.mjs`: real coding backend with a local scripted model at http://127.0.0.1:5173. Requires Node 24+, uv, and a production build. Send any message to create and run `demo.py`; send **slow demo** to exercise Stop and Resume. No account or provider key required. This demonstrates execution and UI behavior; the scripted model does not answer general questions or perform arbitrary coding tasks. State lives under `.runtime/demo`, separate from your live provider stack. Execution uses the normal OpenHands workspace for each demo conversation.
- `npm run build:mock` followed by `npm start -- --port 5173`: static mock preview. Set `VITE_SESSION_API_KEY=mock-preview` while building to seed a local backend for the fixtures. This is a dummy preview key, not a provider credential.

The UI may show disconnected or unconfigured-agent messages in static mock mode because there is no real WebSocket agent server. File and conversation fixtures still demonstrate the layout.

## Architecture

OpenHands Agent Server → `@openhands/typescript-client` → existing services/hooks → `workspace-core` → `interfaces`.

- `src/workspace-core/use-session-controls.ts` owns shared stop/resume commands. Both the standard composer and DJ transport consume these functions. Existing mutations preserve local interrupt vs. cloud sandbox-pause behavior.
- `src/workspace-core/use-workspace-controller.ts` exposes state and semantic commands for tools, changes, history, settings, and transport. It adapts desktop drawers and mobile panel navigation.
- `src/interfaces/workspace-interface.tsx` binds runtime state to presentation and lazy settings.
- `src/interfaces/workspace-interface-frame.tsx` changes presentation without replacing the shared conversation child or the providers above it.
- `src/interfaces/dj/dj-console.tsx` contains the first control surface. The left platter toggles history; the right platter opens the selected tool; pads and a mixer fader select tools; transport stops/resumes eligible runs. Model selection reuses OpenHands' existing picker.
- `src/interfaces/interface-store.ts` owns the persisted layout preference only. It does not persist conversation data or secrets.

Server APIs, credentials, authentication, execution, approvals, file operations, and event reconnection retain their OpenHands owners. Skin components must not add server clients or endpoints. Composer submission and approval UI continue through the shared OpenHands panels.

## Adding a cockpit or another interface

Add a typed interface id and presentation controls beside `interfaces/dj`. Consume the workspace controller and reusable panels. Keep conversation panels and session providers in a stable React tree; do not key the runtime or composer by the selected interface. Put new semantic actions in workspace-core rather than in the skin. Preserve native keyboard interactions, descriptive labels, disabled states, and approval behavior.

The initial implementation is a modular fork, not a third-party skin plugin SDK. It retains one active conversation view. Independently live decks will require per-session stores and removal of the upstream current-conversation singleton before they can be supported safely.

## Upstream and validation

Based on OpenHands revision `5a8635a3f983503d1e384656ee05b686030b581b`, Agent Canvas 1.27.1, MIT licensed. The `upstream` remote points to OpenHands/OpenHands. No GitHub repository has been published by this setup.

Tests cover command routing, disabled transport states, persisted layout selection, and preserving draft DOM/focus and a session subscription during skin changes. The dedicated Playwright suite runs the real Agent Server against a local scripted model, verifies successful terminal output, and exercises DJ controls, native profile switching, interrupt/resume, and draft retention. Run `npx playwright test --config=playwright.coding-skins.config.ts` after a production build. Real provider authentication and model quality are separate from these key-free execution tests.

## AI-generated hardware visuals

The DJ layout uses two large decks around a central mixer. `src/interfaces/dj/assets/jog-wheel-v1.png` was generated with the built-in image_gen tool from a user-supplied style reference. See the adjacent asset README for the generation prompt. All labels, pads, transport, and selectors remain functional HTML, separate from the decorative image.

## Google AI Pro sign-in

See [Google sign-in without API keys](GOOGLE_SIGN_IN.md). `scripts/google-login.sh` authenticates Google’s official Antigravity ACP agent. `scripts/start-coding-skins.sh` launches the live OpenHands stack on localhost:8000. Google AI Pro authentication and a real response through the DJ interface were verified. The active Google profile defaults to Gemini 3.8 Flash (Low); the scripted demo on port 5173 remains separate.
