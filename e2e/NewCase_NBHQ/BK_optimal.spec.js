import { test, expect } from '@playwright/test';
import writeHelpers from './data/write-result.js';

// ปรับแก้ล่าสุด เรื่องการกรอกชื่อบัญชีให้ดึงจากข้อมูลลูกค้าแทนการ hardcode

async function waitOptionalLoading(page, text = 'กรุณารอสักครู่...') {
  const loading = page.getByText(text);
  try {
    await loading.waitFor({ state: 'visible', timeout: 3000 });
    await loading.waitFor({ state: 'hidden', timeout: 60000 });
  } catch {
    // ไม่ขึ้นก็ถือว่าปกติ
  }
}

async function fillAndVerify(locator, value, options = {}) {
  const {
    timeout = 5000,
    retry = 2,
    delayAfterFill = 150,
    label = 'field',
    matchMode = 'includes', // includes | exact
  } = options;

  const expected = String(value ?? '').trim();
  let lastValue = '';

  for (let attempt = 1; attempt <= retry + 1; attempt++) {
    await locator.click();
    await locator.fill(expected);

    if (delayAfterFill) {
      await locator.page().waitForTimeout(delayAfterFill);
    }

    try {
      await expect(locator).toBeVisible({ timeout });

      lastValue = await locator.inputValue();

      const ok =
        matchMode === 'exact'
          ? lastValue.trim() === expected
          : lastValue.includes(expected);

      if (ok) {
        return;
      }
    } catch {
      // ปล่อยไป retry ด้านล่าง
    }

    if (attempt <= retry) {
      console.log(`⚠️ retry fill ${label} รอบที่ ${attempt} | expected="${expected}" | actual="${lastValue}"`);
      await locator.fill('');
      await locator.page().waitForTimeout(200);
    }
  }

  throw new Error(`fillAndVerify failed: ${label} | expected="${expected}" | actual="${lastValue}"`);
}

async function fillTabAndVerify(locator, value, options = {}) {
  const {
    timeout = 5000,
    retry = 2,
    delayAfterFill = 150,
    delayAfterTab = 300,
    label = 'field',
    matchMode = 'includes',
    duplicateMessage = '',
    duplicateTimeout = 2000,
  } = options;

  const expected = String(value ?? '').trim();
  let lastValue = '';
  const page = locator.page();

 async function throwIfDuplicatePopup() {
  if (!duplicateMessage) return;

  const dialog = page.getByRole('dialog');
  const duplicatePopup = dialog.getByText(duplicateMessage, { exact: true });

  try {
    await duplicatePopup.waitFor({ state: 'visible', timeout: duplicateTimeout });

    console.log(`❌ พบ popup ซ้ำ ${label}: ${duplicateMessage}`);

    const closeBtn = dialog.getByRole('button', { name: /close/i });
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click().catch(() => {});
    }

    throw new Error(duplicateMessage);
  } catch (err) {
    const msg = String(err?.message || err);

    // 1) ถ้าเป็น timeout จากการรอ popup = ไม่เจอ popup -> ปล่อยผ่าน
    if (
      /locator\.waitFor: Timeout/i.test(msg) ||
      /Timeout \d+ms exceeded/i.test(msg)
    ) {
      return;
    }

    // 2) ถ้า page/context ถูกปิด
    if (/Target page, context or browser has been closed/i.test(msg)) {
      throw err;
    }

    // 3) ถ้าเป็น error ที่เรา throw เอง เพราะเจอ popup จริง
    if (msg === duplicateMessage) {
      throw err;
    }

    // 4) อื่น ๆ ค่อยโยนต่อ
    throw err;
  }
}

  for (let attempt = 1; attempt <= retry + 1; attempt++) {
    await locator.click();
    await locator.fill(expected);

    if (delayAfterFill) {
      await page.waitForTimeout(delayAfterFill);
    }

    await locator.press('Tab');

    if (delayAfterTab) {
      await page.waitForTimeout(delayAfterTab);
    }

    // รอ popup เลขซ้ำแบบจริงจัง ไม่ใช่เช็ควูบเดียว
    await throwIfDuplicatePopup();

    try {
      await expect(locator).toBeVisible({ timeout });
      lastValue = await locator.inputValue();

      const ok =
        matchMode === 'exact'
          ? lastValue.trim() === expected
          : lastValue.includes(expected);

      if (ok) return;
    } catch {
      // ไปเช็คก่อน retry ด้านล่าง
    }

    // เช็คอีกที ก่อนจะ retry
    await throwIfDuplicatePopup();

    if (attempt <= retry) {
      console.log(`⚠️ retry fill+tab ${label} รอบที่ ${attempt} | expected="${expected}" | actual="${lastValue}"`);
      await locator.fill('');
      await page.waitForTimeout(200);
    }
  }

  throw new Error(`fillTabAndVerify failed: ${label} | expected="${expected}" | actual="${lastValue}"`);
}

const { fetchRunnableCases, claimCase, writeResult } = writeHelpers;

