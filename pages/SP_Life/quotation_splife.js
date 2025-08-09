const { quotationLocator } = require('../../locators/SP_Life/splife.locators');
const { checkvalueExpected } = require('../../utils/check-value');
const { popupAlert } = require('../../utils/common');

class quotationSPLife {
    constructor(page, expect) {
        this.page = page;
        this.expect = expect;
    }

    async waitforquotationPageLoad() {
        // ตรวจสอบว่ามีการโหลดหน้า "สร้างใบเสนอราคา" หรือไม่
        await this.expect(this.page.locator('h4[class="MuiTypography-root quotation-title MuiTypography-h4"]', { hasText: 'สร้างใบเสนอราคา' })).toBeVisible({ timeout: 60000 });
    }

    async insurancebrokerinformation(insuranceBroker) {
        await this.expect(quotationLocator(this.page).insurancebroker).toBeVisible({ timeout: 60000 }); // รอให้ปุ่มรายชื่อนายหน้าประกันชีวิตปรากฏ
        await quotationLocator(this.page).insurancebroker.click(); // คลิกที่ปุ่มรายชื่อนายหน้าประกันชีวิต
        await this.page.keyboard.press('Control+A');
        await this.page.keyboard.press('Backspace');
        await this.page.keyboard.type(insuranceBroker, { delay: 100 });
        await this.expect(quotationLocator(this.page, '', '', insuranceBroker).insurancebrokerOption).toBeVisible({ timeout: 60000 }); // รอให้ตัวเลือกนายหน้าปรากฏ
        await quotationLocator(this.page, '', '', insuranceBroker).insurancebrokerOption.click(); // คลิกที่ตัวเลือกนายหน้า
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
        await quotationLocator(this.page).idcard.click(); // คลิกที่ช่องกรอกเลขบัตรประชาชน
        // await quotationLocator(this.page).idcard.fill(idcard); // กรอกเลขบัตรประชาชน
        await this.page.keyboard.press('Control+A');
        await this.page.keyboard.press('Backspace');
        await this.page.keyboard.type(idcard, { delay: 100 });
        popupmessage = await popupalert.popupAlertMessage(); // ดึงข้อความใน pop-up แจ้งเตือน (ถ้ามี)
        popuparray.push(popupmessage.popupmessage); // เก็บข้อความ pop-up แจ้งเตือน (ถ้ามี)

        // คำนำหน้า
        // รอให้ปุ่มปรากฏและพร้อมใช้งาน (visible + enabled)
        await this.expect(quotationLocator(this.page).titlename).toBeVisible({ timeout: 60000 });
        await this.expect(quotationLocator(this.page).titlename).toBeEnabled({ timeout: 60000 });
        await quotationLocator(this.page).titlename.click(); // คลิกที่ช่องคำนำหน้า
        popupmessage = await popupalert.popupAlertMessage(); // ดึงข้อความใน pop-up แจ้งเตือน (ถ้ามี)
        popuparray.push(popupmessage.popupmessage); // เก็บข้อความ pop-up แจ้งเตือน (ถ้ามี)
        // รอให้ปุ่มปรากฏและพร้อมใช้งาน (visible + enabled)
        await this.expect(quotationLocator(this.page, '', titlename).titalnameOption).toBeVisible({ timeout: 60000 });
        await this.expect(quotationLocator(this.page, '', titlename).titalnameOption).toBeEnabled({ timeout: 60000 });
        await quotationLocator(this.page, '', titlename).titalnameOption.click(); // เลือกคำนำหน้า
        popupmessage = await popupalert.popupAlertMessage(); // ดึงข้อความใน pop-up แจ้งเตือน (ถ้ามี)
        popuparray.push(popupmessage.popupmessage); // เก็บข้อความ pop-up แจ้งเตือน (ถ้ามี)

        // ชื่อผู้เอาประกัน
        await quotationLocator(this.page).name.click();
        // await quotationLocator(this.page).name.fill(name); // กรอกชื่อผู้เอาประกันภัย
        await this.page.keyboard.press('Control+A');
        await this.page.keyboard.press('Backspace');
        await this.page.keyboard.type(name, { delay: 100 });
        popupmessage = await popupalert.popupAlertMessage(); // ดึงข้อความใน pop-up แจ้งเตือน (ถ้ามี)
        popuparray.push(popupmessage.popupmessage); // เก็บข้อความ pop-up แจ้งเตือน (ถ้ามี)

        // นามสกุลผู้เอาประกัน
        await quotationLocator(this.page).surname.click();
        // await quotationLocator(this.page).surname.fill(surname); // กรอกนามสกุลผู้เอาประกันภัย
        await this.page.keyboard.press('Control+A');
        await this.page.keyboard.press('Backspace');
        await this.page.keyboard.type(surname, { delay: 100 });
        popupmessage = await popupalert.popupAlertMessage(); // ดึงข้อความใน pop-up แจ้งเตือน (ถ้ามี)
        popuparray.push(popupmessage.popupmessage); // เก็บข้อความ pop-up แจ้งเตือน (ถ้ามี)

        // วัน/เดือน/ปี เกิด
        await quotationLocator(this.page).birthdate.click();
        // await quotationLocator(this.page).birthdate.fill(birthdate); // กรอกวันเกิดผู้เอาประกันภัย
        await this.page.keyboard.press('Control+A');
        await this.page.keyboard.press('Backspace');
        await this.page.keyboard.type(birthdate, { delay: 100 });
        popupmessage = await popupalert.popupAlertMessage(); // ดึงข้อความใน pop-up แจ้งเตือน (ถ้ามี)
        popuparray.push(popupmessage.popupmessage); // เก็บข้อความ pop-up แจ้งเตือน (ถ้ามี)

        // วันหมดอายุ
        await quotationLocator(this.page).cardexpiredate.click();
        // await quotationLocator(this.page).cardexpiredate.fill(cardexpiredate); // กรอกวันหมดอายุบัตรประชาชน
        await this.page.keyboard.press('Control+A');
        await this.page.keyboard.press('Backspace');
        await this.page.keyboard.type(cardexpiredate, { delay: 100 });
        popupmessage = await popupalert.popupAlertMessage(); // ดึงข้อความใน pop-up แจ้งเตือน (ถ้ามี)
        popuparray.push(popupmessage.popupmessage); // เก็บข้อความ pop-up แจ้งเตือน (ถ้ามี)

        // โทรศัพท์มือถือ(ระบุเฉพาะตัวเลข)
        await quotationLocator(this.page).mobileno.click(); // คลิกที่ช่องเบอร์โทรศัพท์
        popupmessage = await popupalert.popupAlertMessage(); // ดึงข้อความใน pop-up แจ้งเตือน (ถ้ามี)
        popuparray.push(popupmessage.popupmessage); // เก็บข้อความ pop-up แจ้งเตือน (ถ้ามี)
        await quotationLocator(this.page).mobileno.click();
        // await quotationLocator(this.page).mobileno.fill(mobileno); // กรอกเบอร์โทรศัพท์
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

        let checkvalueinsurancesum = '';
        try {
            // พยายามรอให้ element มีค่า (ถ้ามี)
            checkvalueinsurancesum = await quotationLocator(this.page).insurancesum.inputValue(); // ดึงค่าจำนวนเงินเอาประกันภัยจาก input
        } catch (e) {
            console.log('⏱️ ไม่มีค่าใน timeout ที่กำหนด');
        }
        if (checkvalueinsurancesum === '') {
            await quotationLocator(this.page).insurancesum.click(); // คลิกที่ช่องกรอกจำนวนเงินเอาประกันภัย

            // await quotationLocator(this.page).insurancesum.fill(insurancesum); // กรอกจำนวนเงินเอาประกันภัย
            // เคลียร์ค่าใน input
            await this.page.keyboard.press('Control+A');
            await this.page.keyboard.press('Backspace');
            await this.page.keyboard.type(insurancesum, { delay: 100 });

            popupmessage = await popupalert.popupAlertMessage(); // ดึงข้อความใน pop-up แจ้งเตือน (ถ้ามี)
            popuparray.push(popupmessage.popupmessage); // เก็บข้อความ pop-up แจ้งเตือน (ถ้ามี)
            // ทำอย่างอื่นต่อได้เลย
        } else {
            await this.expect(quotationLocator(this.page).insurancesum).not.toHaveValue('', { timeout: 60000 }); // รอจนค่าขึ้นมา (ไม่ใช่ค่าว่าง)
            await quotationLocator(this.page).insurancesum.click(); // คลิกที่ช่องกรอกจำนวนเงินเอาประกันภัย

            // await quotationLocator(this.page).insurancesum.fill(insurancesum); // กรอกจำนวนเงินเอาประกันภัย
            // เคลียร์ค่าใน input
            await this.page.keyboard.press('Control+A');
            await this.page.keyboard.press('Backspace');
            await this.page.keyboard.type(insurancesum, { delay: 100 });

            popupmessage = await popupalert.popupAlertMessage(); // ดึงข้อความใน pop-up แจ้งเตือน (ถ้ามี)
            popuparray.push(popupmessage.popupmessage); // เก็บข้อความ pop-up แจ้งเตือน (ถ้ามี)
        }
        
        let checkvaluecoverageyear = '';

        // loop ให้ค่าที่ input ระยะเวลาความคุ้มครอง ตรงกับ coverageyear
        while (checkvaluecoverageyear !== coverageyear) {
            try {
                // พยายามรอให้ element มีค่า (ถ้ามี)
                checkvaluecoverageyear = await quotationLocator(this.page).coverageyear.inputValue(); // ดึงค่าจำนวนระยะเวลาความคุ้มครองจาก input
            } catch (e) {
                console.log('⏱️ ไม่มีค่าใน timeout ที่กำหนด');
            }
            if (checkvaluecoverageyear === '') {
                await quotationLocator(this.page).coverageyear.click(); // คลิกที่ช่องกรอกระยะเวลาคุ้มครอง

                // await quotationLocator(this.page).coverageyear.fill(coverageyear); // กรอกจำนวนระยะเวลาความคุ้มครอง
                // เคลียร์ค่าใน input
                await this.page.keyboard.press('Control+A');
                await this.page.keyboard.press('Backspace');
                await this.page.keyboard.type(coverageyear, { delay: 100 });

                // เพิ่มหน่วงเวลารอค่า input เก็บค่าล่าสุด
                await this.page.waitForTimeout(500);

                popupmessage = await popupalert.popupAlertMessage(); // ดึงข้อความใน pop-up แจ้งเตือน (ถ้ามี)
                popuparray.push(popupmessage.popupmessage); // เก็บข้อความ pop-up แจ้งเตือน (ถ้ามี)
                checkvaluecoverageyear = await quotationLocator(this.page).coverageyear.inputValue(); // ดึงค่าจำนวนระยะเวลาความคุ้มครองจาก input
            } else {
                await this.expect(quotationLocator(this.page).coverageyear).not.toHaveValue('', { timeout: 60000 }); // รอจนค่าขึ้นมา (ไม่ใช่ค่าว่าง)
                await quotationLocator(this.page).coverageyear.click(); // คลิกที่ช่องกรอกระยะเวลาคุ้มครอง

                // await quotationLocator(this.page).coverageyear.fill(coverageyear); // กรอกจำนวนระยะเวลาความคุ้มครอง
                // เคลียร์ค่าใน input
                await this.page.keyboard.press('Control+A');
                await this.page.keyboard.press('Backspace');
                await this.page.keyboard.type(coverageyear, { delay: 100 });

                // เพิ่มหน่วงเวลารอค่า input เก็บค่าล่าสุด
                await this.page.waitForTimeout(500);

                popupmessage = await popupalert.popupAlertMessage(); // ดึงข้อความใน pop-up แจ้งเตือน (ถ้ามี)
                popuparray.push(popupmessage.popupmessage); // เก็บข้อความ pop-up แจ้งเตือน (ถ้ามี)
                checkvaluecoverageyear = await quotationLocator(this.page).coverageyear.inputValue(); // ดึงค่าจำนวนระยะเวลาความคุ้มครองจาก input
            }
        }

        // รอให้ปุ่มปรากฏและพร้อมใช้งาน (visible + enabled)
        await this.expect(quotationLocator(this.page).calisurance).toBeVisible({ timeout: 60000 });
        await this.expect(quotationLocator(this.page).calisurance).toBeEnabled({ timeout: 60000 });
        await quotationLocator(this.page).calisurance.click(); // กดปุ่มคำนวณเบี้ย
        // รอให้มีการคำนวณเบี้ยประกันภัย
        await this.page.waitForTimeout(500); // รอครึ่งวินาที
        popupmessage = await popupalert.popupAlertMessage(); // ดึงข้อความใน pop-up แจ้งเตือน (ถ้ามี)
        popuparray.push(popupmessage.popupmessage); // เก็บข้อความ pop-up แจ้งเตือน (ถ้ามี)

        // check ค่าของ เบี้ยประกัน
        const checkvalue = await checkvalueexpected.checkvalueOnscreen_GoogleSheet_calSPlife(quotationLocator(this.page).totalinsurancepremium, expectedinsurancesum, '', rowdata);

        return { checkvalue, popuparray };
    }

