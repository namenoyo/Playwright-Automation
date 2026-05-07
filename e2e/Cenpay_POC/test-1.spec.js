const { test, expect } = require('@playwright/test');

test.describe('FS-02-01-01 - ข้อมูลลูกค้า (Customer Information)', () => {

  test('FS-02-01-01: Navigate to ลูกค้าสัมพันธ์ > ระบบ CIS > ข้อมูลลูกค้า and search by เลขกรมธรรม์', async ({ page }) => {

    // Step 1: Go to the home page
    await page.goto('https://sitnbs.thaisamut.co.th/nbsweb/secure/home.html');
    await page.waitForLoadState('networkidle');

    // Step 2: Navigate to ลูกค้าสัมพันธ์ menu
    const menuLukkhaSamphan = page.getByText('ลูกค้าสัมพันธ์');
    await expect(menuLukkhaSamphan).toBeVisible({ timeout: 10000 });
    await menuLukkhaSamphan.click();

    // Step 3: Click on ระบบ CIS submenu
    const menuCIS = page.getByText('ระบบ CIS');
    await expect(menuCIS).toBeVisible({ timeout: 10000 });
    await menuCIS.click();

    // Step 4: Click on ข้อมูลลูกค้า submenu
    const menuKhomulLukkha = page.getByText('ข้อมูลลูกค้า');
    await expect(menuKhomulLukkha).toBeVisible({ timeout: 10000 });
    await menuKhomulLukkha.click();

    // Wait for the page/form to load
    await page.waitForLoadState('networkidle');

    // Step 5: Fill in เลขกรมธรรม์ input with '1234'
    const policyNumberInput = page.getByLabel('เลขกรมธรรม์');
    await expect(policyNumberInput).toBeVisible({ timeout: 10000 });
    await policyNumberInput.fill('1234');

    // Step 6: Click ค้นหา (Search) button
    const searchButton = page.getByRole('button', { name: 'ค้นหา' });
    await expect(searchButton).toBeVisible({ timeout: 10000 });
    await searchButton.click();

    // Step 7: Wait for results and assert pass
    await page.waitForLoadState('networkidle');

    // Assert that some result or response is visible (adjust selector to match actual result element)
    // Option A: Check that a result table or result container appears
    const resultContainer = page.locator('table, .result, [class*="result"], [id*="result"]').first();
    await expect(resultContainer).toBeVisible({ timeout: 15000 });

    console.log('✅ FS-02-01-01 PASSED: Successfully navigated to ข้อมูลลูกค้า and searched with เลขกรมธรรม์ = 1234');
  });

});