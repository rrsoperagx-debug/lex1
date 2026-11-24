import { test, expect } from "@playwright/test";

test.describe("AI Resource Optimizer", () => {
    test.beforeEach(async ({ page }) => {
        // Add token and consent to localStorage to bypass login
        await page.addInitScript(() => {
            window.localStorage.setItem('lexportal_consent', 'true');
            window.localStorage.setItem('isLoggedIn', 'true');
            window.localStorage.setItem('token', 'mock-token');
        });

        // Log browser console
        page.on('console', msg => console.log(`BROWSER [${msg.type()}]: ${msg.text()}`));

        // Mock the stats API
        await page.route("**/api/v1/admin/ai/stats*", async (route) => {



            const url = new URL(route.request().url());
            if (url.searchParams.get("all") === "true") {
                await route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify({
                        total_savings: 125.45678,
                        total_queries: 1250,
                        avg_latency: 245.5,
                        recent_logs: [
                            {
                                id: "1",
                                document_name: "Test Doc 1",
                                tokens_used: 1500,
                                provider: "Gemini",
                                model_name: "gemini-1.5-flash",
                                latency_ms: 120,
                                cost_usd: 0.00022,
                                timestamp: new Date().toISOString()
                            }
                        ]
                    })
                });
            } else {
                await route.fulfill({
                    status: 200,
                    contentType: "application/json",
                    body: JSON.stringify({
                        total_savings: 125.45678,
                        total_cost: 45.12,
                        avg_latency: 245.5,
                        total_queries: 1250,
                        failover_count: 3,
                        distribution: { "Gemini": 1000, "Cerebras": 250 },
                        latency_per_provider: { "Gemini": 120, "Cerebras": 30 },
                        recent_logs: [
                            {
                                id: "1",
                                document_name: "Test Doc 1",
                                tokens_used: 1500,
                                provider: "Gemini",
                                model_name: "gemini-1.5-flash",
                                latency_ms: 120,
                                cost_usd: 0.00022,
                                timestamp: new Date().toISOString()
                            }
                        ]
                    })
                });
            }
        });

        await page.route("**/api/v1/admin/dashboard/stats*", async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({
                    finance: { actual_revenue: 10000, revenue_chart: [] },
                    traffic: {},
                    cases: { open_cases: 5, success_rate: 95 },
                    clients: { total_active: 10 }
                })
            });
        });

        await page.route("**/api/v1/users/me*", async (route) => {
            await route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ id: "admin-id", email: "admin@lexportal.pl", is_superuser: true, full_name: "Admin", role: "superuser" })
            });
        });

        await page.goto("/#/admin-dashboard");

        // Final debug: check what URL and storage the browser actually has
        const storage = await page.evaluate(() => {
            return {
                url: window.location.href,
                isLoggedIn: localStorage.getItem('isLoggedIn'),
                token: localStorage.getItem('token'),
                consent: localStorage.getItem('lexportal_consent')
            };
        });
        console.log('Final Browser state:', storage);

        // Wait for the admin dashboard welcome text with a longer timeout
        await expect(page.locator("h1")).toContainText("Admin", { timeout: 15000 });
    });

    test("should display AI metrics correctly", async ({ page }) => {
        await page.click('text="Optymalizator AI"');

        // Check main title
        await expect(page.locator('h2:has-text("AI Resource Optimizer")')).toBeVisible();

        // Check KPI Cards
        await expect(page.locator('text=$125.45678')).toBeVisible();
        await expect(page.locator('text=246 ms')).toBeVisible();

        // Check Table content
        await expect(page.locator('td:has-text("Test Doc 1")')).toBeVisible();
    });

    test("should handle PDF report export", async ({ page }) => {
        await page.click('text="Optymalizator AI"');

        // Wait for data to be loaded
        await expect(page.locator('td:has-text("Test Doc 1")')).toBeVisible();

        // Listen for download
        const downloadPromise = page.waitForEvent('download');
        await page.getByRole('button', { name: 'PDF Report' }).click();
        const download = await downloadPromise;

        expect(download.suggestedFilename()).toContain("Lexportal_AI_Audit_Full");
    });
});
