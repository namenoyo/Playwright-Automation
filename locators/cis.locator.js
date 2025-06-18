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
  customerNumber: page => page.getByText('เลขข้อมูลลูกค้า'),
  // Select all rows in the payment history grid (use td:nth-child(even) in test/helper)
  gridpaymentHistory: page => page.locator('tbody.MuiTableBody-root').nth(12).locator('tr'),
};
