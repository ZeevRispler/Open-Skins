# Connect Google AI Pro without an API key

Google AI Pro is supported through Gemini CLI's Google sign-in. Coding Skins runs Gemini CLI as an ACP agent; Google credentials remain in the CLI's normal local credential storage. The account's subscription and limits are determined by Google.

1. Open Terminal and run:

   ```sh
   cd /Users/zeevrispler/Documents/ChatGPT/side/Coding_Skins
   ./scripts/google-login.sh
   ```

2. If Gemini asks about trusting a folder, choose only the `gemini-login` folder. Choose **Sign in with Google**, then finish signing in in Google's browser window using the account holding Google AI Pro. Do not choose Gemini API key or Vertex AI. After successful authentication, enter `/quit`.

3. The live app is already running for this session. For a future start, run `./scripts/start-coding-skins.sh` from the same folder and keep that terminal open. Do not start a second copy while the live app is already running. The launcher rebuilds the real frontend, starts the pinned OpenHands services, and provides Gemini CLI on the backend process PATH.

4. Open http://127.0.0.1:8000. The port 5173 page is a mock preview and cannot use your subscription. During onboarding, choose **Gemini CLI**, then **Next**. The connection step should detect the CLI login. Leave API key and Google Cloud fields empty and continue.

5. Start a new conversation, then choose **DJ console**. Agent choices apply to newly created conversations; an existing mock conversation is not a live Gemini session. Start with a simple question such as “Reply with a short hello.”

If the connection step does not detect a login, restart the live app after completing Gemini CLI sign-in, then retry onboarding. Login detection checks the presence of local CLI credentials; a real response is the final verification of authentication and subscription access.

The local scripts require Node, npm, uvx and Gemini CLI. These prerequisites have been installed under `.runtime` on this machine. `.runtime` is ignored by Git, including generated local server authentication files. The Node executable currently uses this machine's bundled Codex runtime; on another machine install Node 24+, npm, uv and Gemini CLI on PATH.

References:
- https://geminicli.com/docs/get-started/authentication/
- https://geminicli.com/plans/
