import { describe, expect, it, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { renderWithProviders } from "test-utils";
import { SettingsModal } from "#/components/shared/modals/settings/settings-modal";
import { MOCK_DEFAULT_USER_SETTINGS } from "#/mocks/handlers";

describe("SettingsModal", () => {
  it("renders an advanced settings link that opens in a new window", () => {
    renderWithProviders(
      <MemoryRouter>
        <SettingsModal
          onClose={vi.fn()}
          settings={MOCK_DEFAULT_USER_SETTINGS}
        />
      </MemoryRouter>,
    );

    const advancedSettingsLink = screen.getByTestId("advanced-settings-link");
    const linkElement = advancedSettingsLink.querySelector("a");

    expect(linkElement).toBeInTheDocument();
    expect(linkElement).toHaveAttribute("href", "/settings");
    expect(linkElement).toHaveAttribute("target", "_blank");
    expect(linkElement).toHaveAttribute("rel", "noreferrer noopener");
  });
  it("closes on Escape without saving provider settings", () => {
    const onClose = vi.fn();
    renderWithProviders(
      <MemoryRouter>
        <SettingsModal
          onClose={onClose}
          settings={MOCK_DEFAULT_USER_SETTINGS}
        />
      </MemoryRouter>,
    );
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
