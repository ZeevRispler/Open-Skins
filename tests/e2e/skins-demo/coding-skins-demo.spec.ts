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
