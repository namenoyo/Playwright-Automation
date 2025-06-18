module.exports = {
  SELECTOR_1_BUTTON_SEARCH: 'button:has-text("ค้นหา")', // Expected: button 'ค้นหา'
  SELECTOR_2_INPUT_KEYWORD: 'input[placeholder="กรุณากรอกคำค้นหา"]', // Expected: input 'คำค้นหา'
  SELECTOR_3_BUTTON_CLEAR: 'button:has-text("ล้าง")', // Expected: button 'ล้าง'
  SELECTOR_4_BUTTON_DETAIL_1: page => page.locator('button:has-text("รายละเอียด")').nth(0), // Expected: button 'รายละเอียด'
  SELECTOR_5_BUTTON_DETAIL_2: page => page.locator('button:has-text("รายละเอียด")').nth(1), // Expected: button 'รายละเอียด'
  SELECTOR_6_DIV_BIRTHDATE: page => page.locator('div').filter({ hasText: /\d{2}\/\d{2}\/\d{4}\(\d+ ปี \)/ }), // div ที่มีวันเกิด (ไม่ระบุค่า)
};
