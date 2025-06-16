// Reuseable/Log_Count.js
/**
 * ตรวจสอบ selector ทั้งหมดใน keys, log ผล, และสรุปยอด pass/fail/skip
 * @param {string[]} selectors - รายการ selector string
 */
function logSelectorCheck(selectors, keys) {
  const notPassLogs = [];
  const passLogs = [];
  let passCount = 0;
  let notPassCount = 0;
  selectors.forEach((selector, idx) => {
    const label = Array.isArray(keys) && keys[idx] ? keys[idx] : selector;
    cy.get('body').then($body => {
      if ($body.find(selector).length > 0) {
        cy.get(selector, { timeout: 10000 }).then($els => {
          if ($els.length === 1) {
            cy.wrap($els)
              .scrollIntoView()
              .should('be.visible')
              .then(() => {
                const msg = `✅ PASS: ${label} (single element)`;
                cy.log(msg);
                cy.task('logToReport', msg);
                passLogs.push(msg);
                passCount++;
              }, () => {
                const msg = `❌ FAIL: ${label} (single element)`;
                cy.log(msg);
                cy.task('logToReport', msg);
                notPassLogs.push(msg);
                notPassCount++;
              });
          } else if ($els.length >= 2) {
            cy.wrap($els.eq(1))
              .scrollIntoView()
              .should('be.visible')
              .then(() => {
                const msg = `✅ PASS: ${label} (element index 2)`;
                cy.log(msg);
                cy.task('logToReport', msg);
                passLogs.push(msg);
                passCount++;
              }, () => {
                const msg = `❌ FAIL: ${label} (element index 2)`;
                cy.log(msg);
                cy.task('logToReport', msg);
                notPassLogs.push(msg);
                notPassCount++;
              });
          } else {
            const msg = `⚠️ SKIP: ไม่พบ element ใน DOM สำหรับ ${label}`;
            cy.log(msg);
            cy.task('logToReport', msg);
            notPassLogs.push(msg);
            notPassCount++;
            }
            // Soft assert: do not throw here
          });
      } else {
        const msg = `⚠️ SKIP: ไม่พบ element ใน DOM สำหรับ ${label}`;
        cy.log(msg);
        cy.task('logToReport', msg);
        notPassLogs.push(msg);
        notPassCount++;
      }
    });
  });
  cy.then(() => {
    let summaryMsg;
    const allLogs = [];
    // Collect all selector results (pass/fail/skip) BEFORE logging
    selectors.forEach((selector, idx) => {
      const label = Array.isArray(keys) && keys[idx] ? keys[idx] : selector;
      if (!selector) {
        allLogs.push(`❌ FAIL: ไม่พบ selector: ${label}`);
      } else if (notPassLogs.find(msg => msg.includes(label))) {
        allLogs.push(notPassLogs.find(msg => msg.includes(label)));
      } else {
        allLogs.push(`✅ PASS: ${label}`);
      }
    });
    // รวม log ทั้งหมด (PASS/FAIL/SKIP) กับ summaryMsg แล้วส่งไป logToReport ทีเดียว
    const detailLog = allLogs.join('\n');
    if (notPassLogs.length > 0) {
      cy.log('==== สรุปผลที่ไม่ผ่าน (Fail/Skip) ทั้งหมด ====');
      notPassLogs.forEach(msg => cy.log(msg));
      summaryMsg = `{==== รวมผล: ผ่าน ${passCount} ไม่ผ่าน/skip ${notPassCount} จากทั้งหมด ${selectors.length} ====}`;
      cy.log(summaryMsg);
      cy.log(detailLog);
      cy.task('logToReport', `${detailLog}\n${summaryMsg}`);
    } else {
      summaryMsg = `{==== รวมผล: ผ่าน ${passCount} ไม่ผ่าน/skip 0 จากทั้งหมด ${selectors.length} ====}`;
      cy.log(summaryMsg);
      cy.log(detailLog);
      cy.task('logToReport', `${detailLog}\n${summaryMsg}`);
    }
    // เพิ่ม log รายละเอียดเข้า context ของ test เพื่อให้ mochawesome export ไป Google Sheet
    if (Cypress && Cypress.Commands) {
      cy.addDetailLogToContext(`${detailLog}\n${summaryMsg}`);
    }
    if (notPassLogs.length > 0) {
      throw new Error(`${summaryMsg}\n${detailLog}`);
    }
  });
}

module.exports = { logSelectorCheck };
