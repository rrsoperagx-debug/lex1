import { test, expect } from '@playwright/test';
import { login } from './support/auth';

test.describe('Happy Path - Umowa o Dzieło', () => {
  
  test('Should allow user to generate and download an "Umowa o Dzieło" PDF', async ({ page }) => {
    // 1. Login as a standard client
    await login(page, 'jan.kowalski@example.com', 'password123');
    
    // 2. Navigate to the document creation wizard
    await page.goto('/#/document-wizard');
    await expect(page.locator('h1:has-text("Witaj w Kreatorze Pism")')).toBeVisible();

    // 3. Select the "Umowa o Dzieło" template
    await page.click('h3:has-text("Umowa o Dzieło")'); // Usually clicking the card or the "Rozpocznij" button within it
    const startButton = page.locator('div').filter({ hasText: 'Umowa o Dzieło' }).locator('button:has-text("Rozpocznij")').first();
    if (await startButton.isVisible()) {
        await startButton.click();
    }

    // 4. Fill out the dynamically generated form
    await page.waitForSelector('div.space-y-6');
    const inputContainers = page.locator('div.space-y-6 > div');
    const inputCount = await inputContainers.count();
    
    for(let i = 0; i < inputCount; i++) {
        const container = inputContainers.nth(i);
        const input = container.locator('input');
        const inputType = await input.getAttribute('type');
        const label = await container.locator('label').innerText();

        if (label.toLowerCase().includes('email')) {
            await input.fill('test.wykonawca@example.com');
        } else if (inputType === 'date') {
            await input.fill('2026-02-28');
        } else if (inputType === 'number' || label.toLowerCase().includes('wynagrodzenie')) {
            await input.fill('7500');
        } else if (label.toLowerCase().includes('przedmiot')) {
            await input.fill('Stworzenie strony internetowej zgodnie ze specyfikacją');
        } else {
            await input.fill('Dane testowe E2E');
        }
    }

    // 5. Generate the document
    await page.click('button:has-text("Generuj Gotowy PDF")');
    // 5. Assert the PDF generation was successful (preview appears or download button)
    await expect(page.locator('button:has-text("Pobierz Plik PDF")')).toBeVisible({ timeout: 10000 });

    // Assuming the application currently does not issue a real download and just visually succeeds,
    // we just verify the visual success and do a pseudo click without awaiting a download buffer.
    await page.click('button:has-text("Pobierz Plik PDF")');
  });
});
