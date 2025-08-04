const { quotationLocator } = require('../../locators/SP_Life/splife.locators');
const { checkvalueExpected } = require('../../utils/check-value');
const { menuSPLife } = require('../../pages/SP_Life/menu_splife');
const { mainSPLife } = require('../../pages/SP_Life/main_splife');
const { LogoutPage } = require('../../pages/logout.page');
const { LoginPageSPLife } = require('../../pages/login_t.page');
const { popupAlert } = require('../../utils/common');

class quotationSPLife {
    constructor(page, expect) {
        this.page = page;
        this.expect = expect;
        this.quatationlocator = quotationLocator(page);
    }

    async waitforquotationPageLoad() {
        // ตรวจสอบว่ามีการโหลดหน้า "สร้างใบเสนอราคา" หรือไม่
        await this.expect(this.page.locator('h4[class="MuiTypography-root quotation-title MuiTypography-h4"]', { hasText: 'สร้างใบเสนอราคา' })).toBeVisible({ timeout: 60000 });
    }

    async selectInsurancePlan(insurancename) {
        const popupalert = new popupAlert(this.page);

        let popupmessage = '';
        let popuparray = [];

        // รอให้หน้า "สร้างใบเสนอราคา" โหลด
        await this.page.waitForTimeout(500); // รอครึ่งวินาที

        // // สำหรับทดสอบกรณี error
        // await this.page.locator('span', { hasText: 'ย้อนกลับ' }).click();

        // ดึงข้อมูล locator ใส่ในตัวแปรเพอื่ให้เรียกใช้ได้ง่ายขึ้น
        await this.expect(quotationLocator(this.page, insurancename).insurancePlan).toBeVisible({ timeout: 60000 });
        await quotationLocator(this.page, insurancename).insurancePlan.click();
        popupmessage = await popupalert.popupAlertMessage(); // ดึงข้อความใน pop-up แจ้งเตือน (ถ้ามี)
        popuparray.push(popupmessage.popupmessage); // เก็บข้อความ pop-up แจ้งเตือน (ถ้ามี)

        return { popuparray };
    }

