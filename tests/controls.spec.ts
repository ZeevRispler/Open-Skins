import { test, expect } from "@playwright/test";

test("history selects prior sessions and New session starts a blank conversation", async ({
  page,
}) => {
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "Message agent" });

  await input.fill("first conversation");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(
    page.getByText("Demo complete.", { exact: false }),
  ).toBeVisible();
  await expect(page.locator(".agent-heading h1")).toHaveText(
    "first conversation",
  );

  await page.getByRole("button", { name: "New session", exact: true }).click();
  await expect(page.locator(".agent-heading h1")).toHaveText("New demo");
  await expect(page.locator(".messages article")).toHaveCount(0);

  await input.fill("second conversation");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(
    page.getByText("Demo complete.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "History", exact: true }).click();
  const history = page.locator(".history");
  await expect(
    history.getByRole("button", { name: "second conversation" }),
  ).toBeVisible();
  await history.getByRole("button", { name: "first conversation" }).click();
  await expect(page.locator(".agent-heading h1")).toHaveText(
    "first conversation",
  );
  await expect(page.locator(".history")).toHaveCount(0);
  await expect(
    page.getByText("Demo complete.", { exact: false }),
  ).toBeVisible();
});

test("each tool pad opens its matching tool and preview popup validates URLs", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("textbox", { name: "Message agent" })
    .fill("tool pad fixture");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(
    page.getByText("Demo complete.", { exact: false }),
  ).toBeVisible();

  await page.locator("summary").click();
  await page.locator('[data-skin-option="cockpit"]').click();
  const console = page.locator(".dj-console");
  for (const [label, title] of [
    ["Files", "files"],
    ["Terminal", "terminal"],
    ["Changes", "changes"],
    ["Browser", "browser"],
  ]) {
    await console.getByRole("button", { name: label, exact: true }).click();
    await expect(page.locator(".tools h2")).toHaveText(title);
    await expect(
      console.getByRole("button", { name: label, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
  }

  const url = page.getByRole("textbox", { name: "Preview URL" });
  const openPreview = page.getByRole("button", { name: "Open preview" });
  await expect(openPreview).toBeDisabled();
  await url.fill("javascript:alert(1)");
  await expect(openPreview).toBeDisabled();
  await url.fill("https://example.test/preview");
  await expect(openPreview).toBeEnabled();
  await page.context().route("https://example.test/preview", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<title>Preview fixture</title>",
    }),
  );
  const popupPromise = page.waitForEvent("popup");
  await openPreview.click();
  const popup = await popupPromise;
  await expect(popup).toHaveURL("https://example.test/preview");
  await expect(popup).toHaveTitle("Preview fixture");
});

test("connection settings, directory and model controls remain usable", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Connection", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const directory = dialog.getByLabel("Working directory");
  await directory.fill("/tmp/demo-workspace");
  await expect(directory).toHaveValue("/tmp/demo-workspace");
  await dialog.getByRole("button", { name: "Connect demo" }).click();
  await expect(dialog).toHaveCount(0);
  const model = page.locator(".composer").getByLabel("Model");
  await expect(model).toBeEnabled();
  await expect(model.locator("option")).toContainText([
    "Backend default",
    "Local demo · no credits",
  ]);
  await model.selectOption("demo");
  await expect(model).toHaveValue("demo");
});

test("hardware stop and resume controls work across the nonstandard skins", async ({
  page,
}) => {
  await page.goto("/");
  for (const [index, skin] of [
    "dj",
    "cockpit",
    "retro",
  ].entries()) {
    await page.locator("summary").click();
    await page.locator(`[data-skin-option="${skin}"]`).click();
    const console = page.locator(".dj-console");
    await page
      .getByRole("textbox", { name: "Message agent" })
      .fill("slow demo");
    await page.getByRole("button", { name: "Send", exact: true }).click();
    const stop = console.getByRole("button", { name: "Stop", exact: true });
    await expect(stop).toBeEnabled();
    await stop.click();
    const resume = console.getByRole("button", {
      name: "Resume the agent task",
      exact: true,
    });
    await expect(resume).toBeEnabled();
    await resume.click();
    await expect(
      page.locator('.messages article[data-role="assistant"]'),
    ).toHaveCount(index + 1);
    await expect(page.locator(".workspace-interface")).toHaveAttribute(
      "data-agent-state",
      "finished",
    );
  }
});

test("reduced motion keeps tool controls working without hardware transitions", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.locator("summary").click();
  await page.locator('[data-skin-option="cockpit"]').click();
  const handle = page.locator("[data-hardware-handle]");
  await expect(handle).toHaveCSS("transition-duration", "0s");
  await page.locator(".skin-tool-wheel").click();
  await expect(page.locator(".tools h2")).toHaveText("terminal");
});

test("keyboard activation opens controls and backend connection failures preserve the draft", async ({
  page,
}) => {
  await page.route("**/bridge/openhands/**", (route) =>
    route.fulfill({ status: 503, body: "fixture unavailable" }),
  );
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "Message agent" });
  await input.fill("keep this draft");

  await page.getByRole("button", { name: "Connection", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Connect openhands" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(input).toHaveValue("keep this draft");

  await page.getByRole("button", { name: "Close", exact: true }).focus();
  await page.keyboard.press("Space");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(input).toHaveValue("keep this draft");
});
