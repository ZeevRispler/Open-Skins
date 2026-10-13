# Integration testing

The normal test suite needs no backend or provider credentials. Real-server tests are opt-in because they create files in the specified workspace.

Use an isolated directory and servers configured with a local deterministic model. `tests/fixtures/local-model.mjs` serves an OpenAI-compatible fixture on port 9997 and makes OpenCode's real bash tool create `opencode-demo.txt`. It is testing infrastructure, not a coding agent or production model. Start it with `node tests/fixtures/local-model.mjs`.

Configure a separate OpenCode server with a provider using `@ai-sdk/openai-compatible`, base URL `http://127.0.0.1:9997/v1`, model `test`, and a dummy local-only key. Point a separate Open Skins instance to this server. The OpenHands test expects the archived fork's existing scripted local demo (which creates and runs `demo.py` with output `Coding Skins demo: real terminal execution`); it must never target a paid live agent.

```sh
SKIN_TEST_URL=http://127.0.0.1:5184 \
RUN_AGENT_INTEGRATION=1 \
OPENCODE_TEST_DIRECTORY=/absolute/path/to/isolated/workspace \
npx playwright test tests/backends.spec.ts
```

The test opens the DJ interface, creates a session, invokes real tools through each adapter, and reads the resulting file through the shared file panel. Credentials and test output belong in ignored `.runtime/` files. Never put provider credentials in screenshots or fixture source.

## Economical UI and sound validation

The regular unit and browser suites cover control wiring and sound behavior without an agent or provider account. Run these before opting into real-agent integration tests. `tests/controls.spec.ts` covers session selection, every tool pad, preview popups, keyboard activation, model and directory controls, and the physical Stop/Resume buttons in every hardware skin. `tests/audio-browser.spec.ts` runs the real Chromium Web Audio engine and verifies tones start and finish for all four sound packs; it cannot verify the listener's speakers or volume setting.

Sound unit tests exercise every cue, opt-in/mute behavior, missing audio support, rapid-click throttling, and delayed audio resume races. Motion tests check reduced-motion support while retaining functional controls.

For AI-assisted test maintenance, use a small number of cheaper-model subagents on separate files, then review and execute the combined suite. A subagent's written assertion is not evidence until the test runs. Keep real backend inference tests separate and opt-in.