test('NBHQ realtime runner', async ({ browser }) => {
  test.setTimeout(0);

  let idx = 0;

  while (true) {
    const caseDatas = await fetchRunnableCases();

    if (!caseDatas.length) {
      console.log('🎉 ไม่มีเคสให้รันแล้ว');
      break;
    }

    const finalData = caseDatas[0];
    idx++;

    console.log(`🚀 เริ่มรันใบคำขอที่ [${idx}] - ${finalData.applicationNo}`);

    const startTime = Date.now();
    let status = 'FAIL';
    let remark = '';
    let depositReceiptNo = '';

    const claimed = await claimCase(finalData.applicationNo);
    if (!claimed) {
      console.log(`⏭️ Skip ${finalData.applicationNo} because row is not Ready for Test`);
      continue;
    }

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
     
    //SIT
    await page.waitForTimeout(1000);

    if (finalData.environment == 'SIT') {
      await page.goto('https://sitnbs.thaisamut.co.th/nbsweb/secure/home.html');
        await page.locator('#username').click();
        await page.locator('#username').fill('0001');
        await page.locator('#password').click();
        await page.locator('#password').fill('12');
        await page.getByRole('button', { name: 'Login' }).click();
        await page.waitForTimeout(300);
        await page.getByRole('menuitem', { name: 'ระบบงานให้บริการ' }).click();
        await page.getByRole('menuitem', { name: 'ระบบจัดการข้อมูลเคสใหม่ สำนักงานใหญ่' }).click();
        await page.waitForTimeout(300);
        await page.goto('https://intranet-api.ochi.link/thaisamut/web/nbentry/index.html#home');
        await page.waitForTimeout(300);
      } else if (finalData.environment == 'UAT') {
        await page.goto('https://uatnbs.thaisamut.co.th/nbsweb/secure/home.html');
        await page.locator('#username').click();
        await page.locator('#username').fill('0001');
        await page.locator('#password').click();
        await page.locator('#password').fill('12');
        await page.getByRole('button', { name: 'Login' }).click();
        await page.waitForTimeout(300);
        await page.getByRole('menuitem', { name: 'ระบบงานให้บริการ' }).click();
        await page.getByRole('menuitem', { name: 'ระบบจัดการข้อมูลเคสใหม่ สำนักงานใหญ่' }).click();
        await page.waitForTimeout(300);
        await page.goto('https://uat-intranet-api.ochi.link/thaisamut/web/nbentry/index.html#home');
        await page.waitForTimeout(300);
      }

    console.log("Pass Login")
    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`⏱️ ใช้เวลาไป ${elapsedSec}s`);
    await page.getByRole('button', { name: ' จัดการข้อมูลเคสใหม่' }).click();
    await page.getByRole('button', { name: 'บันทึกข้อมูลเคสใหม่' }).click();
    await page.getByRole('button', { name: 'เพิ่มข้อมูลใหม่' }).click();
    await page.getByRole('button', { name: `Application Code : ${'02052'} ใบคำขอเอาประกันชีวิตประเภทสามัญ` }).click();
    await page.getByRole('button', { name: 'เพิ่มข้อมูลใหม่' }).click();

   await page.waitForTimeout(1000);
    await page.getByLabel('ประเภทบัตร').click();
    await page.getByText('เลขประจำตัว 13 หลัก', { exact: true }).click();
  await page.waitForTimeout(1000);

    await page.getByRole('dialog', { name: 'ค้นหาหรือเพิ่มสำหรับเลือกข้อมูลลูกค้าเพื่อทำการบันทึกเคสใหม่ จากระบบ CIS Close' }).locator('#cardNo').click();
    await page.getByRole('dialog', { name: 'ค้นหาหรือเพิ่มสำหรับเลือกข้อมูลลูกค้าเพื่อทำการบันทึกเคสใหม่ จากระบบ CIS Close' }).locator('#cardNo').fill(finalData.cardNo);
    await page.getByLabel('คำนำหน้า').click();
    await page.getByLabel('คำนำหน้า').fill(finalData.cusTitlePrefix);
    await page.getByLabel('คำนำหน้า').press('Tab');

    // Function to get the current date in Thai Buddhist year format
    function getThaiBuddhistDate(date = new Date()) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear() + 543; // แปลงจากปีคริสต์ศักราชเป็นปีพุทธศักราช
      return `${day}/${month}/${year}`;
    }
    // ฟังก์ชันหลัก: แปลงอายุให้เป็นวันเกิด
    function generateBirthDateFromAge(age, currentDateString) {
      // 1. ดึงปีปัจจุบัน (พ.ศ.) จาก currentDateString
      const parts = currentDateString.split('/');
      const currentYearBE = parseInt(parts[2], 10);
      // 2. คำนวณปีเกิด (พ.ศ.) โดยใช้ 'age' ที่เป็น parameter
      const birthYearBE = currentYearBE - age;
      // 3. กำหนดวันเกิดเป็น "01/01/ปีที่เกิด"
      const birthDate = `01/01/${birthYearBE}`;
      return birthDate;
    }
    // 1. สร้างวันที่ปัจจุบัน
    const currentDate = getThaiBuddhistDate();
    // 2. เรียกใช้ฟังก์ชันเพื่อคำนวณวันเกิดและเก็บผลลัพธ์ลงในตัวแปร birthDate
    const birthDate = generateBirthDateFromAge(finalData.age, currentDate);
    console.log(`วันที่ปัจจุบัน: ${currentDate}`);
    console.log(`วันเกิดที่คำนวณได้: ${birthDate}`);
    await page.getByRole('dialog', { name: 'ค้นหาหรือเพิ่มสำหรับเลือกข้อมูลลูกค้าเพื่อทำการบันทึกเคสใหม่ จากระบบ CIS Close' }).locator('#name').click();
    await page.getByRole('dialog', { name: 'ค้นหาหรือเพิ่มสำหรับเลือกข้อมูลลูกค้าเพื่อทำการบันทึกเคสใหม่ จากระบบ CIS Close' }).locator('#name').fill(finalData.cusName);
    await page.getByRole('dialog', { name: 'ค้นหาหรือเพิ่มสำหรับเลือกข้อมูลลูกค้าเพื่อทำการบันทึกเคสใหม่ จากระบบ CIS Close' }).locator('#surname').click();
    await page.getByRole('dialog', { name: 'ค้นหาหรือเพิ่มสำหรับเลือกข้อมูลลูกค้าเพื่อทำการบันทึกเคสใหม่ จากระบบ CIS Close' }).locator('#surname').fill(finalData.cusSurname);
    await page.getByRole('textbox', { name: 'วันเกิด *' }).click();
    await page.getByRole('textbox', { name: 'วันเกิด *' }).fill(birthDate);
    await page.getByRole('textbox', { name: 'วันเกิด *' }).press('Tab');

    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: 'ยืนยัน' }).click();
    await page.getByRole('button', { name: 'ตกลง' }).click();
    // หน้าบันทึกและแก้ไขข้อมูลเคสใหม่
    // Category เลขที่ใบคำขอ
 await page.waitForTimeout(1000);
const appNoInput = page.locator('#section-main #applicationNo');

await fillTabAndVerify(appNoInput, finalData.applicationNo, {
  label: 'Application No',
  matchMode: 'exact',
  duplicateMessage: 'เลขที่ใบคำขอฯนี้มีอยู่ในระบบแล้ว',
  duplicateTimeout: 1200,
});

// ดัก popup เลขใบคำขอซ้ำ
// const duplicateDialog = page.getByRole('dialog');
// const duplicateMessage = duplicateDialog.getByText('เลขที่ใบคำขอฯนี้มีอยู่ในระบบแล้ว', {
//   exact: true,
// });

// let isDuplicateAppNo = false;

// try {
//   await duplicateMessage.waitFor({ state: 'visible', timeout: 2500 });
//   isDuplicateAppNo = true;
// } catch {
//   isDuplicateAppNo = false;
// }

// if (isDuplicateAppNo) {
//   console.log('❌ พบ popup: เลขที่ใบคำขอฯนี้มีอยู่ในระบบแล้ว');

//   // ปิด popup ไว้ก่อน เผื่อหน้าค้าง
//   const closeBtn = duplicateDialog.getByRole('button', { name: /close/i });
//   if (await closeBtn.isVisible().catch(() => false)) {
//     await closeBtn.click().catch(() => {});
//   }

//   throw new Error('เลขที่ใบคำขอฯนี้มีอยู่ในระบบแล้ว');
// }


    await page.waitForTimeout(1000);
    await page.getByRole('textbox', { name: 'วันที่เขียนใบคำขอ *' }).click();
    await page.getByLabel('วันที่เขียนใบคำขอ *').fill(currentDate + '_');
    await page.waitForTimeout(1000);

      // Category ข้อมูลตัวแทน
    await page.getByLabel('ตัวแทนเจ้าของผลงาน *').click();
    await page.getByRole('textbox', { name: 'ตัวแทนเจ้าของผลงาน *' }).fill(finalData.agentCode);
    await page.getByRole('textbox', { name: 'ตัวแทนเจ้าของผลงาน *' }).press('Tab');
