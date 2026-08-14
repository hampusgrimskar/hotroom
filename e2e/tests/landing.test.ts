import { test, expect } from "@playwright/test";
import { snap } from "../helpers/screenshot";

test.describe("Landing Page", () => {
  test("displays the landing page with host and join buttons", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("🔥 Hotroom")).toBeVisible();
    await expect(page.getByText("Host a Game")).toBeVisible();
    await expect(page.getByText("Join a Game")).toBeVisible();

    await snap(page, "landing-page");
  });

  test("multiple clients can load the page simultaneously", async ({ browser }) => {
    const hostContext = await browser.newContext();
    const player1Context = await browser.newContext();
    const player2Context = await browser.newContext();

    const hostPage = await hostContext.newPage();
    const player1Page = await player1Context.newPage();
    const player2Page = await player2Context.newPage();

    await hostPage.goto("/");
    await player1Page.goto("/");
    await player2Page.goto("/");

    await expect(hostPage.getByText("🔥 Hotroom")).toBeVisible();
    await expect(player1Page.getByText("🔥 Hotroom")).toBeVisible();
    await expect(player2Page.getByText("🔥 Hotroom")).toBeVisible();

    // Screenshot each client for debugging
    await snap(hostPage, "multi-client-host");
    await snap(player1Page, "multi-client-player1");
    await snap(player2Page, "multi-client-player2");

    await hostContext.close();
    await player1Context.close();
    await player2Context.close();
  });
});
