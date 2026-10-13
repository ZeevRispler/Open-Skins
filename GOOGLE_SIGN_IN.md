# Connect Google AI Pro without an API key

Use Google's official **Antigravity ACP agent**, with Google account sign-in. Coding Skins connects through OpenHands' existing custom ACP support. Credentials stay in Google's local runtime storage; the frontend never receives your Google tokens.

## This machine

The official macOS ARM64 Antigravity ACP runtime 1.3.0 is installed in `.runtime/antigravity`. The live OpenHands stack at http://127.0.0.1:8000 has an active `google-pro-antigravity` agent profile pointing to it. The key-free scripted demo at port 5173 is separate.

1. To sign in again, run:

   ```sh
   cd /Users/zeevrispler/Documents/ChatGPT/side/Coding_Skins
   ./scripts/google-login.sh
   ```

   Complete Google's browser flow with the account holding Google AI Pro. A valid existing Google session can sign in silently. No API key or Google Cloud project is configured for this personal-account connection.

2. Open http://127.0.0.1:8000. For a future restart, run `./scripts/start-coding-skins.sh` and keep the terminal open. Do not start a second live stack while one is running.

3. Start a **new conversation** using `google-pro-antigravity`, then select **DJ console**. Existing scripted-demo conversations do not become real Google sessions.

4. Send a coding task. Tools and approval requests use the shared OpenHands UI. Google determines subscription entitlements and limits.

The default model is **Gemini 3.8 Flash (Low)**, following the user's preference for economical usage. Prefer short prompts and low reasoning; do not enable credit overage or upgrade to a heavier model automatically. Model availability is determined by Google.

## Verification and migration

Google's official Antigravity runtime successfully authenticated, reported the account's Google AI Pro tier, and returned a real response through the DJ conversation UI. The test used one short greeting and no coding tools.

The Gemini CLI sign-in page saved credentials, but Google rejected actual access on this account with `UNSUPPORTED_CLIENT` and directed it to Antigravity. Credential-file presence alone is not proof of usable access. Do not route Google subscription credentials into a Gemini API proxy; use the official ACP agent.

## Installing on another machine

Use the platform-specific official binary in the [ACP registry](https://github.com/agentclientprotocol/registry/blob/main/antigravity-acp/agent.json). Download its archive directly from `dl.google.com`, extract it into `.runtime/antigravity`, and make `agy_acp_server.par` executable on macOS/Linux. Configure a custom ACP agent profile in OpenHands with the absolute executable path and no API key, then authenticate with `scripts/google-login.sh`. Windows uses the registry's `.exe` distribution.

Node 24+, npm, and uv are needed for the local stack. `.runtime` is ignored by Git; Google credentials must not be copied into the repository.

References:
- [Google's official account authentication](https://antigravity.google/docs/cli/install/)
- [Google's ACP-based integration and personal-account auth](https://antigravity.google/docs/ide/extensions/zed)
- [Antigravity plans](https://antigravity.google/pricing)