await page.waitForTimeout(1000);

   // Category รหัสสถาบัน/ คู่ค้า
    await page.getByLabel('รหัสสถาบัน/ คู่ค้า (Partner) *').click();
    await page.getByRole('textbox', { name: 'รหัสสถาบัน/ คู่ค้า (Partner) *' }).fill(finalData.partnerNo);
    await page.waitForTimeout(500);
    await page.getByRole('textbox', { name: 'รหัสสถาบัน/ คู่ค้า (Partner) *' }).press('Tab');
    await page.waitForTimeout(1500);
    await page.getByText('ยืนยันมีรูปถ่าย Selfie').click();

    // Category ข้อมูลผู้เอาประกัน
    await page.getByRole('textbox', { name: 'วันที่บัตรหมดอายุ *' }).click();
    // 1. สร้าง Object Date สำหรับวันที่ปัจจุบัน
    const currentDate2 = new Date();
    // 2. สร้าง Object Date ใหม่โดยเพิ่มปีไปอีก 10 ปี
    const futureDate = new Date();
    futureDate.setFullYear(currentDate2.getFullYear() + 10);
    // 3. จัดรูปแบบวันที่ในอีก 10 ปีข้างหน้าให้เป็นปีพุทธศักราช
    const formattedFutureDate = getThaiBuddhistDate(futureDate);
    // 4. นำวันที่ที่ได้ไปกรอกในช่อง
    await page.getByRole('textbox', { name: 'วันที่บัตรหมดอายุ *' }).fill(formattedFutureDate + '_');
    await page.getByRole('textbox', { name: 'วันที่บัตรหมดอายุ *' }).press('Tab');
    await page.waitForTimeout(300);
    await page.getByRole('textbox', { name: 'สัญชาติ *' }).click();
    await page.getByRole('textbox', { name: 'สัญชาติ *' }).fill('ไทย');
    await page.waitForTimeout(1000);
    await page.getByRole('textbox', { name: 'สัญชาติ *' }).press('Tab');
    await page.waitForTimeout(1000);
    await page.getByRole('textbox', { name: 'เอกสารที่ใช้แสดง * เอกสารที่ใช้แสดง' }).click();
    await page.getByRole('textbox', { name: 'เอกสารที่ใช้แสดง * เอกสารที่ใช้แสดง' }).fill('บัตรประจำตัวประชาชน');
    await page.getByRole('textbox', { name: 'เอกสารที่ใช้แสดง * เอกสารที่ใช้แสดง' }).press('Tab');
   await page.waitForTimeout(300);
    await page.getByLabel('สถานภาพ *').click();
    await page.getByRole('textbox', { name: 'สถานภาพ *' }).fill('โสด');
    await page.getByRole('textbox', { name: 'สถานภาพ *' }).press('Tab');

    // Category ที่อยู่และที่ทำงาน
    await page.locator('#registerHouseNo').click();
    //await page.locator('#registerHouseNo').fill('123');

    await fillAndVerify(page.locator('#registerHouseNo'), '123', {
  label: 'เลขที่บ้าน',
  matchMode: 'exact',
});

    await page.locator('#registerProvinceCode').click();
    await page.locator('#registerProvinceCode').fill('กระบี่');
    await page.locator('#registerProvinceCode').press('Tab');
    await page.waitForTimeout(500);
    await page.locator('#registerDistrictCode').click();
    await page.locator('#registerDistrictCode').fill('เมืองกระบี่');
    await page.locator('#registerDistrictCode').press('Tab');
    await page.waitForTimeout(500);
    await page.locator('#registerSubDistrictCode').click();
    await page.locator('#registerSubDistrictCode').fill('เขาคราม');
    await page.locator('#registerSubDistrictCode').press('Tab');
    await page.waitForTimeout(500);
    await page.locator('#currentUseAddressTypeCode').click();
    await page.locator('#currentUseAddressTypeCode').fill('ที่อยู่ตามทะเบียนบ้านของผู้เอาประกัน');
    await page.locator('#currentUseAddressTypeCode').press('Tab');
    await page.waitForTimeout(500);
    await page.getByRole('radio', { name: 'ที่อยู่ปัจจุบัน' }).click();
    await page.waitForTimeout(400);
    console.log("Pass Address")
    const elapsedSec2 = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`⏱️ ใช้เวลาไป ${elapsedSec2}s`);
    // ฟังก์ชันสำหรับสร้างเบอร์โทรศัพท์มือถือ 10 หลักแบบสุ่ม
    function generatePhoneNumber() {
      // สร้างตัวเลขนำหน้า (06, 08, หรือ 09)
      const prefixes = ['06', '08', '09'];
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      // สร้างตัวเลขสุ่ม 8 หลักที่เหลือ
      let remainingDigits = '';
      for (let i = 0; i < 8; i++) {
        remainingDigits += Math.floor(Math.random() * 10);
      }
      return prefix + remainingDigits;
    }
    // Category ข้อมูลติดต่อ
    const randomPhone = generatePhoneNumber();
    // ล็อกเบอร์โทรศัพท์ที่สร้างขึ้นมาเพื่อตรวจสอบ
    console.log(`เบอร์โทรศัพท์: ${randomPhone}`);
    await page.getByRole('textbox', { name: 'โทรศัพท์มือถือ *' }).click();
    // ส่งค่าที่สร้างแบบสุ่มเข้าไปกรอกโดยตรง
    await page.getByRole('textbox', { name: 'โทรศัพท์มือถือ *' }).fill(randomPhone);
    await page.waitForTimeout(1000);
    await page.getByText('อีเมล').nth(1).click();
    await page.getByText('อีเมล').nth(1).fill(finalData.email);
    await page.waitForTimeout(1000);

    if (finalData.paperOrElectronic === 'กระดาษ') {
      // Category รูปแบบกรมธรรม์
      await page.getByText('แบบรูปเล่มกระดา').first().click(); // แก้ Selector ให้ถูกต้องหาก text คือ 'แบบรูปเล่มกระดาษ'
      await page.getByRole('textbox', { name: 'ส่งเอกสารกรมธรรม์ที่ *' }).click();
      await page.getByRole('textbox', { name: 'ส่งเอกสารกรมธรรม์ที่ *' }).fill('ส่งตรงลูกค้า'); // ยังคง Hardcode หรือเพิ่มใน NewCaseData
      await page.waitForTimeout(1000);
      await page.getByRole('textbox', { name: 'ส่งเอกสารกรมธรรม์ที่ *' }).press('Tab');
      await page.getByText('แบบรูปเล่มกระดา').nth(1).click(); // แก้ Selector ให้ถูกต้องหาก text คือ 'แบบรูปเล่มกระดาษ'
      await page.waitForTimeout(1000);
    }
    else if (finalData.paperOrElectronic === 'อิเล็กทรอนิกส์') {
      // Category รูปแบบกรมธรรม์
      await page.getByText('แบบอิเล็กทรอนิกส์').first().click();
      await page.waitForTimeout(1000);
      await page.getByText('แบบอิเล็กทรอนิกส์ โดยจัดส่งตามอีเมล').nth(1).click();
      await page.waitForTimeout(1000);
    }
    console.log("Pass Estamp")
    const elapsedSec3 = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`⏱️ ใช้เวลาไป ${elapsedSec3}s`);
    // Category อาชีพ     
    await page.getByRole('textbox', { name: 'อาชีพ *' }).click();
    await page.getByRole('textbox', { name: 'อาชีพ *' }).fill(finalData.occupationCode);
    await page.getByRole('textbox', { name: 'อาชีพ *' }).press('Tab');
    // await page.getByRole('textbox', { name: 'ตำแหน่ง *' }).click();
    // await page.getByRole('textbox', { name: 'ตำแหน่ง *' }).fill('ทั่วไป');
    // await page.getByRole('textbox', { name: 'ตำแหน่ง *' }).press('Tab');
    await page.getByRole('textbox', { name: 'ตำแหน่ง' }).click();
    await page.getByRole('textbox', { name: 'ตำแหน่ง' }).fill('ทั่วไป');
    await page.getByRole('textbox', { name: 'ตำแหน่ง' }).press('Tab');
    await page.getByRole('textbox', { name: 'รายได้ต่อปี *' }).click();
    await page.getByRole('textbox', { name: 'รายได้ต่อปี *' }).fill('800000');
    await page.getByRole('textbox', { name: 'รายได้ต่อปี *' }).press('Tab');
    await page.getByText('ไม่ใช้').first().click();
    console.log("Pass Occupation")
    const elapsedSec4 = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`⏱️ ใช้เวลาไป ${elapsedSec4}s`);
    //case finalData.policyName = a18,19,20 มันให้กรอกเบี้ยแทนทุน
    if (finalData.policyName.includes('โอเชี่ยนไลฟ์ โอชิ แพลน 18/10')) {
      await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).click();
      await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).fill(finalData.policyName);
      await page.waitForTimeout(1000);
      await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).press('Tab');
      await page.waitForTimeout(1000);
      await page.getByRole('textbox', { name: 'เบี้ยประกันภัยรวม *' }).click();
      await page.waitForTimeout(2000);
      await page.getByRole('textbox', { name: 'เบี้ยประกันภัยรวม *' }).fill(finalData.insuredAmount);
      await page.waitForTimeout(1000);
      await page.getByRole('textbox', { name: 'เบี้ยประกันภัยรวม *' }).press('Tab');
      await page.waitForTimeout(1000);
      try {
        const closeBtn = page.getByRole('button', { name: 'Close' });
        await closeBtn.waitFor({ state: 'visible', timeout: 3000 });
        await closeBtn.click();
        console.log('✅ เจอ Pop Up ระบุว่าต้องกรอกเบี้ย range ใด');
      }
      catch {
        console.log('⏩ ไม่เจอ Pop Up ระบุว่าต้องกรอกเบี้ย range ใด');
      }
    }

    //แบบประกันปกติ
    else {
      await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).click();
      await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).type(finalData.policyName, { delay: 100 });
      await page.waitForTimeout(1000);
      await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).press('Tab');
      await page.waitForTimeout(1000);
      // await expect(page.getByText('กรุณารอสักครู่...')).toBeVisible({ timeout: 60000 });
      // await expect(page.getByText('กรุณารอสักครู่...')).not.toBeVisible({ timeout: 60000 });

      await waitOptionalLoading(page);

      await page.getByRole('textbox', { name: 'จำนวนเงินเอาประกันภัย *' }).type(finalData.insuredAmount, { delay: 100 });
      await page.waitForTimeout(1000);
      await page.getByRole('textbox', { name: 'จำนวนเงินเอาประกันภัย *' }).press('Tab');
      // await page.waitForTimeout(3000);
      // await expect(page.getByText('กรุณารอสักครู่...')).toBeVisible({ timeout: 60000 });
      // await expect(page.getByText('กรุณารอสักครู่...')).not.toBeVisible({ timeout: 60000 });
      await waitOptionalLoading(page);

      await page.getByRole('textbox', { name: 'งวดการชำระ *' }).click();
      await page.getByRole('textbox', { name: 'งวดการชำระ *' }).type(finalData.paymentPeriod, { delay: 100 });
      await page.getByRole('textbox', { name: 'งวดการชำระ *' }).press('Tab');
      await page.waitForTimeout(1000);
      //แบบประกันหายเลือกกดอีกครั้ง
      await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).click();
      await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).type(finalData.policyName, { delay: 100 });
      await page.waitForTimeout(1000);
      await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).press('Tab');
      await page.waitForTimeout(1000);
    }
    console.log("Pass Main Insurance")
    const elapsedSec5 = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`⏱️ ใช้เวลาไป ${elapsedSec5}s`);
    //A18 พัง
    // await page.getByRole('textbox', { name: 'งวดการชำระ *' }).click();
    // await page.getByRole('textbox', { name: 'งวดการชำระ *' }).fill(finalData.paymentPeriod);
    // await page.getByRole('textbox', { name: 'งวดการชำระ *' }).press('Tab');
    //await page.waitForTimeout(5000);

    // เก็บจำนวนสัญญาเพิ่มเติม
    let numRider = 0;
    for (const rider of finalData.riders) {
      await page.waitForTimeout(1500);
      await page.getByRole('button', { name: 'เพิ่มสัญญาเพิ่มเติม', exact: true }).click();
      await page.getByRole('textbox', { name: 'ชื่อสัญญาเพิ่มเติม *' }).click();
      await page.getByRole('textbox', { name: 'ชื่อสัญญาเพิ่มเติม *' }).fill(rider.ridername);
      await page.getByRole('textbox', { name: 'ชื่อสัญญาเพิ่มเติม *' }).press('Tab');
      await page.waitForTimeout(1000);
      await page.getByText('กรุณาเลือก').click();
      await page.getByRole('textbox', { name: 'ทุนประกันภัย/แผนความคุ้มครอง *' }).fill(rider.ridercapital);
      await page.getByRole('textbox', { name: 'ทุนประกันภัย/แผนความคุ้มครอง *' }).press('Tab');
      await page.waitForTimeout(1500);
      await page.getByRole('button', { name: 'เพิ่ม' }).click();
      await page.waitForTimeout(1000);
      numRider++;
    }
    console.log("Pass Rider")
    const elapsedSec6 = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`⏱️ ใช้เวลาไป ${elapsedSec6}s`);
    console.log(`จำนวนสัญญาเพิ่มเติมที่เพิ่มที่ถูกเพิ่ม: ${numRider} รายการ`);
    await page.waitForTimeout(1000);

    // ดึงข้อมูลทั้งหมดจากหน้าเว็บ
    const draftPremium3 = await page.locator('td.MuiTableCell-body.MUIDataTableBodyCell-root-58').allTextContents();

    let premiumPay;
    let filledPay = 0; // ✅ ประกาศนอก loop เพื่อเก็บค่ารวม
    let insuMainIndex = -1; // ประกาศตัวแปรเพื่อเก็บ index ของแบบประกันหลัก
    insuMainIndex = draftPremium3.findLastIndex(text => text.includes(finalData.policyName));

    if (insuMainIndex !== -1) {
      const insuMain = draftPremium3[insuMainIndex];
      const insuMoney = draftPremium3[insuMainIndex + 4];
      const insuPremium = parseFloat(draftPremium3[insuMainIndex + 6]?.replace(/,/g, '')) || 0;
      const insuSpePremium = parseFloat(draftPremium3[insuMainIndex + 8]?.replace(/,/g, '')) || 0;
      const insuCommis = draftPremium3[insuMainIndex + 12];

      // ✅ รวมเบี้ยหลักกับเบี้ยพิเศษหลักก่อน
      filledPay = insuPremium + insuSpePremium;
      if (finalData.policyName.includes('โอเชี่ยนไลฟ์ โอชิ แพลน 18/10')) {
        finalData.riders.unshift({ ridername: "CPA.2.13", ridercapital: "10000" })
      };

      const riders = [];
      let lastRiderIndex = insuMainIndex;

      for (const riderConfig of finalData.riders) {
        const riderNameIndex = draftPremium3.findIndex((text, index) => {
          // ค้นหาข้อความชื่อ rider ที่อยู่หลังจากตำแหน่งของ rider ตัวล่าสุด
          return index > lastRiderIndex && text.includes(riderConfig.ridername);
        });

        if (riderNameIndex !== -1) {
          const riderPremium = parseFloat(draftPremium3[riderNameIndex + 6]?.replace(/,/g, '')) || 0;
          const riderSpePremium = parseFloat(draftPremium3[riderNameIndex + 8]?.replace(/,/g, '')) || 0;

          const rider = {
            name: draftPremium3[riderNameIndex],
            money: draftPremium3[riderNameIndex + 4],
            premium: riderPremium,
            spePremium: riderSpePremium,
            commis: draftPremium3[riderNameIndex + 12],
          };
          riders.push(rider);
          lastRiderIndex = riderNameIndex;
          // ✅ รวมเบี้ยของ Rider ทุกตัวด้วย
          filledPay += riderPremium + riderSpePremium;
        }
      }

      // ค้นหา index ของข้อความ "รวมทั้งหมด"
      const premiumPayKeywordIndex = draftPremium3.findIndex((text, index) => {
        return index > lastRiderIndex && text.includes('รวมทั้งหมด');
      });

      if (premiumPayKeywordIndex !== -1) {
        const premiumPayIndex = premiumPayKeywordIndex + 6;
        premiumPay = draftPremium3[premiumPayIndex] ?? 'ไม่พบข้อมูลเนื่องจาก Index อยู่นอกขอบเขต';
      } else {
        premiumPay = 'ไม่พบ Keyword "รวมทั้งหมด"';
      }

      console.log(`แบบประกันหลัก: ${insuMain}`);
      console.log(`จำนวนเงินเอาประกันภัยหลัก: ${insuMoney}`);
      console.log(`เบี้ยประกันภัยหลัก: ${insuPremium}`);
      console.log(`เบี้ยเพิ่มพิเศษหลัก: ${insuSpePremium}`);
      console.log(`ค่าบำเหน็จหลัก: ${insuCommis}`);
      console.log('-------------------------------');
      console.log(`จำนวนสัญญาเพิ่มเติมทั้งหมด: ${riders.length} รายการ`);
      riders.forEach((rider, index) => {
        console.log(`Rider ตัวที่ ${index + 1}: ${rider.name}`);
        console.log(`  - จำนวนเงินเอาประกันภัย: ${rider.money}`);
        console.log(`  - เบี้ยประกันภัย: ${rider.premium}`);
        console.log(`  - เบี้ยเพิ่มพิเศษ: ${rider.spePremium}`);
        console.log(`  - ค่าบำเหน็จ: ${rider.commis}`);
      });
      console.log('-------------------------------');
      console.log(`ค่า Premium ที่ชำระที่ยังไม่รวมเบี้ยเพิ่มพิเศษ: ${premiumPay}`);
      console.log(`✅ รวมเบี้ยทั้งหมด (filledPay) คือค่าเบี้ย หลัก บวก rider ที่ซื้อเท่านั้น ไม่ได้คิด bundle ที่แถมมา: ${filledPay}`);
    } else {
      console.log('ไม่พบแบบประกันหลักที่กำหนด');
    }
    console.log("Pass Display Insurance Money")
    const elapsedSec7 = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`⏱️ ใช้เวลาไป ${elapsedSec7}s`);
    //Error Premium Check
    //const cells = await page.$$eval('td.MuiTableCell-root.MuiTableCell-body', els => els.map(e => e.innerText));
    //console.log(JSON.stringify(cells, null, 2));

    //แสดงแค่บางอัน 290 more items
    //const supermapone = await page.locator('td.MuiTableCell-body.MUIDataTableBodyCell-root-58').allTextContents();
    //console.log('ค่าเบี้ยทั้งหมด:td.MuiTableCell-root.MuiTableCell-body.MUIDataTableBodyCell-root-58', supermapone);

    // Category วิธีการชำระเบี้ย
    await page.waitForTimeout(1000);
    await page.getByText('ชำระเอง').first().click();
    await page.waitForTimeout(100);
    await page.getByText('ชำระเอง').first().click();
    await page.waitForTimeout(100);
    await page.getByText('ชำระเอง').first().click();
    await page.waitForTimeout(1000);
    await page.getByRole('textbox', { name: 'เลขที่ใบรับเงินชั่วคราว *' }).click();
    await page.getByRole('textbox', { name: 'เลขที่ใบรับเงินชั่วคราว *' }).fill(finalData.tempReceiptNo);
    await page.getByRole('textbox', { name: 'เลขที่ใบรับเงินชั่วคราว *' }).press('Tab');
    await page.waitForTimeout(1000);
    await page.getByText('โอนเงินเจ้าของบัญชีเงินฝาก').first().click();
    await page.getByRole('textbox', { name: 'ธนาคาร *' }).click();
    await page.getByRole('textbox', { name: 'ธนาคาร *' }).fill('ธนาคารกรุงเทพ');
    await page.getByRole('textbox', { name: 'ธนาคาร *' }).press('Tab');
    await page.getByRole('textbox', { name: 'สาขา *' }).click();
    await page.getByRole('textbox', { name: 'สาขา *' }).fill('ออโตเมทดาต้า');
    await page.waitForTimeout(1000);
    await page.getByRole('textbox', { name: 'เลขที่บัญชี *' }).click();
    await page.waitForTimeout(1000);
    await page.getByRole('textbox', { name: 'เลขที่บัญชี *' }).fill('1234567890');
    await page.waitForTimeout(1000);
    // await page.getByRole('textbox', { name: 'ชื่อบัญชี *' }).fill('นายเจอเนอเรทดาต้า');

    const prefix = finalData.cusTitlePrefix || '';
