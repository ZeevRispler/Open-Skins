import { test, expect } from "@playwright/test";

async function chooseFerrari(page: import("@playwright/test").Page) {
  await page.locator("summary").click();
  await page.locator('[data-skin-option="ferrari"]').click();
}

test("Ferrari keeps the shared conversation and draft", async ({ page }) => {
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "Message agent" });
  await input.fill("Ferrari draft");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(
    page.getByText("Demo complete.", { exact: false }),
  ).toBeVisible();

  await chooseFerrari(page);
  await expect(page.locator("body")).toHaveAttribute(
    "data-coding-skin",
    "ferrari",
  );
  await expect(input).toHaveValue("");
  await input.fill("preserved Ferrari draft");
  await page.locator("summary").click();
  await page.locator('[data-skin-option="standard"]').click();
  await expect(input).toHaveValue("preserved Ferrari draft");
  await expect(
    page.getByText("Demo complete.", { exact: false }),
  ).toBeVisible();
});

test("Ferrari tachometer and history indicator animate only while running", async ({
  page,
}) => {
  await page.goto("/");
  await chooseFerrari(page);
  const needle = page.locator(".racing-needle");
  await expect(needle).toHaveCSS("animation-name", "none");

  await page.getByRole("textbox", { name: "Message agent" }).fill("slow demo");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(needle).toHaveCSS("animation-name", "racing-work");
  await page
    .locator(".dj-transport")
    .getByRole("button", { name: "Stop", exact: true })
    .click();
  await expect(needle).toHaveCSS("animation-name", "none");
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(page.locator(".workspace-interface")).toHaveAttribute(
    "data-agent-state",
    "finished",
  );
  await expect(needle).toHaveCSS("animation-name", "none");

  await page.getByRole("button", { name: "New session", exact: true }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByRole("textbox", { name: "Message agent" }).fill("slow demo");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.locator(".workspace-interface")).toHaveAttribute(
    "data-agent-state",
    "running",
  );
  await expect(needle).toHaveCSS("animation-name", "none");
  await expect
    .poll(() =>
      needle.evaluate((el) => {
        const matrix = new DOMMatrixReadOnly(getComputedStyle(el).transform);
        return Math.round((Math.atan2(matrix.m12, matrix.m11) * 180) / Math.PI);
      }),
    )
    .toBe(35);
});

test("Ferrari gear maps arrow keys and drags to shared tool directions", async ({
  page,
}) => {
  await page.goto("/");
  await chooseFerrari(page);
  const gear = page.locator(".skin-tool-wheel");
  const directions = [
    ["ArrowLeft", "files", "0", -12, 0],
    ["ArrowUp", "terminal", "1", 0, -10],
    ["ArrowDown", "changes", "2", 0, 10],
    ["ArrowRight", "browser", "3", 12, 0],
  ] as const;
  await gear.focus();
  for (const [key, title, index, x, y] of directions) {
    await page.keyboard.press(key);
    await expect(page.locator(".tools h2")).toHaveText(title);
    await expect(page.locator(".dj-console")).toHaveAttribute(
      "data-tool-index",
      index,
    );
    await expect
      .poll(() =>
        page.locator(".racing-gear").evaluate((el) => {
          const matrix = new DOMMatrixReadOnly(getComputedStyle(el).transform);
          return [matrix.m41, matrix.m42];
        }),
      )
      .toEqual([x, y]);
  }

  const box = await gear.boundingBox();
  expect(box).not.toBeNull();
  const cx = box!.x + box!.width / 2;
  const cy = box!.y + box!.height / 2;
  for (const [dx, dy, title, index] of [
    [0, -60, "terminal", "1"],
    [0, 60, "changes", "2"],
    [-60, 0, "files", "0"],
    [60, 0, "browser", "3"],
  ] as const) {
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + dx, cy + dy, { steps: 4 });
    await page.mouse.up();
    await expect(page.locator(".tools h2")).toHaveText(title);
    await expect(page.locator(".dj-console")).toHaveAttribute(
      "data-tool-index",
      index,
    );
  }
});

test("Ferrari controls remain usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await chooseFerrari(page);
  const composer = await page.locator(".composer").boundingBox();
  expect(composer!.y + composer!.height).toBeLessThanOrEqual(844);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.locator(".skin-tool-wheel").click();
  await expect(page.locator(".dj-console")).toHaveAttribute(
    "data-tool-index",
    "1",
  );
  await expect(page.locator(".tools h2")).toHaveText("terminal");
});
