import { menualterationLocator } from "../../locators/Alteration/alteration.locators";

export class menuAlteration {
    constructor (page, expect) {
        this.page = page;
        this.expect = expect;
    }

    async menuallAlteration(mainmenu, submenu) {

        // ดึงข้อมูล locator ใส่ในตัวแปรเพอื่ให้เรียกใช้ได้ง่ายขึ้น
        const menualterationlocator = menualterationLocator(this.page, mainmenu, submenu)

        // เช็คว่าเจอชื่อเมนูหลัก แล้วหรือยัง
        await this.expect(menualterationlocator.mainmenu).toBeVisible();
        // กดเมนูหลัก
        await menualterationlocator.mainmenu.click()
        // เงื่อนไขถ้ามี เมนูรอง ไหม
        if (submenu != undefined) {
            // เช็คว่าเจอชื่อเมนูรอง แล้วหรือยัง
            await this.expect(menualterationlocator.submenu).toBeVisible();
            // กดเมนูรอง
            await menualterationlocator.submenu.click()
            // ตรวจสอบว่าเข้าเมนูรอง ได้หรือยัง
            await this.expect(menualterationlocator.checksubmenu).toBeVisible();
        } else {
            // ตรวจสอบว่าเข้าเมนูหลัก ได้หรือยัง
            await this.expect(menualterationlocator.checkmainmenu).toBeVisible();
        }
    }
}

module.exports = { menuAlteration }