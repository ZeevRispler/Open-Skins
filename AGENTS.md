# Open Skins
This checkout is an independent companion app. Historical branches are preserved in the private, read-only `ZeevRispler/Open-Skins-Archive` repository; the existing local fork checkout remains untouched.
- Keep official provider SDK calls inside `src/adapters/`. Skins depend only on `src/core/` contracts.
- Never store provider credentials in the frontend, log secrets, or implement an arbitrary-URL proxy. Bridge targets and session credentials come from server environment.
- Keep shared session state mounted across skin changes. Honor reduced motion and opt-in sounds.
- Keep skin labels in `src/i18n/translation.json`; generate the enum with `npm run make-i18n`. Existing skin locales are retained; common workspace copy is English in the first standalone release.
- Exact-pin dependencies and commit package-lock.json. Use `npm ci`.
- Run lint, unit tests, build and relevant browser/integration tests. Use local fixture models, not paid accounts.
- Gate unsupported actions honestly. OpenCode abort does not imply pause/resume; never resend prompts as a fake resume.
- Keep validation economical: run deterministic unit/browser tests first; real-agent tests use local fixture models. When subagent delegation is authorized, prefer 1–2 `gpt-6-luna` agents for bounded test-writing or coverage audits, assign disjoint files, and have the parent review their changes and run combined checks. Do not use paid inference merely to validate buttons or sounds.
