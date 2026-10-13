# Agents and account connections

Open Skins uses OpenHands' existing agent configuration and authentication paths. A skin is presentation only: switching it does not require signing in again or creating a new provider connection.

## Which sign-in do I need?

| Connection                               | Who owns authentication                               |
| ---------------------------------------- | ----------------------------------------------------- |
| Local OpenHands Agent Server             | The local launcher and its session authentication     |
| OpenHands Cloud                          | Your OpenHands Cloud account                          |
| A model provider for the OpenHands agent | The configured provider and its supported credentials |
| An external ACP coding agent             | The agent's own account login or API-key mechanism    |

Signing into OpenHands Cloud does not sign you into Google, and a Google subscription does not authenticate the local Agent Server. For an ACP agent, install the official runtime, authenticate it using its supported flow, then select or configure it in OpenHands. The same connection works in every skin.

See the existing [ACP agent guide](../ACP_AGENTS.md) for agent onboarding, model selection and runtime setup.

## Optional: Google account without an API key

Use Google's official Antigravity ACP runtime with its supported Google account authentication. Configure it through OpenHands' custom ACP agent support, using the installed executable path. Provider entitlements and available models are determined by Google.

An optional local sign-in helper is available:

1. Obtain the platform-specific official runtime from the [ACP registry](https://github.com/agentclientprotocol/registry/blob/main/antigravity-acp/agent.json) and follow its installation instructions.
2. For the helper, place the macOS/Linux executable at `.runtime/antigravity/agy_acp_server.par` and make it executable.
3. Run `./scripts/google-login.sh` from the repository root and complete Google's account flow.
4. Configure the same executable as a custom ACP agent in OpenHands and start a conversation with that agent. Choose a supported economical model in its model selector.

The helper is optional and platform-specific; Windows users should use the official runtime's supported authentication flow. Credentials stay in the provider's storage. Do not copy provider credentials into this repository. `.runtime` is ignored by Git.

For installation details, consult [Google's official runtime documentation](https://antigravity.google/docs/cli/install/).
