# Open Skins

A lightweight companion workspace for **OpenHands** and **OpenCode**. Install your coding agent normally, run Open Skins beside it, and choose a DJ booth, pilot cockpit, retro console, cyberdeck or standard workspace.

The agent conversation stays central. Moving handles, switches, tool pads and optional sound packs control the same shared actions in every skin. Switching skins preserves your session and draft.

![DJ workspace](docs/screenshots/open-skins/dj.png)

## Start

Requires Node.js 24 or newer. Open Skins contains the interface and adapters; it does not bundle a coding agent, Docker image or model runtime.

```sh
npm ci
cp .env.example .env
npm run dev
```

Open **http://127.0.0.1:5180**. The initial **simulated demo** works without an account or API key. It demonstrates controls and virtual files; connect a real backend for actual coding.

For a production build:

```sh
npm run build
npm start
```

## Connect your agent

### OpenHands

Start your existing **OpenHands Agent Server** and configure its URL in `.env`. This adapter targets the Agent Server REST API used by the TypeScript client, rather than the older OpenHands web application's API.

```dotenv
OPENHANDS_URL=http://127.0.0.1:8000
# If your server requires session authentication:
OPENHANDS_SESSION_KEY_FILE=/absolute/path/to/session-api-key.txt
```

Click **Connection**, enter an absolute working directory on the agent server, then **Connect openhands**. Select an existing session from History, or send a message to create one. The model menu selects a configured agent profile for new sessions. Configure models and provider sign-in in OpenHands itself.

Your existing Google-connected OpenHands runtime can remain installed separately. Open Skins does not implement Google sign-in or convert a consumer subscription into API access. Any supported account connection belongs to the backend agent.

### OpenCode

Install [OpenCode](https://opencode.ai/docs/), connect your provider using its normal account flow, and start its server in your project:

```sh
opencode serve --hostname 127.0.0.1 --port 4096
```

Set `OPENCODE_URL=http://127.0.0.1:4096` in `.env`, restart Open Skins, then choose **Connection → Connect opencode**. Supply the project directory if needed. The model menu lists the models of connected providers; **Backend default** preserves OpenCode's configured default.

If your OpenCode server uses a password, set `OPENCODE_SERVER_PASSWORD` and optionally `OPENCODE_SERVER_USERNAME` in `.env`. Server credentials stay in the local bridge, outside the browser bundle. This password authenticates the agent server; it is not a model provider API key.

### Capabilities

| Action                              | OpenHands Agent Server        | OpenCode                        |
| ----------------------------------- | ----------------------------- | ------------------------------- |
| Conversations and real coding tools | Yes                           | Yes                             |
| Stop                                | Pause                         | Cancel current turn             |
| Resume                              | Yes                           | Send a new message to continue  |
| Model selection                     | Agent profile for new session | Connected provider model        |
| Files                               | Open by path                  | Root file list and open by path |
| Terminal                            | Agent tool output             | Agent bash output               |
| Changes                             | Edit action summaries         | Backend patch output            |
| Permissions                         | Confirmation response         | Once / reject, agent questions  |
| Preview                             | Open URL in browser           | Open URL in browser             |

The companion is deliberately smaller than a full IDE: no embedded code editor, interactive shell, Git publishing controls or automatic backend installation. The existing agent remains responsible for tools, credentials, permissions and session storage. OpenHands currently shows the latest 400 events. Tool output and patch panels are read-only.

## Skins and feedback

DJ platters rotate in opposite directions while the agent is working, with a reactive equalizer beside its status light. They pause when work stops, finishes, or needs approval. These decorative indicators follow agent activity.

The palette button opens a compact skin gallery. Sounds are **off by default**; enable them with the speaker button. Each skin has synthesized local press, completion, permission and error cues. Background tabs stay quiet, and motion respects the operating system's reduced-motion preference.

| Cockpit                                             | Retro console                                   |
| --------------------------------------------------- | ----------------------------------------------- |
| ![Cockpit](docs/screenshots/open-skins/cockpit.png) | ![Retro](docs/screenshots/open-skins/retro.png) |

![Cyberdeck](docs/screenshots/open-skins/cyberdeck.png)

Screenshots above are captured from this app's browser regression tests, using the clearly labeled simulated demo.

## Architecture

```text
src/core/                 Shared sessions, snapshots, messages and capability contracts
src/adapters/             OpenHands, OpenCode and free simulated-demo implementations
src/workspace-core/       Connection lifecycle, polling and shared workspace commands
src/interfaces/           Skins, hardware controls, animation and sound packs
src/main.tsx              Common conversation and tool panels
scripts/bridge.mjs        Local fixed-target proxy and server-side session authentication
```

Skins never import an agent SDK. Add another backend by implementing `AgentAdapter`; add a skin without changing the backend or coding functions. The browser talks only to the local bridge, which routes to configured backend addresses. Open Skins binds to loopback; this is a local companion, not a hosted multi-user service.

## Tests

```sh
npm test
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
```

Unit tests cover sound lifecycle, stop/resume, permissions, adapter state normalization and bridge origin checks. Chromium tests exercise every skin, draft preservation, files, tool pads, history, moving selectors, approvals, errors and mobile layout. Optional real-server tests are in `tests/backends.spec.ts`; see [integration testing](docs/testing.md). They use local inference fixtures and spend no provider credits.

## Migration from the fork

The earlier OpenHands fork is preserved on [`codex/openhands-fork-archive`](https://github.com/ZeevRispler/Open-Skins/tree/codex/openhands-fork-archive). This standalone branch retains the skins and license attribution, while removing the bundled OpenHands source, backend packaging and account onboarding. Existing installations remain separate and can be connected through the adapters.

MIT licensed. The original OpenHands license and attribution are retained in [LICENSE](LICENSE).
