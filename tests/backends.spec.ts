import { test, expect } from "@playwright/test";
test.describe("real local servers", () => {
  test.skip(
    !process.env.RUN_AGENT_INTEGRATION,
    "Requires isolated real agent servers backed by local fixtures",
  );
  for (const backend of ["openhands", "opencode"])
    test(`${backend} creates a file through the shared UI`, async ({
      page,
    }) => {
      test.setTimeout(90000);
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto("/");
      await page
        .getByRole("button", { name: "Connection", exact: true })
        .click();
      await page
        .locator("dialog input")
        .fill(process.env.OPENCODE_TEST_DIRECTORY!);
      await page
        .getByRole("button", { name: `Connect ${backend}`, exact: true })
        .click();
      await expect(page.locator("dialog")).toHaveCount(0);
      await page.locator("summary").click();
      await page.locator('[data-skin-option="dj"]').click();
      await page
        .getByRole("textbox", { name: "Message agent" })
        .fill("Create and run the adapter test file");
      await page.getByRole("button", { name: "Send", exact: true }).click();
      await expect(page.locator(".messages")).toContainText(
        backend === "opencode" ? "OPENCODE_ADAPTER_OK" : "Local demo complete",
        { timeout: 60000 },
      );
      await page
        .locator(".dj-console")
        .getByRole("button", { name: "Files", exact: true })
        .click();
      await page
        .getByRole("textbox", { name: "File path" })
        .fill(backend === "opencode" ? "opencode-demo.txt" : "demo.py");
      await page
        .getByRole("button", { name: "Open file", exact: true })
        .click();
      await expect(page.locator(".tools pre")).toContainText(
        backend === "opencode" ? "OPENCODE_FILE_OK" : "Coding Skins demo",
        { timeout: 15000 },
      );
      await page.getByRole("button", { name: "Close tools" }).click();
      expect(errors).toEqual([]);
      await page.screenshot({ path: `.runtime/${backend}-integration.png` });
    });
  test("OpenHands pauses and resumes a real tool turn", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await page.getByRole("button", { name: "Connection", exact: true }).click();
    await page
      .locator("dialog input")
      .fill(process.env.OPENCODE_TEST_DIRECTORY!);
    await page
      .getByRole("button", { name: "Connect openhands", exact: true })
      .click();
    await expect(page.locator("dialog")).toHaveCount(0);
    await page
      .getByRole("textbox", { name: "Message agent" })
      .fill("slow demo");
    await page.getByRole("button", { name: "Send", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Stop", exact: true }),
    ).toBeEnabled();
    await page.getByRole("button", { name: "Stop", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Resume", exact: true }),
    ).toBeEnabled();
    await page.getByRole("button", { name: "Resume", exact: true }).click();
    await expect(page.locator(".messages")).toContainText(
      "Local demo complete",
      { timeout: 45000 },
    );
  });
});
