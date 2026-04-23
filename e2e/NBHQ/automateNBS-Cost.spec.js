import { test, expect } from '@playwright/test';
import { caseDatas } from './data/testcase.data.js';
import ExcelJS from 'exceljs';

// เพิ่มตัวแปรเก็บผลทดสอบ
const testResults = [];

caseDatas.forEach((data, idx) => {
  test(`Automate เชคเบี้ย ชุดที่ ${idx + 1} `, async ({ page }) => {

    let popupMassage = null;

    page.on('dialog', async dialog => {
      popupMassage = dialog.message();
      await dialog.accept();
    });

    //เข้า web
    await page.goto('https://sitnbs.thaisamut.co.th/nbsweb/secure/home.html'); //ใส่ url

    //login
    await page.locator('#username').click();
    await page.locator('#username').fill(data.username); //ใส่ username
    await page.locator('#password').click();
    await page.locator('#password').fill('1'); //ใส่ password
    await page.getByRole('button', { name: /login/i }).click();

    //เข้าเมนู
    await page.getByRole('menuitem', { name: 'ระบบงานให้บริการ' }).click();
    await page.getByRole('menuitem', { name: 'เคสใหม่แบบย่อ (สามัญ, อุตสาหกรรม, อุบัติเหตุธรรมดา)' }).click();
    await page.getByRole('menuitem', { name: 'บันทึกเคสใหม่แบบย่อ ต่างสาขา (สามัญ)' }).click();

    //ใส่ตัวแทน
    await page.locator('#agent-code-name').fill(data.agentCode); //ใส่ agent code
    await page.getByRole('option', { name: data.agentName }).click(); //เลือก agent name

    //เข้าเมนูเพิ่มเคสใหม่
    await page.locator('#bAddNew').click();
    await page.locator('#addCus').click();

    //เพิ่มข้อมูลลูกค้า
    await page.selectOption('#cardCusType', { label: 'เลขประจำตัว 13 หลัก' }); //เลือกประเภทบัตร
    await page.locator('#cardCusNumberAdd').click();
    await page.locator('#cardCusNumberAdd').fill('1507290726182'); //ใส่เลขบัตรประจำตัวประชาชน (เปลี่ยนได้)

    //คำนำหน้าเพศชาย
    const cusAge = parseInt(data.age);
    if (data.gender === 'ชาย') {
      if(cusAge < 15 ) {
         await page.locator('#prefixCus').click();
         await page.locator('#prefixCus').fill('ด.ช.'); //ใส่คำนำหน้าชื่อ
         await page.waitForSelector(`li.yui3-aclist-item[data-text="ด.ช."]`);
         await page.locator(`li.yui3-aclist-item[data-text="ด.ช."]`).click();
      }
      else {
        await page.locator('#prefixCus').click();
        await page.locator('#prefixCus').fill('นาย'); //ใส่คำนำหน้าชื่อ
        await page.waitForSelector(`li.yui3-aclist-item[data-text="นาย"]`);
        await page.locator(`li.yui3-aclist-item[data-text="นาย"]`).click();
      }
    }

    else if(data.gender === 'หญิง') {
      if(cusAge < 15 ) {
         await page.locator('#prefixCus').click();
         await page.locator('#prefixCus').fill('ด.ญ.'); //ใส่คำนำหน้าชื่อ
         await page.waitForSelector(`li.yui3-aclist-item[data-text="ด.ญ."]`);
         await page.locator(`li.yui3-aclist-item[data-text="ด.ญ."]`).click();
      }
      else {
        await page.locator('#prefixCus').click();
        await page.locator('#prefixCus').fill('นาง'); //ใส่คำนำหน้าชื่อ
        await page.waitForSelector(`li.yui3-aclist-item[data-text="นาง"]`);
        await page.locator(`li.yui3-aclist-item[data-text="นาง"]`).click();
      }
    }
    //คำนำหน้าเพศชาย

    await page.locator('#nameCusAdd').click();
    await page.locator('#nameCusAdd').fill('เทสเบี้ย'); //ใส่ชื่อ
    await page.locator('#surnameCusAdd').click();
    await page.locator('#surnameCusAdd').fill('เทสเบี้ย'); //ใส่นามสกุล

    const Bdday = new Date();
    let birthDateFill = '';

    if (parseInt(data.age) === 0) {
      const birthDate = new Date();
      birthDate.setDate(birthDate.getDate() - 30); // ย้อนหลัง 30 วัน
      const dd = ("0" + birthDate.getDate()).slice(-2);
      const mm = ("0" + (birthDate.getMonth() + 1)).slice(-2);
      const yyyy = birthDate.getFullYear() + 543; // แปลงเป็น พ.ศ.
      birthDateFill = `${dd}${mm}${yyyy}`;} 
    else {
      const birthYearAD = Bdday.getFullYear() - parseInt(data.age);
      const birthYearBE = birthYearAD + 543; 
      birthDateFill = `01${("0" + (1)).slice(-2)}${birthYearBE}`;
    }

    await page.locator('#birthDateCus').click();
    await page.locator('#birthDateCus').fill(birthDateFill); //วันเกิด ddmmyyyy

    if (data.gender === 'ชาย') {
      try {
        const maleBtn = page.locator('#genderCusM');
        await Promise.race([
          maleBtn.click({ timeout: 1000 }),
          page.waitForTimeout(1000)
        ]);
      } catch (e) {
        console.log(`Exception while doing something: ${e}`);

      }
    } else if (data.gender === 'หญิง') {
      try {
        const femaleBtn = page.locator('#genderCusF');
        await Promise.race([
          femaleBtn.click({ timeout: 1000 }),
          page.waitForTimeout(1000)
        ]);
      } catch (e) {
        console.log(`Exception while doing something: ${e}`);
      }
    }
    await page.locator('#surnameCusAdd').click();
    await page.getByRole('button', { name: 'ยืนยัน' }).click();

    //กรอกข้อมูลเคสใหม่//
    //ข้อมูลผู้เอาประกัน
    await page.locator('#requestId').click();
    await page.locator('#requestId').fill(data.requestId); //เลขที่คำขอ

    const today = new Date();
    const day = ("0" + today.getDate()).slice(-2);
    const month = ("0" + (today.getMonth() + 1)).slice(-2); // เดือนต้อง +1
    const yearBE = today.getFullYear() + 543;
    const DateFill = `${day}${month}${yearBE}`;
    const ExpireCardDate = DateFill + 5;

    await page.locator('#requestDatePdpa').click();
    await page.locator('#requestDatePdpa').fill(DateFill); //วันเขียนใบคำขอ
    await page.locator('#expireDate').click();
    await page.locator('#expireDate').fill(ExpireCardDate); //วันบัตรหมดอายุ
    await page.selectOption('#checkCard', { label: 'บัตรประจำตัวประชาชน' }); //เลือกประเภทบัตร
    await page.locator('#phoneMobile').click();
    await page.locator('#phoneMobile').fill('0665846548');

    //ที่อยู่
    await page.locator('#homeNo').click();
    await page.locator('#homeNo').fill('233515'); //บ้านเลขที่
    await page.selectOption('#province', { label: 'กรุงเทพมหานคร' }); //เลือกจังหวัด
    await page.selectOption('#district', { label: 'ดุสิต' }); //เลือกอำเภอ
    await page.selectOption('#subdistrict', { label: 'ดุสิต (10300)' }); //เลือกตำบล

    //อาชีพ
    await page.selectOption('#occupationList', { label: data.occupation }); //เลือกอาชีพ
    await page.locator('#rMotorcycleNotuse').click();

    //แบบประกัน
    await page.locator('#tempRecieptDate').fill(DateFill); // วันที่ใบรับเงินชั่วคราว

    // bug //
    await page.locator('#plan').click();
    await page.locator('#plan').click();
    await page.locator('#plan').click();
    await page.locator('#plan').click().then(() => page.waitForTimeout(3000));
    await page.selectOption('#plan', { label: 'A10 โอเชี่ยนไลฟ์ เซฟ แอนด์ โพรเทค 88/8' });
    await page.locator('#plan').click();
    await page.locator('#plan').click();
    await page.selectOption('#plan', { label: 'A10 โอเชี่ยนไลฟ์ เซฟ แอนด์ โพรเทค 88/8' });
    await page.pause();
    await page.selectOption('#sMode', { label: 'รายปี' }); //เลือกวิธีชำระเบี้ยประกัน
    // bug //



    //กรอกรายละเอียดประกัน
    await page.locator('#plan').click();
    await page.locator('#plan').click();
    await page.selectOption('#plan', { label: data.plan });
    await page.getByRole('button', { name: 'ป้อนทุนประกัน' }).click();
    await page.locator('#popUpCapital').fill('');
    await page.locator('#popUpCapital').fill(data.capital); //ใส่ทุนประกัน
    await page.getByRole('button', { name: 'ยืนยัน' }).click();
    await page.selectOption('#sMode', { label: data.sMode }); //เลือกวิธีชำระเบี้ยประกัน

    await page.locator('#bAdditionalContract').click();
    await page.selectOption('#additionalContract', { label: 'CPA Extra' });
    await page.selectOption('#additionalSumAssure', { label: data.ridercap }); //ทุนประกันภัย
    await page.getByRole('button', { name: 'เพิ่ม', exact: true }).click();
    
    await page.locator('#benefOwnPay1').click();
    await page.locator('#i06Yes').click();

    const tabledataobj = []


    await page.waitForSelector('#plan-datatable')
    const plantableTextArr = await page.locator('#plan-datatable table td').allTextContents();

    for (let row = 0; row < Math.floor(plantableTextArr.length / 5); row += 1) {
      tabledataobj.push({
        insurance_name: plantableTextArr[0 + (5 * row)],
        insurance_cap: plantableTextArr[1 + (5 * row)],
        insurance_premium: plantableTextArr[2 + (5 * row)],
        insurance_premium_addition: plantableTextArr[3 + (5 * row)],
        insurance_commission: plantableTextArr[4 + (5 * row)]
      })
    }


    // ฟังก์ชันลบ .00 ที่ท้าย string
    function normalizeNumber(str) {
      return str.replace(/,/g, '').replace(/\.00$/, '');
    }

    const actualPremium = normalizeNumber(tabledataobj[2].insurance_premium);
    const expectedPremium = normalizeNumber(data.premium);
    const actualCommission = normalizeNumber(tabledataobj[2].insurance_commission);
    const expectCommission = normalizeNumber(data.commission);
   
    // เช็คเบี้ย
    try {
      expect(actualPremium).toBe(expectedPremium);
      console.log(`✅ expect CPAX_premium: "${actualPremium}" === "${expectedPremium}" (ผ่าน)`);
    } catch (e) {
      console.log(`❌ expect CPAX_premium: "${actualPremium}" !== "${expectedPremium}" (ไม่ผ่าน)`);
      throw e;
    }

    // เช็คบำเหน็จ
    try {
      expect(actualCommission).toBe(expectCommission);
      console.log(`✅ expect insurance_commision: "${actualCommission}" === "${expectCommission}" (ผ่าน)`);
    } catch (e) {
      console.log(`❌ expect insurance_commision: "${actualCommission}" !== "${expectCommission}" (ไม่ผ่าน)`);
      throw e;
    }

    // เก็บผลการทดสอบ
    const result = {
      testCase: idx + 1,
      age: data.age,
      expectedPremium,
      actualPremium,
      premiumResult: actualPremium === expectedPremium ? 'PASS' : 'FAIL',
      expectCommission,
      actualCommission,
      commissionResult: actualCommission === expectCommission ? 'PASS' : 'FAIL'
    };
    testResults.push(result);

  });

});

