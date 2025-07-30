const { menusplifeLocator } = require('../../locators/SP_Life/splife.locators');

class menuSPLife {
    constructor(page, expect) {
        this.page = page;
        this.expect = expect;
    }

    async menuSPLife(mainmenu) {
        const menusplifelocator = menusplifeLocator(this.page, mainmenu);

        await this.expect(menusplifelocator.mainmenu).toBeVisible({ timeout: 10000 });
        await menusplifelocator.mainmenu.click();
        
        if (mainmenu === 'สร้างใบเสนอราคา') {
            await this.expect(this.page).toHaveURL(/.*#quotation/); // ใช้ regex
        } else if (mainmenu === 'หน้าหลัก') {
            await this.expect(this.page).toHaveURL(/.*#home/); // ใช้ regex
        } else if (mainmenu === 'รายงานการทำประกันชีวิต') {
            await this.expect(this.page).toHaveURL(/.*#report/); // ใช้ regex สำหรับเมนูอื่นๆ
        }

    }
}

module.exports = { menuSPLife };