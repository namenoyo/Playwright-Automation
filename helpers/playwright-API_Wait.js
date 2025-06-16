// playwright-API_Wait.js
// ฟังก์ชันรอข้อมูล customerInfo และ claimHistory สำหรับ Playwright

async function waitForCustomerInfoAndClaimHistory(page, panelHeaderSelector) {
  // รอ response customerInfoList
  const [customerInfoResponse] = await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/customerSearch/customerInfoList.html') && resp.request().method() === 'POST', { timeout: 60000 }),
    // trigger UI action ที่จะทำให้เกิด request
  ]);
  const customerInfo = await customerInfoResponse.json();
  const customerId = customerInfo?.data?.data?.[0]?.customerId;
  if (!customerId) throw new Error('customerId ไม่ถูกต้องจาก API');

  // รอ claimHistory API
  await page.route(
    url => url.includes(`/customerInfo/findNewClaimHistory.html?params.customerId=${customerId}`),
    route => route.continue()
  );
  await page.locator(panelHeaderSelector).scrollIntoViewIfNeeded();
  await page.locator(panelHeaderSelector).waitFor({ state: 'visible', timeout: 60000 });
  await page.waitForResponse(resp => resp.url().includes(`/customerInfo/findNewClaimHistory.html?params.customerId=${customerId}`), { timeout: 60000 });
  return { customerId };
}

module.exports = { waitForCustomerInfoAndClaimHistory };