const name = finalData.cusName || '';
const surname = finalData.cusSurname || '';

const fullName = `${prefix}${name} ${surname}`.trim();

await page.getByRole('textbox', { name: 'ชื่อบัญชี *' }).fill(fullName);

    await page.getByRole('textbox', { name: 'จำนวนเงิน *' }).click();

    //A18 พัง
    //await page.getByRole('textbox', { name: 'จำนวนเงิน *' }).fill(finalData.insuredAmount);
    // await page.waitForTimeout(1000);
    await page.getByRole('textbox', { name: 'จำนวนเงิน *' }).fill((filledPay ?? 0).toString());
    //await page.getByRole('textbox', { name: 'จำนวนเงิน *' }).fill((premiumPay ?? 0).toString());
    await page.waitForTimeout(1000);
    await page.getByText('รับเช็คทางไปรษณีย์').first().click();
    await page.waitForTimeout(1000);
   // Category จัดการผู้รับผลประโยชน์
const numBeneInt = parseInt(finalData.numBene, 10);

// เปิดหน้าจัดการผู้รับประโยชน์แค่ครั้งเดียว
// await page.getByRole('button', { name: 'จัดการผู้รับประโยชน์' }).click();
// await page.waitForTimeout(500);

if (numBeneInt > 0) {
  await page.getByRole('button', { name: 'จัดการผู้รับประโยชน์' }).click();
  await page.waitForTimeout(500);
}

