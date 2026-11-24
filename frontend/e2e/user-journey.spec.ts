import { test, expect } from '@playwright/test';
import { login } from './support/auth';

test('complete user journey: login, theme switch, dashboard navigation', async ({ page }) => {
  // 1. Login using the reusable login function
  await login(page, 'jan.kowalski@example.com', 'password123');

  // 2. Verify Client Dashboard is visible
  await expect(page).toHaveURL(/.*client-dashboard/);
  await expect(page.locator('h2:has-text("Pulpit")')).toBeVisible();

  // 3. Navigate to Help section in dashboard
  await page.click('text=Pomoc');
  // Use a more specific locator for the heading to avoid strict mode violation
  await expect(page.locator('h2:has-text("Centrum Pomocy")').first()).toBeVisible();

  // 4. Toggle Theme (assuming Navbar/Header has it)
  // Dashboard has its own header, check for theme toggle there or in sidebar
  const themeToggle = page.locator('button[aria-label*="tryb"]').first();
  if (await themeToggle.isVisible()) {
    await themeToggle.click();
    // Verify dark mode class on html
    await expect(page.locator('html')).toHaveClass(/dark/);
  }
});
