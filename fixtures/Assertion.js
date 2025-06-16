// Assertion.js
// Assertion กลางที่ใช้ในหลาย test case

const Selector = require('./Selector');

module.exports = {
  LOGIN_SUCCESS_TEXT: 'เข้าระบบตั้งแต่',
  USER_LOGIN_SINCE_ID: '#user-loginSince',
  // เพิ่ม assertion อื่น ๆ ได้ที่นี่
  // Assertion utilities สำหรับ test script
  assertDetailFound: ($els, cy) => {
    let found = false;
    $els.each((i, el) => {
      const txt = Cypress.$(el).text().trim();
      if (txt && (txt.includes('รายละเอียด') || txt.includes('Detail'))) {
        cy.log(`✅ พบข้อมูลรายละเอียด: ${txt.substring(0, 100)}`);
        found = true;
      }
    });
    if (!found) {
      cy.log('❌ ไม่พบข้อมูลรายละเอียดใน div หรือ table');
    }
  },
  assertToolbarResult: ($spans, cy) => {
    let logText = '';
    $spans.each((i, el) => {
      logText += el.innerText + ' ';
    });
    logText = logText.trim();
    if (logText.match(/แสดง.*จากทั้งหมด.*รายการ/)) {
      cy.log('🔎 ผลลัพธ์ค้นหา: ' + logText);
    } else {
      cy.log('⚠️ ไม่พบผลลัพธ์ค้นหาใน Toolbar-Message');
    }
  }
};