    async premiumandpaymentmode(insurancesum, coverageyear) {

        let popupmessage = '';
        let popuparray = [];

        const popupalert = new popupAlert(this.page);

        let checkvalueinsurancesum = '';
        try {
            // พยายามรอให้ element มีค่า (ถ้ามี)
            checkvalueinsurancesum = await quotationLocator(this.page).insurancesum.inputValue(); // ดึงค่าจำนวนเงินเอาประกันภัยจาก input
        } catch (e) {
            console.log('⏱️ ไม่มีค่าใน timeout ที่กำหนด');
        }
        if (checkvalueinsurancesum === '') {
            await quotationLocator(this.page).insurancesum.click(); // คลิกที่ช่องกรอกจำนวนเงินเอาประกันภัย

            // await quotationLocator(this.page).insurancesum.fill(insurancesum); // กรอกจำนวนเงินเอาประกันภัย
            // เคลียร์ค่าใน input
            await this.page.keyboard.press('Control+A');
            await this.page.keyboard.press('Backspace');
            await this.page.keyboard.type(insurancesum, { delay: 100 });

            popupmessage = await popupalert.popupAlertMessage(); // ดึงข้อความใน pop-up แจ้งเตือน (ถ้ามี)
            popuparray.push(popupmessage.popupmessage); // เก็บข้อความ pop-up แจ้งเตือน (ถ้ามี)
            // ทำอย่างอื่นต่อได้เลย
        } else {
            await this.expect(quotationLocator(this.page).insurancesum).not.toHaveValue('', { timeout: 60000 }); // รอจนค่าขึ้นมา (ไม่ใช่ค่าว่าง)
            await quotationLocator(this.page).insurancesum.click(); // คลิกที่ช่องกรอกจำนวนเงินเอาประกันภัย

            // await quotationLocator(this.page).insurancesum.fill(insurancesum); // กรอกจำนวนเงินเอาประกันภัย
            // เคลียร์ค่าใน input
            await this.page.keyboard.press('Control+A');
            await this.page.keyboard.press('Backspace');
            await this.page.keyboard.type(insurancesum, { delay: 100 });

            popupmessage = await popupalert.popupAlertMessage(); // ดึงข้อความใน pop-up แจ้งเตือน (ถ้ามี)
            popuparray.push(popupmessage.popupmessage); // เก็บข้อความ pop-up แจ้งเตือน (ถ้ามี)
        }
        
        let checkvaluecoverageyear = '';

        // loop ให้ค่าที่ input ระยะเวลาความคุ้มครอง ตรงกับ coverageyear
        while (checkvaluecoverageyear !== coverageyear) {
            try {
                // พยายามรอให้ element มีค่า (ถ้ามี)
                checkvaluecoverageyear = await quotationLocator(this.page).coverageyear.inputValue(); // ดึงค่าจำนวนระยะเวลาความคุ้มครองจาก input
            } catch (e) {
                console.log('⏱️ ไม่มีค่าใน timeout ที่กำหนด');
            }
            if (checkvaluecoverageyear === '') {
                await quotationLocator(this.page).coverageyear.click(); // คลิกที่ช่องกรอกระยะเวลาคุ้มครอง

                // await quotationLocator(this.page).coverageyear.fill(coverageyear); // กรอกจำนวนระยะเวลาความคุ้มครอง
                // เคลียร์ค่าใน input
                await this.page.keyboard.press('Control+A');
                await this.page.keyboard.press('Backspace');
                await this.page.keyboard.type(coverageyear, { delay: 100 });

                // เพิ่มหน่วงเวลารอค่า input เก็บค่าล่าสุด
                await this.page.waitForTimeout(500);

                popupmessage = await popupalert.popupAlertMessage(); // ดึงข้อความใน pop-up แจ้งเตือน (ถ้ามี)
                popuparray.push(popupmessage.popupmessage); // เก็บข้อความ pop-up แจ้งเตือน (ถ้ามี)
                checkvaluecoverageyear = await quotationLocator(this.page).coverageyear.inputValue(); // ดึงค่าจำนวนระยะเวลาความคุ้มครองจาก input
            } else {
                await this.expect(quotationLocator(this.page).coverageyear).not.toHaveValue('', { timeout: 60000 }); // รอจนค่าขึ้นมา (ไม่ใช่ค่าว่าง)
                await quotationLocator(this.page).coverageyear.click(); // คลิกที่ช่องกรอกระยะเวลาคุ้มครอง

                // await quotationLocator(this.page).coverageyear.fill(coverageyear); // กรอกจำนวนระยะเวลาความคุ้มครอง
                // เคลียร์ค่าใน input
                await this.page.keyboard.press('Control+A');
                await this.page.keyboard.press('Backspace');
                await this.page.keyboard.type(coverageyear, { delay: 100 });

                // เพิ่มหน่วงเวลารอค่า input เก็บค่าล่าสุด
                await this.page.waitForTimeout(500);

                popupmessage = await popupalert.popupAlertMessage(); // ดึงข้อความใน pop-up แจ้งเตือน (ถ้ามี)
                popuparray.push(popupmessage.popupmessage); // เก็บข้อความ pop-up แจ้งเตือน (ถ้ามี)
                checkvaluecoverageyear = await quotationLocator(this.page).coverageyear.inputValue(); // ดึงค่าจำนวนระยะเวลาความคุ้มครองจาก input
            }
        }

        // รอให้ปุ่มปรากฏและพร้อมใช้งาน (visible + enabled)
        await this.expect(quotationLocator(this.page).calisurance).toBeVisible({ timeout: 60000 });
        await this.expect(quotationLocator(this.page).calisurance).toBeEnabled({ timeout: 60000 });
        await quotationLocator(this.page).calisurance.click(); // กดปุ่มคำนวณเบี้ย
        // รอให้มีการคำนวณเบี้ยประกันภัย
        await this.page.waitForTimeout(500); // รอครึ่งวินาที
        popupmessage = await popupalert.popupAlertMessage(); // ดึงข้อความใน pop-up แจ้งเตือน (ถ้ามี)
        popuparray.push(popupmessage.popupmessage); // เก็บข้อความ pop-up แจ้งเตือน (ถ้ามี)

        return { popuparray };
    }

