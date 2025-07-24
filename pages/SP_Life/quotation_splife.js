const { quotationLocator } = require('../../locators/SP_Life/splife.locators');
const { checkvalueExpected } = require('../../utils/check-value');
const { split_total_unit } = require('../../utils/common');

class quotationSPLife {
    constructor(page, expect) {
        this.page = page;
        this.expect = expect;
        this.quatationlocator = quotationLocator(page);
    }

    async waitforquotationPageLoad() {
        // ตรวจสอบว่ามีการโหลดหน้า "สร้างใบเสนอราคา" หรือไม่
        await this.expect(this.page.locator('h4[class="MuiTypography-root quotation-title MuiTypography-h4"]', { hasText: 'สร้างใบเสนอราคา' })).toBeVisible();
    }

    async selectInsurancePlan(insurancename) {
        // ดึงข้อมูล locator ใส่ในตัวแปรเพอื่ให้เรียกใช้ได้ง่ายขึ้น
        await this.expect(quotationLocator(this.page, insurancename).insurancePlan).toBeVisible();
        await quotationLocator(this.page, insurancename).insurancePlan.click();
    }

    async insuredInformation(idcard, titlename, name, surname, birthdate, cardexpiredate, mobileno) {
        await this.quatationlocator.idcard.fill(idcard); // กรอกเลขบัตรประชาชน
        await this.quatationlocator.titlename.click(); // คลิกที่ช่องคำนำหน้า
        await quotationLocator(this.page, '', titlename).titalnameOption.click(); // เลือกคำนำหน้า
        await this.quatationlocator.name.fill(name); // กรอกชื่อผู้เอาประกันภัย
        await this.quatationlocator.surname.fill(surname); // กรอกนามสกุลผู้เอาประกันภัย
        await this.quatationlocator.birthdate.fill(birthdate); // กรอกวันเกิดผู้เอาประกันภัย
        await this.quatationlocator.cardexpiredate.fill(cardexpiredate); // กรอกวันหมดอายุบัตรประชาชน
        await this.quatationlocator.mobileno.fill(mobileno); // กรอกเบอร์โทรศัพท์
    }

    async calculatepremiumandpaymentmode(insurancesum, coverageyear, expectedinsurancesum) {
        
        const checkvalueexpected = new checkvalueExpected(this.page, this.expect);

        await this.quatationlocator.insurancesum.fill(insurancesum); // กรอกจำนวนเงินเอาประกันภัย
        await this.quatationlocator.coverageyear.fill(coverageyear); // กรอกระยะเวลาคุ้มครอง
        await this.quatationlocator.calisurance.click(); // กดปุ่มคำนวณเบี้ย
        // รอให้มีการคำนวณเบี้ยประกันภัย
        await this.page.waitForTimeout(1000); // รอ 1 วินาที

        await checkvalueexpected.checkvalueOnscreen_GoogleSheet_calSPlife(this.quatationlocator.totalinsurancepremium, expectedinsurancesum);

        
    }
}

module.exports = { quotationSPLife };