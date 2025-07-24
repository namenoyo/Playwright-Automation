const { menusplifeLocator } = require('../../locators/SP_Life/splife.locators');

class menuSPLife {
    constructor(page, expect) {
        this.page = page;
        this.expect = expect;
    }

    async menuSPLife(mainmenu) {
        const menusplifelocator = menusplifeLocator(this.page, mainmenu);

        await this.expect(menusplifelocator.mainmenu).toBeVisible();
        await menusplifelocator.mainmenu.click();

    }
}

module.exports = { menuSPLife };