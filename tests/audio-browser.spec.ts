import { test, expect } from "@playwright/test";
test("all sound packs schedule and finish real Web Audio tones", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const NativeAudio = window.AudioContext;
    const audio = { created: 0, started: 0, ended: 0, states: [] as string[] };
    (window as unknown as { skinAudio: typeof audio }).skinAudio = audio;
    class ObservedAudio extends NativeAudio {
      constructor() {
        super();
        audio.created++;
      }
      createOscillator() {
        const node = super.createOscillator();
        const start = node.start.bind(node);
        node.start = (when = 0) => {
          audio.started++;
          audio.states.push(this.state);
          start(when);
        };
        node.addEventListener("ended", () => audio.ended++);
        return node;
      }
    }
    window.AudioContext = ObservedAudio;
  });
  await page.goto("/");
  for (const skin of ["dj", "cockpit", "retro", "ferrari", "flagship"]) {
    await page.locator("summary").click();
    await page.locator(`[data-skin-option="${skin}"]`).click();
    const speaker = page.locator(".interface-switcher>button");
    await expect(speaker).toHaveAttribute("aria-pressed", "false");
    const before = await page.evaluate(
      () =>
        (window as unknown as { skinAudio: { started: number } }).skinAudio
          .started,
    );
    await speaker.click();
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as unknown as { skinAudio: { ended: number } }).skinAudio
              .ended,
        ),
      )
      .toBeGreaterThan(before);
    await speaker.click();
  }
  const audio = await page.evaluate(
    () =>
      (
        window as unknown as {
          skinAudio: {
            created: number;
            started: number;
            ended: number;
            states: string[];
          };
        }
      ).skinAudio,
  );
  expect(audio.created).toBe(5);
  expect(audio.started).toBe(audio.ended);
  expect(audio.states.every((state) => state === "running")).toBe(true);
});