// วนลูปตามจำนวนผู้รับผลประโยชน์
for (let i = 0; i < numBeneInt; i++) {
  const bene = finalData.bene?.[i];
if (!bene) {
  throw new Error(`bene หาย index=${i} | numBene=${finalData.numBene} | bene.length=${finalData.bene?.length}`);
}

  await page.getByRole('button', { name: 'เพิ่มผู้รับประโยชน์' }).click();

  // ความสัมพันธ์
  await page.getByRole('textbox', { name: 'ความสัมพันธ์ *' }).click();
  await page.getByRole('textbox', { name: 'ความสัมพันธ์ *' }).fill(bene.beneRela);
  await page.getByRole('textbox', { name: 'ความสัมพันธ์ *' }).press('Tab');
  await page.waitForTimeout(500);

  // คำนำหน้า
  await page.getByRole('textbox', { name: 'คำนำหน้า *' }).click();
  await page.getByRole('textbox', { name: 'คำนำหน้า *' }).fill(bene.benePrefix);
  await page.getByRole('textbox', { name: 'คำนำหน้า *' }).press('Tab');
  await page.waitForTimeout(500);

  // ชื่อ
  await page.getByRole('textbox', { name: 'ชื่อ *' }).click();
  await page.getByRole('textbox', { name: 'ชื่อ *' }).fill(bene.beneName);
  await page.waitForTimeout(500);

  // นามสกุล
  await page.getByLabel('จัดการผู้รับประโยชน์').locator('div').filter({ hasText: /^นามสกุล$/ }).nth(1).click();
  await page.getByRole('textbox', { name: 'นามสกุล', exact: true }).fill(bene.beneSurname);
  await page.waitForTimeout(500);

  // อายุ
  await page.getByRole('textbox', { name: 'อายุ *' }).click();
  await page.getByRole('textbox', { name: 'อายุ *' }).fill(bene.beneAge);
  await page.waitForTimeout(500);

  // เฉลี่ยสัดส่วนผลประโยชน์เท่าๆกัน
  await page.getByText('เฉลี่ยสัดส่วนผลประโยชน์เท่าๆกัน').first().click();
  await page.waitForTimeout(1000);

  // ที่อยู่ปัจจุบัน ดึงค่าจากทะเบียนบ้าน
  await page.getByRole('dialog', { name: 'จัดการผู้รับประโยชน์ Close' }).locator('#useAddressTypeCode').click();
  await page.getByRole('dialog', { name: 'จัดการผู้รับประโยชน์ Close' }).locator('#useAddressTypeCode').fill('ที่อยู่ปัจจุบ');
  await page.getByRole('dialog', { name: 'จัดการผู้รับประโยชน์ Close' }).locator('#useAddressTypeCode').press('Tab');
  await page.waitForTimeout(1000);

  // เพิ่มแต่ละคน
  await page.getByRole('button', { name: 'บันทึก(เพิ่ม)' }).click();
  await page.waitForTimeout(500);

  // คนสุดท้ายค่อยกดบันทึกปิด dialog
  if (i === numBeneInt - 1) {
    await page.getByRole('button', { name: 'บันทึก' }).nth(1).click();
    await page.waitForTimeout(1000);
  }
}

    console.log("Pass Beneficiary")
    const elapsedSec8 = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`⏱️ ใช้เวลาไป ${elapsedSec8}s`);
    // Category คำแถลง
    await page.getByText('เลือกคำแถลงเป็น ไม่เคย/ไม่มี/ไม่เปลี่ยน/ไม่เป็น/ไม่สูบ/ไม่ดื่ม ทั้งหมด').first().click();
    await page.waitForTimeout(1000);

    const ageInt = parseInt(finalData.age, 10);
    const gender = finalData.gender; // "ชาย" หรือ "หญิง"
    let randomHeight, randomWeight;
    // ----------- ตารางเกณฑ์ตามอายุ ----------- //
    const maleData = {
      0: { h: [71, 78], w: [3, 9] },
      1: { h: [72, 79], w: [9, 11] },
      2: { h: [85, 93], w: [11, 13] },
      3: { h: [90, 100], w: [13, 17] },
      4: { h: [96, 108], w: [14, 19] },
      5: { h: [102, 115], w: [15, 22] },
      6: { h: [108, 121], w: [17, 25] },
      7: { h: [113, 127], w: [19, 28] },
      8: { h: [118, 133], w: [20, 32] },
      9: { h: [122, 138], w: [22, 36] },
      10: { h: [127, 143], w: [24, 40] },
      11: { h: [131, 149], w: [26, 45] },
      12: { h: [136, 156], w: [29, 50] },
      13: { h: [141, 164], w: [32, 51] },
      14: { h: [148, 170], w: [36, 58] },
      15: { h: [154, 173], w: [41, 61] },
      16: { h: [159, 175], w: [44, 64] },
      17: { h: [161, 177], w: [55, 65] },
      18: { h: [162, 177], w: [55, 66] },
      19: { h: [162, 177], w: [55, 67] },
    };
    const femaleData = {
      0: { h: [68, 77], w: [8, 10] },
      1: { h: [69, 78], w: [8, 10] },
      2: { h: [80, 89], w: [10, 13] },
      3: { h: [89, 99], w: [12, 16] },
      4: { h: [95, 106], w: [13, 19] },
      5: { h: [102, 112], w: [15, 21] },
      6: { h: [108, 120], w: [17, 24] },
      7: { h: [113, 126], w: [18, 28] },
      8: { h: [117, 132], w: [20, 32] },
      9: { h: [122, 139], w: [22, 37] },
      10: { h: [128, 146], w: [24, 42] },
      11: { h: [133, 152], w: [27, 46] },
      12: { h: [139, 156], w: [30, 50] },
      13: { h: [144, 160], w: [33, 53] },
      14: { h: [147, 162], w: [37, 55] },
      15: { h: [149, 163], w: [39, 56] },
      16: { h: [150, 164], w: [41, 57] },
      17: { h: [150, 164], w: [41, 57] },
      18: { h: [150, 164], w: [41, 57] },
      19: { h: [150, 164], w: [41, 57] },
    };
    // ----------- เลือกเพศที่ใช้ ----------- //
    const dataMap = gender === "ชาย" ? maleData : femaleData;
    // fallback สำหรับเกิน 19 ปี
    let data;
    if (ageInt <= 19) {
      data = dataMap[ageInt];
    } else {
      // fallback แยกเพศ
      data = gender === "ชาย" ? { h: [162, 177], w: [55, 67] } : { h: [150, 164], w: [41, 57] };
    }
    // ----------- สุ่มส่วนสูง/น้ำหนัก ----------- //
    // ตัวแปรเดิม
    randomHeight = Math.floor(Math.random() * (data.h[1] - data.h[0] + 1)) + data.h[0];
    randomWeight = Math.floor(Math.random() * (data.w[1] - data.w[0] + 1)) + data.w[0];
    // สร้างตัวแปรใหม่เป็น string
    const randomHeightStr = String(randomHeight);
    const randomWeightStr = String(randomWeight);
    // await page.getByRole('textbox', { name: 'ส่วนสูง' }).click();
    // await page.getByRole('textbox', { name: 'ส่วนสูง' }).fill(randomHeightStr);
    // await page.getByRole('textbox', { name: 'น้ำหนัก' }).click();
    // await page.getByRole('textbox', { name: 'น้ำหนัก' }).fill(randomWeightStr);
    await page.getByRole('textbox', { name: /ส่วนสูง/ }).click();
    await page.getByRole('textbox', { name: /ส่วนสูง/ }).fill(randomHeightStr);

    // await page.getByRole('textbox', { name: /น้ำหนัก/ }).nth(1).click();
    // await page.getByRole('textbox', { name: /น้ำหนัก/ }).nth(1).fill(randomWeightStr);
    
    await fillAndVerify(page.locator('#bmiWeight'), randomWeightStr, {
  label: 'น้ำหนัก',
  matchMode: 'includes',
});

    await page.getByText('เลือกการรับรองสถานะและคำยินยอมและตกลงปฏิบัติตามกฎหมาย FATCA ไม่มี/ไม่เป็น').first().click();
    await page.waitForTimeout(1000);
    await page.getByText('ไม่มีความประสงค์').first().click();
    await page.waitForTimeout(1000);
    await page.getByText('ไม่ยินยอม').first().click();
    await page.waitForTimeout(1000);



    if (ageInt < 21) {
      // ถ้าอายุต่ำกว่า 15 ปี ให้กรอกข้อมูลผู้ปกครอง
      console.log(`ผู้เอาประกันอายุ ${finalData.age} ปี, ต้องกรอกข้อมูลผู้ปกครอง`);

      // ตัวอย่างการกรอกข้อมูลผู้ปกครอง
      await page.getByText('คำนำหน้า').nth(6).click();
      //await page.locator('div.css-2opkg5-control.css-tntsk8').click();
      await page.locator('#consentTitleCode').fill('นาย');
      await page.locator('#consentTitleCode').press('Tab');
      await page.waitForTimeout(100);
      await page.locator('#consentName').click();
      await page.locator('#consentName').fill('สำหรับเด็ก');
      await page.locator('#consentName').press('Tab');
      await page.waitForTimeout(100);
      await page.locator('#consentSurname').click();
      await page.locator('#consentSurname').fill('ที่อายุไม่ถึง');
      await page.locator('#consentSurname').press('Tab');
      await page.waitForTimeout(100);
    }

    await page.getByText('ใช่/Yes').first().click();
    await page.waitForTimeout(1000);
    await page.getByRole('textbox', { name: 'เมือง / City *' }).click();
    await page.waitForTimeout(1000);
    await page.getByRole('textbox', { name: 'เมือง / City *' }).fill('กทม');

    //ส่งพิจารณา
    //await page.getByText('ส่งพิจารณาทุกกรณี ระบุเหตุผลในการขออนุมัติ').click();
    //await page.locator('#uwReason').click();
    //await page.waitForTimeout(2000);

    // await page.locator('#uwReason').click();
    // await page.waitForTimeout(500);

    // await page.locator('#uwReason').fill('ส่ง underwrite');
    // await page.waitForTimeout(300);
    // await page.locator('#uwReason').press('Tab');
    // await page.waitForTimeout(2000);
    console.log("Pass All checkbox")
    const elapsedSec9 = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`⏱️ ใช้เวลาไป ${elapsedSec9}s`);

    await page.getByRole('button', { name: 'บันทึก', exact: true }).click();
    await page.waitForTimeout(1000);


    //รอกดยืนยันเพื่อส่งเคส
  await page.getByRole('button', { name: 'ยืนยัน' }).click();
    try {
      await page.waitForSelector('text=กรุณาระบุ Required Field ในทุก Section ให้ครบถ้วน', { timeout: 3000 });
      throw new Error('❌ พบข้อความเตือน: กรุณาระบุ Required Field ในทุก Section ให้ครบถ้วน');
    } catch {
      console.log('✅ ไม่พบข้อความเตือน');
    }

    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: 'ตกลง' }).click();
    await page.waitForTimeout(1000);


    //ตรวจสอบว่าคีย์เคสมาผ่านไหม
    await page.getByRole('button', { name: ' จัดการข้อมูลเคสใหม่' }).click();
    await page.getByRole('button', { name: 'แสดงรายการเคสใหม่' }).click();
    await page.getByRole('textbox', { name: 'เลขที่ใบคำขอ' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('textbox', { name: 'เลขที่ใบคำขอ' }).fill(finalData.applicationNo);
    await page.waitForTimeout(200);
    await page.getByRole('textbox', { name: 'เลขที่ใบคำขอ' }).press('Tab');
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'ค้นหา', exact: true }).click();
    await page.waitForTimeout(1000);
    try {
      const checkPolicybtn = page.getByRole('button', { name: 'ﻋ' });
      await checkPolicybtn.waitFor({ state: 'visible', timeout: 3000 });
      await checkPolicybtn.click();
      console.log('✅ คีย์เคสหน้าย่อสำเร็จ');

    }
    catch {
      console.log('⏩ คีย์เคสไม่สำเร็จ');
      throw new Error('❌ Test failed: ไม่เจอปุ่มหรือคลิกไม่สำเร็จ');
    }
    const elapsedSec10 = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`⏱️ ใช้เวลาไป ${elapsedSec10}s`);
    // เพิ่มรายการรับฝาก
    if (finalData.environment === 'UAT') {
      await page.goto('https://uatnbs.thaisamut.co.th/nbsweb/secure/home.html');
    }
    else if (finalData.environment === 'SIT') {
      await page.goto('https://sitnbs.thaisamut.co.th/nbsweb/secure/home.html');
    }

    await page.waitForTimeout(1000);
    await page.getByRole('menuitem', { name: 'ระบบงานให้บริการ' }).click();
    await page.waitForTimeout(200);
    await page.getByRole('menuitem', { name: 'เงินรับฝาก' }).click();
    await page.waitForTimeout(200);
    await page.getByRole('menuitem', { name: 'ระบบรับฝากสำนักงานใหญ่' }).click();
    await page.waitForTimeout(200);
    await page.getByRole('button', { name: 'ตั้งรับฝาก' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'บันทึกรายการรับฝาก' }).click();
    await page.waitForTimeout(200);
    await page.getByRole('button', { name: 'เพิ่มรายการรับฝาก' }).click();
    await page.waitForTimeout(200);

    //กรอกเลือกช่องทางการขาย
    await page.getByText('เลือก').first().click();
    await page.waitForTimeout(500);
    await page.getByText('Non Agent').first().click();
    await page.waitForTimeout(200);
    await page.getByText('เลือก').first().click();
    await page.waitForTimeout(500);
    // กำหนดเงื่อนไขเพื่อคลิกที่ข้อความที่ถูกต้องตามค่า partnerNo
    if (finalData.partnerNo === '8500001') {
      await page.getByText('850-0001 : Digital Sales').first().click();
    } else if (finalData.partnerNo === '8100001') {
      await page.getByText('810-0001 : ฝ่ายธุรกิจสถาบัน').first().click();
    } else if (finalData.partnerNo === '8290001') {
      await page.getByText('829-0001 : Worksite (ALT2)').first().click();
    }
    await page.waitForTimeout(200);
    await page.getByText('เลือก').first().click();
    await page.waitForTimeout(500);
    await page.getByText('ตัวแทน').first().click();
    await page.waitForTimeout(200);
    await page.getByRole('textbox', { name: 'กรุณาระบุ' }).first().click();
    await page.getByRole('textbox', { name: 'กรุณาระบุ' }).first().fill(finalData.cusName); //กรอกชื่อ
    await page.getByRole('textbox', { name: 'กรุณาระบุ' }).nth(1).click();
    await page.waitForTimeout(200);
    await page.getByRole('textbox', { name: 'กรุณาระบุ' }).nth(1).fill(finalData.cusSurname); //กรอกนามสกุล
    await page.waitForTimeout(200);

    //เพิ่มข้อมูลการโอนเงิน
    await page.getByRole('button', { name: 'วิธีการชำระเงิน *  เพิ่มข้อมูล' }).getByRole('button').click();
    await page.getByText('เลือก').click();
    await page.getByText('เงินโอน', { exact: true }).click();
    await page.getByText('เลือก').click();
    await page.locator('#glCode').nth(1).fill('ธ ไทยพาณิชย์ สุรวงศ์2 064-3-01455-7');
    await page.locator('#glCode').nth(1).press('Tab');
    await page.getByRole('textbox', { name: 'วันที่' }).click();
    await page.getByRole('textbox', { name: 'วันที่' }).fill(currentDate + '_');
    await page.getByRole('textbox', { name: 'วันที่' }).press('Tab');
    //A18 พัง
    //await page.locator('.MuiGrid-root.MuiGrid-container.MuiGrid-spacing-xs-1 > div:nth-child(3) > .MuiFormControl-root > .MuiInputBase-root > .MuiInputBase-input').click();
    //await page.waitForTimeout(1000);    
    //await page.locator('.MuiInputBase-root.MuiInput-root.MuiInput-underline.MuiInputBase-fullWidth.MuiInput-fullWidth.Mui-focused > .MuiInputBase-input').fill(finalData.insuredAmount); //ค่าเบี้ยที่ไปดึงมาจากหน้าก่อน
    //await page.waitForTimeout(1000);    
    await page.locator('.MuiGrid-root.MuiGrid-container.MuiGrid-spacing-xs-1 > div:nth-child(3) > .MuiFormControl-root > .MuiInputBase-root > .MuiInputBase-input').click();
    await page.locator('.MuiInputBase-root.MuiInput-root.MuiInput-underline.MuiInputBase-fullWidth.MuiInput-fullWidth.Mui-focused > .MuiInputBase-input').fill((filledPay ?? 0).toString()); //ค่าเบี้ยที่ไปดึงมาจากหน้าก่อน
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'บันทึก' }).click();
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: 'รายการใบคำขอ/กรมธรรม์ *  เพิ่มข้อมูล' }).getByRole('button').click();
    await page.getByText('เลือก').click();
    await page.getByRole('textbox').fill('เคสใหม่');
    await page.getByRole('textbox').press('Tab');
    await page.getByText('เลือก').first().click();
    await page.locator('#policyTypeSearch').nth(1).fill('สามัญ');
    await page.locator('#policyTypeSearch').nth(1).press('Tab');
    await page.getByRole('region').filter({ hasText: 'เหตุผลที่รับฝาก *เคสใหม่ประเภทข้อมูล *ใบคำขอประเภทกรมธรรม์ * option สามัญ,' }).getByRole('textbox').nth(3).click();
    await page.getByRole('region').filter({ hasText: 'เหตุผลที่รับฝาก *เคสใหม่ประเภทข้อมูล *ใบคำขอประเภทกรมธรรม์ *สามัญเลขที่ใบคำขอ * ' }).getByRole('textbox').nth(3).fill(finalData.applicationNo); //ใส่เลขใบคำขอ
    await page.getByRole('button', { name: 'ค้นหา', exact: true }).click();
    await page.waitForTimeout(600);
    await page.getByRole('button', { name: 'ยืนยัน' }).click();
    await page.getByText('เลือก').first().click();


    // สมมติว่า finalData.policyName มีค่าคือ "A19 - โอเชี่ยนไลฟ์ โอชิ แพลน 18/10"
    // ใบรับฝากคือ finalData.policyName มีค่าคือ "A19 : โอเชี่ยนไลฟ์ โอชิ แพลน 18/10"
    let newPolicyName = finalData.policyName.replace(' - ', ' : ');

    await page.locator('#planCode').nth(1).fill(newPolicyName); //ใส่แบบประกัน
    await page.locator('#planCode').nth(1).press('Tab');
    await page.locator('div:nth-child(8) > .MuiFormControl-root > .MuiInputBase-root > .MuiInputBase-input').click();
    //A18 พัง
    // await page.locator('.MuiInputBase-root.MuiInput-root.MuiInput-underline.MuiInputBase-fullWidth.MuiInput-fullWidth.Mui-focused > .MuiInputBase-input').fill(finalData.insuredAmount); //ใส่จนเงิน  premiumAll
    // await page.locator('.MuiInputBase-root.MuiInput-root.MuiInput-underline.MuiInputBase-fullWidth.MuiInput-fullWidth.Mui-focused > .MuiInputBase-input').press('Tab');
    // await page.waitForTimeout(1000);
    await page.locator('.MuiInputBase-root.MuiInput-root.MuiInput-underline.MuiInputBase-fullWidth.MuiInput-fullWidth.Mui-focused > .MuiInputBase-input').fill((filledPay ?? 0).toString()); //ใส่จนเงิน  premiumAll
    await page.locator('.MuiInputBase-root.MuiInput-root.MuiInput-underline.MuiInputBase-fullWidth.MuiInput-fullWidth.Mui-focused > .MuiInputBase-input').press('Tab');
    await page.waitForTimeout(1000);
    await page.getByText('เลือก').click();
    await page.locator('#customerTitle').nth(1).fill(finalData.cusTitlePrefix); //ใส่คำนำหน้าชื่อ
    await page.locator('#customerTitle').nth(1).press('Tab');
    await page.locator('div:nth-child(10) > .MuiFormControl-root > .MuiInputBase-root > .MuiInputBase-input').click();
    await page.locator('.MuiInputBase-root.MuiInput-root.MuiInput-underline.MuiInputBase-fullWidth.MuiInput-fullWidth.Mui-focused > .MuiInputBase-input').fill(finalData.cusName); //ใส่ชื่อ
    await page.locator('.MuiInputBase-root.MuiInput-root.MuiInput-underline.MuiInputBase-fullWidth.MuiInput-fullWidth.Mui-focused > .MuiInputBase-input').press('Tab');
    await page.locator('.MuiInputBase-root.MuiInput-root.MuiInput-underline.MuiInputBase-fullWidth.MuiInput-fullWidth.Mui-focused > .MuiInputBase-input').click();
    await page.locator('.MuiInputBase-root.MuiInput-root.MuiInput-underline.MuiInputBase-fullWidth.MuiInput-fullWidth.Mui-focused > .MuiInputBase-input').fill(finalData.cusSurname); //ใส่นามสกุล
    await page.locator('.MuiInputBase-root.MuiInput-root.MuiInput-underline.MuiInputBase-fullWidth.MuiInput-fullWidth.Mui-focused > .MuiInputBase-input').press('Tab');
    await page.waitForTimeout(500);
    await page.locator('[id^="mui-autocomplete"]').fill(finalData.agentCode);
    await page.locator(`text=${finalData.agentCode}`).click();
    await page.waitForTimeout(3000);
    await page.getByRole('button', { name: 'บันทึก', exact: true }).click();
    await page.waitForTimeout(500);
    await page.getByText('บันทึก').nth(3).click();
    //await page.getByRole('button', { name: 'บันทึก', exact: true }).click();
    await page.getByRole('button', { name: 'ตกลง' }).click();
    await page.waitForTimeout(1000);

    //log out from 0001
    await page.getByRole('button', { name: '' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'ตกลง' }).click();
    await page.waitForTimeout(1000);

    // Login NBS as boss
    await page.locator('#username').click();
    await page.locator('#username').fill('boss'); // ยังคง Hardcode เนื่องจากข้อมูล Login ไม่ได้อยู่ใน NewCaseData
    await page.locator('#password').click();
    await page.locator('#password').fill('12');  // ยังคง Hardcode เนื่องจากข้อมูล Login ไม่ได้อยู่ใน NewCaseData
    await page.getByRole('button', { name: 'Login' }).click();

    await page.getByRole('menuitem', { name: 'ระบบงานให้บริการ' }).click();
    await page.getByRole('menuitem', { name: 'เงินรับฝาก' }).click();
    await page.getByRole('menuitem', { name: 'ระบบรับฝากสำนักงานใหญ่' }).click();
    await page.getByRole('button', { name: 'ตั้งรับฝาก' }).click();
    await page.getByRole('button', { name: 'บันทึกรายการรับฝาก' }).click();

    await page.locator('div:nth-child(2) > .MuiFormControl-root > .MuiInputBase-root > .MuiInputBase-input').first().click();
    await page.locator('div:nth-child(2) > .MuiFormControl-root > .MuiInputBase-root > .MuiInputBase-input').first().fill(finalData.applicationNo);
    await page.locator('div:nth-child(2) > .MuiFormControl-root > .MuiInputBase-root > .MuiInputBase-input').first().press('Tab');
    await page.locator('div:nth-child(5) > .MuiFormControl-root > .MuiInputBase-root > .MuiInputBase-input').click();

    //A18 พัง
    // await page.locator('.MuiInputBase-root.MuiInput-root.MuiInput-underline.MuiInputBase-fullWidth.MuiInput-fullWidth.Mui-focused > .MuiInputBase-input').fill(finalData.insuredAmount);
    // await page.locator('.MuiInputBase-root.MuiInput-root.MuiInput-underline.MuiInputBase-fullWidth.MuiInput-fullWidth.Mui-focused > .MuiInputBase-input').press('Tab');
    // await page.waitForTimeout(1000);
    await page.locator('.MuiInputBase-root.MuiInput-root.MuiInput-underline.MuiInputBase-fullWidth.MuiInput-fullWidth.Mui-focused > .MuiInputBase-input').fill((filledPay ?? 0).toString());
    await page.locator('.MuiInputBase-root.MuiInput-root.MuiInput-underline.MuiInputBase-fullWidth.MuiInput-fullWidth.Mui-focused > .MuiInputBase-input').press('Tab');
    await page.waitForTimeout(1000);
    await page.locator('.css-jb3yj5-placeholder').first().click();
    await page.locator('#branchService').nth(1).fill('0001');
    await page.locator('#branchService').nth(1).press('Tab');
    await page.locator('.css-jb3yj5-placeholder').first().click();
    await page.locator('#channelType').nth(1).fill('Non Agent');
    await page.locator('#channelType').nth(1).press('Tab');
    await page.getByRole('button', { name: 'ค้นหา', exact: true }).click();
    await page.waitForTimeout(5000);
    await page.getByRole('row', { name: 'ดูข้อมูล แก้ไข แก้ไขเลขที่ใบคำขอ ธกส. ยกเลิก สถานะอนุมัติรับฝาก สถานะจ่ายคืนรับฝ' }).getByRole('checkbox').check();
    await page.getByRole('button', { name: 'อนุมัติ', exact: true }).click();
    await page.getByRole('button', { name: 'ใช่' }).click();
