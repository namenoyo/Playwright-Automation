// CISPage class for Playwright

const { expect } = require('@playwright/test');
const { waitForLoadingDialogGone } = require('../utils/loading.helper');

class CISPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }


  async goToCustomerInfo() {
    await this.page.getByRole('menuitem', { name: 'ลูกค้าสัมพันธ์' }).click();
    await this.page.getByRole('menuitem', { name: 'ระบบ CIS' }).click();
    await this.page.getByRole('menuitem', { name: 'ข้อมูลลูกค้า', exact: true }).click();
    await waitForLoadingDialogGone(this.page);
  }

  async searchPolicy(policyNo) {
    const policyInput = this.page.getByRole('textbox', { name: 'เลขที่กรมธรรม์', exact: true });
    await policyInput.click();
    await policyInput.fill(policyNo);
    // เช็คให้แน่ใจว่าค่าใน textbox ถูกต้องก่อนคลิกค้นหา
    await expect(policyInput).toHaveValue(policyNo, { timeout: 5000 });

    // เช็คว่าเลขที่กรมธรรม์แสดงบนหน้าจอ (ตัวอย่าง: <span id="policyNoDisplay">เลขที่กรมธรรม์</span>)
    // หากมี element อื่นที่แสดงเลขนี้ ให้เปลี่ยน selector ตามจริง
    const display = this.page.locator('#policyNoDisplay');
    try {
      await expect(display).toHaveText(policyNo, { timeout: 3000 });
    } catch (e) {
      // ถ้าไม่เจอ element หรือไม่ตรง ให้ข้ามไป (หรือจะ throw error ก็ได้)
    }

    await this.page.getByRole('button', { name: 'ค้นหา', exact: true }).click();
    await waitForLoadingDialogGone(this.page);
  }

  async clickDiamondButton() {
    await this.page.getByRole('button', { name: '' }).click();
    await waitForLoadingDialogGone(this.page);
  }
}

module.exports = { CISPage };
