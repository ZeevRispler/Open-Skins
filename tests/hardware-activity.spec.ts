import { test, expect } from "@playwright/test";

async function chooseSkin(
  page: import("@playwright/test").Page,
  skin: "cockpit" | "retro",
) {
  await page.locator("summary").click();
  await page.locator(`[data-skin-option="${skin}"]`).click();
}

test("cockpit radar and retro avatar animate only while their state calls for it", async ({
  page,
}) => {
  await page.goto("/");
  await chooseSkin(page, "cockpit");
  const radar = page.locator(".skin-radar .radar-sweep");
  await expect(radar).toHaveCSS("animation-play-state", "paused");
  await page.getByRole("textbox", { name: "Message agent" }).fill("slow demo");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(radar).toHaveCSS("animation-play-state", "running");
  const initialTransform = await radar.evaluate(
    (el) => getComputedStyle(el).transform,
  );
  await expect
    .poll(() => radar.evaluate((el) => getComputedStyle(el).transform))
    .not.toBe(initialTransform);
  await page
    .locator(".dj-transport")
    .getByRole("button", { name: "Stop", exact: true })
    .click();
  await expect(radar).toHaveCSS("animation-play-state", "paused");
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(page.locator(".workspace-interface")).toHaveAttribute(
    "data-agent-state",
    "finished",
  );
  await expect(radar).toHaveCSS("animation-play-state", "paused");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(radar).toHaveCSS("animation-name", "none");

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await chooseSkin(page, "retro");
  await page.getByRole("button", { name: "New session", exact: true }).click();
  const avatar = page.locator(".retro-avatar");
  await expect(avatar).toHaveCSS("animation-name", "none");
  await page.getByRole("textbox", { name: "Message agent" }).fill("slow demo");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(avatar).toHaveCSS("animation-play-state", "running");
  await page.locator(".dj-transport").getByRole("button", { name: "Stop", exact: true }).click();
  await expect(avatar).toHaveCSS("animation-name", "none");
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(page.locator(".workspace-interface")).toHaveAttribute(
    "data-agent-state",
    "finished",
  );
  await expect(avatar).toHaveCSS("animation-name", "retro-celebrate");
  await expect(avatar).toHaveCSS("animation-play-state", "running");
  await page
    .getByRole("textbox", { name: "Message agent" })
    .fill("approval demo");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.locator(".workspace-interface")).toHaveAttribute(
    "data-agent-state",
    "awaiting_user_confirmation",
  );
  await expect(avatar).toHaveCSS("animation-name", "none");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(avatar).toHaveCSS("animation-name", "none");
});

test("tool wheel keys and drags map to tools and signed lever positions", async ({
  page,
}) => {
  await page.goto("/");
  const selected = () => page.locator(".tools h2").textContent();
  const positions = {
    ArrowLeft: { title: "files", x: -12, y: 0 },
    ArrowUp: { title: "terminal", x: 0, y: -10 },
    ArrowDown: { title: "changes", x: 0, y: 10 },
    ArrowRight: { title: "browser", x: 12, y: 0 },
  } as const;

  for (const skin of ["cockpit", "retro"] as const) {
    await chooseSkin(page, skin);
    const wheel = page.locator(".dj-console .skin-tool-wheel");
    const handle = wheel.locator("[data-hardware-handle]");
    await wheel.focus();
    for (const [key, expected] of Object.entries(positions)) {
      await page.keyboard.press(key);
      await expect.poll(selected).toBe(expected.title);
      await expect
        .poll(() =>
          handle.evaluate((el) => {
            const matrix = new DOMMatrixReadOnly(getComputedStyle(el).transform);
            return [matrix.m41, matrix.m42];
          }),
        )
        .toEqual([expected.x, expected.y]);
    }

    const box = await wheel.boundingBox();
    expect(box).not.toBeNull();
    const cx = box!.x + box!.width / 2;
    const cy = box!.y + box!.height / 2;
    for (const [dx, dy, title] of [
      [0, -60, "terminal"],
      [0, 60, "changes"],
      [-60, 0, "files"],
      [60, 0, "browser"],
    ] as const) {
      await page.mouse.move(cx, cy);
      await page.mouse.down();
      await page.mouse.move(cx + dx, cy + dy, { steps: 4 });
      await page.mouse.up();
      await expect.poll(selected).toBe(title);
    }
  }
});

test("cockpit metal toggle follows both history states", async ({ page }) => {
  await page.goto("/");
  await chooseSkin(page, "cockpit");
  const history = page.locator(".skin-history");
  const stem = history.locator(".metal-toggle i");
  await expect(history).toHaveAttribute("aria-pressed", "false");
  const offTransform = await stem.evaluate(
    (el) => getComputedStyle(el).transform,
  );

  await history.click();
  await expect(history).toHaveAttribute("aria-pressed", "true");
  await expect
    .poll(() => stem.evaluate((el) => getComputedStyle(el).transform))
    .not.toBe(offTransform);
  await history.click();
  await expect(history).toHaveAttribute("aria-pressed", "false");
  await expect(stem).toHaveCSS("transform", offTransform);

  const files = page.locator(".dj-pads").getByRole("button", {
    name: "Files",
    exact: true,
  });
  const filesStem = files.locator(".metal-toggle i");
  const padOffTransform = await filesStem.evaluate(
    (el) => getComputedStyle(el).transform,
  );
  await files.click();
  await expect(files).toHaveAttribute("aria-pressed", "true");
  await expect
    .poll(() => filesStem.evaluate((el) => getComputedStyle(el).transform))
    .not.toBe(padOffTransform);
  await files.click();
  await expect(files).toHaveAttribute("aria-pressed", "false");
  await expect(filesStem).toHaveCSS("transform", padOffTransform);
});
