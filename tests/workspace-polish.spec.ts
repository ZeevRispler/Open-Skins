import { test, expect } from "@playwright/test";

test("skin gallery explains choices, closes with Escape and retains the workspace", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".agent-state")).toHaveText("Ready");
  const input = page.getByRole("textbox", { name: "Message agent" });
  await input.fill("preserve my work");
  const picker = page.locator(".interface-switcher summary");
  await picker.focus();
  await page.keyboard.press("Enter");
  const dj = page.locator('[data-skin-option="dj"]');
  await expect(dj).toContainText("Twin decks, mixer and club lights");
  await dj.focus();
  await page.keyboard.press("Escape");
  await expect(picker).toBeFocused();
  await expect(dj).toBeHidden();
  await picker.click();
  await page.locator('[data-skin-option="cockpit"]').click();
  await expect(input).toHaveValue("preserve my work");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.locator(".agent-state")).toHaveText("Complete");
  await expect(
    page.locator('.messages article[data-role="user"] > small'),
  ).toHaveText("You");
  await expect(
    page.locator('.messages article[data-role="assistant"] > small'),
  ).toHaveText("Agent");
  await page.setViewportSize({ width: 390, height: 844 });
  for (const skin of [
    "standard",
    "dj",
    "cockpit",
    "retro",
    "ferrari",
    "flagship",
  ]) {
    await picker.click();
    await page.locator(`[data-skin-option="${skin}"]`).click();
    await expect(input).toBeInViewport();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(390);
    await page.screenshot({ path: `.runtime/polish-${skin}-mobile.png` });
  }
  await picker.click();
  await page.screenshot({ path: ".runtime/polish-gallery-mobile.png" });
});
