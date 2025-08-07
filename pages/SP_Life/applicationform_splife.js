const { applicationformLocator, quotationLocator } = require('../../locators/SP_Life/splife.locators');

class applicationformSPLife {
    constructor (page, expect) {
        this.page = page;
        this.expect = expect;
    }

    async waitforquotationPageLoad() {
        // ตรวจสอบว่ามีการโหลดหน้า "สร้างใบคำขอเอาประกันภัย" หรือไม่
        await this.expect(this.page.locator('h4[class="MuiTypography-root application-title MuiTypography-h4"]', { hasText: 'สร้างใบคำขอเอาประกันภัย' })).toBeVisible({ timeout: 60000 });
    }

    async insuredinformation (statuspeople) {
        const applicationformlocator = applicationformLocator(this.page);

        await this.waitforquotationPageLoad();

        // 2. ข้อมูลผู้เอาประกันภัย และผู้รับผลประโยชน์
        if (statuspeople === 'โสด') {
            await applicationformlocator.statuspeople_single.click();
        } else if (statuspeople === 'สมรส') {
            await applicationformlocator.statuspeople_married.click();
        } else if (statuspeople === 'หย่า') {
            await applicationformlocator.statuspeople_divorced.click();
        } else if (statuspeople === 'หม้าย') {
            await applicationformlocator.statuspeople_widowed.click();
        }

        // คำนำหน้า
        // รอให้ปุ่มปรากฏและพร้อมใช้งาน (visible + enabled)
        await this.expect(applicationformlocator.nationality).toBeVisible({ timeout: 60000 });
        await this.expect(applicationformlocator.nationality).toBeEnabled({ timeout: 60000 });
        await applicationformlocator.nationality.click(); // คลิกที่ช่องคำนำหน้า

        // รอให้ปุ่มปรากฏและพร้อมใช้งาน (visible + enabled)
        await this.expect(applicationformlocator.nationalityOption).toBeVisible({ timeout: 60000 });
        await this.expect(applicationformlocator.nationalityOption).toBeEnabled({ timeout: 60000 });
        await applicationformlocator.nationalityOption.click(); // เลือกคำนำหน้า

    }

    async homeaddress () {
        const applicationformlocator = applicationformLocator(this.page);

        await applicationformlocator.addressno.click(); // คลิกที่ช่องเลขที่
        await this.page.keyboard.type('123', { delay: 100 }); // กรอกเลขที่
        await applicationformlocator.zipcode.click(); // คลิกที่ช่องรหัสไปรษณีย์
        await this.page.keyboard.type('80000', { delay: 100 }); // กรอกรหัสไปรษณีย์
        // รอให้ปุ่มปรากฏและพร้อมใช้งาน (visible + enabled)
        await this.expect(applicationformlocator.province).toBeVisible({ timeout: 60000 });
        await this.expect(applicationformlocator.province).toBeEnabled({ timeout: 60000 });
        await applicationformlocator.province.click(); // คลิ๊กช่องจังหวัด
        // รอให้ปุ่มปรากฏและพร้อมใช้งาน (visible + enabled)
        await this.expect(applicationformlocator.provinceOption).toBeVisible({ timeout: 60000 });
        await this.expect(applicationformlocator.provinceOption).toBeEnabled({ timeout: 60000 });
        await applicationformlocator.provinceOption.click(); // เลือกจังหวัด
        await this.expect(applicationformlocator.district).toBeVisible({ timeout: 60000 });
        await this.expect(applicationformlocator.district).toBeEnabled({ timeout: 60000 });
        await applicationformlocator.district.click(); // คลิ๊กช่องอำเภอ
        await this.expect(applicationformlocator.districtOption).toBeVisible({ timeout: 60000 });
        await this.expect(applicationformlocator.districtOption).toBeEnabled({ timeout: 60000 });
        await applicationformlocator.districtOption.click(); // เลือกอำเภอ
        await this.expect(applicationformlocator.subdistrict).toBeVisible({ timeout: 60000 });
        await this.expect(applicationformlocator.subdistrict).toBeEnabled({ timeout: 60000 });
        await applicationformlocator.subdistrict.click(); // คลิ๊กช่องตำบล
        await this.expect(applicationformlocator.subdistrictOption).toBeVisible({ timeout: 60000 });
        await this.expect(applicationformlocator.subdistrictOption).toBeEnabled({ timeout: 60000 });
        await applicationformlocator.subdistrictOption.click(); // เลือกตำบล
    }

    async currentaddress () {
        const applicationformlocator = applicationformLocator(this.page);

        await this.expect(applicationformlocator.currentaddressnow).toBeVisible({ timeout: 60000 });
        await this.expect(applicationformlocator.currentaddressnow).toBeEnabled({ timeout: 60000 });
        await applicationformlocator.currentaddressnow.click(); // คลิ๊กที่ช่องที่อยู่ปัจจุบัน
    }

    async confirmsaveapplicationform() {
        const applicationformlocator = applicationformLocator(this.page);

        await this.expect(applicationformlocator.confirmsaveapplicationform).toBeVisible({ timeout: 60000 }); // รอให้ปุ่มยืนยันข้อมูลปรากฏ
        await applicationformlocator.confirmsaveapplicationform.click(); // กดปุ่มยืนยันข้อมูล
        await this.expect(applicationformlocator.popupmessageconfirmsaveapplicationform).toBeVisible({ timeout: 60000 }); // รอให้ pop-up แจ้งเตือนยืนยันการสร้างใบเสนอราคาปรากฏ
        await this.expect(applicationformlocator.popupmessageconfirmsaveapplicationform).toBeVisible({ timeout: 60000 }); // รอให้ปุ่มยืนยันใน pop-up ปรากฏ
        await quotationLocator(this.page).savepopupmessageconfirmsavequotation.click(); // กดปุ่มยืนยันใน pop-up
        await this.expect(applicationformlocator.popupmessagesuccessapplicationform).toBeVisible({ timeout: 60000 }); // รอให้ pop-up แจ้งเตือนสร้างใบเสนอราคาเสร็จสิ้นปรากฏ
        await this.expect(applicationformlocator.popupmessagesuccessapplicationform).toBeVisible({ timeout: 60000 }); // รอให้ปุ่มปิด pop-up แจ้งเตือนสร้างใบเสนอราคาเสร็จสิ้นพร้อมใช้งาน
        // await quotationLocator(this.page).savepopupmessageconfirmsaveapplicationform.click(); // กดปุ่มปิด pop-up แจ้งเตือนสร้างใบเสนอราคาเสร็จสิ้น
    }

    async getrefnoapplicationform () {
        const applicationformlocator = applicationformLocator(this.page);

        await applicationformlocator.popuprefno.waitFor({ state: 'visible', timeout: 60000 }); // รอให้ pop-up หมายเลขอ้างอิงใบคำขอปรากฏ
        const refno = await applicationformlocator.popuprefno.textContent(); // ดึงข้อความจาก pop-up หมายเลขอ้างอิงใบคำขอ
        return refno ? refno.trim() : ''; // คืนค่าหมายเลขอ้างอิงใบคำขอ ถ้าไม่ว่าง
    }
}

module.exports = { applicationformSPLife };