    async insuredInformation(idcard, titlename, name, surname, birthdate, cardexpiredate, mobileno) {

        const popupalert = new popupAlert(this.page);

        let popupmessage = '';
        let popuparray = [];

        // เลขประจำตัวประชาชน/หนังสือเดินทาง
        await this.quatationlocator.idcard.click(); // คลิกที่ช่องกรอกเลขบัตรประชาชน
        // await this.quatationlocator.idcard.fill(idcard); // กรอกเลขบัตรประชาชน
        await this.page.keyboard.press('Control+A');
        await this.page.keyboard.press('Backspace');
        await this.page.keyboard.type(idcard, { delay: 100 });
        popupmessage = await popupalert.popupAlertMessage(); // ดึงข้อความใน pop-up แจ้งเตือน (ถ้ามี)
        popuparray.push(popupmessage.popupmessage); // เก็บข้อความ pop-up แจ้งเตือน (ถ้ามี)

        // คำนำหน้า
        // รอให้ปุ่มปรากฏและพร้อมใช้งาน (visible + enabled)
        await this.expect(this.quatationlocator.titlename).toBeVisible({ timeout: 60000 });
        await this.expect(this.quatationlocator.titlename).toBeEnabled({ timeout: 60000 });
        await this.quatationlocator.titlename.click(); // คลิกที่ช่องคำนำหน้า
        popupmessage = await popupalert.popupAlertMessage(); // ดึงข้อความใน pop-up แจ้งเตือน (ถ้ามี)
        popuparray.push(popupmessage.popupmessage); // เก็บข้อความ pop-up แจ้งเตือน (ถ้ามี)
        // รอให้ปุ่มปรากฏและพร้อมใช้งาน (visible + enabled)
        await this.expect(quotationLocator(this.page, '', titlename).titalnameOption).toBeVisible({ timeout: 60000 });
        await this.expect(quotationLocator(this.page, '', titlename).titalnameOption).toBeEnabled({ timeout: 60000 });
        await quotationLocator(this.page, '', titlename).titalnameOption.click(); // เลือกคำนำหน้า
        popupmessage = await popupalert.popupAlertMessage(); // ดึงข้อความใน pop-up แจ้งเตือน (ถ้ามี)
        popuparray.push(popupmessage.popupmessage); // เก็บข้อความ pop-up แจ้งเตือน (ถ้ามี)

        // ชื่อผู้เอาประกัน
        await this.quatationlocator.name.click();
        // await this.quatationlocator.name.fill(name); // กรอกชื่อผู้เอาประกันภัย
        await this.page.keyboard.press('Control+A');
        await this.page.keyboard.press('Backspace');
        await this.page.keyboard.type(name, { delay: 100 });
        popupmessage = await popupalert.popupAlertMessage(); // ดึงข้อความใน pop-up แจ้งเตือน (ถ้ามี)
        popuparray.push(popupmessage.popupmessage); // เก็บข้อความ pop-up แจ้งเตือน (ถ้ามี)

        // นามสกุลผู้เอาประกัน
        await this.quatationlocator.surname.click();
        // await this.quatationlocator.surname.fill(surname); // กรอกนามสกุลผู้เอาประกันภัย
        await this.page.keyboard.press('Control+A');
        await this.page.keyboard.press('Backspace');
        await this.page.keyboard.type(surname, { delay: 100 });
        popupmessage = await popupalert.popupAlertMessage(); // ดึงข้อความใน pop-up แจ้งเตือน (ถ้ามี)
        popuparray.push(popupmessage.popupmessage); // เก็บข้อความ pop-up แจ้งเตือน (ถ้ามี)

        // วัน/เดือน/ปี เกิด
        await this.quatationlocator.birthdate.click();
        // await this.quatationlocator.birthdate.fill(birthdate); // กรอกวันเกิดผู้เอาประกันภัย
        await this.page.keyboard.press('Control+A');
        await this.page.keyboard.press('Backspace');
        await this.page.keyboard.type(birthdate, { delay: 100 });
        popupmessage = await popupalert.popupAlertMessage(); // ดึงข้อความใน pop-up แจ้งเตือน (ถ้ามี)
        popuparray.push(popupmessage.popupmessage); // เก็บข้อความ pop-up แจ้งเตือน (ถ้ามี)

        // วันหมดอายุ
        await this.quatationlocator.cardexpiredate.click();
        // await this.quatationlocator.cardexpiredate.fill(cardexpiredate); // กรอกวันหมดอายุบัตรประชาชน
        await this.page.keyboard.press('Control+A');
        await this.page.keyboard.press('Backspace');
        await this.page.keyboard.type(cardexpiredate, { delay: 100 });
        popupmessage = await popupalert.popupAlertMessage(); // ดึงข้อความใน pop-up แจ้งเตือน (ถ้ามี)
        popuparray.push(popupmessage.popupmessage); // เก็บข้อความ pop-up แจ้งเตือน (ถ้ามี)

        // โทรศัพท์มือถือ(ระบุเฉพาะตัวเลข)
        await this.quatationlocator.mobileno.click(); // คลิกที่ช่องเบอร์โทรศัพท์
        popupmessage = await popupalert.popupAlertMessage(); // ดึงข้อความใน pop-up แจ้งเตือน (ถ้ามี)
        popuparray.push(popupmessage.popupmessage); // เก็บข้อความ pop-up แจ้งเตือน (ถ้ามี)
        await this.quatationlocator.mobileno.click();
        // await this.quatationlocator.mobileno.fill(mobileno); // กรอกเบอร์โทรศัพท์
        await this.page.keyboard.press('Control+A');
        await this.page.keyboard.press('Backspace');
        await this.page.keyboard.type(mobileno, { delay: 100 });
        popupmessage = await popupalert.popupAlertMessage(); // ดึงข้อความใน pop-up แจ้งเตือน (ถ้ามี)
        popuparray.push(popupmessage.popupmessage); // เก็บข้อความ pop-up แจ้งเตือน (ถ้ามี)

        return { popuparray };
    }

