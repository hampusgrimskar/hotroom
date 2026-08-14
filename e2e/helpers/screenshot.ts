import { Page } from "@playwright/test";
import { existsSync, mkdirSync } from "fs";

const SCREENSHOT_DIR = "./screenshots";

if (!existsSync(SCREENSHOT_DIR)) {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

/**
 * Take a screenshot of a page for debugging purposes.
 * Useful for AI agents to visually inspect the current UI state.
 *
 * @param page - Playwright page instance
 * @param label - Descriptive label for the screenshot file
 */
export async function snap(page: Page, label: string): Promise<string> {
  const path = `${SCREENSHOT_DIR}/${label}.png`;
  await page.screenshot({ path, fullPage: true });
  return path;
}
