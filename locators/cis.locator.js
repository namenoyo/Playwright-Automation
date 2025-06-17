// Locator definitions for CISPage

module.exports = {
  menuCustomerRelation: { role: 'menuitem', name: 'ลูกค้าสัมพันธ์' },
  menuCIS: { role: 'menuitem', name: 'ระบบ CIS' },
  menuCustomerInfo: { role: 'menuitem', name: 'ข้อมูลลูกค้า', exact: true },
  policyInput: { role: 'textbox', name: 'เลขที่กรมธรรม์', exact: true },
  searchButton: { role: 'button', name: 'ค้นหา', exact: true },
  diamondButton: { role: 'button', name: '' },
  customerName: page => page.locator('#section-cust-detail'),
  policyNumber: page => page.locator('#root > header > div > div:nth-child(3) > ul:nth-child(3) > li'),
  customerNumber: page => page.getByText('เลขข้อมูลลูกค้า')
};
