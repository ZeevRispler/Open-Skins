import { test, expect } from "@playwright/test";

test("vinyl scratching rotates only the touched deck and does not activate panels", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("summary").click();
  await page.locator('[data-skin-option="dj"]').click();
  const input = page.getByRole("textbox", { name: "Message agent" });
  await input.fill("keep this draft");
  const decks = page.locator(".vinyl-scratch");
  for (const [index, button] of [
    page.locator(".skin-history"),
    page.locator(".skin-tool-wheel"),
  ].entries()) {
    const other = await decks
      .nth(1 - index)
      .evaluate((e) => getComputedStyle(e).transform);
    const before = await decks
      .nth(index)
      .evaluate((e) => getComputedStyle(e).transform);
    const b = (await button.boundingBox())!;
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.down();
    await page.mouse.move(
      b.x + b.width / 2 + (index === 0 ? 24 : 0),
      b.y + b.height / 2 + (index === 1 ? 24 : 0),
      {
        steps: 4,
      },
    );
    await expect(decks.nth(index)).toHaveAttribute("data-scratching", "true");
    await expect
      .poll(() =>
        decks.nth(index).evaluate((e) => getComputedStyle(e).transform),
      )
      .not.toBe(before);
    await expect(decks.nth(1 - index)).toHaveCSS("transform", other);
    await page.mouse.up();
    await expect(page.locator(".history")).toHaveCount(0);
    await expect(page.locator(".tools")).toHaveCount(0);
  }
  await expect(input).toHaveValue("keep this draft");
  await page.locator(".skin-history").click();
  await expect(page.locator(".history")).toBeVisible();
  await page.locator(".skin-history").click();
  await page.locator(".skin-tool-wheel").click();
  await expect(page.locator(".tools h2")).toHaveText("terminal");
  await page.locator(".skin-tool-wheel").press("ArrowRight");
  await expect(page.locator(".tools h2")).toHaveText("browser");
});

test("tonearms track activity, labels track sessions and mixer lights affect only scenery", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("summary").click();
  await page.locator('[data-skin-option="dj"]').click();
  const arm = page.locator(".vinyl-tonearm").first();
  const idle = await arm.evaluate((e) => getComputedStyle(e).transform);
  await page.getByRole("textbox", { name: "Message agent" }).fill("slow demo");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect
    .poll(() => arm.evaluate((e) => getComputedStyle(e).transform))
    .not.toBe(idle);
  await expect(page.locator(".vinyl-caption").first()).toContainText(
    "slow demo",
  );
  await page.getByRole("button", { name: "Stop", exact: true }).last().click();
  await expect(arm).toHaveCSS("transform", idle);
  await page.getByRole("slider", { name: "DJ lights", exact: true }).fill("0");
  await expect(page.locator(".conversation-atmosphere")).toHaveCSS(
    "opacity",
    "0",
  );
  await expect(page.locator(".messages")).toBeVisible();
  await page.getByRole("slider", { name: "DJ lights", exact: true }).fill("75");
  await expect(page.locator(".conversation-atmosphere")).toHaveCSS(
    "opacity",
    "0.75",
  );
  await page.screenshot({ path: "docs/screenshots/open-skins/dj.png" });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(arm).toHaveCSS("transition-duration", "0s");
});

test("scratching schedules real audio only with sounds enabled", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const Native = window.AudioContext;
    const stats = { scratch: 0, ended: 0 };
    (window as unknown as { scratchStats: typeof stats }).scratchStats = stats;
    class Observed extends Native {
      createOscillator() {
        const node = super.createOscillator();
        const start = node.start.bind(node);
        node.start = (when = 0) => {
          if (node.type === "sawtooth") {
            stats.scratch++;
            node.addEventListener("ended", () => stats.ended++);
          }
          start(when);
        };
        return node;
      }
    }
    window.AudioContext = Observed;
  });
  await page.goto("/");
  await page.locator("summary").click();
  await page.locator('[data-skin-option="dj"]').click();
  const deck = page.locator(".skin-history");
  const drag = async () => {
    const b = (await deck.boundingBox())!;
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width / 2 + 25, b.y + b.height / 2, {
      steps: 4,
    });
    await page.mouse.up();
  };
  await drag();
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { scratchStats: { scratch: number } })
          .scratchStats.scratch,
    ),
  ).toBe(0);
  await page.locator(".interface-switcher>button").click();
  await page.waitForTimeout(90);
  await drag();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as unknown as { scratchStats: { ended: number } })
            .scratchStats.ended,
      ),
    )
    .toBeGreaterThan(0);
  const before = await page.evaluate(
    () =>
      (window as unknown as { scratchStats: { scratch: number } }).scratchStats
        .scratch,
  );
  await page.locator(".interface-switcher>button").click();
  await drag();
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { scratchStats: { scratch: number } })
          .scratchStats.scratch,
    ),
  ).toBe(before);
});
