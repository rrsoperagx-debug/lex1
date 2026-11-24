import { Page, expect } from '@playwright/test';

export async function login(page: Page, email: string, password?: string) {
  await page.addInitScript(() => {
    window.localStorage.setItem('lexportal_consent', 'true');
  });
  await page.goto('/#/login');

  await page.fill('input[type="email"]', email);
  if (password) {
    await page.fill('input[type="password"]', password);
  }
  await page.click('button[type="submit"]');

  // Handle 2FA if it appears
  try {
    const twoFactorAuthLocator = page.locator('text=Weryfikacja dwuetapowa');
    await expect(twoFactorAuthLocator).toBeVisible({ timeout: 5000 }); // Short timeout
    await page.fill('input[id="code"]', '123456'); // Simulated 2FA code
    await page.click('button:has-text("Zaloguj bezpiecznie")');
  } catch (error) {
    // If 2FA doesn't show up, we assume it's not needed for this user/flow and continue.
    // This makes the login function more resilient.
    console.log('2FA not detected, proceeding.');
  }

  await expect(page).toHaveURL(/.*dashboard.*/, { timeout: 15000 });
}
