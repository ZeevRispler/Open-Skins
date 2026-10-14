import { test, expect } from "@playwright/test";

test("clouds, waves and club lights move behind opaque readable cards", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("textbox", { name: "Message agent" })
    .fill("check readable conversation");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(
    page.getByText("Demo complete.", { exact: false }),
  ).toBeVisible();
  for (const [skin, animation] of [
    ["cockpit", "cloud-drift"],
    ["flagship", "sea-drift"],
    ["dj", "club-sweep"],
  ]) {
    await page.locator("summary").click();
    await page.locator(`[data-skin-option="${skin}"]`).click();
    const scene = page.locator(".conversation-atmosphere");
    await expect(scene).toHaveCSS("pointer-events", "none");
    const before = await scene.locator("i").evaluate((e) => ({
      name: getComputedStyle(e, "::before").animationName,
      play: getComputedStyle(e, "::before").animationPlayState,
    }));
    expect(before.name).toContain(animation);
    expect(
      before.play.split(",").every((value) => value.trim() === "running"),
    ).toBe(true);
    const samples = await scene.evaluate((e) => {
      const animations = e.getAnimations({ subtree: true });
      animations.forEach((a) => {
        a.pause();
        a.currentTime = 0;
      });
      const layer = e.querySelector("i")!;
      const first =
        getComputedStyle(layer, "::before").transform +
        getComputedStyle(layer, "::before").backgroundPosition;
      animations.forEach((a) => (a.currentTime = 14000));
      return [
        first,
        getComputedStyle(layer, "::before").transform +
          getComputedStyle(layer, "::before").backgroundPosition,
      ];
    });
    expect(samples[0]).not.toBe(samples[1]);
    const contrast = await page
      .locator(".messages article")
      .first()
      .evaluate((e) => {
        const style = getComputedStyle(e);
        const parse = (v: string) => v.match(/[\d.]+/g)!.map(Number);
        const bg = parse(style.backgroundColor),
          fg = parse(style.color);
        const luminance = (c: number[]) =>
          c
            .slice(0, 3)
            .map((v) => v / 255)
            .map((v) =>
              v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4,
            )
            .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
        return {
          alpha: bg[3] ?? 1,
          ratio:
            (Math.max(luminance(bg), luminance(fg)) + 0.05) /
            (Math.min(luminance(bg), luminance(fg)) + 0.05),
        };
      });
    expect(contrast.alpha).toBe(1);
    expect(contrast.ratio).toBeGreaterThanOrEqual(4.5);
    await page.screenshot({ path: `docs/screenshots/open-skins/${skin}.png` });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect
      .poll(() =>
        scene
          .locator("i")
          .evaluate((e) => getComputedStyle(e, "::before").animationName),
      )
      .toBe("none");
    await expect
      .poll(() =>
        scene
          .locator("i")
          .evaluate((e) => getComputedStyle(e, "::after").animationName),
      )
      .toBe("none");
    await page
      .getByRole("textbox", { name: "Message agent" })
      .fill("draft still works");
    await expect(
      page.getByRole("textbox", { name: "Message agent" }),
    ).toHaveValue("draft still works");
    await page.emulateMedia({ reducedMotion: "no-preference" });
  }
});