    async paypremium(paypremium) {
        let popupmessage = '';
        let popuparray = [];

        const popupalert = new popupAlert(this.page);

        if (paypremium === 'ชำระเบี้ยทันที') {
            await quotationLocator(this.page).paymentmethod_now.click(); // กดปุ่มชำระเบี้ยทันที
            popupmessage = await popupalert.popupAlertMessage(); // ดึงข้อความใน pop-up แจ้งเตือน (ถ้ามี)
            popuparray.push(popupmessage.popupmessage); // เก็บข้อความ pop-up แจ้งเตือน (ถ้ามี)
        } else if (paypremium === 'รอตัดบัญชี') {

            const today = new Date();
            // ปีนี้
            const expireDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            // แปลงเป็นวัน/เดือน/ปี (พ.ศ.)
            const day = String(expireDate.getDate()).padStart(2, '0');
            const month = String(expireDate.getMonth() + 1).padStart(2, '0'); // เดือนเริ่มที่ 0
            const year = expireDate.getFullYear() + 543; // แปลง ค.ศ. → พ.ศ.
            const formattedExpireDate = `${day}/${month}/${year}`;

            await quotationLocator(this.page).paymentmethod_account.click(); // กดปุ่มรอตัดบัญชี
            popupmessage = await popupalert.popupAlertMessage(); // ดึงข้อความใน pop-up แจ้งเตือน (ถ้ามี)
            popuparray.push(popupmessage.popupmessage); // เก็บข้อความ pop-up แจ้งเตือน (ถ้ามี)

            await quotationLocator(this.page).inputdate_account.click(); // คลิกที่ช่องรอตัดบัญชีภายในวันที่
            // เคลียร์ค่าใน input
            await this.page.keyboard.press('Control+A');
            await this.page.keyboard.press('Backspace');
            await this.page.keyboard.type(formattedExpireDate, { delay: 100 });
            popupmessage = await popupalert.popupAlertMessage(); // ดึงข้อความใน pop-up แจ้งเตือน (ถ้ามี)
            popuparray.push(popupmessage.popupmessage); // เก็บข้อความ pop-up แจ้งเตือน (ถ้ามี)

            await quotationLocator(this.page).inputpaymentno_account.click(); // กดปุ่มเลขที่บัญชี (ระบุเฉพาะตัวเลข)
            // เคลียร์ค่าใน input
            await this.page.keyboard.press('Control+A');
            await this.page.keyboard.press('Backspace');
            await this.page.keyboard.type('1234567890', { delay: 100 });
            popupmessage = await popupalert.popupAlertMessage(); // ดึงข้อความใน pop-up แจ้งเตือน (ถ้ามี)
            popuparray.push(popupmessage.popupmessage); // เก็บข้อความ pop-up แจ้งเตือน (ถ้ามี)
        }

        return { popuparray };
    }

