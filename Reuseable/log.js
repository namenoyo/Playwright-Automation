/**
 * ฟังก์ชันกลางสำหรับตรวจสอบ locator หลายตัวแบบ soft assert และ log ผลลัพธ์ (รองรับ locator function)
 * @param {import('@playwright/test').Page} page
 * @param {Array<{label: string, locator: function, getText?: string}>} selectorsToCheck
 * @param {boolean} isLocatorFn - ถ้า true จะใช้ locator function แทน string selector
 * @returns {Promise<{assertionLog: string, status: string}>}
 */
async function logSelectorsSoftAssert(page, selectorsToCheck, isLocatorFn = false) {
  let assertionLog = '';
  let status = 'Passed';
  for (const { label, locator, selector, getText } of selectorsToCheck) {
    try {
      const loc = isLocatorFn ? locator(page) : page.locator(selector);
      const count = await loc.count();
      if (count > 0) {
        await loc.first().waitFor({ state: 'visible', timeout: 10000 });
        // ดึง innerText/textContent ทั้งหมดของ element
        let domText = await loc.first().evaluate(el => el.innerText || el.textContent || '');
        if (getText) {
          // ถ้าระบุ getText ให้หา element ย่อยที่ต้องการ
          const sub = loc.first().getByText(getText);
          if (await sub.count() > 0) {
            domText = await sub.first().evaluate(el => el.innerText || el.textContent || '');
          }
        }
        console.log(`✅ PASS: ${label} | DOM: ${domText}`);
        assertionLog += `✅ PASS: ${label} | DOM: ${domText}\n`;
      } else {
        console.log(`❌ FAIL: ไม่พบ element ใน DOM สำหรับ ${label}`);
        assertionLog += `❌ FAIL: ไม่พบ element ใน DOM สำหรับ ${label}\n`;
        status = 'Failed';
      }
    } catch (e) {
      console.log(`❌ FAIL: ${label} | ${e.message}`);
      assertionLog += `❌ FAIL: ${label} | ${e.message}\n`;
      status = 'Failed';
    }
  }
  return { assertionLog, status };
}

module.exports = { logSelectorsSoftAssert };
