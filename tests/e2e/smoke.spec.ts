import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("marketing and auth shells", () => {
  test("landing page renders hero and CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Run every room, guest and shift",
    );
    await expect(page.getByRole("link", { name: /book a product demo/i })).toBeVisible();
  });

  test("landing has no serious accessibility violations", async ({ page }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter((v) =>
      ["serious", "critical"].includes(v.impact || ""),
    );
    expect(serious).toEqual([]);
  });

  test("login page is reachable", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });
});
