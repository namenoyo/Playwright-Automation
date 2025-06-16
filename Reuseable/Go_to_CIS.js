// Go_to_CIS.js
// Navigate ฟังก์ชันกลางสำหรับเข้าเมนู CIS 

const Selector = require('../fixtures/Selector');

function Go_to_CIS() {
  // Assume already logged in before calling this function
  // 1. Click "ลูกค้าสัมพันธ์"
  cy.get(Selector.SELECTOR_CIS_MENU_SUB_1_Navigate_1_Menu_Bar_Label).click({ force: true });
  cy.wait(500);
  // 2. Click "ระบบ CIS"
  cy.get(Selector.SELECTOR_CIS_MENU_SUB_1_Navigate_2_Menu_Bar_Label).click({ force: true });
  cy.wait(1000);
  // 3. Click "ข้อมูลลูกค้า"
  cy.get(Selector.SELECTOR_CIS_MENU_SUB_1_Navigate_3_Menu_Bar_Label).click({ force: true });
  cy.wait(1000);
}

module.exports = { Go_to_CIS };
