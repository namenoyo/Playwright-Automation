// Go_to_Emailnot.js
// ฟังก์ชันกลางสำหรับ navigate ไปยัง Email Notification เท่านั้น
const Selector = require('../fixtures/Selector');

function Go_to_Emailnot() {
  // 1. คลิกเมนู "ระบบงานให้บริการ"
  cy.contains('a,button,div,span', Selector.SERVICE_MENU.label).click({ force: true });
  cy.wait(1000);
  // 2. คลิกเมนู "ระบบ Email Notification"
  cy.contains('a,button,div,span', Selector.EMAIL_NOTIFICATION_MENU.label).click({ force: true });
  cy.wait(2000);
}

module.exports = { Go_to_Emailnot };
