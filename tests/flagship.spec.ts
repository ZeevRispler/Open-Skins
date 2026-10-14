import { test, expect } from "@playwright/test";

test("flag signals operate the shared agent and preserve drafts across skins", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("summary").click();
  await page.locator('[data-skin-option="flagship"]').click();
  const rig = page.getByRole("complementary", { name: "Ship signals" });
  const input = page.getByRole("textbox", { name: "Message agent" });
  await expect(
    rig.getByRole("button", { name: "Resume", exact: true }),
  ).toBeDisabled();
  await rig.getByRole("button", { name: "Explain", exact: true }).click();
  await expect(input).toHaveValue(
    "Explain your current approach before continuing.",
  );
  await expect(
    rig.getByRole("button", { name: "Explore", exact: true }),
  ).toBeDisabled();
  await input.fill("slow demo");
  await rig.getByRole("button", { name: "Send draft", exact: true }).click();
  await expect(
    page.locator(".ship-hoist:not(.ship-secondary)"),
  ).toHaveAttribute("data-signal", "green");
  await expect(
    page.locator(".ship-hoist:not(.ship-secondary)"),
  ).toHaveAttribute("data-raised", "true");
  await rig.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(
    rig.getByRole("button", { name: "Resume", exact: true }),
  ).toBeEnabled();
  await expect(
    page.locator(".ship-hoist:not(.ship-secondary)"),
  ).toHaveAttribute("data-signal", "red");
  await rig.getByRole("button", { name: "Files", exact: true }).click();
  await expect(page.locator(".tools h2")).toHaveText("files");
  await expect(
    rig.getByRole("button", { name: "Files", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await rig.getByRole("button", { name: "Files", exact: true }).click();
  await expect(page.locator(".tools")).toHaveCount(0);
  await expect(
    rig.getByRole("button", { name: "Files", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await rig.getByRole("button", { name: "Files", exact: true }).click();
  await expect(page.locator(".tools h2")).toHaveText("files");
  await page.getByRole("button", { name: "Close tools" }).click();
  await input.fill("approval demo");
  await rig.getByRole("button", { name: "Send draft", exact: true }).click();
  await expect(page.locator(".approval")).toBeVisible();
  await expect(
    page.locator(".ship-hoist:not(.ship-secondary)"),
  ).toHaveAttribute("data-signal", "amber");
  await rig.getByRole("button", { name: "Decision", exact: true }).click();
  await expect(page.locator(".approval")).toBeFocused();
  await expect(
    page.getByRole("button", { name: "Approve / answer" }),
  ).toBeVisible();
  await input.fill("keep this");
  await page.locator("summary").click();
  await page.locator('[data-skin-option="retro"]').click();
  await expect(input).toHaveValue("keep this");
});

test("retro joystick pivots during dragging and stays in the selected detent", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("summary").click();
  await page.locator('[data-skin-option="retro"]').click();
  const wheel = page.locator(".skin-tool-wheel");
  const handle = wheel.locator("[data-hardware-handle]");
  const box = (await wheel.boundingBox())!;
  const x = box.x + box.width / 2,
    y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 35, y);
  await expect
    .poll(() =>
      handle.evaluate((e) => new DOMMatrix(getComputedStyle(e).transform).b),
    )
    .toBeGreaterThan(0.4);
  await page.mouse.up();
  await expect(page.locator(".tools h2")).toHaveText("browser");
  await expect
    .poll(() =>
      handle.evaluate((e) => new DOMMatrix(getComputedStyle(e).transform).b),
    )
    .toBeGreaterThan(0.4);
  await wheel.focus();
  await page.keyboard.down("ArrowUp");
  await expect
    .poll(() =>
      handle.evaluate((e) => new DOMMatrix(getComputedStyle(e).transform).m23),
    )
    .toBeGreaterThan(0.4);
  await page.keyboard.up("ArrowUp");
  await expect
    .poll(() =>
      handle.evaluate((e) => new DOMMatrix(getComputedStyle(e).transform).m23),
    )
    .toBeGreaterThan(0.4);
});

test("flagship stays readable at desktop and mobile and respects reduced motion", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("summary").click();
  await page.locator('[data-skin-option="flagship"]').click();
  const box = (await page.locator(".agent").boundingBox())!;
  expect(box.width).toBeGreaterThan(1000);
  expect(box.height).toBeGreaterThan(550);
  await page.screenshot({ path: "docs/screenshots/open-skins/flagship.png" });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".ship-cloth").first()).toHaveCSS(
    "animation-name",
    "none",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await expect(
    page.getByRole("textbox", { name: "Message agent" }),
  ).toBeInViewport();
});

test("mast carries multiple flags while commands stay on the deck", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("summary").click();
  await page.locator('[data-skin-option="flagship"]').click();
  await page
    .getByRole("textbox", { name: "Message agent" })
    .fill("preserve this");
  await expect(page.locator(".ship-hoist")).toHaveCount(3);
  const mast = (await page.locator(".ship-watch").boundingBox())!;
  const controls = (await page.locator(".ship-signals").boundingBox())!;
  expect(controls.width).toBeGreaterThan(mast.width * 5);
  expect(controls.y).toBeGreaterThanOrEqual(mast.y + mast.height);
});

test("scenery moves only during work and the racing toolbar has no steering wheel", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("summary").click();
  await page.locator('[data-skin-option="retro"]').click();
  const scene = page.locator(".skin-atmosphere i");
  await expect(scene).toHaveCSS("animation-play-state", "paused");
  await page.getByRole("textbox", { name: "Message agent" }).fill("slow demo");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(scene).toHaveCSS("animation-play-state", "running");
  await page.getByRole("button", { name: "Stop", exact: true }).last().click();
  await expect(scene).toHaveCSS("animation-play-state", "paused");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(scene).toHaveCSS("animation-name", "none");
  await page.locator("summary").click();
  await page.locator('[data-skin-option="ferrari"]').click();
  await expect(page.locator(".racing-steering")).toHaveCount(0);
});
