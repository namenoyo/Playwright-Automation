const { test, expect } = require('@playwright/test');
const { GoogleSheet } = require('../../utils/google-sheet-OAuth.helper');
const { LoginPageSPLife } = require('../../pages/login_t.page');
const { menuSPLife } = require('../../pages/SP_Life/menu_splife');
const { mainSPLife } = require('../../pages/SP_Life/main_splife');
const { quotationSPLife } = require('../../pages/SP_Life/quotation_splife');


test('Calculate Insurance Premium', async ({ page }) => {

    const googlesheet = new GoogleSheet();
    const loginpagesplife = new LoginPageSPLife(page);
    const menusplife = new menuSPLife(page, expect);
    const mainsplife = new mainSPLife(page, expect);
    const quotationsplife = new quotationSPLife(page, expect);

    // เริ่มต้น Auth
    const auth = await googlesheet.initAuth();

    // ส่ง spreadsheetId และ range มาจากไฟล์ test
    const spreadsheetId = '1fWFSP2pmzV1QBVxoYbyxzb4XDQbcWflB7gLdW94jARY';
    const readrange = 'Prepare_TestData_Playwright!B6:T6';

    // อ่านข้อมูลสำหรับการเข้าสู่ระบบ
    const datalogin = await googlesheet.fetchSheetData(auth, spreadsheetId, 'Prepare_TestData_Playwright!B1:B2');

    // อ่านข้อมูลสำหรับ test data
    const data = await googlesheet.fetchSheetData(auth, spreadsheetId, readrange);
    console.table(data);
    console.log('Fetched data:\n', data, '\n จำนวนแถว:', data.length, '\n จำนวนคอลัมน์:', data[0].length);

    // Navigate to the website
    await loginpagesplife.gotoSPLife();
    // กรอก username และ password
    await loginpagesplife.login(datalogin[0][0], datalogin[1][0]);
    // Wait for the page to load completely
    await page.waitForLoadState('networkidle');

    // // กดเมนูหลัก
    // await menusplife.menuSPLife('รายงานการทำประกันชีวิต');

    // กดปุ่ม สร้างใบเสนอราคา
    await mainsplife.clickcreateQuotation();

    // รอหน้า "สร้างใบเสนอราคา" โหลด
    await quotationsplife.waitforquotationPageLoad();

    for (const row in data) {

        const insurancename = data[row][1]; // ชื่อแบบประกัน
        const idcard = data[row][12]; // เลขบัตรประชาชน
        const titlename = data[row][9]; // คำนำหน้า
        const name = data[row][10]; // ชื่อผู้เอาประกันภัย
        const surname = data[row][11]; // นามสกุลผู้เอาประกันภัย
        const birthdate = data[row][8]; // วันเกิดผู้เอาประกันภัย
        const insurancesum = data[row][13]; // จำนวนเงินทุนประกันภัย
        const coverageYear = data[row][4]; // ระยะเวลาคุ้มครอง
        const expectedinsurancesum = data[row][14]; // ค่าที่คาดหวังสำหรับจำนวนเงินเอาประกันภัย

        const today = new Date();
        // เพิ่ม 1 ปีจากวันนี้
        const expireDate = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
        // แปลงเป็นวัน/เดือน/ปี (พ.ศ.)
        const day = String(expireDate.getDate()).padStart(2, '0');
        const month = String(expireDate.getMonth() + 1).padStart(2, '0'); // เดือนเริ่มที่ 0
        const year = expireDate.getFullYear() + 543; // แปลง ค.ศ. → พ.ศ.
        const formattedExpireDate = `${day}/${month}/${year}`;

        const mobileno = '0987654321'; // เบอร์โทรศัพท์

        // เลือกแบบประกันตามข้อมูลในแถว
        await quotationsplife.selectInsurancePlan(insurancename);

        // กรอกข้อมูลผู้เอาประกันภัย
        await quotationsplife.insuredInformation(idcard, titlename, name, surname, birthdate, formattedExpireDate, mobileno);

        // คำนวณเบี้ยประกันภัยและวิธีการชำระเบี้ย
        await quotationsplife.calculatepremiumandpaymentmode(insurancesum, coverageYear, expectedinsurancesum); // กรอกจำนวนเงินเอาประกันภัย และระยะเวลาคุ้มครอง
    }

})