// เพิ่ม test สำหรับสร้างไฟล์ Excel หลังรันเทสเสร็จ
test.afterAll(async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Test Results');

  // กำหนดหัวคอลัมน์
  worksheet.columns = [
    { header: 'Test Case', key: 'testCase', width: 10 },
    { header: 'Age', key: 'age', width: 10 },
    { header: 'Expected Premium', key: 'expectedPremium', width: 15 },
    { header: 'Actual Premium', key: 'actualPremium', width: 15 },
    { header: 'Premium Result', key: 'premiumResult', width: 15 },
    { header: 'Expected Commission', key: 'expectCommission', width: 15 },
    { header: 'Actual Commission', key: 'actualCommission', width: 15 },
    { header: 'Commission Result', key: 'commissionResult', width: 15 }
  ];

  // เพิ่มสี header
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF99CCFF' }
  };

  // ใส่ข้อมูล
  testResults.forEach(result => {
    worksheet.addRow(result);
    // ใส่สีผลการทดสอบ
    const row = worksheet.lastRow;
    if (result.premiumResult === 'FAIL') {
      row.getCell('premiumResult').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFF9999' }
      };
    }
    if (result.commissionResult === 'FAIL') {
      row.getCell('commissionResult').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFF9999' }
      };
    }
  });

  // บันทึกไฟล์
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await workbook.xlsx.writeFile(`test-results/test-summary-${timestamp}.xlsx`);
  console.log(`Excel report generated: test-summary-${timestamp}.xlsx`);
});