const { test, expect } = require('@playwright/test');
const { LoginPageSPLife } = require('../../pages/login_t.page');
const { LogoutPage } = require('../../pages/logout.page');
const { mainSPLife } = require('../../pages/SP_Life/main_splife');
const { quotationSPLife } = require('../../pages/SP_Life/quotation_splife');
const { quotationLocator } = require('../../locators/SP_Life/splife.locators');

test.describe('เมนู สร้างใบเสนอราคา (Validation)', () => {

    // ดาต้าตั้งต้น กรอกครั้งแรก
    const insurancename = 'เพื่อนคู่ทรัพย์ 1 พลัส'; // ชื่อแบบประกัน
    const idcard = '2238268061876'; // เลขบัตรประชาชน
    const titlename = 'นาย'; // คำนำหน้า
    const name = 'ทดสอบ'; // ชื่อผู้เอาประกันภัย
    const surname = 'ทดสอบ'; // นามสกุลผู้เอาประกันภัย
    const birthdate = '01/01/2548'; // วันเกิดผู้เอาประกันภัย
    const formattedExpireDate = '01/01/2570'; // วันหมดอายุ
    const mobileno = '0812345678'; // เบอร์โทรศัพท์มือถือ
    const insurancesum = '1000000'; // จำนวนเงินทุนประกันภัย
    const coverageYear = '10'; // ระยะเวลาคุ้มครอง
    const paypremium = 'รอตัดบัญชี'; // วิธีการชำระเบี้ย

    test.beforeEach(async ({ page }) => {
        const loginPage = new LoginPageSPLife(page);
        const mainPage = new mainSPLife(page, expect);
        const quotationPage = new quotationSPLife(page, expect);

        await loginPage.gotoSPLife();
        await loginPage.login('5300385', 'Ocean@77');
        // Wait for the page to load completely
        await page.waitForLoadState('networkidle');
        // คลิกปุ่ม สร้างใบเสนอราคา
        await mainPage.clickcreateQuotation();
        // รอให้หน้า สร้างใบเสนอราคา โหลดเสร็จ
        await quotationPage.waitforquotationPageLoad();

        // กรอกข้อมูลทั้งหมดก่อน
        // เลือกแบบประกันตามข้อมูลในแถว
        await quotationPage.selectInsurancePlan(insurancename);
        // กรอกข้อมูลผู้เอาประกันภัย
        await quotationPage.insuredInformation(idcard, titlename, name, surname, birthdate, formattedExpireDate, mobileno);
        // คำนวณเบี้ยประกันภัยและวิธีการชำระเบี้ย
        await quotationPage.premiumandpaymentmode(String(insurancesum), String(coverageYear)); // กรอกจำนวนเงินเอาประกันภัย และระยะเวลาคุ้มครอง
        // วิธีการชำระเบี้ย
        await quotationPage.paypremium(paypremium);
    })

    test('TC-หน้าจอสร้างใบเสนอราคา-4', async ({ page }) => {
        try {
            // กดปุ่ม dropdown agent
            await quotationLocator(page).insurancebroker.click();
            // กดปุ่ม x เพื่อเคลียร์ค่า agent
            await quotationLocator(page).insurancebrokerClear.click();
            // กด ช่องสาขา
            await quotationLocator(page).insurancebranch.click();
            // เช็คแสดงข้อความ ไม่ได้ใส่ agent ช่อง agent
            await expect(page.locator('div[class="MuiGrid-root MuiGrid-item MuiGrid-grid-xs-12 MuiGrid-grid-sm-6"]').getByText('กรุณาเลือกรายชื่อนายหน้าประกันชีวิต')).toHaveText('กรุณาเลือกรายชื่อนายหน้าประกันชีวิต');

            // คลิ๊กปุ่ม บันทึกข้อมูล
            await quotationLocator(page).confirmsavequotation.isVisible({ timeout: 60000 });
            await quotationLocator(page).confirmsavequotation.click();
            // คลิ๊กปุ่ม บันทึกข้อมูล
            await quotationLocator(page).savepopupmessageconfirmsavequotation.isVisible({ timeout: 60000 });
            await quotationLocator(page).savepopupmessageconfirmsavequotation.click();

            // เช็คแจ้งเตือน ไม่ได้ใส่ agent ช่อง agent
            await expect(quotationLocator(page).popupAlert).toHaveText('กรุณาระบุ ข้อมูลนายหน้าประกันชีวิต เป็นอย่างน้อย');
        } catch (err) {
            console.log('Error in TC-หน้าจอสร้างใบเสนอราคา-4:', err.message);
            throw err;
        }
    })

    test('TC-หน้าจอสร้างใบเสนอราคา-32', async ({ page }) => {
        try {
            // คลิ๊ก ช่องจำนวนเงินเอาประกันภัย
            await quotationLocator(page).insurancesum.click();
            // เคลียร์ค่าใน input
            await page.keyboard.press('Control+A');
            await page.keyboard.press('Backspace');
            await page.keyboard.type('30000', { delay: 100 });
            // กดปุ่มคำนวณเบี้ย
            await quotationLocator(page).calisurance.click();

            // เช็คแจ้งเตือน กรอกจำนวนเงินเอาประกันภัย ต่ำกว่ากำหนด
            await expect(quotationLocator(page).popupAlert).toHaveText('ทุนประกันภัยต้องอยู่ในช่วง 50,000.00 - 999,999,999,999.00 บาท');
        } catch (err) {
            console.log('Error in TC-หน้าจอสร้างใบเสนอราคา-32:', err.message);
            throw err;
        }
    })

    test('TC-หน้าจอสร้างใบเสนอราคา-33', async ({ page }) => {
        try {
            // คลิ๊ก ช่องจำนวนเงินเอาประกันภัย
            await quotationLocator(page).insurancesum.click();
            // เคลียร์ค่าใน input
            await page.keyboard.press('Control+A');
            await page.keyboard.press('Backspace');
            await page.keyboard.type('1000000000000000000', { delay: 100 });
            // กดปุ่มคำนวณเบี้ย
            await quotationLocator(page).calisurance.click();

            // เช็คแจ้งเตือน กรอกจำนวนเงินเอาประกันภัย ต่ำกว่ากำหนด
            await expect(quotationLocator(page).popupAlert).toHaveText('ทุนประกันภัยต้องอยู่ในช่วง 50,000.00 - 999,999,999,999.00 บาท');
        } catch (err) {
            console.log('Error in TC-หน้าจอสร้างใบเสนอราคา-33:', err.message);
            throw err;
        }
    })

    test('TC-หน้าจอสร้างใบเสนอราคา-35', async ({ page }) => {
        try {
            // คลิ๊ก ช่องจำนวนเงินเอาประกันภัย
            await quotationLocator(page).coverageyear.click();
            // เคลียร์ค่าใน input
            await page.keyboard.press('Control+A');
            await page.keyboard.press('Backspace');
            await page.keyboard.type('0', { delay: 100 });
            // กดปุ่มคำนวณเบี้ย
            await quotationLocator(page).calisurance.click();

            // เช็คแจ้งเตือน กรอกจำนวนเงินเอาประกันภัย ต่ำกว่ากำหนด
            await expect(quotationLocator(page).popupAlert).toHaveText('ระยะเวลาคุ้มครองไม่อยู่ในช่วงที่กำหนด');
        } catch (err) {
            console.log('Error in TC-หน้าจอสร้างใบเสนอราคา-35:', err.message);
            throw err;
        }
    })

    test.only('TC-หน้าจอสร้างใบเสนอราคา-36', async ({ page }) => {
        try {
            // คลิ๊ก ช่องจำนวนเงินเอาประกันภัย
            await quotationLocator(page).coverageyear.click();
            // เคลียร์ค่าใน input
            await page.keyboard.press('Control+A');
            await page.keyboard.press('Backspace');
            await page.keyboard.type('100', { delay: 100 });
            // กดปุ่มคำนวณเบี้ย
            await quotationLocator(page).calisurance.click();

            // เช็คแจ้งเตือน กรอกจำนวนเงินเอาประกันภัย ต่ำกว่ากำหนด
            await expect(quotationLocator(page).popupAlert).toHaveText('ระยะเวลาคุ้มครองไม่อยู่ในช่วงที่กำหนด');
        } catch (err) {
            console.log('Error in TC-หน้าจอสร้างใบเสนอราคา-36:', err.message);
            throw err;
        }
    })

    test.afterEach(async ({ page }) => {
        const logoutPage = new LogoutPage(page, expect);

        // ปิด pop-up แจ้งเตือน
        await quotationLocator(page).closepopupButton.isVisible({ timeout: 60000 });
        await quotationLocator(page).closepopupButton.click();

        // ออกจากระบบ
        await logoutPage.logoutSPLife();
        // await page.close();
    })

})