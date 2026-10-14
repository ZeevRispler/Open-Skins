import { test, expect } from "@playwright/test";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

test("physical design studies preserve the screen and respond to controls", async ({
  page,
}) => {
  await page.goto(
    pathToFileURL(resolve("public/design-studies/index.html")).href,
  );
  await page.setViewportSize({ width: 1440, height: 1040 });
  for (const skin of ["retro", "ship"]) {
    await page.locator(`#${skin}`).click();
    for (const state of ["ready", "working", "approval"]) {
      await page.selectOption("#state", state);
      await expect(page.locator(".study")).toHaveAttribute("data-state", state);
      expect(
        await page
          .locator(".screen")
          .evaluate((e) => e.getBoundingClientRect().width),
      ).toBeGreaterThan(800);
    }
  }
  await page.locator("#retro").click();
  await page.locator(".stick-zone").focus();
  await page.keyboard.down("ArrowLeft");
  await expect
    .poll(() =>
      page
        .locator(".stick")
        .evaluate((e) => new DOMMatrix(getComputedStyle(e).transform).b),
    )
    .toBeLessThan(-0.4);
  await page.keyboard.up("ArrowLeft");
  await expect
    .poll(() =>
      page
        .locator(".stick")
        .evaluate((e) => new DOMMatrix(getComputedStyle(e).transform).b),
    )
    .toBe(0);
  await page.locator("#ship").click();
  await page.getByRole("button", { name: "Green · work" }).click();
  await expect(page.locator(".study")).toHaveAttribute("data-state", "working");
  await expect
    .poll(() =>
      page
        .locator(".flag-hoist")
        .evaluate((e) => parseFloat(getComputedStyle(e).top)),
    )
    .toBe(35);
  await page.getByRole("button", { name: "White · explain" }).click();
  await expect(page.locator("textarea")).toHaveValue(/Explain/);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".flag")).toHaveCSS("animation-name", "none");
});
