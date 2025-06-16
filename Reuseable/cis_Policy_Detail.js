// cis_Policy_Detail.js
// ฟังก์ชันกลางสำหรับค้นหาและเปิดรายละเอียดกรมธรรม์ในหน้า CIS

const Selector = require('../fixtures/Selector');

/**
 * ค้นหาและเปิดรายละเอียดกรมธรรม์ในหน้า CIS
 * @param {string} policyNo เลขกรมธรรม์ (ต้องกำหนดจาก test case ที่เรียกใช้เท่านั้น)
 */
function searchAndOpenCisPolicyDetail(policyNo) {
  if (!policyNo) throw new Error('ต้องระบุเลขกรมธรรม์ (policyNo) ในแต่ละ test case');
  cy.get(Selector.SELECTOR_CIS_MENU_SUB_1_SEARCH_1_In_Page_1_Menu_Bar_Label, { timeout: 10000 })
    .should('be.visible')
    .and('contain.text', 'ค้นหาข้อมูล', { timeout: 10000 })
    .then(() => cy.log('✅ Pass: แสดงข้อความ ค้นหาข้อมูล ในตำแหน่งที่ถูกต้อง'));

  cy.get(Selector.SELECTOR_CIS_MENU_SUB_1_SEARCH_1_In_Page_6_Input_Text).type(policyNo, { force: true });
  cy.wait(1000);
  cy.get(Selector.SELECTOR_CIS_MENU_SUB_1_SEARCH_1_In_Page_16_Button).first().click({ force: true });
  cy.wait(3000);
  cy.get(Selector.SELECTOR_CIS_MENU_SUB_1_SEARCH_1_In_Page_19_Button).first().click({ force: true });
  cy.wait(2000);
}

module.exports = { searchAndOpenCisPolicyDetail };