    async confirmsavequotation() {
        await this.expect(quotationLocator(this.page).confirmsavequotation).toBeVisible({ timeout: 60000 }); // รอให้ปุ่มยืนยันข้อมูลปรากฏ
        await quotationLocator(this.page).confirmsavequotation.click(); // กดปุ่มยืนยันข้อมูล
        await this.expect(quotationLocator(this.page).popupmessageconfirmsavequotation).toBeVisible({ timeout: 60000 }); // รอให้ pop-up แจ้งเตือนยืนยันการสร้างใบเสนอราคาปรากฏ
        await this.expect(quotationLocator(this.page).savepopupmessageconfirmsavequotation).toBeVisible({ timeout: 60000 }); // รอให้ปุ่มยืนยันใน pop-up ปรากฏ
        await quotationLocator(this.page).savepopupmessageconfirmsavequotation.click(); // กดปุ่มยืนยันใน pop-up
        await this.expect(quotationLocator(this.page).popupmessagesuccessquotation).toBeVisible({ timeout: 60000 }); // รอให้ pop-up แจ้งเตือนสร้างใบเสนอราคาเสร็จสิ้นปรากฏ
        await this.expect(quotationLocator(this.page).savepopupmessageconfirmsavequotation).toBeVisible({ timeout: 60000 }); // รอให้ปุ่มปิด pop-up แจ้งเตือนสร้างใบเสนอราคาเสร็จสิ้นพร้อมใช้งาน
        await quotationLocator(this.page).savepopupmessageconfirmsavequotation.click(); // กดปุ่มปิด pop-up แจ้งเตือนสร้างใบเสนอราคาเสร็จสิ้น
    }
}

module.exports = { quotationSPLife };