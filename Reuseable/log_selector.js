/**
 * ฟังก์ชันกลางสำหรับตรวจสอบ locator หลายตัวแบบ soft assert และ log ผลลัพธ์ (รองรับ locator function)
 * log คล้าย log.js แต่เพิ่มการแสดง count
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
        await loc.first().waitFor({ state: 'visible', timeout: 10000 });
        domText = await loc.first().evaluate(el => el.innerText || el.textContent || '');
        domText = domText.trim().replace(/\n/g, ' '); // แสดงเป็น 1 บรรทัด
        if (getText) {
          const sub = loc.first().getByText(getText);
          if (await sub.count() > 0) {
            let subText = await sub.first().evaluate(el => el.innerText || el.textContent || '');
            domText = subText.trim().replace(/\n/g, ' ');
          }
        }
        // log DOM จริงทั้งหมด ไม่ตัดข้อความ
        if (count === 1) {
          console.log(`✅ PASS: ${label} | Count: 1 | DOM: ${domText}`);
          assertionLog += `✅ PASS: ${label} | Count: 1 | DOM: ${domText}\n`;
        } else {
          console.log(`⚠️ WARN: ${label} | Count: ${count} | DOM: ${domText}`);
          assertionLog += `⚠️ WARN: ${label} | Count: ${count} | DOM: ${domText}\n`;
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
