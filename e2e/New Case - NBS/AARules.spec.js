import { test, expect } from '@playwright/test';
import { caseDatas } from './data/newCase.data.js';

caseDatas.forEach((data, idx) => {
  test(`test AARULES ชุดที่ ${idx + 1} `, async ({ page }) => {

    page.on('dialog', async dialog => {
      let popupMassage = dialog.message();
      await dialog.accept();
    });

    if (data.system === 'UAT') {
      await page.goto('https://uatnbs.thaisamut.co.th/nbsweb/secure/home.html'); //ใส่ url
    }
    else {
      await page.goto('https://sitnbs.thaisamut.co.th/nbsweb/secure/home.html'); //ใส่ url
    }

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
    await page.locator('#cardCusNumberAdd').fill(data.cardNumber); //ใส่เลขบัตรประจำตัวประชาชน
    await page.locator('#prefixCus').click();
    await page.locator('#prefixCus').fill(data.prefix); //ใส่คำนำหน้าชื่อ
    await page.waitForSelector(`li.yui3-aclist-item[data-text="${data.prefix}"]`);
    await page.locator(`li.yui3-aclist-item[data-text="${data.prefix}"]`).click();
    await page.locator('#nameCusAdd').click();
    await page.locator('#nameCusAdd').fill(data.name); //ใส่ชื่อ
    await page.locator('#surnameCusAdd').click();
    await page.locator('#surnameCusAdd').fill(data.surname); //ใส่นามสกุล
    await page.locator('#birthDateCus').click();

    // คำนวณวันเกิด
    const Bdday = new Date();
    let birthDateFill = '';

    if (parseInt(data.age) === 0) {
      const birthDate = new Date();
      birthDate.setDate(birthDate.getDate() - 30); // ย้อนหลัง 30 วัน
      const dd = ("0" + birthDate.getDate()).slice(-2);
      const mm = ("0" + (birthDate.getMonth() + 1)).slice(-2);
      const yyyy = birthDate.getFullYear() + 543; // แปลงเป็น พ.ศ.
      birthDateFill = `${dd}${mm}${yyyy}`;
    }
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

    const allowedPrefixes = ['06', '08', '09'];
    const prefix = allowedPrefixes[Math.floor(Math.random() * allowedPrefixes.length)];
    const randomDigits = String(Math.floor(Math.random() * 100000000)).padStart(8, '0');
    const phoneNumber = prefix + randomDigits;

    await page.locator('#phoneMobile').click();
    await page.locator('#phoneMobile').fill(phoneNumber); //เบอร์มือถือ

    //ที่อยู่
    const randomHomenum = Math.floor(100000 + Math.random() * 900000);
    await page.locator('#homeNo').click();
    await page.locator('#homeNo').fill(randomHomenum.toString()); //บ้านเลขที่
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
    await page.locator('#plan').click();
    await page.selectOption('#plan', { label: data.plan });
    await page.selectOption('#sMode', { label: 'รายปี' });
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

    const numOfRider = parseInt(data.NumOfRider);
    if (numOfRider > 0) {
      for (let i = 0; i < numOfRider; i++) {
        await page.locator('#bAdditionalContract').click();
        await page.selectOption('#additionalContract', { label: data.rider[i].ridername });
        await page.selectOption('#additionalSumAssure', { label: data.rider[i].ridercapital });
        await page.getByRole('button', { name: 'เพิ่ม', exact: true }).click();
      }
    }
    //await page.pause();

    await page.locator('#benefOwnPay1').click();
    await page.locator('#i06Yes').click();

    //ผู้รับผลประโยชน์
    await page.selectOption('#titleBeneficiary', { label: data.benefTitle }); //เลือกคำนำหน้าชื่อ
    await page.locator('#nameBeneficiary').click();
    await page.locator('#nameBeneficiary').fill(data.benefName); //ใส่ชื่อผู้รับผลประโยชน์
    await page.locator('#surnameBeneficiary').click();
    await page.locator('#surnameBeneficiary').fill(data.benefSurname); //ใส่นามสกุลผู้รับผลประโยชน์
    await page.selectOption('#relationBeneficiary', { label: data.benefRelation }); //เลือกความสัมพันธ์
    await page.locator('#ageBeneficiary').click();
    await page.locator('#ageBeneficiary').fill(data.benefAge); //ใส่อายุผู้รับผลประโยชน์
    await page.locator('#avgBeneficiary').click();
    await page.selectOption('#listBenefAddress', { label: 'ที่อยู่เดียวกันกับ ที่อยู่ที่ติดต่อผู้เอาประกัน' }); //เลือกที่อยู่ผู้รับผลประโยชน์
    await page.locator('#bAddBenef').click();

    //อื่นๆ
    try {
      const ladyBtn = page.locator('#flagHealthLadyNo');
      await Promise.race([
        ladyBtn.click({ timeout: 1000 }),
        page.waitForTimeout(1000) // กันกรณีปุ่มไม่โผล่
      ]);
    } catch (e) {
      console.log(`Exception while doing something: ${e}`);
    }

    await page.locator('#i7No').click();
    await page.locator('#i8No').click();

    let bmiRange;
    let height;
    let weight;
    let bmi;

    let checkAge = parseInt(data.age);
    if (data.checkAge <= 1) {
      // ทารก: BMI ไม่ใช้ ให้สุ่มน้ำหนักกับส่วนสูงโดยตรง
      const heightCm = 50 + Math.random() * 20; // 50–70 cm
      const weightKg = 3 + Math.random() * 7;   // 3–10 kg
      height = Math.round(heightCm);
      weight = Math.round(weightKg);
    } else {
      if (data.gender === 'ชาย') {
        if (checkAge <= 5) bmiRange = [14, 17];
        else if (checkAge <= 12) bmiRange = [14, 20];
        else if (checkAge <= 19) bmiRange = [17, 24];
        else if (checkAge <= 59) bmiRange = [19, 25];
        else bmiRange = [23, 28];
      } else { // หญิง
        if (checkAge <= 5) bmiRange = [13, 16];
        else if (checkAge <= 12) bmiRange = [14, 19];
        else if (checkAge <= 19) bmiRange = [16, 23];
        else if (checkAge <= 59) bmiRange = [18, 24];
        else bmiRange = [22, 27];
      }

      bmi = bmiRange[0] + Math.random() * (bmiRange[1] - bmiRange[0]);

      const heightCm = 80 + Math.random() * 100; // 80–180 cm
      const heightM = heightCm / 100;
      const weightKg = bmi * (heightM ** 2);

      height = Math.round(heightCm);
      weight = Math.round(weightKg);
    }

    await page.locator('#height').click();
    await page.locator('#height').fill(height.toString()); //ใส่ส่วนสูง
    await page.locator('#weight').click();
    await page.locator('#weight').fill(weight.toString()); //ใส่น้ำหนัก
    await page.locator('#i9No').click();
    await page.locator('#i10No').click();
    await page.locator('#i1113No').click();
    await page.locator('#i13No').click();
    await page.locator('#flagHealthDoctorNo').click();
    await page.locator('#flagHealthSymptomNo').click();
    await page.locator('#i17No').click();
    await page.locator('#i18No').click();
    await page.locator('#fatcaNo').click();
    await page.locator('#marketingConsentNo').click();
    await page.locator('#taxDiscloseStatusNo').click();
    await page.locator('#crsTaxResidenceFlagY').click();
    await page.waitForTimeout(2000);

    let log = [];

    for (let round = 1; round <= 1; round++) {

      const stwaitingtime = new Date();
      var fnwaitingtime

      await page.getByRole('button', { name: 'บันทึก' }).click();
      //----------------------- เชคUW ----------------------------------
      await Promise.race([
        page.waitForSelector('#fullSummary-panel #oMainInfo', { timeout: 600000 }),
        page.waitForSelector('#summary-panel #oMainInfo', { timeout: 600000 })
      ]);

      console.log('oMainInfo visible:', await page.locator('#fullSummary-panel #oMainInfo').isVisible());
      console.log('summary-pane visible:', await page.locator('#summary-panel #oMainInfo').isVisible());

      let allText = '';

      if (await page.locator('#fullSummary-panel #oMainInfo').isVisible()) {
        fnwaitingtime = new Date();

        const divLocator = page.locator('#fullSummary-panel #oMainInfo div').filter({
          hasText: /^ใบคำขอฯเลขที่/
        });
        const divText = await divLocator.first().innerText();

        const tableTextArr = await page.locator('#fullSummary-panel #oMainInfo .summary-content table td').allTextContents();
        const tableText = tableTextArr.join('\n');
        allText = `${divText}\n${tableText}`;

        //const page1Promise = page.waitForEvent('popup');
        await page.getByRole('button', { name: 'ยืนยัน' }).click();
        await page.waitForTimeout(10000);
        //await page.pause();
        //const page1 = await page1Promise;
        // } else if (await page.locator('#summary-panel #oMainInfo').isVisible()) {

        //   const divText = await page.locator('#summary-panel #oMainInfo div').first().innerText();
        //   const tableTextArr = await page.locator('#summary-panel #oMainInfo .summary-content table td').allTextContents();
        //   const tableText = tableTextArr.join('\n');
        //   allText = `${divText}\n${tableText}`;
        //   await page.getByRole('button', { name: 'ยกเลิก' }).click();
        //   await page.pause();
      }

      console.log('All summary text:', allText);
      data.program_output = allText;

      const waitingMs = fnwaitingtime.getTime() - stwaitingtime.getTime();
      const waitinSeconds = waitingMs / 1000;
      log.push(`รอบที่:${round},${waitinSeconds}`)
      console.log(`Test ชุดที่ ${idx+1} รอบที่ ${round} waiting time: ${waitinSeconds} seconds Start Time:${stwaitingtime} , Endtime${fnwaitingtime}`);
    }
    // หลังจากอัพเดท data.program_output แล้ว ให้เขียนกลับลงไฟล์ testcase.data.js
    /*fs.writeFileSync(
    './data/testcase.data.js',
    `export const caseDatas = ${JSON.stringify(caseDatas, null, 2)};\n`,
    { encoding: 'utf8' }
  );*/
    //------------------------------------------------------------------------------------------------------

    //   //---------------------------- เชคแบบประกัน == ใบคำขอ ---------------------------------------------------------
    //   try {
    //     const closeButton = await page.locator('button', { hasText: 'ปิด' }).first().waitFor({ timeout: 5000 });
    //     await closeButton.click();
    //   } catch (error) {
    //     console.log(error);
    //   }
    //   await page.waitForTimeout(5000);
    //   const expectedRequestId = data.requestId;
    //   const expectedCell6 = data.plan;

    //   // ดึง rows ทั้งหมดใน table
    //   const rows = await page.locator('#newcaseshortly-list-bd table tr').all();

    //   let found = false;

    //   for (const row of rows) {
    //     const cells = await row.locator('td').allTextContents();
    //     if (cells[0] === expectedRequestId) {
    //       const normalizedCellText = cells[5].replace(/[:\s]/g, '');
    //       const normalizedExpected = expectedCell6.replace(/[:\s]/g, '');
    //       console.log('normalizedCellText :', normalizedCellText)
    //       console.log('normalizedExpected :', normalizedExpected)
    //       expect(normalizedCellText).toContain(normalizedExpected);
    //       found = true;
    //       console.log('Matched row:', cells);
    //       break;
    //     }
    //   }

    //   if (!found) {
    //     throw new Error(`ไม่พบ row ที่มีเลขใบคำขอ ${expectedRequestId}`);
    //   }


    //   if (!found) {
    //     throw new Error(`ไม่พบ row ที่มีเลขใบคำขอ ${expectedRequestId}`);
    //   }

    //   //ไหลออกกธ.//
    //   await page.goto('https://uatnbs.thaisamut.co.th/nbsweb/secure/home.html'); //ใส่ url

    //   //เข้าเมนู
    //   await page.getByRole('menuitem', { name: 'ระบบงานให้บริการ' }).click();
    //   await page.getByRole('menuitem', { name: 'เคสใหม่แบบย่อ (สามัญ, อุตสาหกรรม, อุบัติเหตุธรรมดา)' }).click();
    //   await page.getByRole('menuitem', { name: 'บันทึกเคสใหม่แบบย่อ ต่างสาขา (สามัญ)' }).click();

    //   //ใส่ตัวแทน
    //   await page.locator('#agent-code-name').fill(data.agentCode); //ใส่ agent code
    //   await page.getByRole('option', { name: data.agentName }).click(); //เลือก agent name


    //   //พิมพ์ใบรับฝากเคส
    //   await page.locator('#bPrint').click();

    //   //ส่งข้อมูลใบคำขอ
    //   await page.getByRole('menuitem', { name: 'ระบบงานให้บริการ' }).click();
    //   await page.getByRole('menuitem', { name: 'เคสใหม่แบบย่อ (สามัญ, อุตสาหกรรม, อุบัติเหตุธรรมดา)' }).click();
    //   await page.getByRole('menuitem', { name: 'ส่งข้อมูลใบคำขอฯ' }).click();
    //   await page.selectOption('#pdGroupCode', { label: '1 : สามัญ' });
    //   await page.locator('#requestNo').fill(data.requestId);
    //   await page.waitForTimeout(3000);
    //   await page.locator('#oSearch').click();
    //   await page.waitForTimeout(2000);
    //   await page.locator('div.yui3-datatable-scroll-liner', { hasText: 'ทั้งหมด' }).locator('input[type="checkbox"]').click();
    //   await page.locator('#oSendData').click();
    //   await page.waitForTimeout(2000);
    //   await page.locator('.yui3-widget-buttons').getByRole('button', { name: 'ส่ง' }).click();
    //   await page.pause();
    //   await page.getByRole('button', { name: 'ปิดหน้าจอ' }).click();

    //   // //จัดการข้อมูลเคสใหม่สามัญ
    //   await page.getByRole('menuitem', { name: 'ระบบงานให้บริการ' }).click();
    //   await page.getByRole('menuitem', { name: 'จัดการข้อมูลเคสใหม่สามัญ' }).click();
    //   await page.getByRole('menuitem', { name: 'จัดการรายการเคสใหม่ ต่างสาขา' }).click();
    //   await page.locator('#requestIdCriteria').fill(data.requestId);
    //   await page.waitForTimeout(3000);
    //   await page.locator('#bSearch').click();
    //   await page.waitForTimeout(2000);
    //   await page.locator(`td:has-text("${data.requestId}")`).click();
    //   await page.selectOption('#marryStatus', { label: 'โสด' });
    //   await page.locator('#rAddress').click();
    //   await page.locator('#rAddressCur').click();
    //   await page.locator('#salaryPerYear').fill('250000');
    //   await page.getByRole('tab', { name: 'แบบประกัน' }).click();
    //   const totalPremiumText = await page.locator('#totalPremium').innerText();
    //   await page.locator('#payTypeBank').click();
    //   await page.locator('#cReturnPost').click();
    //   await page.locator('#receivePolicyMethodPaper').click();
    //   await page.selectOption('#receivePolicyCodePdpa', { label: 'ส่งตรงลูกค้า' });
    //   await page.locator('#receiveDocumentMethodPaper').click();

    //   await page.getByRole('tab', { name: 'คำแถลงสุขภาพ' }).click();
    //   await page.locator('#crsCityOfBirth').fill('กทม.');

    //   //เลือกเอกสารประกอบการขอเอาประกัน
    //   await page.getByRole('tab', { name: 'เอกสารประกอบการขอเอาประกัน' }).click();
    //   const redSpans = page.locator('span.text-red');
    //   const count = await redSpans.count();

    //   for (let i = 0; i < count; i++) {
    //     const span = redSpans.nth(i);
    //     const checkbox = span.locator('xpath=preceding-sibling::input[@type="checkbox"][1]');

    //     if (await checkbox.isVisible()) {
    //       await checkbox.check();
    //     }
    //   }
    //   // //เลือกเอกสารประกอบการขอเอาประกัน

    //   await page.getByRole('tab', { name: 'ใบรับเงินชั่วคราว' }).click();
    //   //xpath ของ ใบรับเงินชั่วคราว
    //   const inputXpathTr = '/html/body/div[3]/div[3]/div/div[2]/div/form/div[2]/div/div/div[6]/div/table/tr[1]/td[2]/input';
    //   const inputFieldTr = page.locator(`xpath=${inputXpathTr}`);
    //   await inputFieldTr.fill(data.temporaryReceipt); //ใส่เลขที่ใบรับเงินชั่วคราว

    //   const inputNameBank = '/html/body/div[3]/div[3]/div/div[2]/div/form/div[2]/div/div/div[6]/div/table/tr[16]/td[2]/select';
    //   const inputFieldBank = page.locator(`xpath=${inputNameBank}`);
    //   await inputFieldBank.selectOption({ label: '002 BBL : ธนาคารกรุงเทพ จำกัด (มหาชน)' });

    //   const inputBranch = '/html/body/div[3]/div[3]/div/div[2]/div/form/div[2]/div/div/div[6]/div/table/tr[16]/td[2]/input';
    //   const inputFieldBranch = page.locator(`xpath=${inputBranch}`);
    //   await inputFieldBranch.fill('สนง.');

    //   const inputCusNameBank = '/html/body/div[3]/div[3]/div/div[2]/div/form/div[2]/div/div/div[6]/div/table/tr[17]/td[2]/input[1]';
    //   const inputFieldCusNameBank = page.locator(`xpath=${inputCusNameBank}`);
    //   await inputFieldCusNameBank.fill('เทสเทสโดยออโต้เมท'); //ใส่ชื่อผู้ฝากเงิน

    //   const allowedStartDigits = ['5', '6', '8'];
    //   const startDigit = allowedStartDigits[Math.floor(Math.random() * allowedStartDigits.length)];
    //   const remainingDigits = String(Math.floor(Math.random() * 1000000000)).padStart(9, '0');
    //   const bankAccountNumber = startDigit + remainingDigits;

    //   const inputBankNum = '/html/body/div[3]/div[3]/div/div[2]/div/form/div[2]/div/div/div[6]/div/table/tr[17]/td[2]/input[2]';
    //   const inputFieldBankNum = page.locator(`xpath=${inputBankNum}`);
    //   await inputFieldBankNum.fill(bankAccountNumber); //ใส่เลขบัญชีธนาคาร

    //   const inputPremium = '/html/body/div[3]/div[3]/div/div[2]/div/form/div[2]/div/div/div[6]/div/table/tr[18]/td[2]/input';
    //   const inputFieldPremium = page.locator(`xpath=${inputPremium}`);
    //   await inputFieldPremium.click();
    //   await inputFieldPremium.fill('');
    //   await inputFieldPremium.fill(totalPremiumText);
    //   await page.pause();
    //   await page.getByRole('button', { name: 'บันทึก' }).click();
    //   await page.getByRole('button', { name: 'ยืนยัน' }).click();
    const finishTime = new Date();

    console.log(`Test ชุดที่ ${idx + 1} finished at: ${finishTime.toLocaleString('th-TH', { hour12: false })}`);
    console.log(`log ชุดที่ ${idx + 1} `, log)

  });
});                 