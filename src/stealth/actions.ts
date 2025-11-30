import type { Page } from 'playwright';

/**
 * Simulates human-like interactions to avoid bot detection.
 * Includes random mouse movements, scrolling, and variable delays.
 */
export async function performStealthActions(page: Page): Promise<void> {
  // 1. Random Mouse Movements (simulating reading/scanning)
  // Move to a random position in the upper half of the screen
  const x = Math.random() * 800;
  const y = Math.random() * 400;
  await page.mouse.move(x, y, { steps: 10 });

  // Random pause
  await page.waitForTimeout(Math.random() * 500 + 200);

  // 2. Scroll behavior
  // Scroll down roughly half a screen
  await page.evaluate(() => {
    window.scrollBy({
      top: window.innerHeight / 2 + (Math.random() * 100 - 50),
      behavior: 'smooth',
    });
  });

  // Wait for potential lazy-loaded content
  await page.waitForTimeout(Math.random() * 1000 + 500);

  // Small scroll adjustment (up or down)
  await page.evaluate(() => {
    window.scrollBy({
      top: Math.random() * 200 - 100,
      behavior: 'smooth',
    });
  });

  await page.waitForTimeout(Math.random() * 500 + 200);
}
