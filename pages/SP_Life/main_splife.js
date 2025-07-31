const { mainmenuLocator } = require('../../locators/SP_Life/splife.locators');

class mainSPLife {
    constructor(page, expect) {
        this.page = page;
        this.expect = expect;
    }

    async clickcreateQuotation() {
        // รอให้ปุ่มปรากฏและพร้อมใช้งาน (visible + enabled)
        await this.expect(mainmenuLocator(this.page).quotationButton).toBeVisible({ timeout: 60000 });
        await this.expect(mainmenuLocator(this.page).quotationButton).toBeEnabled({ timeout: 60000 });
        await mainmenuLocator(this.page).quotationButton.click();
    }
}

module.exports = { mainSPLife };