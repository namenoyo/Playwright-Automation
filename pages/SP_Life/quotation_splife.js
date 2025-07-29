const { quotationLocator } = require('../../locators/SP_Life/splife.locators');
const { checkvalueExpected } = require('../../utils/check-value');
const { menuSPLife } = require('../../pages/SP_Life/menu_splife');
const { mainSPLife } = require('../../pages/SP_Life/main_splife');

class quotationSPLife {
    constructor(page, expect) {
        this.page = page;
        this.expect = expect;
        this.quatationlocator = quotationLocator(page);
    }

    async waitforquotationPageLoad() {
        // ตรวจสอบว่ามีการโหลดหน้า "สร้างใบเสนอราคา" หรือไม่
        await this.expect(this.page.locator('h4[class="MuiTypography-root quotation-title MuiTypography-h4"]', { hasText: 'สร้างใบเสนอราคา' })).toBeVisible({ timeout: 5000 });
    }

    async selectInsurancePlan(insurancename) {
        // รอให้หน้า "สร้างใบเสนอราคา" โหลด
        await this.page.waitForTimeout(500); // รอครึ่งวินาที
        // ดึงข้อมูล locator ใส่ในตัวแปรเพอื่ให้เรียกใช้ได้ง่ายขึ้น
        await this.expect(quotationLocator(this.page, insurancename).insurancePlan).toBeVisible({ timeout: 5000 });
        await quotationLocator(this.page, insurancename).insurancePlan.click();
    }

    async insuredInformation(idcard, titlename, name, surname, birthdate, cardexpiredate, mobileno) {
        await this.quatationlocator.idcard.click(); // คลิกที่ช่องกรอกเลขบัตรประชาชน
        await this.quatationlocator.idcard.fill(idcard); // กรอกเลขบัตรประชาชน
        // รอให้ปุ่มปรากฏและพร้อมใช้งาน (visible + enabled)
        await this.expect(this.quatationlocator.titlename).toBeVisible({ timeout: 5000 });
        await this.expect(this.quatationlocator.titlename).toBeEnabled({ timeout: 5000 });
        await this.quatationlocator.titlename.click(); // คลิกที่ช่องคำนำหน้า
        // รอให้ปุ่มปรากฏและพร้อมใช้งาน (visible + enabled)
        await this.expect(quotationLocator(this.page, '', titlename).titalnameOption).toBeVisible({ timeout: 5000 });
        await this.expect(quotationLocator(this.page, '', titlename).titalnameOption).toBeEnabled({ timeout: 5000 });
        await quotationLocator(this.page, '', titlename).titalnameOption.click(); // เลือกคำนำหน้า
        await this.quatationlocator.name.fill(name); // กรอกชื่อผู้เอาประกันภัย
        await this.quatationlocator.surname.fill(surname); // กรอกนามสกุลผู้เอาประกันภัย
        await this.quatationlocator.birthdate.fill(birthdate); // กรอกวันเกิดผู้เอาประกันภัย
        await this.quatationlocator.cardexpiredate.fill(cardexpiredate); // กรอกวันหมดอายุบัตรประชาชน
        await this.quatationlocator.mobileno.click(); // คลิกที่ช่องเบอร์โทรศัพท์
        await this.quatationlocator.mobileno.fill(mobileno); // กรอกเบอร์โทรศัพท์
    }

    async calculatepremiumandpaymentmode(insurancesum, coverageyear, expectedinsurancesum) {

        const checkvalueexpected = new checkvalueExpected(this.page, this.expect);
        const menusplife = new menuSPLife(this.page, this.expect);
        const mainsplife = new mainSPLife(this.page, this.expect);

        // if (this.quatationlocator.insurancesum.not.toHaveValue({ timeout: 5000 })) {
        //     await this.quatationlocator.insurancesum.fill(insurancesum); // กรอกจำนวนเงินเอาประกันภัย
        // } else {
        //     await this.quatationlocator.insurancesum.fill(insurancesum); // กรอกจำนวนเงินเอาประกันภัย
        // }

        // รอให้มีค่า default ขึ้นมาใน input
        await this.quatationlocator.insurancesum.click(); // คลิกที่ช่องกรอกจำนวนเงินเอาประกันภัย
        await this.expect(this.quatationlocator.insurancesum).not.toHaveValue('', { timeout: 5000 }); // รอจนค่าขึ้นมา (ไม่ใช่ค่าว่าง)
        await this.quatationlocator.insurancesum.fill(insurancesum); // กรอกจำนวนเงินเอาประกันภัย
        // รอให้มีค่า default ขึ้นมาใน input
        await this.quatationlocator.coverageyear.click(); // คลิกที่ช่องกรอกระยะเวลาคุ้มครอง
        await this.expect(this.quatationlocator.coverageyear).not.toHaveValue('', { timeout: 5000 }); // รอจนค่าขึ้นมา (ไม่ใช่ค่าว่าง)
        await this.quatationlocator.coverageyear.fill(coverageyear); // กรอกระยะเวลาคุ้มครอง
        // รอให้ปุ่มปรากฏและพร้อมใช้งาน (visible + enabled)
        await this.expect(this.quatationlocator.calisurance).toBeVisible({ timeout: 5000 });
        await this.expect(this.quatationlocator.calisurance).toBeEnabled({ timeout: 5000 });
        await this.quatationlocator.calisurance.click(); // กดปุ่มคำนวณเบี้ย
        // รอให้มีการคำนวณเบี้ยประกันภัย
        await this.page.waitForTimeout(500); // รอครึ่งวินาที

        let popupmessage = '';

        if (await this.quatationlocator.popupAlert.isVisible({ timeout: 5000 })) {
            // ถ้า pop-up แจ้งเตือนปรากฏขึ้น ให้ดึงข้อความใน pop-up
            popupmessage = await this.quatationlocator.popupAlert.innerText();

            // ถ้ามี pop-up แจ้งเตือน ให้ปิด pop-up
            await this.quatationlocator.closePopupButton.click();
        }

        const checkvalue = await checkvalueexpected.checkvalueOnscreen_GoogleSheet_calSPlife(this.quatationlocator.totalinsurancepremium, expectedinsurancesum);

        await menusplife.menuSPLife('สร้างใบเสนอราคา'); // กลับไปที่หน้า "สร้างใบเสนอราคา"
        await menusplife.menuSPLife('หน้าหลัก'); // กลับไปที่หน้า "หน้าหลัก"
        await mainsplife.clickcreateQuotation(); // กดปุ่ม "สร้างใบเสนอราคา" เพื่อเริ่มใหม่
        await this.waitforquotationPageLoad(); // รอหน้า "สร้างใบเสนอราคา" โหลดใหม่

        return { checkvalue, popupmessage }
    }
}

module.exports = { quotationSPLife };