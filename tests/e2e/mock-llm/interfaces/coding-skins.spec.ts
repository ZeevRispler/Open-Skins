import { test, expect } from "@playwright/test";
import {
  seedLocalStorage,
  routeSessionApiKey,
  dismissAnalyticsModal,
  ensureMockLLMProfile,
  ensureMockLLMAgentProfile,
  resetMockLLM,
  setChatInput,
  waitForTestId,
  getConversationIdFromURL,
  waitForNonUserMessageText,
  BACKEND_URL,
  SESSION_API_KEY,
  BASH_TOKEN,
  REPLY_TOKEN,
  registerTrajectory,
  activateTrajectory,
} from "../utils/mock-llm-helpers";

// @spec CS-001 — Real agent events and composer survive interface changes.
test("DJ controls operate the real coding workspace without a provider key", async ({
  page,
}) => {
  test.setTimeout(180000);
  await seedLocalStorage(page);
  await routeSessionApiKey(page);
  await ensureMockLLMProfile(page, {
    profileName: "skin-model-beta",
    model: "openai/mock-beta",
  });
  await ensureMockLLMProfile(page);
  await ensureMockLLMAgentProfile(page.request);
  await resetMockLLM(page.request);
  // The pinned server makes one skill-analysis completion before the agent loop.
  await registerTrajectory(page.request, "skin-tool-smoke", [
    { text: "" },
    {
      tool_call: {
        name: "terminal",
        arguments: {
          command: `printf 'Coding Skins file test\\n' > coding-skins-demo.txt; printf '${BASH_TOKEN}\\n'`,
        },
      },
    },
    { text: REPLY_TOKEN },
  ]);
  await activateTrajectory(page.request, "skin-tool-smoke");
  await page.goto("/");
  await dismissAnalyticsModal(page);
  await waitForTestId(page, "home-chat-launcher");
  await setChatInput(page, "Run the scripted terminal command and reply.");
  await page.getByTestId("chat-input").press("Enter");
  await page.waitForURL(/\/conversations\/[^/?#]+/);
  await page.getByRole("button", { name: "DJ console", exact: true }).click();
  const id = getConversationIdFromURL(page);
  await waitForNonUserMessageText(page, REPLY_TOKEN);
  await page.getByRole("button", { name: "Expand", exact: true }).click();
  await expect(
    page.locator("code").filter({ hasText: BASH_TOKEN }).last(),
  ).toBeVisible();
  await expect
    .poll(async () => {
      const response = await page.request.get(
        `${BACKEND_URL}/api/conversations/${id}/events/search`,
        {
          headers: { "X-Session-API-Key": SESSION_API_KEY },
          params: { limit: "100" },
        },
      );
      const events = (await response.json()).items;
      return events.some(
        (event: {
          kind: string;
          observation?: {
            kind: string;
            exit_code: number;
            content: { text: string }[];
          };
        }) =>
          event.kind === "ObservationEvent" &&
          event.observation?.kind === "TerminalObservation" &&
          event.observation.exit_code === 0 &&
          event.observation.content.some((content) =>
            content.text.includes(BASH_TOKEN),
          ),
      );
    })
    .toBe(true);
  const console = page.locator(".dj-console");
  // Exercise native model switching through the mixer, not a presentation stub.
  await console.getByTestId("chat-input-llm-profile").click();
  await page
    .getByTestId("chat-input-llm-profile-option-skin-model-beta")
    .click();
  await expect(console.getByTestId("chat-input-llm-profile")).toContainText(
    "skin-model-beta",
  );

  await console
    .getByRole("button", { name: "Conversation history", exact: true })
    .click();
  await expect(
    console.getByRole("button", { name: "Conversation history", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await console
    .getByRole("button", { name: "Conversation history", exact: true })
    .click();
  await console.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.getByTestId("ai-config-modal")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("ai-config-modal")).not.toBeVisible();
  for (const name of ["Files", "Terminal", "Changes", "Browser"]) {
    await console.getByRole("button", { name, exact: true }).click();
    await expect(
      console.getByRole("button", { name, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#conversation-tab-panel")).toBeVisible();
  }
  await console.getByRole("slider").press("Home");
  await expect(
    console.getByRole("button", { name: "Files", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await console
    .getByRole("button", { name: "Tool selector", exact: true })
    .click();
  await expect(
    page.getByRole("tabpanel", { name: "Files", exact: true }),
  ).toBeVisible();
  await setChatInput(page, "Preserve this draft");
  await page.getByRole("button", { name: "Standard", exact: true }).click();
  await expect(page.getByTestId("chat-input")).toContainText(
    "Preserve this draft",
  );
  await page.getByRole("button", { name: "DJ console", exact: true }).click();
  await expect(page.getByTestId("chat-input")).toContainText(
    "Preserve this draft",
  );
  await expect(
    console.getByRole("button", { name: "Stop", exact: true }),
  ).toBeDisabled();
  await setChatInput(page, "");
  await registerTrajectory(page.request, "skin-transport", [
    {
      tool_call: {
        name: "terminal",
        arguments: { command: "sleep 15; printf 'SKIN_TRANSPORT_TOOL_OK\\n'" },
      },
    },
    { text: "SKIN_RESUME_REPLY_OK" },
    { text: "SKIN_RESUME_REPLY_OK" },
  ]);
  await activateTrajectory(page.request, "skin-transport");
  await setChatInput(page, "Run the slow local test command.");
  await page.getByTestId("chat-input").press("Enter");
  const stop = console.getByRole("button", { name: "Stop", exact: true });
  await expect(stop).toBeEnabled();
  const interrupted = page.waitForResponse(
    (response) =>
      response.url().includes("/interrupt") &&
      response.request().method() === "POST",
  );
  await stop.click();
  expect((await interrupted).ok()).toBe(true);
  const resume = console.getByRole("button", {
    name: "Resume the agent task",
    exact: true,
  });
  await expect(resume).toBeEnabled({ timeout: 30000 });
  await resume.click();
  await waitForNonUserMessageText(page, "SKIN_RESUME_REPLY_OK");

  await page.screenshot({
    path: "test-results-mock-llm/coding-skins-desktop.png",
  });
  // All hardware controls fit on a typical laptop without scrolling the console.
  await page.setViewportSize({ width: 1280, height: 720 });
  const bounds = await console.boundingBox();
  const controls = await page.locator(".dj-controls").boundingBox();
  expect(bounds!.height).toBeLessThanOrEqual(controls!.height + 2);
  await page.setViewportSize({ width: 390, height: 844 });
  await console
    .getByRole("button", { name: "Conversation history", exact: true })
    .click();
  await expect(
    console.getByRole("button", { name: "Conversation history", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Escape");
  for (const name of ["Files", "Terminal", "Changes", "Browser"]) {
    await console.getByRole("button", { name, exact: true }).click();
    await expect(page).toHaveURL(/\/panel$/);
    await expect(
      page.getByRole("tab", {
        name: name === "Changes" ? "Commits" : name,
        exact: true,
      }),
    ).toHaveAttribute("aria-selected", "true");
    await page.getByRole("button", { name: "Back", exact: true }).click();
  }
  await page.screenshot({
    path: "test-results-mock-llm/coding-skins-mobile.png",
  });
});
