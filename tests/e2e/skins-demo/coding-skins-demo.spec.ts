import { test, expect } from "@playwright/test";

// @spec CS-006 — The persistent demo boots without a manually entered key.
test("key-free demo creates and runs a real file", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("analytics-consent", "false");
    localStorage.setItem("openhands-telemetry-consent", "denied");
    localStorage.setItem("openhands-telemetry-first-use", "true");
    localStorage.setItem("openhands-onboarded", "1");
  });
  await page.goto("/");
  const consent = page.getByTestId("telemetry-consent-form");
  const hasConsent = await consent
    .waitFor({ state: "visible", timeout: 5000 })
    .then(
      () => true,
      () => false,
    );
  if (hasConsent)
    await consent.getByRole("button", { name: "Confirm preferences" }).click();
  await expect(page.getByTestId("home-chat-launcher")).toBeVisible();
  await page.getByTestId("chat-input").fill("Run the local coding demo.");
  await page.getByTestId("chat-input").press("Enter");
  await page.waitForURL(/\/conversations\/[^/?#]+/);
  if (await consent.isVisible())
    await consent.getByRole("button", { name: "Confirm preferences" }).click();
  await page.getByRole("button", { name: "Interface", exact: true }).click();
  await page.getByRole("button", { name: "DJ console", exact: true }).click();
  await expect(
    page.getByText("Local demo complete.", { exact: false }),
  ).toBeVisible({ timeout: 60000 });
  await page
    .locator(".dj-console")
    .getByRole("button", { name: "Files", exact: true })
    .click();
  await page.getByRole("button", { name: "demo.py", exact: true }).click();
  await expect(
    page.getByRole("tabpanel", { name: "Files", exact: true }),
  ).toContainText("Coding Skins demo: real terminal execution");
  await page.screenshot({
    path: "test-results-skins-demo/working-dj-demo.png",
  });
});

// @spec CS-009 — Gallery dismissal and keyboard selection preserve focus.
// @spec CS-007 — Home, settings, sidebar and dialogs share the selected skin.
test("skins cover the app and survive route navigation", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("openhands-onboarded", "1");
    localStorage.setItem("analytics-consent", "false");
    localStorage.setItem("openhands-telemetry-consent", "denied");
  });
  await page.goto("/");
  await expect(page).toHaveTitle("Open Skins");
  const backgrounds = new Set<string>();
  for (const [name, id] of [
    ["Cockpit", "cockpit"],
    ["Retro console", "retro"],
    ["Cyberdeck", "cyberdeck"],
    ["DJ console", "dj"],
    ["Standard", "standard"],
  ]) {
    await page.getByRole("button", { name: "Interface", exact: true }).click();
    await page.getByRole("button", { name, exact: true }).click();
    await expect(
      page.getByRole("group", { name: "Interface", exact: true }),
    ).not.toBeVisible();
    await expect(page.locator("body")).toHaveAttribute("data-coding-skin", id);
    const background = await page
      .locator('[data-testid="root-layout"] > aside')
      .evaluate((element) => getComputedStyle(element).background);
    expect(backgrounds.has(background)).toBe(false);
    backgrounds.add(background);
    if (id !== "standard") {
      await expect
        .poll(
          async () =>
            (await page
              .locator('[data-testid="root-layout"] > aside')
              .boundingBox())!.width,
        )
        .toBeLessThan(250);
    }
    await page.screenshot({ path: `test-results-skins-demo/home-${id}.png` });
    // Reload checks persisted preference, rather than only the in-memory store.
    await page.reload();
    await expect(page.locator("body")).toHaveAttribute("data-coding-skin", id);
    // Keyboard users can reach and activate the same skin controls.
    await page.getByRole("button", { name: "Interface", exact: true }).click();
    const selectedSkin = page.getByRole("button", { name, exact: true });
    await selectedSkin.focus();
    await expect(selectedSkin).toBeFocused();
    await page.keyboard.press("Enter");
    await page.goto("/settings");
    await page.getByRole("button", { name: "Interface", exact: true }).click();
    await expect(
      page.getByRole("button", { name, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("body")).toHaveAttribute("data-coding-skin", id);
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: "Interface", exact: true }),
    ).toBeFocused();
    await expect(
      page.getByRole("group", { name: "Interface", exact: true }),
    ).not.toBeVisible();
    await page.screenshot({
      path: `test-results-skins-demo/settings-${id}.png`,
      mask: [page.locator('input[type="password"]')],
    });
    await page.goto("/");
  }
});
