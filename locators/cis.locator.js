// Locator definitions for CISPage

module.exports = {
  menuCustomerRelation: { role: 'menuitem', name: 'ลูกค้าสัมพันธ์' },
  menuCIS: { role: 'menuitem', name: 'ระบบ CIS' },
  menuCustomerInfo: { role: 'menuitem', name: 'ข้อมูลลูกค้า', exact: true },
  policyInput: { role: 'textbox', name: 'เลขที่กรมธรรม์', exact: true },
  searchButton: { role: 'button', name: 'ค้นหา', exact: true },
  diamondButton: { role: 'button', name: '' },
  customerName: page => page.getByRole('button', { name: ' ข้อมูลส่วนตัว', exact: true }),
  policyNumber: page => page.locator('#root > header > div > div:nth-child(3) > ul:nth-child(3) > li'),
  SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_In_Page_11_Detail_Panel: page => page.locator('#root > header > div > div:nth-child(3) > ul:nth-child(3) > li'),
};
