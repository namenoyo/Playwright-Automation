const { test, expect } = require('@playwright/test');

test('test', async ({ page }) => {
    await page.goto('https://qatool.ochi.link/#')
});