// Data Dictionary
const { fund_code_dictionary } = require('../../data/Unit_Linked/fund_code_dict.data.js');

const { test, expect } = require('@playwright/test');

const { calculateYearsOnly } = require('../../utils/common.js');

test('test investment order check', async ({ page }) => {
    const fund_name_ordercheck = fund_code_dictionary['9'] || 'Unknown Fund';

    console.log(fund_name_ordercheck.code, fund_name_ordercheck.NetAssetValue, fund_name_ordercheck.NAVValue, fund_name_ordercheck.BidPriceValue, fund_name_ordercheck.OfferPriceValue);

    console.log(calculateYearsOnly('20251107', '20281107'));

    // ไปที่ เว็ปไซต์ QA generate file ชำระบิลอัตโนมัติ
    await page.goto('https://qatool.ochi.link/#');
    // รอหน้าโหลดเสร็จ
    await page.waitForLoadState('networkidle');
    // กดเมนู Gen Text File Counter Bank
    await page.locator("a[onclick=\"switchTab('dline')\"]").click({ timeout: 10000 });
    // รอหน้าโหลดเสร็จ
    await expect(page.locator('text=📄  Generator Text File - Counter Bank V.1')).toBeVisible({ timeout: 60000 });
    // เลือก dropdown 002 BBL
    await page.locator('select#bankCommon').selectOption('002', { timeout: 10000 });
    await page.waitForTimeout(500);
    await page.locator('#txnDate').type('02/12/2026', { delay: 100 });



});

