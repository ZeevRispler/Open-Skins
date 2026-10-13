# Getting started

## Run Open Skins

Install Node.js 24+, npm and [uv](https://docs.astral.sh/uv/getting-started/installation/). Then run:

```sh
git clone https://github.com/ZeevRispler/Open-Skins.git
cd Open-Skins
npm ci
npm run dev
```

Open the URL printed by the launcher (normally http://localhost:8000). Configure an agent using the existing OpenHands setup screens. Open the skin picker in the upper right to choose Standard, DJ console, Cockpit, Retro console or Cyberdeck. Skin changes preserve the current conversation and draft.

See [agents and account connections](agents.md) for provider setup. No Google account is required to run Open Skins.

## Try coding without a provider account

```sh
npm run build
node scripts/start-demo.mjs
```

Open http://127.0.0.1:5173 and send a message. The local scripted model creates and runs `demo.py` through the real OpenHands Agent Server. Send **slow demo** to exercise Stop and Resume. It demonstrates coding execution and the interface; it cannot perform arbitrary coding tasks. Its state lives in `.runtime/demo`, separate from the live provider stack.

## Production and embedded builds

- `npm run build`: standalone production app.
- `./scripts/start-coding-skins.sh`: serve the production app with a separate local stack at http://127.0.0.1:8000. Keep the terminal open; avoid starting another stack on the same port.
- `npm run build:lib`: the embeddable component library.

Launcher filenames retain their original names for compatibility. They start the shared OpenHands runtime.

## UI previews

`npm run dev:mock` starts frontend fixtures without a coding backend. Open `/conversations/canvas-demo` and use the skin picker. Static fixture mode may show disconnected or unconfigured-agent messages because there is no real WebSocket server. Use the scripted demo above to check actual file and terminal execution.

## Verification

```sh
npm run lint
npm test
npm run build
npm run build:lib
npx playwright install chromium
npx playwright test --config=playwright.coding-skins.config.ts
```

The dedicated browser suite uses an isolated real Agent Server and local scripted model; it does not require paid provider credentials. It checks tool panels, model selection, settings, history, stop/resume, draft retention, physical-control movement, reduced motion, and desktop/mobile layout.

To test the persistent demo, start it as above and run `npx playwright test --config=playwright.coding-skins-demo.config.ts`.
