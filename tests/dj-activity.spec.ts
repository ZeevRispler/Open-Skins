import { test, expect } from "@playwright/test";
test("DJ platters move only during work and respect reduced motion", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("summary").click();
  await page.locator('[data-skin-option="dj"]').click();
  const discs = page.locator(".dj-console button img");
  await expect(discs.first()).toHaveCSS("animation-play-state", "paused");
  await page.getByRole("textbox", { name: "Message agent" }).fill("slow demo");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(discs.first()).toHaveCSS("animation-play-state", "running");
  const before = await discs
    .first()
    .evaluate((el) => getComputedStyle(el).transform);
  await expect
    .poll(() => discs.first().evaluate((el) => getComputedStyle(el).transform))
    .not.toBe(before);
  await expect(discs.last()).toHaveCSS("animation-direction", "reverse");
  await page.getByRole("button", { name: "Stop", exact: true }).last().click();
  await expect(discs.first()).toHaveCSS("animation-play-state", "paused");
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(discs.first()).toHaveCSS("animation-play-state", "running");
  await expect(page.locator(".workspace-interface")).toHaveAttribute(
    "data-agent-state",
    "finished",
  );
  await expect(discs.first()).toHaveCSS("animation-play-state", "paused");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(discs.first()).toHaveCSS("animation-name", "none");
});
