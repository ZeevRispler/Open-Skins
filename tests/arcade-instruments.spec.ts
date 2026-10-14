import { test, expect } from "@playwright/test";

test("removed cyberdeck is absent and an old saved selection falls back to standard", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "agent-canvas-workspace-interface",
      JSON.stringify({
        state: { interfaceId: "cyberdeck", soundsEnabled: false },
        version: 0,
      }),
    );
  });
  await page.goto("/");
  await expect(page.locator("body")).toHaveAttribute(
    "data-coding-skin",
    "standard",
  );
  await page.locator("summary").click();
  await expect(page.locator('[data-skin-option="cyberdeck"]')).toHaveCount(0);
});

test("retro arcade marquee has distinct tokens and preserves a draft", async ({
  page,
}) => {
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "Message agent" });
  await input.fill("keep this arcade draft");
  await page.locator("summary").click();
  await page.locator('[data-skin-option="retro"]').click();
  const marquee = page.locator(".arcade-marquee");
  await expect(marquee).toBeVisible();
  await expect(marquee).toContainText(/ARCADE|PIXEL|INSERT COIN/i);
  await expect(marquee).toHaveCSS("color", "rgb(20, 75, 72)");
  const marqueeBackground = await marquee.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );
  expect(marqueeBackground).toContain("228, 229, 204");
  const legends = page.locator(".arcade-pad-code");
  await expect(legends).toHaveCount(4);
  await expect(legends).toHaveText(["A", "B", "C", "D"]);
  await expect(legends.first()).toHaveAttribute("aria-hidden", "true");
  await expect(legends.first().locator("xpath=..")).toHaveJSProperty(
    "tagName",
    "BUTTON",
  );
  const pads = page.locator(".dj-pads button");
  await expect(pads).toHaveCount(4);
  const padRadii = await pads.evaluateAll((buttons) =>
    buttons.map((button) => getComputedStyle(button).borderRadius),
  );
  expect(padRadii).toEqual(["50%", "50%", "50%", "50%"]);
  const padBackgrounds = await pads.evaluateAll((buttons) =>
    buttons.map((button) => getComputedStyle(button).backgroundImage),
  );
  await expect(pads.first()).toHaveCSS("background-color", "rgb(201, 54, 50)");
  expect(padBackgrounds[1]).toContain("255, 255, 255");
  expect(padBackgrounds[2]).toContain("8, 127, 209");
  await expect(input).toHaveValue("keep this arcade draft");
});

test("ambient instruments appear only on desktop DJ and cockpit skins", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  for (const skin of ["dj", "cockpit"]) {
    await page.locator("summary").click();
    await page.locator(`[data-skin-option="${skin}"]`).click();
    const rail = page.locator(".ambient-instruments");
    await expect(rail).toBeVisible();
    await expect(rail).toHaveAttribute("data-rack", skin);
    if (skin === "dj") {
      await expect(rail.locator(".ambient-meter")).toHaveCount(2);
      await expect(rail.locator(".rack-faders")).toBeVisible();
      await expect(rail.locator(".rack-horizon")).toHaveCount(0);
    } else {
      await expect(rail.locator(".rack-horizon")).toBeVisible();
      await expect(rail.locator(".ambient-compass")).toBeVisible();
      await expect(rail.locator(".ambient-patch")).toHaveCount(0);
    }
    await expect(rail).not.toHaveAttribute("role", "button");
    const agent = await page.locator(".agent").boundingBox();
    expect(agent?.width).toBeGreaterThanOrEqual(1000);
    expect(agent?.height).toBeGreaterThanOrEqual(550);
  }
  for (const skin of ["standard", "retro"]) {
    await page.locator("summary").click();
    await page.locator(`[data-skin-option="${skin}"]`).click();
    await expect(page.locator(".ambient-instruments")).toBeHidden();
  }
});

test("ambient rail hides on mobile and follows agent state without motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator("summary").click();
  await page.locator('[data-skin-option="cockpit"]').click();
  const rail = page.locator(".ambient-instruments");
  await expect(rail).toBeHidden();
  const composer = await page.locator(".composer").boundingBox();
  expect(composer!.y + composer!.height).toBeLessThanOrEqual(844);
  await page.locator("summary").click();
  await page.locator('[data-skin-option="retro"]').click();
  const modelSelect = await page.locator(".dj-model select").boundingBox();
  const pads = await page.locator(".dj-pads").boundingBox();
  expect(modelSelect && pads).toBeTruthy();
  const controlsOverlap =
    modelSelect!.x < pads!.x + pads!.width &&
    modelSelect!.x + modelSelect!.width > pads!.x &&
    modelSelect!.y < pads!.y + pads!.height &&
    modelSelect!.y + modelSelect!.height > pads!.y;
  expect(controlsOverlap).toBe(false);

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator("summary").click();
  await page.locator('[data-skin-option="cockpit"]').click();
  await expect(rail).toBeVisible();
  const workspace = page.locator(".workspace-interface");
  await expect(workspace).toHaveAttribute(
    "data-agent-state",
    "awaiting_user_input",
  );
  await page.getByRole("textbox", { name: "Message agent" }).fill("slow demo");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(workspace).toHaveAttribute("data-agent-state", "running");
  await expect(rail.locator("i")).toHaveCount(3);
  for (const instrumentNeedle of await rail.locator("i").all()) {
    await expect(instrumentNeedle).toHaveCSS("animation-name", "none");
    await expect(instrumentNeedle).toHaveCSS("transition-duration", "0s");
  }
});

test("retro transport stays legible when disabled, running and paused", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("summary").click();
  await page.locator('[data-skin-option="retro"]').click();
  const transport = page.locator(".dj-transport");
  const resume = transport.getByRole("button", {
    name: "Resume the agent task",
    exact: true,
  });
  const stop = transport.getByRole("button", { name: "Stop", exact: true });
  await expect(resume).toHaveCSS("opacity", "1");
  await expect(resume).toHaveCSS("color", "rgb(203, 209, 205)");
  await page.getByRole("textbox", { name: "Message agent" }).fill("slow demo");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(stop).toBeEnabled();
  await expect(stop).toHaveCSS("color", "rgb(24, 32, 34)");
  await stop.click();
  await expect(resume).toBeEnabled();
  await resume.click();
  await expect(page.locator(".workspace-interface")).toHaveAttribute(
    "data-agent-state",
    "running",
  );
});