    async calculatepremiumandpaymentmode(insurancesum, coverageyear, expectedinsurancesum, rowdata) {

        let popupmessage = '';
        let popuparray = [];

        const popupalert = new popupAlert(this.page);

        const checkvalueexpected = new checkvalueExpected(this.page, this.expect);
        const menusplife = new menuSPLife(this.page, this.expect);
        const mainsplife = new mainSPLife(this.page, this.expect);

        const logout = new LogoutPage(this.page, this.expect);
        const loginpagesplife = new LoginPageSPLife(this.page);

        let checkvalueinsurancesum = '';
        try {
            // พยายามรอให้ element มีค่า (ถ้ามี)
            checkvalueinsurancesum = await this.quatationlocator.insurancesum.inputValue(); // ดึงค่าจำนวนเงินเอาประกันภัยจาก input
        } catch (e) {
            console.log('⏱️ ไม่มีค่าใน timeout ที่กำหนด');
        }
        if (checkvalueinsurancesum === '') {
            await this.quatationlocator.insurancesum.click(); // คลิกที่ช่องกรอกจำนวนเงินเอาประกันภัย

            // await this.quatationlocator.insurancesum.fill(insurancesum); // กรอกจำนวนเงินเอาประกันภัย
            // เคลียร์ค่าใน input
            await this.page.keyboard.press('Control+A');
            await this.page.keyboard.press('Backspace');
            await this.page.keyboard.type(insurancesum, { delay: 100 });

            popupmessage = await popupalert.popupAlertMessage(); // ดึงข้อความใน pop-up แจ้งเตือน (ถ้ามี)
            popuparray.push(popupmessage.popupmessage); // เก็บข้อความ pop-up แจ้งเตือน (ถ้ามี)
            // ทำอย่างอื่นต่อได้เลย
        } else {
            await this.expect(this.quatationlocator.insurancesum).not.toHaveValue('', { timeout: 60000 }); // รอจนค่าขึ้นมา (ไม่ใช่ค่าว่าง)
            await this.quatationlocator.insurancesum.click(); // คลิกที่ช่องกรอกจำนวนเงินเอาประกันภัย

            // await this.quatationlocator.insurancesum.fill(insurancesum); // กรอกจำนวนเงินเอาประกันภัย
            // เคลียร์ค่าใน input
            await this.page.keyboard.press('Control+A');
            await this.page.keyboard.press('Backspace');
            await this.page.keyboard.type(insurancesum, { delay: 100 });

            popupmessage = await popupalert.popupAlertMessage(); // ดึงข้อความใน pop-up แจ้งเตือน (ถ้ามี)
            popuparray.push(popupmessage.popupmessage); // เก็บข้อความ pop-up แจ้งเตือน (ถ้ามี)
        }
        // // รอให้มีค่า default ขึ้นมาใน input
        // await this.quatationlocator.insurancesum.click(); // คลิกที่ช่องกรอกจำนวนเงินเอาประกันภัย
        // await this.expect(this.quatationlocator.insurancesum).not.toHaveValue('', { timeout: 60000 }); // รอจนค่าขึ้นมา (ไม่ใช่ค่าว่าง)
        // await this.quatationlocator.insurancesum.fill(insurancesum); // กรอกจำนวนเงินเอาประกันภัย


        let checkvaluecoverageyear = '';
        try {
            // พยายามรอให้ element มีค่า (ถ้ามี)
            checkvaluecoverageyear = await this.quatationlocator.coverageyear.inputValue(); // ดึงค่าจำนวนเงินเอาประกันภัยจาก input
        } catch (e) {
            console.log('⏱️ ไม่มีค่าใน timeout ที่กำหนด');
        }
        if (checkvaluecoverageyear === '') {
            await this.quatationlocator.coverageyear.click(); // คลิกที่ช่องกรอกระยะเวลาคุ้มครอง

            // await this.quatationlocator.coverageyear.fill(coverageyear); // กรอกจำนวนเงินเอาประกันภัย
            // เคลียร์ค่าใน input
            await this.page.keyboard.press('Control+A');
            await this.page.keyboard.press('Backspace');
            await this.page.keyboard.type(coverageyear, { delay: 100 });


            popupmessage = await popupalert.popupAlertMessage(); // ดึงข้อความใน pop-up แจ้งเตือน (ถ้ามี)
            popuparray.push(popupmessage.popupmessage); // เก็บข้อความ pop-up แจ้งเตือน (ถ้ามี)
            // ทำอย่างอื่นต่อได้เลย
        } else {
            await this.expect(this.quatationlocator.coverageyear).not.toHaveValue('', { timeout: 60000 }); // รอจนค่าขึ้นมา (ไม่ใช่ค่าว่าง)
            await this.quatationlocator.coverageyear.click(); // คลิกที่ช่องกรอกระยะเวลาคุ้มครอง

            // await this.quatationlocator.coverageyear.fill(coverageyear); // กรอกจำนวนเงินเอาประกันภัย
            // เคลียร์ค่าใน input
            await this.page.keyboard.press('Control+A');
            await this.page.keyboard.press('Backspace');
            await this.page.keyboard.type(coverageyear, { delay: 100 });


            popupmessage = await popupalert.popupAlertMessage(); // ดึงข้อความใน pop-up แจ้งเตือน (ถ้ามี)
            popuparray.push(popupmessage.popupmessage); // เก็บข้อความ pop-up แจ้งเตือน (ถ้ามี)
        }
        // // รอให้มีค่า default ขึ้นมาใน input
        // await this.quatationlocator.coverageyear.click(); // คลิกที่ช่องกรอกระยะเวลาคุ้มครอง
        // await this.expect(this.quatationlocator.coverageyear).not.toHaveValue('', { timeout: 60000 }); // รอจนค่าขึ้นมา (ไม่ใช่ค่าว่าง)
        // await this.quatationlocator.coverageyear.fill(coverageyear); // กรอกระยะเวลาคุ้มครอง


        // รอให้ปุ่มปรากฏและพร้อมใช้งาน (visible + enabled)
        await this.expect(this.quatationlocator.calisurance).toBeVisible({ timeout: 60000 });
        await this.expect(this.quatationlocator.calisurance).toBeEnabled({ timeout: 60000 });
        await this.quatationlocator.calisurance.click(); // กดปุ่มคำนวณเบี้ย
        // รอให้มีการคำนวณเบี้ยประกันภัย
        await this.page.waitForTimeout(500); // รอครึ่งวินาที
        popupmessage = await popupalert.popupAlertMessage(); // ดึงข้อความใน pop-up แจ้งเตือน (ถ้ามี)
        popuparray.push(popupmessage.popupmessage); // เก็บข้อความ pop-up แจ้งเตือน (ถ้ามี)

        // let popupmessage = '';

        // if (await this.quatationlocator.popupAlert.isVisible({ timeout: 60000 })) {
        //     // ถ้า pop-up แจ้งเตือนปรากฏขึ้น ให้ดึงข้อความใน pop-up
        //     popupmessage = await this.quatationlocator.popupAlert.innerText();

        //     // ถ้ามี pop-up แจ้งเตือน ให้ปิด pop-up
        //     await this.quatationlocator.closePopupButton.click();
        // }

        const checkvalue = await checkvalueexpected.checkvalueOnscreen_GoogleSheet_calSPlife(this.quatationlocator.totalinsurancepremium, expectedinsurancesum, '', rowdata);

        // await menusplife.menuSPLife('สร้างใบเสนอราคา'); // กลับไปที่หน้า "สร้างใบเสนอราคา"
        // await menusplife.menuSPLife('หน้าหลัก'); // กลับไปที่หน้า "หน้าหลัก"
        // await mainsplife.clickcreateQuotation(); // กดปุ่ม "สร้างใบเสนอราคา" เพื่อเริ่มใหม่
        // await this.waitforquotationPageLoad(); // รอหน้า "สร้างใบเสนอราคา" โหลดใหม่

        // await logout.logoutSPLife(); // ออกจากระบบ

        // // Wait for the page to load completely
        // await this.page.waitForLoadState('networkidle');
        // // กรอก username และ password
        // await loginpagesplife.login(username, password);
        // // Wait for the page to load completely
        // await this.page.waitForLoadState('networkidle');
        // // // กดเมนูหลัก
        // // await menusplife.menuSPLife('รายงานการทำประกันชีวิต');
        // // กดปุ่ม สร้างใบเสนอราคา
        // await mainsplife.clickcreateQuotation();
        // // รอหน้า "สร้างใบเสนอราคา" โหลด
        // await this.waitforquotationPageLoad();


        return { checkvalue, popuparray };
    }
}

module.exports = { quotationSPLife };