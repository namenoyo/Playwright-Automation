const { mainmenuLocator } = require('../../locators/SP_Life/splife.locators');

class mainSPLife {
    constructor(page, expect) {
        this.page = page;
        this.expect = expect;
    }

    async clickcreateQuotation() {
        await mainmenuLocator(this.page).quotationButton.click();
    }
}

module.exports = { mainSPLife };