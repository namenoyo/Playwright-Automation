import { test,expect } from '@playwright/test';
import { caseDatas } from './data/newCase.data.js';

caseDatas.forEach((data, idx) => {
  test(`test บันทึกเคสใหม่ ชุดที่ ${idx + 1} `, async ({ page }) => {

    let popupMassage = null;

    page.on('dialog', async dialog => {
      popupMassage = dialog.message();
      await dialog.accept();
    });

    //เข้า web
    if(data.syetem === 'UAT') {
      await page.goto('https://uatnbs.thaisamut.co.th/nbsweb/secure/home.html'); //ใส่ url
    }
    else {
      await page.goto('https://sitnbs.thaisamut.co.th/nbsweb/secure/home.html'); //ใส่ url
    }

    //login
    await page.locator('#username').click();
    await page.locator('#username').fill(data.username); //ใส่ username
    await page.locator('#password').click();
    await page.locator('#password').fill('123'); //ใส่ password
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
    await page.selectOption('#cardCusType', { label: data.cardType }); //เลือกประเภทบัตร
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
    await page.locator('#birthDateCus').fill(data.birthDate); //วันเกิด ddmmyyyy

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
    await page.locator('#requestDatePdpa').click();
    await page.locator('#requestDatePdpa').fill(data.requestDatePdpa); //วันเขียนใบคำขอ
    await page.locator('#expireDate').click();
    await page.locator('#expireDate').fill(data.expireDate); //วันบัตรหมดอายุ
    await page.selectOption('#checkCard', { label: data.checkCard }); //เลือกประเภทบัตร
    await page.locator('#phoneMobile').click();
    await page.locator('#phoneMobile').fill(data.phoneMobile);

    //ที่อยู่
    await page.locator('#homeNo').click();
    await page.locator('#homeNo').fill(data.homeNo); //บ้านเลขที่
    await page.selectOption('#province', { label: data.province }); //เลือกจังหวัด
    await page.selectOption('#district', { label: data.district }); //เลือกอำเภอ
    await page.selectOption('#subdistrict', { label: data.subdistrict }); //เลือกตำบล

    //อาชีพ
    await page.selectOption('#occupationList', { label: data.occupation }); //เลือกอาชีพ
    await page.locator('#rMotorcycleNotuse').click();

    //แบบประกัน
    await page.locator('#tempRecieptDate').fill(data.tempRecieptDate); // วันที่ใบรับเงินชั่วคราว

    // bug //
    await page.locator('#plan').click();
    await page.locator('#plan').click();
    await page.locator('#plan').click();
    await page.locator('#plan').click();
    await page.selectOption('#plan', { label: '188 วางใจคุ้มค่า' });
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
    await page.selectOption('#listBenefAddress', { label: data.benefAddress }); //เลือกที่อยู่ผู้รับผลประโยชน์
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
    await page.locator('#height').click();
    await page.locator('#height').fill(data.height); //ใส่ส่วนสูง
    await page.locator('#weight').click();
    await page.locator('#weight').fill(data.weight); //ใส่น้ำหนัก
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
    await page.getByRole('button', { name: 'บันทึก' }).click();
    //----------------------- เชคUW ----------------------------------
    await Promise.race([
      page.waitForSelector('#fullSummary-panel #oMainInfo', { timeout: 100000 }),
      page.waitForSelector('#summary-panel #oMainInfo', { timeout: 100000 })
    ]);

    console.log('oMainInfo visible:', await page.locator('#fullSummary-panel #oMainInfo').isVisible());
    console.log('summary-pane visible:', await page.locator('#summary-panel #oMainInfo').isVisible());

    let allText = '';

    if (await page.locator('#fullSummary-panel #oMainInfo').isVisible()) {
      const divLocator = page.locator('#fullSummary-panel #oMainInfo div').filter({
        hasText: /^ใบคำขอฯเลขที่/
      });
      const divText = await divLocator.first().innerText();

      const tableTextArr = await page.locator('#fullSummary-panel #oMainInfo .summary-content table td').allTextContents();
      const tableText = tableTextArr.join('\n');
      allText = `${divText}\n${tableText}`;

      const page1Promise = page.waitForEvent('popup');
      await page.getByRole('button', { name: 'ยืนยัน' }).click();
      const page1 = await page1Promise;
    } else if (await page.locator('#summary-panel #oMainInfo').isVisible()) {
      const divText = await page.locator('#summary-panel #oMainInfo div').first().innerText();
      const tableTextArr = await page.locator('#summary-panel #oMainInfo .summary-content table td').allTextContents();
      const tableText = tableTextArr.join('\n');
      allText = `${divText}\n${tableText}`;
    }

      await page.getByRole('button', { name: 'ยกเลิก' }).click();//เปลี่ยนเป็นยืนยันด้วย


      console.log('All summary text:', allText);
      data.program_output = allText;

      // หลังจากอัพเดท data.program_output แล้ว ให้เขียนกลับลงไฟล์ testcase.data.js
      fs.writeFileSync(
      './data/testcase.data.js',
      `export const caseDatas = ${JSON.stringify(caseDatas, null, 2)};\n`,
      { encoding: 'utf8' }
    );
    //------------------------------------------------------------------------------------------------------

    //---------------------------- เชคแบบประกัน == ใบคำขอ ---------------------------------------------------------
    const expectedRequestId = data.requestId;
    const expectedCell6 = data.plan;

    // ดึง rows ทั้งหมดใน table
    const rows = await page.locator('#newcaseshortly-list-bd table tr').all();

    let found = false;

    for (const row of rows) {
      const cells = await row.locator('td').allTextContents();
      if (cells[0] === expectedRequestId) {
        expect(cells[5]).toBe(expectedCell6);
        found = true;
        console.log('Matched row:', cells);
        break;
      }
    }

    if (!found) {
      throw new Error(`ไม่พบ row ที่มีเลขใบคำขอ ${expectedRequestId}`);
    }


    if (!found) {
      throw new Error(`ไม่พบ row ที่มีเลขใบคำขอ ${expectedRequestId}`);
    }
    //-------------------------------------------------------------------------------------------------------------

  });
});