await page.waitForTimeout(5000);


// เลขรับฝากใหม่
const firstRow = page.locator('tbody tr').first();
await firstRow.waitFor({ state: 'visible', timeout: 10000 });

depositReceiptNo = (await firstRow.locator('td').nth(14).innerText())
  .replace(/\s+/g, ' ')
  .trim();

console.log(`เลขใบรับฝาก: ${depositReceiptNo}`);

    console.log("อนุมัติฝากสำเร็จ เหลือแค่ตรวจสอบนะก้ะ")
           status = 'PASS';
      remark = 'Success';
    } catch (err) {
  const errorMessage = err?.message ? String(err.message) : String(err);

  const isRunnerStopped =
    page.isClosed?.() ||
    /Target page, context or browser has been closed/i.test(errorMessage) ||
    /Test ended/i.test(errorMessage) ||
    /browser has been closed/i.test(errorMessage);

  if (isRunnerStopped) {
    console.log(`🛑 Runner stopped while processing ${finalData.applicationNo}`);
    throw err; // สำคัญ: ออกจาก while ทันที
  }

  status = 'FAIL';
  remark = errorMessage;
  console.error(`❌ Test failed for applicationNo ${finalData.applicationNo}:`, err);
} finally {
      try {
        const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);

        await writeResult({
  applicationNo: finalData.applicationNo,
  status,
  remark: `[${elapsedSec}s] ${remark}`.slice(0, 500),
  depositReceiptNo
});

        console.log(`📝 Write result success: ${finalData.applicationNo} => ${status}`);
      } catch (writeErr) {
        console.error(
          `❌ Write Google Sheet failed for applicationNo ${finalData.applicationNo}:`,
          writeErr
        );
      }

// await page.close().catch(() => {});
      await context.close().catch(() => {});

    }
  }
});