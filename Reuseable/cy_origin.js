// Reuseable/cy_origin.js
// ฟังก์ชัน reusable สำหรับ cy.origin ที่ใช้ค้นหาใบสอบถาม

function searchInquiryInOrigin() {
  cy.origin('https://intranet-api.ochi.link', {}, () => {
    
  });
}

module.exports = { searchInquiryInOrigin };
