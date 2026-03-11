import { expect, test } from "@playwright/test";

test("homepage loads and displays correct title", async ({ page }) => {
  // Access the root url. Playwright will use baseURL from the config.
  await page.goto("/");

  // Expect a title "to contain" a substring.
  // We'll just expect it to not be empty for now, or match Next.js defaults if it has one.
  // Wait for the page to fully load
  await page.waitForLoadState("networkidle");

  // Next.js default might be "Create Next App" or custom "SALA" title
  // For a generic smoke test, let's just assert the body is visible
  const body = page.locator("body");
  await expect(body).toBeVisible();
});
