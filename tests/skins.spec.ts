import { test, expect } from "@playwright/test";
const skins = ["standard", "dj", "cockpit", "retro", "cyberdeck", "ferrari"];
test("every skin retains draft, tools, physical controls and conversation", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Send", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("textbox", { name: "Message agent" })
    .fill("Build a demo");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(
    page.getByText("Demo complete.", { exact: false }),
  ).toBeVisible();
  for (const skin of skins) {
    await page.locator("summary").click();
    await page.locator(`[data-skin-option="${skin}"]`).click();
    await expect(page.locator("body")).toHaveAttribute(
      "data-coding-skin",
      skin,
    );
    await page
      .getByRole("textbox", { name: "Message agent" })
      .fill("preserved draft");
    if (skin !== "standard") {
      const console = page.locator(".dj-console");
      await console.getByRole("button", { name: "Files", exact: true }).click();
      await page.getByRole("button", { name: "demo.py", exact: true }).click();
      await expect(page.locator(".tools pre")).toContainText(
        'print("Open Skins")',
      );
      await console.locator(".skin-tool-wheel").click();
      await expect(page.locator(".tools h2")).toHaveText("terminal");
      await console.locator(".skin-tool-wheel").click();
      await expect(page.locator(".tools h2")).toHaveText("changes");
      await console.locator(".skin-tool-wheel").click();
      await expect(page.locator(".tools h2")).toHaveText("browser");
      await page.getByRole("button", { name: "Close tools" }).click();
      await console.locator(".skin-history").click();
      await expect(page.locator(".history")).toBeVisible();
      await console.locator(".skin-history").click();
      await expect(page.locator(".history")).toHaveCount(0);
      await console.locator(".dj-settings").click();
      await expect(page.locator("dialog")).toBeVisible();
      await page.getByRole("button", { name: "Close", exact: true }).click();
      await page.locator(".dj-tool-selector input").fill("1");
      await expect(page.locator(".tools h2")).toHaveText("terminal");
      await page.getByRole("button", { name: "Close tools" }).click();
    }
    await expect(
      page.getByRole("textbox", { name: "Message agent" }),
    ).toHaveValue("preserved draft");
    await expect(
      page.getByText("Demo complete.", { exact: false }),
    ).toBeVisible();
    await page.screenshot({ path: `docs/screenshots/open-skins/${skin}.png` });
    const agent = await page.locator(".agent").boundingBox();
    expect(agent!.width).toBeGreaterThan(1000);
    expect(agent!.height).toBeGreaterThan(550);
  }
  expect(errors).toEqual([]);
});
test("stop, resume, approval, rejection and error feedback", async ({
  page,
}) => {
  await page.goto("/");
  const input = page.getByRole("textbox", { name: "Message agent" });
  const send = page.getByRole("button", { name: "Send", exact: true });
  await input.fill("slow demo");
  await send.click();
  await expect(
    page.getByRole("button", { name: "Stop", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Resume", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await expect(
    page.getByText("Demo complete.", { exact: false }),
  ).toBeVisible();
  await input.fill("approval demo");
  await send.click();
  await expect(page.locator(".approval")).toBeVisible();
  await page.getByRole("button", { name: "Reject", exact: true }).click();
  await expect(page.getByText("Permission denied.")).toBeVisible();
  await input.fill("approval again");
  await send.click();
  await page.getByRole("button", { name: "Approve / answer" }).click();
  await expect(page.locator(".approval")).toHaveCount(0);
  await input.fill("error demo");
  await send.click();
  await expect(
    page.getByText("Demonstration error.", { exact: false }),
  ).toBeVisible();
});
test("mobile skins keep composer inside viewport and handles move", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  for (const skin of skins.slice(1)) {
    await page.locator("summary").click();
    await page.locator(`[data-skin-option="${skin}"]`).click();
    const box = await page.locator(".composer").boundingBox();
    expect(box!.y + box!.height).toBeLessThanOrEqual(844);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(390);
    await page.locator(".skin-tool-wheel").click();
    await expect(page.locator(".dj-console")).toHaveAttribute(
      "data-tool-index",
      "1",
    );
    await page.getByRole("button", { name: "Close tools" }).click();
    await page.locator(".dj-tool-selector input").fill("0");
    await page.getByRole("button", { name: "Close tools" }).click();
  }
});

test("sound toggle and actual hardware movement respond to clicks", async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as unknown as { soundCount: number }).soundCount = 0;
    class AudioFixture {
      state = "running";
      currentTime = 0;
      destination = {};
      async resume() {}
      async close() {}
      createOscillator() {
        (window as unknown as { soundCount: number }).soundCount++;
        return {
          type: "sine",
          frequency: { setValueAtTime() {} },
          connect() {},
          start() {},
          stop() {},
        };
      }
      createGain() {
        return {
          gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
          connect() {},
        };
      }
    }
    Object.defineProperty(window, "AudioContext", { value: AudioFixture });
  });
  await page.goto("/");
  await page.locator("summary").click();
  await page.locator('[data-skin-option="cockpit"]').click();
  const speaker = page.locator(".interface-switcher>button");
  await expect(speaker).toHaveAttribute("aria-pressed", "false");
  await speaker.click();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { soundCount: number }).soundCount,
      ),
    )
    .toBeGreaterThan(0);
  const lever = page.locator("[data-hardware-handle]");
  const before = await lever.evaluate((el) => getComputedStyle(el).transform);
  await page.locator(".skin-tool-wheel").click();
  await expect
    .poll(() => lever.evaluate((el) => getComputedStyle(el).transform))
    .not.toBe(before);
  await page.getByRole("button", { name: "Close tools" }).click();
  const toggle = page.locator(".skin-history .metal-toggle i");
  const off = await toggle.evaluate((el) => getComputedStyle(el).transform);
  await page.locator(".skin-history").click();
  await expect
    .poll(() => toggle.evaluate((el) => getComputedStyle(el).transform))
    .not.toBe(off);
  await page.locator(".skin-history").click();
  await speaker.click();
  const muted = await page.evaluate(
    () => (window as unknown as { soundCount: number }).soundCount,
  );
  await page.locator(".skin-tool-wheel").click();
  expect(
    await page.evaluate(
      () => (window as unknown as { soundCount: number }).soundCount,
    ),
  ).toBe(muted);
});
