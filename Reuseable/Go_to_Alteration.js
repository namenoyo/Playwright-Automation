// Go_to_Alteration.js
// Navigate ฟังก์ชันกลางสำหรับเข้าเมนู Automatic Alteration

const Selector = require('../fixtures/Selector');

/**
 * ไปที่หน้า Automatic Alteration และทำชุด action/validation ตามที่เคยอยู่ใน TS_Alteration_1.cy.js
 */
function goToAlterationPage() {
  cy.origin('https://intranet-api.ochi.link', {}, () => {
    cy.contains('div', 'Automatic Alteration').parent().parent().click({ force: true });
    // ...existing code... (ใส่ logic เพิ่มเติมที่ต้องการในนี้)
  });
}

module.exports = { goToAlterationPage };