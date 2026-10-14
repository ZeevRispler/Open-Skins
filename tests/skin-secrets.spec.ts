import { test, expect } from "@playwright/test";

test("signal flags disappear when their actual panel or activity ends", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("summary").click();
  await page.locator('[data-skin-option="flagship"]').click();
  const flags = (color: string) =>
    page.locator(`.ship-hoist[data-signal="${color}"]`);
  await expect(page.locator(".ship-hoist")).toHaveCount(0);
  const files = page
    .locator(".ship-signals")
    .getByRole("button", { name: "Files", exact: true });
  await files.click();
  await expect(flags("blue")).toHaveCount(1);
  await files.click();
  await expect(flags("blue")).toHaveCount(0);
  await page
    .locator(".dj-pads")
    .getByRole("button", { name: "Files", exact: true })
    .click();
  await expect(flags("blue")).toHaveCount(1);
  await page
    .locator(".dj-pads")
    .getByRole("button", { name: "Terminal", exact: true })
    .click();
  await expect(flags("blue")).toHaveCount(0);
  const input = page.getByRole("textbox", { name: "Message agent" });
  await input.fill("slow demo");
  await expect(flags("white")).toHaveCount(1);
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(flags("green")).toHaveCount(1);
  await expect(flags("white")).toHaveCount(0);
  await page
    .locator(".ship-signals")
    .getByRole("button", { name: "Stop", exact: true })
    .click();
  await expect(flags("green")).toHaveCount(0);
  await expect(flags("red")).toHaveCount(1);
  await input.fill("approval demo");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(flags("amber")).toHaveCount(1);
  await page.getByRole("button", { name: "Reject", exact: true }).click();
  await expect(flags("amber")).toHaveCount(0);
  await expect(flags("red")).toHaveCount(0);
});

test("sound switch is explicit and skin easter eggs remain harmless", async ({
  page,
}) => {
  await page.goto("/");
  const choose = async (skin: string) => {
    await page.locator("summary").click();
    await page.locator(`[data-skin-option="${skin}"]`).click();
  };
  await choose("dj");
  const sound = page.locator(".interface-switcher>button");
  await expect(sound).toHaveText("Sound off");
  await sound.click();
  await expect(sound).toHaveText("Sound on");
  await expect(sound).toHaveAttribute("aria-pressed", "true");
  await sound.click();
  await choose("retro");
  const coin = page.getByRole("button", { name: "Insert arcade coin" });
  await coin.click();
  await coin.press("Enter");
  await coin.press("Space");
  await expect(coin).toContainText("COINS 03 ★");
  await expect(page.locator(".messages article")).toHaveCount(0);
  await choose("cockpit");
  await expect(page.locator(".scene-aircraft")).toHaveCSS(
    "animation-name",
    "aircraft-pass",
  );
  await choose("flagship");
  await expect(page.locator(".scene-dolphin")).toHaveCSS(
    "animation-name",
    "dolphin-pass",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".scene-dolphin")).toBeHidden();
  await choose("ferrari");
  await expect(page.locator(".race-finish")).toBeHidden();
  await page.getByRole("textbox", { name: "Message agent" }).fill("demo");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.locator(".race-finish")).toBeVisible();
});
