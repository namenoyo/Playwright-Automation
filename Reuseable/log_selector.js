/**
 * ฟังก์ชันกลางสำหรับตรวจสอบ locator หลายตัวแบบ soft assert และ log ผลลัพธ์ (รองรับ locator function)
 * log คล้าย log.js แต่เพิ่มการแสดง count, visible, hidden
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
      let domText = '';
      if (count > 0) {
        let visibleCount = 0;
        let hiddenCount = 0;
        let firstVisibleText = '';
        for (let i = 0; i < count; i++) {
          const el = loc.nth(i);
          const isVisible = await el.isVisible();
          if (isVisible) {
            visibleCount++;
            if (!firstVisibleText) {
              firstVisibleText = (await el.evaluate(e => e.innerText || e.textContent || '')).trim().replace(/\n/g, ' ');
            }
          } else {
            hiddenCount++;
          }
        }
        // getText เฉพาะตัวแรกที่ visible
        if (getText && visibleCount > 0) {
          const sub = loc.filter({ hasText: getText }).first();
          if (await sub.count() > 0) {
            let subText = await sub.evaluate(el => el.innerText || el.textContent || '');
            firstVisibleText = subText.trim().replace(/\n/g, ' ');
          }
        }
        if (visibleCount > 0) {
          console.log(`✅ PASS: ${label} | Total: ${count} | Visible: ${visibleCount} | Hidden: ${hiddenCount} | DOM: ${firstVisibleText}`);
          assertionLog += `✅ PASS: ${label} | Total: ${count} | Visible: ${visibleCount} | Hidden: ${hiddenCount} | DOM: ${firstVisibleText}\n`;
        } else {
          // ไม่มี visible เลย
          const firstHiddenText = await loc.first().evaluate(el => el.innerText || el.textContent || '').catch(() => '');
          console.log(`⚠️ WARN: ${label} | Total: ${count} | Visible: 0 | Hidden: ${hiddenCount} | DOM (hidden): ${firstHiddenText}`);
          assertionLog += `⚠️ WARN: ${label} | Total: ${count} | Visible: 0 | Hidden: ${hiddenCount} | DOM (hidden): ${firstHiddenText}\n`;
          status = 'Failed';
        }
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
