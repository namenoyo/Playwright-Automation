import { test, expect } from '@playwright/test';
import writeHelpers from './data/write-result.js';
import { generateTempReceipt } from './helpers/tempReceipt.js';
const {
  autoFillRequiredFields,
  waitIfPaused,
  initPauseControl,
  waitSelectCommitted,
  optionalFill,
  optionalFillTab,
  mandatoryFill,
  mandatoryFillTab,
  autoConfirmDialogs
} = require('./helpers/common_function');
//======RUN Command=====
//npx playwright test e2e/NewCase_NBHQ/optimal-Full.spec.js --workers=1 --headed
//======================
//Helper functions
//======================
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

async function gotoLoginWithRetry(page, url, maxTry = 3) {
  // ก่อนกรอก username/password ต้องอยู่หน้า login ที่ถูกต้อง (url ที่ส่งมา) เท่านั้น
  // ถ้าไม่ใช่ (โดน redirect ไปที่อื่น) → goto กลับมาหน้านี้
  for (let i = 1; i <= maxTry; i++) {
    console.log(`🌐 เข้า URL: ${url} (รอบ ${i})`);

    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // รอให้ redirect แบบ client-side (JS) นิ่งก่อน แล้วค่อยเช็ค URL
    await page.waitForTimeout(1500);

    if (page.url().includes(url)) {
      await page.locator('#username').waitFor({ state: 'visible', timeout: 10000 });
      console.log('✅ อยู่หน้า login ที่ถูกต้อง → พร้อมกรอก username/password');
      return true;
    }

    console.log(`⚠️ ไม่ใช่หน้า login (อยู่ที่ ${page.url()}) → goto กลับมาหน้า login`);
  }

  throw new Error(`ไปหน้า login ไม่สำเร็จ ติดอยู่ที่ ${page.url()}`);
}

async function waitCheckerTableReady(page, timeout = 20000) {
  console.log('⏳ รอ toolbar จำนวนรายการ...');

  const toolbar = page.locator('.MUIDataTableToolbar-left-8').first();

  await toolbar.waitFor({
    state: 'visible',
    timeout,
  });

  await expect(toolbar).toContainText('จากทั้งหมด', {
    timeout,
  });

  await expect(toolbar).toContainText('รายการ', {
    timeout,
  });

  console.log('✅ Toolbar จำนวนรายการพร้อมแล้ว');
}

async function handleConcurrentRemark(page, environment, applicationNo) {
  console.log('🔧 เริ่ม handleConcurrentRemark');

  // logout ก่อน
  try {
    await page.goto(
      environment === 'SIT'
        ? 'https://sitnbs.thaisamut.co.th/nbsweb/secure/logout.html'
        : 'https://uatnbs.thaisamut.co.th/nbsweb/secure/logout.html',
      { waitUntil: 'domcontentloaded', timeout: 3000 }
    );
  } catch (err) {
    console.log('⚠️ logout เกิน 3 วิ / ไม่ redirect → ข้ามไป step ถัดไป');
  }


  await page.waitForTimeout(1000);

  // login boss
  await gotoLoginWithRetry(
    page,
    environment === 'SIT'
      ? 'https://sitnbs.thaisamut.co.th/nbsweb/secure/home.html'
      : 'https://uatnbs.thaisamut.co.th/nbsweb/secure/home.html'
  );

  await page.locator('#username').fill('boss');
  await page.locator('#password').fill('12');
  await page.getByRole('button', { name: 'Login' }).click();

  console.log('✅ Login boss เพื่อ Manual Batch Process');

  await page.getByRole('menuitem', { name: 'ระบบงานให้บริการ' }).click();
  await page.getByRole('menuitem', { name: 'ระบบจัดการข้อมูลเคสใหม่ สำนักงานใหญ่' }).click();
  await page.getByRole('button', { name: 'ดูแลระบบ' }).click();
  await page.getByRole('button', { name: 'Manual Batch Process' }).click();

  const concurrentRow = page
    .getByRole('row')
    .filter({ hasText: 'Manual : ปลดล็อคใบคำขอ (Concurrent)' })
    .first();

  await concurrentRow.waitFor({
    state: 'visible',
    timeout: 10000,
  });

  console.log('✅ เจอ section Manual : ปลดล็อคใบคำขอ (Concurrent)');

  const concurrentAppNoInput = concurrentRow.locator('#applicationNo');

  await concurrentAppNoInput.waitFor({
    state: 'visible',
    timeout: 10000,
  });

  await concurrentAppNoInput.click();
  await concurrentAppNoInput.fill(applicationNo);

  console.log(`✅ กรอกเลขใบคำขอ Concurrent = ${applicationNo}`);

  const runBtn = concurrentRow
    .getByRole('button', { name: 'RUN', exact: true })
    .first();

  await runBtn.waitFor({
    state: 'visible',
    timeout: 10000,
  });

  await runBtn.click();

  console.log('✅ กด RUN handleConcurrentRemark');

  const confirmDialog = page
    .getByRole('dialog')
    .filter({ hasText: 'handleConcurrentRemark' })
    .last();

  await confirmDialog.waitFor({
    state: 'visible',
    timeout: 10000,
  });

  await confirmDialog
    .getByRole('button', { name: 'ยืนยัน' })
    .click();

  const successDialog = page
    .getByRole('dialog')
    .filter({ hasText: 'ดำเนินการสำเร็จ' })
    .last();

  await successDialog.waitFor({
    state: 'visible',
    timeout: 15000,
  });

  console.log('✅ Manual Batch Process สำเร็จ');

  const closeBtn = successDialog
    .getByRole('button', { name: /close/i })
    .first();

  if (await closeBtn.isVisible().catch(() => false)) {
    await closeBtn.click();
  } else {
    await successDialog.locator('button[aria-label="Close"]').click();
  }

  await page.waitForTimeout(1000);

  // logout boss เพื่อกลับไป login mg0001 ใหม่
  try {
    await page.goto(
      environment === 'SIT'
        ? 'https://sitnbs.thaisamut.co.th/nbsweb/secure/logout.html'
        : 'https://uatnbs.thaisamut.co.th/nbsweb/secure/logout.html',
      { waitUntil: 'domcontentloaded', timeout: 3000 }
    );
  } catch (err) {
    console.log('⚠️ logout เกิน 3 วิ / ไม่ redirect → ข้ามไป step ถัดไป');
  }


  await page.waitForTimeout(1000);

  console.log('✅ handleConcurrentRemark เสร็จแล้ว');
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
        await closeBtn.click().catch(() => { });
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


const {
  fetchRunnableCases,
  claimCase,
  writeResult,
  writeTempReceiptNo,
} = writeHelpers;

test('NBHQ realtime runner', async ({ browser }) => {
  test.setTimeout(0);
  // initPauseControl();

  let idx = 0;

  const processedApplicationNos = new Set();

  // Section: กำหนด Create By ตามชื่อ
  const RUN_CREATE_BY = 'QA'; // 👈 วางก่อน loop (แนะนำ)


  mainLoop:
  while (true) {
    const caseDatas = await fetchRunnableCases(RUN_CREATE_BY);

    if (!caseDatas.length) {
      console.log('🎉 ไม่มีเคสให้รันแล้ว');
      break;
    }

    const finalData = caseDatas.find(c => {
      const key = `${String(c.applicationNo || '').trim()}|${String(c.testStatus || '').trim()}|${String(c.result || '').trim()}`;
      return !processedApplicationNos.has(key);
    });

    if (!finalData) {
      console.log('🎉 ไม่มีเคสใหม่ให้รันในรอบนี้แล้ว');
      break;
    }

    idx++;



    const {
      no,                 //ฟิลด์ No. เอาไว้ระบุว่า row ไหนใน sheet เพื่อเขียนผลกลับไปถูกต้อง
      testStatus,
      result: sheetResult,
      environment,
      caseType,               //ลักษณะเคส
      applicationNo,          //เลขที่ใบคำขอ
      tempReceiptNo,          //เลขที่ใบเสร็จชั่วคราว

      //-------- Section: สาขาตัวแทน --------
      branch,                 //สาขา
      branchName,             //ชื่อสาขา
      agentCode,              //รหัสตัวแทน
      agentName,              //ชื่อตัวแทน
      partner,
      partnerNo,              //partner code
      partnerCode2,              //Partner Code 2

      // -------- Section: ข้อมูลลูกค้าผู้เอาประกัน --------
      cardType,               //ประเภทบัตร
      cardNo,                 //เลขบัตร
      expirecardNo,           //วันที่บัตรหมดอายุ
      nationality,            //สัญชาติ
      documentidentify,       //เอกสารที่ใช้แสดง
      cusType,                //ประเภทลูกค้า
      cusTitlePrefix,         //คำนำหน้าชื่อลูกค้า
      // genderType,             //ประเภทเพศ
      gender,                 //เพศ
      cusName,                //ชื่อลูกค้า
      cusSurname,             //นามสกุลลูกค้า
      birthDate,              //วันเกิดลูกค้า
      age,                    //อายุลูกค้า
      maritalStatus,          //สถานภาพ เช่น โสด, สมรส
      spousePrefix,           //คำนำหน้าชื่อคู่สมรส (หากเลือก สมรส)
      spouseName,             //ชื่อคู่สมรส (หากเลือก สมรส)
      spouseSurname,          //นามสกุลคู่สมรส (หากเลือก สมรส)

      // -------- Section: ที่อยู่ตามทะเบียนบ้าน ของผู้เอาประกัน --------
      registerHouseNo,
      registerMoo,
      registerVillage,
      registerSoi,
      registerRoad,
      registerProvince,
      registerDistrict,
      registerSubDistrict,

      // -------- Section: ที่อยู่ปัจจุบัน ของผู้เอาประกัน --------
      currentUseAddressType,
      currentHouseNo,
      currentMoo,
      currentVillage,
      currentSoi,
      currentRoad,
      currentProvince,
      currentDistrict,
      currentSubDistrict,

      // -------- Section: สถานที่ทำงาน ของผู้เอาประกัน --------
      workUseAddressType,
      workPlaceName,
      workHouseNo,
      workMoo,
      workVillage,
      workSoi,
      workRoad,
      workProvince,
      workDistrict,
      workSubDistrict,

      // -------- Section: ข้อมูลติดต่อ --------
      contactPlaceType,
      mobilePhone,
      homePhone,
      workPhone,
      workPhoneExt,
      email,
      paperOrElectronic,
      policyDeliveryLocation,

      // -------- Section: อาชีพ --------
      occupation,
      occupationCode,
      occClass,
      occupationPosition,
      jobDescription,
      businessType,
      annualIncome,
      useMotorcycle,

      // -------- Section: แบบประกัน --------
      policyType,
      policyCode,
      policyName,
      packageType,
      applicationFormCode,
      paymentPeriod,
      insuredAmount,
      premium,

      // -------- Section: Rider --------
      numRider,
      riders,

      // -------- Section: รายละเอียดผู้ชำระเบี้ย --------
      payerType,
      payerPrefix,
      payerName,
      payerSurname,
      payerAge,
      payerUseAddressType,
      payerHouseNo,
      payerMoo,
      payerVillage,
      payerSoi,
      payerRoad,
      payerProvince,
      payerDistrict,
      payerSubDistrict,
      payerMobile,
      payerRelation,
      payerDocument,
      payerCardNo,
      payerOccupation,

      // -------- Section: วิธีชำระ --------
      paymentMethod,

      // -------- Section: BMI ส่วนสูง น้ำหนัก --------
      height,
      weight,
      birthWeight,
      weightChange6Months,
      // -------- Section: BMI ส่วนสูง น้ำหนัก --------
      Valid,

      // -------- Section: Info Result --------
      createBy,
      uwApprove,
      numBene,
    } = finalData;

    const applicationNoKey = String(finalData.applicationNo || '').trim();

    const processKey = `${applicationNoKey}|${testStatus}|${sheetResult}`;

    if (processedApplicationNos.has(processKey)) {
      console.log(`🛑 ข้ามเคสซ้ำในรอบเดียวกัน: ${processKey}`);
      continue mainLoop;
    }

    processedApplicationNos.add(processKey);

    const riderList = Array.isArray(riders) ? riders : [];
    const expectedRiderCount = Number(numRider || 0);

    if (riderList.length !== expectedRiderCount) {
      throw new Error(
        `จำนวน Rider ไม่ตรง: sheet=${expectedRiderCount} | parsed=${riderList.length}`
      );
    }

    const benes = finalData.bene || [];

    const agentParts = String(agentName || '')
      .trim()
      .split(' ')
      .filter(Boolean);

    const agentFirstName =
      agentParts.slice(0, -1).join(' ') || '';

    const agentLastName =
      agentParts.slice(-1).join('') || '';

    console.log('agentFirstName =', agentFirstName);
    console.log('agentLastName =', agentLastName);

    function getThaiBuddhistDate(date = new Date()) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear() + 543;
      return `${day}/${month}/${year}`;
    }

    const currentDate = getThaiBuddhistDate();

    console.log(`🚀 เริ่มรันใบคำขอที่ [${idx}] - ${applicationNo} | 🙍🏻‍♂️ ${RUN_CREATE_BY} `);

    const startTime = Date.now();


    let status = 'FAIL';
    let result = String(sheetResult || '').trim() || 'FAIL';
    let remark = '';
    let depositReceiptNo = '';
    let totalAmount = '';
    let policyNo = '';
    let alreadyWroteResult = false;

    const claimed = await claimCase(no, RUN_CREATE_BY);
    if (!claimed) {
      console.log(`⏭️ Skip No ${no} / ${applicationNo} because row is not Ready for Test/Retest`);
      continue;
    }

    const context = await browser.newContext();
    const page = await context.newPage();

    const shouldStartFromStage2 =
      String(testStatus || '').trim().toLowerCase() === 'inprogress' &&
      String(sheetResult || '').trim().toLowerCase() === 'deposit success';

    const shouldStartFromStage3 =
      String(testStatus || '').trim().toLowerCase() === 'inprogress' &&
      String(sheetResult || '').trim().toLowerCase() === 'waiting policy no';

    console.log('🔎 Resume Flag =', {
      testStatus,
      sheetResult,
      shouldStartFromStage2,
      shouldStartFromStage3,
    });

    try {

      if (shouldStartFromStage2 || shouldStartFromStage3) {
        console.log('🔁 Resume จาก Inprogress + Deposit Success → เริ่มที่ Waiting Policy No');

        await gotoLoginWithRetry(
          page,
          environment === 'SIT'
            ? 'https://sitnbs.thaisamut.co.th/nbsweb/secure/home.html'
            : 'https://uatnbs.thaisamut.co.th/nbsweb/secure/home.html'
        );

      } else {

        const tempNo = String(finalData.tempReceiptNo || '').trim();

        if (!tempNo && (policyType === 'ORD' || policyType === 'MRTA')) { //จะเข้าโฟลวเบิกใบรับเงินชั่วคราวต่อเมื่อเป็น ORD
          console.log('⚠️ tempReceiptNo ว่าง → run generate flow');

          const generatedTempReceiptNo = await generateTempReceipt(page, finalData);

          finalData.tempReceiptNo = generatedTempReceiptNo;

          await writeTempReceiptNo(no, generatedTempReceiptNo);

          console.log('🔓 generate temp receipt เสร็จแล้ว → logout NBS เพื่อเริ่ม flow หลักใหม่');

          try {
            await page.goto(
              environment === 'SIT'
                ? 'https://sitnbs.thaisamut.co.th/nbsweb/secure/logout.html'
                : 'https://uatnbs.thaisamut.co.th/nbsweb/secure/logout.html',
              { waitUntil: 'domcontentloaded', timeout: 3000 }
            );
          } catch (err) {
            console.log('⚠️ logout เกิน 3 วิ / ไม่ redirect → ข้ามไป step ถัดไป');
          }


          await page.waitForTimeout(1000);
        }

        //SIT
        await page.waitForTimeout(1000);
        if (environment == 'SIT') {

          await gotoLoginWithRetry(
            page,
            'https://sitnbs.thaisamut.co.th/nbsweb/secure/home.html'
          );

          await page.locator('#username').fill(branch);
          await page.locator('#password').fill('12');
          await page.getByRole('button', { name: 'Login' }).click();

          await page.waitForTimeout(300);
          await page.getByRole('menuitem', { name: 'ระบบงานให้บริการ' }).click();
          await page.getByRole('menuitem', { name: 'ระบบจัดการข้อมูลเคสใหม่ สำนักงานใหญ่' }).click();
          await page.waitForTimeout(300);
          await page.goto('https://intranet-api.ochi.link/thaisamut/web/nbentry/index.html#home');
          await page.waitForTimeout(300);
        } else if (environment == 'UAT') {

          await gotoLoginWithRetry(
            page,
            'https://uatnbs.thaisamut.co.th/nbsweb/secure/home.html'
          );

          await page.locator('#username').fill(branch);
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

        //-------
        const applicationFormCode = String(finalData.applicationFormCode || '').trim();

        if       // ===== FLOW ORD รหัสใบคำขอ 02052 =====
          (applicationFormCode === '02052' && policyType === 'ORD') {
          console.log('🟢 Run Flow ORD รหัสใบคำขอ 02052');
          //// ===== FLOW 02052 =====
          await page.getByRole('button', { name: `Application Code : ${'02052'} ใบคำขอเอาประกันชีวิตประเภทสามัญ` }).click();
          await page.getByRole('button', { name: 'เพิ่มข้อมูลใหม่' }).click();

          await page.waitForTimeout(1000);
          await page.getByLabel('ประเภทบัตร').click();
          await page.getByText('เลขประจำตัว 13 หลัก', { exact: true }).click();
          await page.waitForTimeout(1000);

          await page.getByRole('dialog', { name: 'ค้นหาหรือเพิ่มสำหรับเลือกข้อมูลลูกค้าเพื่อทำการบันทึกเคสใหม่ จากระบบ CIS Close' }).locator('#cardNo').click();
          await page.getByRole('dialog', { name: 'ค้นหาหรือเพิ่มสำหรับเลือกข้อมูลลูกค้าเพื่อทำการบันทึกเคสใหม่ จากระบบ CIS Close' }).locator('#cardNo').fill(cardNo);
          await page.getByLabel('คำนำหน้า').click();
          await page.getByLabel('คำนำหน้า').fill(cusTitlePrefix);
          await page.getByLabel('คำนำหน้า').press('Tab');


          const inputBirthDate = String(finalData.birthDate || '').trim();

          if (!inputBirthDate) {
            throw new Error('❌ birthDate ไม่มีค่า');
          }

          console.log(`วันเกิดจาก data: ${inputBirthDate}`);

          await page.getByRole('dialog', { name: 'ค้นหาหรือเพิ่มสำหรับเลือกข้อมูลลูกค้าเพื่อทำการบันทึกเคสใหม่ จากระบบ CIS Close' }).locator('#name').click();
          await page.getByRole('dialog', { name: 'ค้นหาหรือเพิ่มสำหรับเลือกข้อมูลลูกค้าเพื่อทำการบันทึกเคสใหม่ จากระบบ CIS Close' }).locator('#name').fill(cusName);
          await page.getByRole('dialog', { name: 'ค้นหาหรือเพิ่มสำหรับเลือกข้อมูลลูกค้าเพื่อทำการบันทึกเคสใหม่ จากระบบ CIS Close' }).locator('#surname').click();
          await page.getByRole('dialog', { name: 'ค้นหาหรือเพิ่มสำหรับเลือกข้อมูลลูกค้าเพื่อทำการบันทึกเคสใหม่ จากระบบ CIS Close' }).locator('#surname').fill(cusSurname);
          await page.getByRole('textbox', { name: 'วันเกิด *' }).click();
          await page.getByRole('textbox', { name: 'วันเกิด *' }).fill(inputBirthDate);
          await page.getByRole('textbox', { name: 'วันเกิด *' }).press('Tab');

          await page.waitForTimeout(500);


          // console.log('👉 gender raw =', gender);
          console.log('👉 finalData.gender =', finalData.gender);

          // ✅ เลือกเพศ ถ้ายังไม่ได้เลือก 
          const genderValue = String(finalData.gender || '').trim();

          const genderLabel = page
            .locator('label.MuiFormControlLabel-root')
            .filter({ hasText: genderValue })
            .first();

          await genderLabel.waitFor({ state: 'visible', timeout: 5000 });

          const genderInput = genderLabel.locator('input[name="genderCode"]');

          if (!(await genderInput.isChecked())) {
            await genderLabel.click({ force: true });
            await page.waitForTimeout(300);
          }
          await page.waitForTimeout(1000);
          await page.getByRole('button', { name: 'ยืนยัน' }).click();
          await page.getByRole('button', { name: 'ตกลง' }).click();
          // หน้าบันทึกและแก้ไขข้อมูลเคสใหม่
          // Category เลขที่ใบคำขอ
          await page.waitForTimeout(1000);
          const appNoInput = page.locator('#section-main #applicationNo');

          await fillTabAndVerify(appNoInput, applicationNo, {
            label: 'Application No',
            matchMode: 'exact',
            duplicateMessage: 'เลขที่ใบคำขอฯนี้มีอยู่ในระบบแล้ว',
            duplicateTimeout: 1200,
          });

          await page.waitForTimeout(1000);
          await page.getByRole('textbox', { name: 'วันที่เขียนใบคำขอ *' }).click();
          await page.getByLabel('วันที่เขียนใบคำขอ *').fill(currentDate + '_');
          await page.waitForTimeout(1000);

          // Category ข้อมูลตัวแทน ใหม่
          await page.getByLabel('ตัวแทนเจ้าของผลงาน *').click();
          const agentContainer = page
            .locator('div.MuiExpansionPanel-root:has(.ExpansionPanelSummaryTitle:text-is("ข้อมูลตัวแทน"))')
            .locator('div:has(:text-is("ตัวแทนเจ้าของผลงาน"))');

          await page.getByLabel('ตัวแทนเจ้าของผลงาน *').click();

          const agentInput = agentContainer.locator('#agentOwnerCode').first();

          await agentInput.fill(agentCode);
          await agentInput.press('Tab');
          await page.waitForTimeout(1000);

          // อ่านค่าจริงจากตัวแสดงผลของ control เดียวกัน
          let agentDisplay = await agentContainer
            .locator('div[class*="singleValue"]')
            .first()
            .innerText()
            .catch(() => '');

          agentDisplay = (agentDisplay || '').replace(/\s+/g, ' ').trim();

          console.log('agentDisplay =', agentDisplay);

          // ตัดเลขตัวแทนออก
          let agentNamePart = agentDisplay.replace(/^\d+\s*[-:]\s*/, '').trim();

          if (agentNamePart === agentDisplay) {
            agentNamePart = agentDisplay.replace(/^\d+\s*/, '').trim();
          }

          // Category รหัสสถาบัน/ คู่ค้า
          await mandatoryFillTab(page, partnerNo, '#orgCode', 'Partner Code');
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

          await mandatoryFillTab(page, expirecardNo, '#cardExpireDate', 'วันที่บัตรหมดอายุ');
          await mandatoryFillTab(page, nationality, '#nationalityCode', 'สัญชาติ');
          await mandatoryFillTab(page, documentidentify, '#documentCode', 'เอกสารที่ใช้แสดง');
          //  await page.waitForTimeout(300);


          // ===== สถานภาพ =====
          await mandatoryFillTab(page, maritalStatus, '#maritalStatusCode', 'สถานภาพ');

          // ===== เงื่อนไข: ถ้า "สมรส" =====
          if (String(maritalStatus).trim() === 'สมรส') {

            console.log('💍 พบสถานภาพสมรส → กรอกข้อมูลคู่สมรส');

            // // ---- spousePrefix (React select) ----
            await mandatoryFillTab(page, spousePrefix, '#spouseTitleCode', 'คำนำหน้าคู่สมรส');
            await mandatoryFill(page, spouseName, '#spouseName', 'ชื่อคู่สมรส');
            await optionalFill(page, spouseSurname, '#spouseSurname', 'นามสกุลคู่สมรส');

          }
          // =============
          // ที่อยู่ตามทะเบียนบ้าน
          // =============

          await mandatoryFill(page, registerHouseNo, '#registerHouseNo', 'ที่อยู่ตามทะเบียนบ้าน-เลขที่');
          await optionalFill(page, registerMoo, '#registerVillage', 'ที่อยู่ตามทะเบียนบ้าน-หมู่ที่');
          await optionalFill(page, registerVillage, '#registerBuilding', 'ที่อยู่ตามทะเบียนบ้าน-หมู่บ้าน/อาคาร');
          await optionalFill(page, registerSoi, '#registerAlley', 'ที่อยู่ตามทะเบียนบ้าน-ตรอก/ซอย');
          await optionalFill(page, registerRoad, '#registerRoad', 'ที่อยู่ตามทะเบียนบ้าน-ถนน');
          await mandatoryFillTab(page, registerProvince, '#registerProvinceCode', 'ที่อยู่ตามทะเบียนบ้าน-จังหวัด');
          await mandatoryFillTab(page, registerDistrict, '#registerDistrictCode', 'ที่อยู่ตามทะเบียนบ้าน-อำเภอ/เขต');
          await mandatoryFillTab(page, registerSubDistrict, '#registerSubDistrictCode', 'ที่อยู่ตามทะเบียนบ้าน-ตำบล/แขวง');
          await page.waitForTimeout(1000);
          // =============
          // ที่อยู่ปัจจุบัน
          // =============
          // // ===== เงื่อนไข: ถ้า "ที่อยู่ปัจจุบัน ไม่ใช่ ที่อยู่ตามทะเบียนบ้าน"  =====
          await mandatoryFillTab(page, currentUseAddressType, '#currentUseAddressTypeCode', 'ที่อยู่ปัจจุบัน-ใช้ตามที่อยู่');
          if (currentUseAddressType !== 'ที่อยู่ตามทะเบียนบ้านของผู้เอาประกัน') {
            console.log('🏠 ระบุที่อยู่ปัจจุบันเอง');

            // ที่อยู่ปัจจุบัน-เลขที่ (Mandatory) 
            await mandatoryFill(page, currentHouseNo, '#currentHouseNo', 'ที่อยู่ปัจจุบัน-เลขที่');
            await optionalFill(page, currentMoo, '#currentVillage', 'ที่อยู่ปัจจุบัน-หมู่ที่');
            await optionalFill(page, currentVillage, '#currentBuilding', 'ที่อยู่ปัจจุบัน-หมู่บ้าน/อาคาร');
            await optionalFill(page, currentSoi, '#currentAlley', 'ที่อยู่ปัจจุบัน-ตรอก/ซอย');
            await optionalFill(page, currentRoad, '#currentRoad', 'ที่อยู่ปัจจุบัน-ถนน');
            await mandatoryFillTab(page, currentProvince, '#currentProvinceCode', 'ที่อยู่ปัจจุบัน-จังหวัด');
            await mandatoryFillTab(page, currentDistrict, '#currentDistrictCode', 'ที่อยู่ปัจจุบัน-อำเภอ/เขต');
            await mandatoryFillTab(page, currentSubDistrict, '#currentSubDistrictCode', 'ที่อยู่ปัจจุบัน-ตำบล/แขวง');
          }

          // =============
          // สถานที่ทำงาน
          // =============
          // ไม่ว่ากรณีไหนก็ให้กรอกเสมอ
          await optionalFill(
            page,
            workPlaceName,
            '#companyName',
            'สถานที่ทำงาน-ชื่อสถานที่ทำงาน'
          );
          // ===== เงื่อนไข: ถ้า "สถานที่ทำงาน ไม่ใช่ ที่อยู่ตามทะเบียนบ้าน หรือที่อยู่ปัจจุบัน"  =====
          await mandatoryFillTab(page, workUseAddressType, '#workUseAddressTypeCode', 'สถานที่ทำงาน-ใช้ตามที่อยู่');

          if (
            workUseAddressType !== 'ที่อยู่ตามทะเบียนบ้านของผู้เอาประกัน' &&
            workUseAddressType !== 'ที่อยู่ปัจจุบันของผู้เอาประกัน'
          ) {
            console.log('🏛 ระบุสถานที่ทำงานเอง');

            // await optionalFill(page, workPlaceName, '#companyName', 'สถานที่ทำงาน-ชื่อสถานที่ทำงาน');
            await optionalFill(page, workHouseNo, '#workHouseNo', 'สถานที่ทำงาน-เลขที่');
            await optionalFill(page, workMoo, '#workVillage', 'สถานที่ทำงาน-หมู่ที่');
            await optionalFill(page, workVillage, '#workBuilding', 'สถานที่ทำงาน-หมู่บ้าน/อาคาร');
            await optionalFill(page, workSoi, '#workAlley', 'สถานที่ทำงาน-ตรอก/ซอย');
            await optionalFill(page, workRoad, '#workRoad', 'สถานที่ทำงาน-ถนน');

            // สถานที่ทำงาน-จังหวัด
            const workProvinceVal = String(workProvince || '').trim();

            if (workProvinceVal !== '') {
              const workProvinceInput = page.locator('#workProvinceCode');

              await workProvinceInput.waitFor({ state: 'visible', timeout: 5000 });
              await workProvinceInput.click();
              await workProvinceInput.fill(workProvinceVal);
              await workProvinceInput.press('Tab');

              await waitSelectCommitted(workProvinceInput, 'จังหวัดสถานที่ทำงาน', 10000);
            }

            // สถานที่ทำงาน-อำเภอ/เขต
            const workDistrictVal = String(workDistrict || '').trim();

            if (workDistrictVal !== '') {
              const workProvinceInputCheck = page.locator('#workProvinceCode');

              await waitSelectCommitted(workProvinceInputCheck, 'จังหวัดสถานที่ทำงาน', 10000);

              const workDistrictInput = page.locator('#workDistrictCode');
              await workDistrictInput.waitFor({ state: 'visible', timeout: 5000 });
              await workDistrictInput.click();
              await workDistrictInput.fill(workDistrictVal);
              await workDistrictInput.press('Tab');

              await waitSelectCommitted(workDistrictInput, 'อำเภอ/เขตสถานที่ทำงาน', 10000);
            }

            // สถานที่ทำงาน-ตำบล/แขวง
            const workSubDistrictVal = String(workSubDistrict || '').trim();

            if (workSubDistrictVal !== '') {
              const workDistrictInputCheck = page.locator('#workDistrictCode');

              await waitSelectCommitted(workDistrictInputCheck, 'อำเภอ/เขตสถานที่ทำงาน', 10000);

              const workSubDistrictInput = page.locator('#workSubDistrictCode');
              await workSubDistrictInput.waitFor({ state: 'visible', timeout: 5000 });
              await workSubDistrictInput.click();
              await workSubDistrictInput.fill(workSubDistrictVal);
              await workSubDistrictInput.press('Tab');

              await waitSelectCommitted(workSubDistrictInput, 'ตำบล/แขวงสถานที่ทำงาน', 10000);
            }
          }

          // =============
          // สถานที่สะดวกในการติดต่อและส่งเอกสาร
          // =============
          const contactPlaceTypeVal = String(contactPlaceType || '').trim();

          let contactFlagValue = '';

          if (contactPlaceTypeVal === 'ที่อยู่ตามทะเบียนบ้าน') {
            contactFlagValue = 'REG';
          } else if (contactPlaceTypeVal === 'ที่อยู่ปัจจุบัน') {
            contactFlagValue = 'CON';
          } else if (contactPlaceTypeVal === 'สถานที่ทำงาน') {
            contactFlagValue = 'WRK';
          } else {
            throw new Error(`❌ contactPlaceType ไม่ถูกต้อง: ${contactPlaceTypeVal}`);
          }

          const contactRadioInput = page.locator(`input[name="contactFlag"][value="${contactFlagValue}"]`);
          await contactRadioInput.waitFor({ state: 'attached', timeout: 5000 });

          // ✅ click ที่ label ครอบ input แทน input ตรง ๆ
          const contactRadioLabel = contactRadioInput.locator('xpath=ancestor::label[1]');
          await contactRadioLabel.click({ force: true });

          await page.waitForTimeout(300);

          // ✅ verify ว่าติดจริง
          const checked = await contactRadioInput.isChecked();
          if (!checked) {
            throw new Error(`❌ เลือกสถานที่สะดวกในการติดต่อไม่สำเร็จ: ${contactPlaceTypeVal} (${contactFlagValue})`);
          }

          console.log(`✅ เลือกสถานที่สะดวกในการติดต่อ: ${contactPlaceTypeVal}`);

          //============
          await page.waitForTimeout(400);

          await mandatoryFill(page, mobilePhone, '#currentMobileNo', 'โทรศัพท์มือถือ');
          await optionalFill(page, homePhone, '#currentHomePhoneNo', 'โทรศัพท์บ้าน');
          await optionalFillTab(page, workPhone, '#currentWorkPhoneNo', 'โทรศัพท์ที่ทำงาน');
          await optionalFillTab(page, workPhoneExt, '#currentWorkPhoneNoExt', 'ต่อ');


          // Email
          const emailVal = String(email || '').trim();

          if (emailVal !== '') {
            try {
              const emailInput = page.locator('#registerEmail');
              await emailInput.waitFor({
                state: 'visible',
                timeout: 5000,
              });
              await emailInput.click();
              await emailInput.fill(emailVal);
              console.log('✅ fill #registerEmail success');
            } catch {
              console.log('⚠️ #registerEmail ไม่เจอ → fallback #currentEmail');
              const emailInputFallback = page.locator('#currentEmail');
              await emailInputFallback.waitFor({
                state: 'visible',
                timeout: 5000,
              });
              await emailInputFallback.click();
              await emailInputFallback.fill(emailVal);
              console.log('✅ fill #currentEmail success');
            }
            await page.waitForTimeout(500);
          }


          if (paperOrElectronic === 'Paper') {
            // Category รูปแบบกรมธรรม์
            await page.getByText('แบบรูปเล่มกระดาษ').first().click(); // แก้ Selector ให้ถูกต้องหาก text คือ 'แบบรูปเล่มกระดาษ'
            await page.getByRole('textbox', { name: 'ส่งเอกสารกรมธรรม์ที่ *' }).click();
            await page.getByRole('textbox', { name: 'ส่งเอกสารกรมธรรม์ที่ *' }).fill(policyDeliveryLocation); // ยังคง Hardcode หรือเพิ่มใน NewCaseData
            await page.waitForTimeout(1000);
            await page.getByRole('textbox', { name: 'ส่งเอกสารกรมธรรม์ที่ *' }).press('Tab');
            await page.getByText('แบบรูปเล่มกระดาษ').nth(1).click(); // แก้ Selector ให้ถูกต้องหาก text คือ 'แบบรูปเล่มกระดาษ'
            await page.waitForTimeout(1000);
          }
          else if (paperOrElectronic === 'Email') {
            // Category รูปแบบกรมธรรม์
            await page.getByText('แบบอิเล็กทรอนิกส์').first().click();
            await page.waitForTimeout(1000);
            await page.getByText('แบบอิเล็กทรอนิกส์ โดยจัดส่งตามอีเมล').nth(1).click();
            await page.waitForTimeout(1000);
          }
          console.log("Pass Estamp")
          const elapsedSec3 = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`⏱️ ใช้เวลาไป ${elapsedSec3}s`);


          // =============
          // Category อาชีพ    
          // =============
          await mandatoryFillTab(page, occupationCode, '#currentOccupationCode', 'รหัสอาชีพ');
          await mandatoryFillTab(page, occupationPosition, '#currentPositionName', 'ตำแหน่ง');
          await optionalFillTab(page, jobDescription, '#currentJobDesc', 'ลักษณะงานที่ทำ');
          await optionalFillTab(page, businessType, '#currentBusinessTypeDesc', 'ลักษณะธุรกิจ');
          await mandatoryFillTab(page, annualIncome, '#currentIncomePerYear', 'รายได้ต่อปี');

          // =============
          // ท่านใช้รถจักรยานยนต์ในการทำงานหรือไม่ 
          // =============
          // ใช้รถจักรยานยนต์
          const useMotorcycleVal = String(useMotorcycle || '').trim();

          let motorcycleValue = '';

          if (useMotorcycleVal === 'ใช้') {
            motorcycleValue = 'Y';
          } else if (useMotorcycleVal === 'ไม่ใช้') {
            motorcycleValue = 'N';
          } else {
            throw new Error(`❌ useMotorcycle ไม่ถูกต้อง: ${useMotorcycleVal}`);
          }

          const motorcycleInput = page.locator(`input[name="motorcycleWork"][value="${motorcycleValue}"]`);
          await motorcycleInput.waitFor({ state: 'attached', timeout: 5000 });

          // MUI radio ให้กด label ครอบ input แทน
          const motorcycleLabel = motorcycleInput.locator('xpath=ancestor::label[1]');
          await motorcycleLabel.click({ force: true });

          await page.waitForTimeout(300);

          if (!(await motorcycleInput.isChecked())) {
            throw new Error(`❌ เลือกใช้รถจักรยานยนต์ไม่สำเร็จ: ${useMotorcycleVal}`);
          }

          console.log(`✅ เลือกใช้รถจักรยานยนต์: ${useMotorcycleVal}`);

          // =============
          console.log("Pass Occupation")
          const elapsedSec4 = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`⏱️ ใช้เวลาไป ${elapsedSec4}s`);
          //case policyName = a18,19,20 มันให้กรอกเบี้ยแทนทุน
          if (policyName.includes('โอเชี่ยนไลฟ์ โอชิ แพลน 18/10')) {
            await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).click();
            await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).fill(policyName);
            await page.waitForTimeout(1000);
            await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).press('Tab');
            await page.waitForTimeout(1000);
            await page.getByRole('textbox', { name: 'เบี้ยประกันภัยรวม *' }).click();
            await page.waitForTimeout(2000);
            await page.getByRole('textbox', { name: 'เบี้ยประกันภัยรวม *' }).fill(insuredAmount);
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
            await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).type(policyName, { delay: 100 });
            await page.waitForTimeout(1000);
            await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).press('Tab');
            await page.waitForTimeout(1000);

            await waitOptionalLoading(page);

            await page.getByRole('textbox', { name: 'จำนวนเงินเอาประกันภัย *' }).type(insuredAmount, { delay: 100 });
            await page.waitForTimeout(1000);
            await page.getByRole('textbox', { name: 'จำนวนเงินเอาประกันภัย *' }).press('Tab');

            await waitOptionalLoading(page);

            await page.getByRole('textbox', { name: 'งวดการชำระ *' }).click();
            await page.getByRole('textbox', { name: 'งวดการชำระ *' }).type(paymentPeriod, { delay: 100 });
            await page.getByRole('textbox', { name: 'งวดการชำระ *' }).press('Tab');
            await page.waitForTimeout(1000);
            //แบบประกันหายเลือกกดอีกครั้ง
            await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).click();
            await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).type(policyName, { delay: 100 });
            await page.waitForTimeout(1000);
            await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).press('Tab');
            await page.waitForTimeout(1000);
          }
          console.log("Pass Main Insurance")
          const elapsedSec5 = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`⏱️ ใช้เวลาไป ${elapsedSec5}s`);
          //A18 พัง

          // เก็บจำนวนสัญญาเพิ่มเติม
          let addedRiderCount = 0;

          // 🔥 check ปุ่มเพิ่ม rider ก่อน
          const addRiderBtn = page.getByRole('button', { name: 'เพิ่มสัญญาเพิ่มเติม', exact: true });

          if (riderList.length > 0) {
            const isVisible = await addRiderBtn.isVisible().catch(() => false);

            if (!isVisible) {
              throw new Error(
                `❌ ต้องมี Rider (${riderList.length}) แต่ไม่พบปุ่ม "เพิ่มสัญญาเพิ่มเติม"`
              );
            }
          }

          // เริ่มทำการ loop เพิ่มสัญญาเพิ่มเติมตามข้อมูลจาก write-result.js > buildRiders()
          for (const rider of riderList) {
            const riderName = String(rider.riderName || rider.riderCode || '').trim();
            const riderAmount = String(rider.riderCoverage || rider.riderPremium || '').trim();

            if (!riderName) {
              throw new Error(`❌ Rider ไม่มีชื่อ: ${JSON.stringify(rider)}`);
            }

            if (!riderAmount) {
              throw new Error(`❌ Rider ${riderName} ไม่มีทุนหรือเบี้ย`);
            }

            // 🔥 check ปุ่มทุกครั้งก่อนกด (กัน UI bug)
            const addRiderBtn = page.getByRole('button', { name: 'เพิ่มสัญญาเพิ่มเติม', exact: true });

            if (!(await addRiderBtn.isVisible().catch(() => false))) {
              throw new Error(`❌ ปุ่มเพิ่ม Rider หายระหว่างทำงาน (rider=${riderName})`);
            }

            await page.waitForTimeout(1500);
            await addRiderBtn.click();

            const riderNameInput = page.getByRole('textbox', { name: 'ชื่อสัญญาเพิ่มเติม *' });
            await riderNameInput.click();
            await riderNameInput.fill(riderName);
            await riderNameInput.press('Tab');

            await page.waitForTimeout(1000);

            try {

              await page.getByText('กรุณาเลือก').click({
                timeout: 10000,
              });

            } catch (err) {

              throw new Error(
                `❌ Rider ${riderName} เลือกทุน/แผนความคุ้มครองไม่สำเร็จ ภายใน 10 วินาที`
              );
            }

            const riderAmountInput = page.getByRole('textbox', {
              name: 'ทุนประกันภัย/แผนความคุ้มครอง *',
            });

            try {

              await riderAmountInput.click({
                timeout: 10000,
              });

            } catch (err) {

              throw new Error(
                `❌ Rider ${riderName} ไม่เลือกทุนประกันภัย/แผนความคุ้มครองได้ ภายใน 10 วินาที`
              );
            }

            if (riderAmount.toLowerCase() === 'any') {

              console.log(`ℹ️ Rider ${riderName} ใช้ Any → เลือกรายการแรกจาก dropdown`);

              await page.waitForTimeout(500);
              await page.keyboard.press('ArrowDown');
              await page.waitForTimeout(300);
              await page.keyboard.press('Enter');
              await page.waitForTimeout(500);

            } else {

              await riderAmountInput.fill(riderAmount);
              await riderAmountInput.press('Tab');
            }

            await page.waitForTimeout(1500);

            const addBtn = page.getByRole('button', { name: 'เพิ่ม' });

            // ✅ รอให้ปุ่ม เพิ่ม กดได้ ภายใน 10 วิ
            try {
              await addBtn.waitFor({
                state: 'visible',
                timeout: 10000,
              });

              await expect(addBtn).toBeEnabled({
                timeout: 10000,
              });

            } catch {
              throw new Error(
                `❌ ไม่สามารถกด เพิ่ม Rider ${riderName} คาดว่าหาทุนไม่พบ`
              );
            }

            await addBtn.click();
            await page.waitForTimeout(1000);

            // ✅ ถ้ากดเพิ่มแล้ว dialog ยังไม่ปิด + มี error สีแดง แปลว่าเพิ่ม Rider ไม่สำเร็จ
            const riderDialogStillOpen = await page
              .getByText('สัญญาเพิ่มเติม', { exact: true })
              .isVisible()
              .catch(() => false);

            const riderCoverageError = await page
              .getByText('กรุณาระบุ ทุนประกันภัย/แผนความคุ้มครอง')
              .isVisible()
              .catch(() => false);

            if (riderDialogStillOpen && riderCoverageError) {
              throw new Error(
                `❌ Rider ${riderName} เพิ่มไม่สำเร็จ: ไม่พบทุนประกันภัย/แผนความคุ้มครอง หรือไม่ได้เลือกทุน`
              );
            }

            // ✅ กันเคส dialog ยังเปิดค้าง แม้ไม่เจอข้อความ error
            if (riderDialogStillOpen) {
              throw new Error(
                `❌ Rider ${riderName} เพิ่มไม่สำเร็จ: หน้าต่างสัญญาเพิ่มเติมยังไม่ปิดหลังจากกดเพิ่ม`
              );
            }

            addedRiderCount++;
          }
          console.log("Pass Rider")
          const elapsedSec6 = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`⏱️ ใช้เวลาไป ${elapsedSec6}s`);
          console.log(`จำนวนสัญญาเพิ่มเติมที่เพิ่มที่ถูกเพิ่ม: ${addedRiderCount} รายการ`);
          await page.waitForTimeout(1000);

          // ดึงข้อมูลทั้งหมดจากหน้าเว็บ
          const draftPremium3 = await page.locator('td.MuiTableCell-body.MUIDataTableBodyCell-root-58').allTextContents();

          let premiumPay;
          let filledPay = 0; // ✅ ประกาศนอก loop เพื่อเก็บค่ารวม
          let insuMainIndex = -1; // ประกาศตัวแปรเพื่อเก็บ index ของแบบประกันหลัก
          insuMainIndex = draftPremium3.findLastIndex(text => text.includes(policyName));

          if (insuMainIndex !== -1) {
            const insuMain = draftPremium3[insuMainIndex];
            const insuMoney = draftPremium3[insuMainIndex + 4];
            const insuPremium = parseFloat(draftPremium3[insuMainIndex + 6]?.replace(/,/g, '')) || 0;
            const insuSpePremium = parseFloat(draftPremium3[insuMainIndex + 8]?.replace(/,/g, '')) || 0;
            const insuCommis = draftPremium3[insuMainIndex + 12];

            // ✅ รวมเบี้ยหลักกับเบี้ยพิเศษหลักก่อน
            filledPay = insuPremium + insuSpePremium;
            const riderConfigsForCheck = [...riderList];

            if (policyName.includes('โอเชี่ยนไลฟ์ โอชิ แพลน 18/10')) {
              riderConfigsForCheck.unshift({
                riderName: 'CPA.2.13',
                riderCoverage: '10000',
              });
            }

            const displayedRiders = [];
            let lastRiderIndex = insuMainIndex;

            for (const riderConfig of riderConfigsForCheck) {
              const riderNameIndex = draftPremium3.findIndex((text, index) => {
                // ค้นหาข้อความชื่อ rider ที่อยู่หลังจากตำแหน่งของ rider ตัวล่าสุด
                return index > lastRiderIndex && text.includes(riderConfig.riderName);
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
                displayedRiders.push(rider);
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

            console.log(`ค่า Premium ที่ชำระที่ยังไม่รวมเบี้ยเพิ่มพิเศษ: ${premiumPay}`);
            console.log(`✅ รวมเบี้ยทั้งหมด (filledPay) คือค่าเบี้ย หลัก บวก rider ที่ซื้อเท่านั้น ไม่ได้คิด bundle ที่แถมมา: ${filledPay}`);
          } else {
            console.log('ไม่พบแบบประกันหลักที่กำหนด');
          }
          console.log("Pass Display Insurance Money")
          const elapsedSec7 = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`⏱️ ใช้เวลาไป ${elapsedSec7}s`);
          console.log('-------------------------------');

          // =============
          // Category การชำระเบี้ยประกันภัย
          // =============

          const payerTypeVal = String(payerType || '').trim();

          let payerValue = '';

          if (payerTypeVal === 'ชำระเอง') {
            payerValue = '1';
          } else if (payerTypeVal === 'ผู้อื่น(โปรดระบุรายละเอียด)') {
            payerValue = '2';
          } else {
            throw new Error(`❌ payerType ไม่ถูกต้อง: ${payerTypeVal}`);
          }

          const payerInput = page.locator(`input[name="payerCode"][value="${payerValue}"]`);
          await payerInput.waitFor({ state: 'attached', timeout: 5000 });

          // ใช้ evaluate เป็นตัวจบ เพราะ MUI click แล้ว state ไม่เปลี่ยน
          await page.evaluate((val) => {
            const el = document.querySelector(`input[name="payerCode"][value="${val}"]`);
            if (!el) throw new Error(`ไม่พบ payerCode value=${val}`);

            el.click();
            el.checked = true;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }, payerValue);

          await page.waitForTimeout(300);

          if (!(await payerInput.isChecked())) {
            throw new Error(`❌ เลือก payerType ไม่สำเร็จ: ${payerTypeVal}`);
          }

          console.log(`✅ เลือก payerType: ${payerTypeVal}`);

          // ==================================================
          // 🔥 กรณี "ผู้อื่น" → กรอกข้อมูลเพิ่ม
          // ==================================================
          if (payerValue === '2') {

            console.log('👤 payerType = ผู้อื่น → กรอกข้อมูลผู้ชำระเบี้ย');

            // ===== ผู้ชำระเบี้ยประกันภัย-คำนำหน้า =====
            await optionalFillTab(page, payerPrefix, '#payerTitleCode', 'ผู้ชำระเบี้ยประกันภัย-คำนำหน้า');
            await optionalFill(page, payerName, '#payerName', 'ผู้ชำระเบี้ยประกันภัย-ชื่อ');
            await optionalFill(page, payerSurname, '#payerSurname', 'ผู้ชำระเบี้ยประกันภัย-นามสกุล');
            await optionalFill(page, payerAge, '#payerAge', 'ผู้ชำระเบี้ยประกันภัย-อายุ');
            await mandatoryFillTab(page, payerUseAddressType, '#useAddressTypeCode', 'ผู้ชำระเบี้ยประกันภัย-ใช้ตามที่อยู่');
            await optionalFill(page, payerHouseNo, '#houseNo', 'ผู้ชำระเบี้ยประกันภัย-เลขที่');
            await optionalFill(page, payerMoo, '#village', 'ผู้ชำระเบี้ยประกันภัย-หมู่ที่');
            await optionalFill(page, payerVillage, '#building', 'ผู้ชำระเบี้ยประกันภัย-หมู่บ้าน/อาคาร');
            await optionalFill(page, payerSoi, '#alley', 'ผู้ชำระเบี้ยประกันภัย-ตรอก/ซอย');
            await optionalFill(page, payerRoad, '#road', 'ผู้ชำระเบี้ยประกันภัย-ถนน');
            await mandatoryFillTab(page, payerProvince, '#provinceCode', 'ผู้ชำระเบี้ยประกันภัย-จังหวัด');
            await optionalFillTab(page, payerDistrict, '#districtCode', 'ผู้ชำระเบี้ยประกันภัย-อำเภอ/เขต');
            await optionalFillTab(page, payerSubDistrict, '#subDistrictCode', 'ผู้ชำระเบี้ยประกันภัย-ตำบล/แขวง');
            await optionalFillTab(page, payerMobile, '#section-payment #mobileNo', 'ผู้ชำระเบี้ยประกันภัย-โทรศัพท์มือถือ');
            await optionalFillTab(page, payerRelation, '#relationCode', 'ความสัมพันธ์กับผู้ขอเอาประกัน');
            await page.waitForTimeout(500);
            // ===== ผู้ชำระเบี้ยประกันภัย-เอกสารที่ใช้แสดง =====
            await optionalFillTab(page, payerDocument, '#section-payment #documentCode', 'ผู้ชำระเบี้ยประกันภัย-เอกสารที่ใช้แสดง');
            // ===== ผู้ชำระเบี้ยประกันภัย-เลขที่บัตร =====
            await optionalFillTab(page, payerCardNo, '#section-payment #cardNo', 'ผู้ชำระเบี้ยประกันภัย-เลขที่บัตร');
            // ===== ผู้ชำระเบี้ยประกันภัย-อาชีพ =====
            await optionalFillTab(page, payerOccupation, '#section-payment #occupationCode', 'ผู้ชำระเบี้ยประกันภัย-อาชีพ');
          }

          // =============
          const finalTempReceiptNo = String(finalData.tempReceiptNo || tempReceiptNo || '').trim();

          await page.getByRole('textbox', { name: 'เลขที่ใบรับเงินชั่วคราว *' }).click();
          await page.getByRole('textbox', { name: 'เลขที่ใบรับเงินชั่วคราว *' }).fill(finalTempReceiptNo);
          await page.getByRole('textbox', { name: 'เลขที่ใบรับเงินชั่วคราว *' }).press('Tab');

          await page.waitForTimeout(1000);
          await page.getByText('โอนเงินเจ้าของบัญชีเงินฝาก').first().click();

          await mandatoryFillTab(page, 'ธนาคารกรุงเทพ', '#payinBankAccountCode', 'ธนาคารโอน');
          await mandatoryFill(page, 'ออโตเมทดาต้า', '#payinBranch', 'สาขาโอน');
          await mandatoryFill(page, '1234567890', '#bankAccountNo', 'เลขที่บัญชีโอน');

          const prefix = cusTitlePrefix || '';
          const name = cusName || '';
          const surname = cusSurname || '';

          const fullName = `${prefix}${name} ${surname}`.trim();
          // await page.getByRole('textbox', { name: 'ชื่อบัญชี *' }).fill(fullName);
          const el = page.getByRole('textbox', { name: 'ชื่อบัญชี *' });

          await el.waitFor({ state: 'visible', timeout: 5000 });
          await el.click();
          await el.fill(fullName);

          // 🔍 log ค่าใน input จริง
          const actualValue = await el.inputValue();

          console.log('✅ Mandatory Fill ชื่อบัญชีโอน:', fullName);

          // 🔥 เก็บค่าจาก <p> ไว้ในตัวแปร
          totalAmount = (
            await page
              .locator('tr', { hasText: 'รวมทั้งหมด' })
              .locator('td')
              .nth(9)
              .locator('p.MuiTypography-body1')
              .innerText()
          ).replace(/,/g, '');

          console.log('💰 ยอดเงินรวมสุทธิ =', totalAmount);

          // 🔥 เอาไปใช้กับ mandatoryFill
          await mandatoryFill(
            page,
            totalAmount,
            '#amount4',
            'จำนวนเงินโอน'
          );

          await page.waitForTimeout(1000);
          await page.getByText('รับเช็คทางไปรษณีย์').first().click();
          await page.waitForTimeout(1000);

          // Category จัดการผู้รับผลประโยชน์
          const numBeneInt = parseInt(numBene, 10);

          // เปิดหน้าจัดการผู้รับประโยชน์แค่ครั้งเดียว

          if (numBeneInt > 0) {
            await page.getByRole('button', { name: 'จัดการผู้รับประโยชน์' }).click();
            await page.waitForTimeout(500);
          }

          // วนลูปตามจำนวนผู้รับผลประโยชน์
          for (let i = 0; i < numBeneInt; i++) {
            const beneItem = benes?.[i];

            if (!beneItem) {
              throw new Error(`bene หาย index=${i} | numBene=${numBene} | bene.length=${benes?.length}`);
            }

            await page.getByRole('button', { name: 'เพิ่มผู้รับประโยชน์' }).click();

            // ความสัมพันธ์
            await page.getByRole('textbox', { name: 'ความสัมพันธ์ *' }).click();
            await page.getByRole('textbox', { name: 'ความสัมพันธ์ *' }).fill(beneItem.beneRela);
            await page.getByRole('textbox', { name: 'ความสัมพันธ์ *' }).press('Tab');
            await page.waitForTimeout(500);

            // คำนำหน้า
            await page.getByRole('textbox', { name: 'คำนำหน้า *' }).click();
            await page.getByRole('textbox', { name: 'คำนำหน้า *' }).fill(beneItem.benePrefix);
            await page.getByRole('textbox', { name: 'คำนำหน้า *' }).press('Tab');
            await page.waitForTimeout(500);

            // ชื่อ
            await page.getByRole('textbox', { name: 'ชื่อ *' }).click();
            await page.getByRole('textbox', { name: 'ชื่อ *' }).fill(beneItem.beneName);
            await page.waitForTimeout(500);

            // นามสกุล
            await page.getByLabel('จัดการผู้รับประโยชน์').locator('div').filter({ hasText: /^นามสกุล$/ }).nth(1).click();
            await page.getByRole('textbox', { name: 'นามสกุล', exact: true }).fill(beneItem.beneSurname);
            await page.waitForTimeout(500);

            // อายุ
            await page.getByRole('textbox', { name: 'อายุ *' }).click();
            await page.getByRole('textbox', { name: 'อายุ *' }).fill(beneItem.beneAge);
            await page.waitForTimeout(500);

            // เฉลี่ยสัดส่วนผลประโยชน์เท่าๆกัน
            await page.getByText('เฉลี่ยสัดส่วนผลประโยชน์เท่าๆกัน').first().click();
            await page.waitForTimeout(1000);


            const useAddressInput = page
              .getByRole('dialog', { name: 'จัดการผู้รับประโยชน์ Close' })
              .locator('#useAddressTypeCode');

            await useAddressInput.waitFor({
              state: 'visible',
              timeout: 10000,
            });
            await useAddressInput.click({
              force: true,
            });
            await page.waitForTimeout(500);
            await page.keyboard.press('ArrowDown');
            await page.waitForTimeout(300);
            await page.keyboard.press('Enter');
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

          const ageInt = parseInt(age, 10);
          // const gender = gender; // "ชาย" หรือ "หญิง"
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

          await mandatoryFill(page, height, '#bmiHeight', 'ส่วนสูง');
          await mandatoryFill(page, weight, '#bmiWeight', 'น้ำหนัก');

          await page.getByText('เลือกการรับรองสถานะและคำยินยอมและตกลงปฏิบัติตามกฎหมาย FATCA ไม่มี/ไม่เป็น').first().click();
          await page.waitForTimeout(1000);
          await page.getByText('ไม่มีความประสงค์').first().click();
          await page.waitForTimeout(1000);
          await page.getByText('ไม่ยินยอม').first().click();
          await page.waitForTimeout(1000);

          if (ageInt < 21) {
            // ถ้าอายุต่ำกว่า 15 ปี ให้กรอกข้อมูลผู้ปกครอง
            console.log(`ผู้เอาประกันอายุ ${age} ปี, ต้องกรอกข้อมูลผู้ปกครอง`);

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
          await autoFillRequiredFields(page);

          console.log("Pass All checkbox")
          const elapsedSec9 = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`⏱️ ใช้เวลาไป ${elapsedSec9}s`);

          await page.getByRole('button', { name: 'บันทึก', exact: true }).click();
          await page.waitForTimeout(1000);

        }
        else if  // ===== FLOW PA รหัสใบคำขอ PST-P08-0012 =====
          (applicationFormCode === 'PST-P08-0012' && policyType === 'PA') {

          console.log('🟣 Run Flow PA รหัสใบคำขอ PST-P08-0012');


          await page.getByRole('button', { name: `Application Code : ${'PST-P08-0012'} ใบคำขอเอาประกันภัย กรมธรรม์ประกันอุบัติเหตุส่วนบุคคล` }).click();
          await page.getByRole('button', { name: 'เพิ่มข้อมูลใหม่' }).click();

          await page.waitForTimeout(1000);
          await page.getByLabel('ประเภทบัตร').click();
          await page.getByText('เลขประจำตัว 13 หลัก', { exact: true }).click();
          await page.waitForTimeout(1000);

          await page.getByRole('dialog', { name: 'ค้นหาหรือเพิ่มสำหรับเลือกข้อมูลลูกค้าเพื่อทำการบันทึกเคสใหม่ จากระบบ CIS Close' }).locator('#cardNo').click();
          await page.getByRole('dialog', { name: 'ค้นหาหรือเพิ่มสำหรับเลือกข้อมูลลูกค้าเพื่อทำการบันทึกเคสใหม่ จากระบบ CIS Close' }).locator('#cardNo').fill(cardNo);
          await page.getByLabel('คำนำหน้า').click();
          await page.getByLabel('คำนำหน้า').fill(cusTitlePrefix);
          await page.getByLabel('คำนำหน้า').press('Tab');

          const inputBirthDate = String(finalData.birthDate || '').trim();

          if (!inputBirthDate) {
            throw new Error('❌ birthDate ไม่มีค่า');
          }

          console.log(`วันเกิดจาก data: ${inputBirthDate}`);

          await page.getByRole('dialog', { name: 'ค้นหาหรือเพิ่มสำหรับเลือกข้อมูลลูกค้าเพื่อทำการบันทึกเคสใหม่ จากระบบ CIS Close' }).locator('#name').click();
          await page.getByRole('dialog', { name: 'ค้นหาหรือเพิ่มสำหรับเลือกข้อมูลลูกค้าเพื่อทำการบันทึกเคสใหม่ จากระบบ CIS Close' }).locator('#name').fill(cusName);
          await page.getByRole('dialog', { name: 'ค้นหาหรือเพิ่มสำหรับเลือกข้อมูลลูกค้าเพื่อทำการบันทึกเคสใหม่ จากระบบ CIS Close' }).locator('#surname').click();
          await page.getByRole('dialog', { name: 'ค้นหาหรือเพิ่มสำหรับเลือกข้อมูลลูกค้าเพื่อทำการบันทึกเคสใหม่ จากระบบ CIS Close' }).locator('#surname').fill(cusSurname);
          await page.getByRole('textbox', { name: 'วันเกิด *' }).click();
          await page.getByRole('textbox', { name: 'วันเกิด *' }).fill(inputBirthDate);
          await page.getByRole('textbox', { name: 'วันเกิด *' }).press('Tab');

          await page.waitForTimeout(500);


          // console.log('👉 gender raw =', gender);
          console.log('👉 finalData.gender =', finalData.gender);

          // ✅ เลือกเพศ ถ้ายังไม่ได้เลือก 
          const genderValue = String(finalData.gender || '').trim();

          const genderLabel = page
            .locator('label.MuiFormControlLabel-root')
            .filter({ hasText: genderValue })
            .first();

          await genderLabel.waitFor({ state: 'visible', timeout: 5000 });

          const genderInput = genderLabel.locator('input[name="genderCode"]');

          if (!(await genderInput.isChecked())) {
            await genderLabel.click({ force: true });
            await page.waitForTimeout(300);
          }
          await page.waitForTimeout(1000);
          await page.getByRole('button', { name: 'ยืนยัน' }).click();
          await page.getByRole('button', { name: 'ตกลง' }).click();
          // หน้าบันทึกและแก้ไขข้อมูลเคสใหม่
          // Category เลขที่ใบคำขอ
          await page.waitForTimeout(1000);
          const appNoInput = page.locator('#section-main #applicationNo');

          await fillTabAndVerify(appNoInput, applicationNo, {
            label: 'Application No',
            matchMode: 'exact',
            duplicateMessage: 'เลขที่ใบคำขอฯนี้มีอยู่ในระบบแล้ว',
            duplicateTimeout: 1200,
          });

          await page.waitForTimeout(1000);
          await page.getByRole('textbox', { name: 'วันที่เขียนใบคำขอ *' }).click();
          await page.getByLabel('วันที่เขียนใบคำขอ *').fill(currentDate + '_');
          await page.waitForTimeout(1000);

          // Category ข้อมูลตัวแทน ใหม่
          await page.getByLabel('ตัวแทนเจ้าของผลงาน *').click();
          const agentContainer = page
            .locator('div.MuiExpansionPanel-root:has(.ExpansionPanelSummaryTitle:text-is("ข้อมูลตัวแทน"))')
            .locator('div:has(:text-is("ตัวแทนเจ้าของผลงาน"))');

          await page.getByLabel('ตัวแทนเจ้าของผลงาน *').click();

          const agentInput = agentContainer.locator('#agentOwnerCode').first();

          await agentInput.fill(agentCode);
          await agentInput.press('Tab');
          await page.waitForTimeout(1000);

          // อ่านค่าจริงจากตัวแสดงผลของ control เดียวกัน
          let agentDisplay = await agentContainer
            .locator('div[class*="singleValue"]')
            .first()
            .innerText()
            .catch(() => '');

          agentDisplay = (agentDisplay || '').replace(/\s+/g, ' ').trim();

          console.log('agentDisplay =', agentDisplay);

          // ตัดเลขตัวแทนออก
          let agentNamePart = agentDisplay.replace(/^\d+\s*[-:]\s*/, '').trim();

          if (agentNamePart === agentDisplay) {
            agentNamePart = agentDisplay.replace(/^\d+\s*/, '').trim();
          }


          // Category รหัสสถาบัน/ คู่ค้า
          await mandatoryFillTab(page, partnerNo, '#orgCode', 'Partner Code');
          await page.getByText('ยืนยันมีรูปถ่าย Selfie').click();
          await mandatoryFill(page, height, '#height', 'ส่วนสูง');
          await mandatoryFill(page, weight, '#weight', 'น้ำหนัก');

          // Category ข้อมูลผู้เอาประกัน
          await page.getByRole('textbox', { name: 'วันที่บัตรหมดอายุ *' }).click();
          // 1. สร้าง Object Date สำหรับวันที่ปัจจุบัน
          const currentDate2 = new Date();
          // 2. สร้าง Object Date ใหม่โดยเพิ่มปีไปอีก 10 ปี
          const futureDate = new Date();
          futureDate.setFullYear(currentDate2.getFullYear() + 10);
          // 3. จัดรูปแบบวันที่ในอีก 10 ปีข้างหน้าให้เป็นปีพุทธศักราช
          const formattedFutureDate = getThaiBuddhistDate(futureDate);

          await mandatoryFillTab(page, expirecardNo, '#cardExpireDate', 'วันที่บัตรหมดอายุ');
          await mandatoryFillTab(page, nationality, '#nationalityCode', 'สัญชาติ');
          await mandatoryFillTab(page, documentidentify, '#documentCode', 'เอกสารที่ใช้แสดง');

          // ===== สถานภาพ =====
          // ที่อยู่ตามทะเบียนบ้าน

          await mandatoryFill(page, registerHouseNo, '#registerHouseNo', 'ที่อยู่ตามทะเบียนบ้าน-เลขที่');
          await optionalFill(page, registerMoo, '#registerVillage', 'ที่อยู่ตามทะเบียนบ้าน-หมู่ที่');
          await optionalFill(page, registerVillage, '#registerBuilding', 'ที่อยู่ตามทะเบียนบ้าน-หมู่บ้าน/อาคาร');
          await optionalFill(page, registerSoi, '#registerAlley', 'ที่อยู่ตามทะเบียนบ้าน-ตรอก/ซอย');
          await optionalFill(page, registerRoad, '#registerRoad', 'ที่อยู่ตามทะเบียนบ้าน-ถนน');
          await mandatoryFillTab(page, registerProvince, '#registerProvinceCode', 'ที่อยู่ตามทะเบียนบ้าน-จังหวัด');
          await mandatoryFillTab(page, registerDistrict, '#registerDistrictCode', 'ที่อยู่ตามทะเบียนบ้าน-อำเภอ/เขต');
          await mandatoryFillTab(page, registerSubDistrict, '#registerSubDistrictCode', 'ที่อยู่ตามทะเบียนบ้าน-ตำบล/แขวง');
          await page.waitForTimeout(1000);
          // =============
          // ที่อยู่ปัจจุบัน
          // =============
          // // ===== เงื่อนไข: ถ้า "ที่อยู่ปัจจุบัน ไม่ใช่ ที่อยู่ตามทะเบียนบ้าน"  =====
          await mandatoryFillTab(page, currentUseAddressType, '#currentUseAddressTypeCode', 'ที่อยู่ปัจจุบัน-ใช้ตามที่อยู่');
          if (currentUseAddressType !== 'ที่อยู่ตามทะเบียนบ้านของผู้เอาประกัน') {
            console.log('🏠 ระบุที่อยู่ปัจจุบันเอง');

            // ที่อยู่ปัจจุบัน-เลขที่ (Mandatory) 
            await mandatoryFill(page, currentHouseNo, '#currentHouseNo', 'ที่อยู่ปัจจุบัน-เลขที่');
            await optionalFill(page, currentMoo, '#currentVillage', 'ที่อยู่ปัจจุบัน-หมู่ที่');
            await optionalFill(page, currentVillage, '#currentBuilding', 'ที่อยู่ปัจจุบัน-หมู่บ้าน/อาคาร');
            await optionalFill(page, currentSoi, '#currentAlley', 'ที่อยู่ปัจจุบัน-ตรอก/ซอย');
            await optionalFill(page, currentRoad, '#currentRoad', 'ที่อยู่ปัจจุบัน-ถนน');
            await mandatoryFillTab(page, currentProvince, '#currentProvinceCode', 'ที่อยู่ปัจจุบัน-จังหวัด');
            await mandatoryFillTab(page, currentDistrict, '#currentDistrictCode', 'ที่อยู่ปัจจุบัน-อำเภอ/เขต');
            await mandatoryFillTab(page, currentSubDistrict, '#currentSubDistrictCode', 'ที่อยู่ปัจจุบัน-ตำบล/แขวง');
          }

          //============
          await optionalFill(page, homePhone, '#currentHomePhoneNo', 'โทรศัพท์บ้าน ปัจจุบัน');
          await mandatoryFill(page, mobilePhone, '#registerMobileNo', 'โทรศัพท์มือถือ');
          await optionalFill(page, homePhone, '#registerHomePhoneNo', 'โทรศัพท์บ้าน ทะเบียนบ้าน');

          await mandatoryFill(page, email, '#currentEmail', 'อีเมลปัจจุบัน');
          await mandatoryFill(page, email, '#registerEmail', 'อีเมล ทะเบียนบ้าน');

          if (paperOrElectronic === 'Paper') {
            // Category รูปแบบกรมธรรม์
            await page.getByText('แบบรูปเล่มกระดาษ').first().click(); // แก้ Selector ให้ถูกต้องหาก text คือ 'แบบรูปเล่มกระดาษ'
            await page.getByRole('textbox', { name: 'ส่งเอกสารกรมธรรม์ที่ *' }).click();
            await page.getByRole('textbox', { name: 'ส่งเอกสารกรมธรรม์ที่ *' }).fill(policyDeliveryLocation); // ยังคง Hardcode หรือเพิ่มใน NewCaseData
            await page.waitForTimeout(1000);
            await page.getByRole('textbox', { name: 'ส่งเอกสารกรมธรรม์ที่ *' }).press('Tab');
            await page.getByText('แบบรูปเล่มกระดาษ').nth(1).click(); // แก้ Selector ให้ถูกต้องหาก text คือ 'แบบรูปเล่มกระดาษ'
            await page.waitForTimeout(1000);
          }
          else if (paperOrElectronic === 'Email') {
            // Category รูปแบบกรมธรรม์
            await page.getByText('แบบอิเล็กทรอนิกส์').first().click();
            await page.waitForTimeout(1000);
            await page.getByText('แบบอิเล็กทรอนิกส์ โดยจัดส่งตามอีเมล').nth(1).click();
            await page.waitForTimeout(1000);
          }
          console.log("Pass Estamp")
          const elapsedSec3 = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`⏱️ ใช้เวลาไป ${elapsedSec3}s`);


          // =============
          // Category อาชีพ    
          // =============
          await mandatoryFillTab(page, occupationCode, '#currentOccupationCode', 'รหัสอาชีพ');
          await mandatoryFillTab(page, occupationPosition, '#currentPositionName', 'ตำแหน่ง');
          await optionalFillTab(page, jobDescription, '#currentJobDesc', 'ลักษณะงานที่ทำ');
          await mandatoryFillTab(page, annualIncome, '#currentIncomePerYear', 'รายได้ต่อปี');

          // =============
          console.log("Pass Occupation")
          const elapsedSec4 = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`⏱️ ใช้เวลาไป ${elapsedSec4}s`);
          //case policyName = a18,19,20 มันให้กรอกเบี้ยแทนทุน
          if (policyName.includes('โอเชี่ยนไลฟ์ โอชิ แพลน 18/10')) {
            await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).click();
            await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).fill(policyName);
            await page.waitForTimeout(1000);
            await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).press('Tab');
            await page.waitForTimeout(1000);
            await page.getByRole('textbox', { name: 'เบี้ยประกันภัยรวม *' }).click();
            await page.waitForTimeout(2000);
            await page.getByRole('textbox', { name: 'เบี้ยประกันภัยรวม *' }).fill(insuredAmount);
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
            const policyNameInput = page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *', });
            await policyNameInput.click();
            await policyNameInput.fill('');
            await policyNameInput.type(policyName, {
              delay: 100,
            });

            await page.waitForTimeout(1000);
            await policyNameInput.press('Tab');
            await page.waitForTimeout(1000);

            // ✅ verify react-select
            let actualPolicyName = await policyNameInput
              .inputValue()
              .catch(() => '');

            if (!String(actualPolicyName || '').trim()) {
              const policyContainer = policyNameInput.locator(
                'xpath=ancestor::div[contains(@class,"container")][1]'
              );

              actualPolicyName = await policyContainer
                .locator('div[class*="singleValue"]')
                .first()
                .innerText()
                .catch(() => '');
            }

            actualPolicyName = String(actualPolicyName || '').trim();

            console.log('🔎 policyName actual =', actualPolicyName);

            if (!actualPolicyName) {
              throw new Error(
                `❌ ชื่อแบบประกันภัยไม่ถูกเลือกหรือ fill ไม่สำเร็จ: ${policyName}`
              );
            }
            await waitOptionalLoading(page);
            //===================
            // ระบุทุนประกันภัย 
            //==================
            const insuredAmountRaw = String(insuredAmount || '').trim();

            // ✅ ลบทุกอย่างที่ไม่ใช่ตัวเลข
            const insuredAmountNumber = Number(
              insuredAmountRaw.replace(/[^\d]/g, '')
            );

            // ✅ format กลับเป็น comma
            const insuredAmountFormatted =
              insuredAmountNumber.toLocaleString('en-US');

            console.log('💰 insuredAmountFormatted =', insuredAmountFormatted);

            const insuredAmountInput = page.getByRole('textbox', {
              name: 'ทุนประกันภัย *',
            });

            await insuredAmountInput.click();
            await insuredAmountInput.fill('');
            await insuredAmountInput.type(
              insuredAmountFormatted,
              { delay: 100 }
            );

            await page.waitForTimeout(1000);
            await insuredAmountInput.press('Tab');
            //===================

            await waitOptionalLoading(page);


            //===================
            // ระบุทุดชดเชย
            //==================
            const premiumVal = String(premium || '').trim();

            const compensationInput = page.locator('#dabSumInsId');

            if (premiumVal !== '') {

              // ✅ เช็ค disabled/readOnly
              const isDisabledOrReadonly = await compensationInput.evaluate(el => {
                return el.disabled || el.readOnly;
              }).catch(() => false);

              // ✅ อ่านค่าปัจจุบัน
              let currentValue = await compensationInput
                .inputValue()
                .catch(() => '');

              // ✅ fallback สำหรับ react-select
              if (!String(currentValue || '').trim()) {

                const compensationContainer = page
                  .locator('#dabSumInsId')
                  .locator(
                    'xpath=ancestor::div[contains(@class,"css-")][contains(@class,"container")][1]'
                  )
                  .first();

                const singleValue = compensationContainer
                  .locator('div[class*="singleValue"]')
                  .first();

                // ✅ เช็คก่อนว่ามี singleValue จริงไหม
                if (await singleValue.count()) {

                  currentValue = await singleValue
                    .textContent({ timeout: 500 })
                    .catch(() => '');

                } else {

                  currentValue = '';

                }
              }

              currentValue = String(currentValue || '').trim();

              // ✅ ถ้ามีค่าอยู่แล้ว หรือ disabled → ข้าม
              if (
                isDisabledOrReadonly ||
                currentValue !== ''
              ) {

                console.log(
                  `ℹ️ ข้ามทุนชดเชย | disabled=${isDisabledOrReadonly} | current="${currentValue}"`
                );

              } else {

                await compensationInput.click();

                // ===== กรณี Any =====
                if (premiumVal.toLowerCase() === 'any') {

                  console.log('ℹ️ premium = Any → เลือกรายการแรก');
                  await page.waitForTimeout(500);
                  await page.keyboard.press('ArrowDown');
                  await page.waitForTimeout(300);
                  await page.keyboard.press('Enter');
                  await page.waitForTimeout(500);

                }

                // ===== กรณีมีค่าปกติ =====
                else {

                  // ✅ normalize ตัวเลข
                  const premiumNumber = Number(
                    premiumVal.replace(/[^\d]/g, '')
                  );

                  // ✅ format comma
                  const premiumFormatted =
                    premiumNumber.toLocaleString('en-US');

                  console.log('💰 premiumFormatted =', premiumFormatted);

                  await compensationInput.fill('');

                  await compensationInput.type(
                    premiumFormatted,
                    { delay: 100 }
                  );

                  await page.waitForTimeout(1000);

                  await compensationInput.press('Tab');
                }
              }
            }
            else {
              console.log('ℹ️ ไม่มีการระบุทุนชดเชย');
            }
            await waitOptionalLoading(page);
          }
          console.log("Pass Main Insurance")
          const elapsedSec5 = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`⏱️ ใช้เวลาไป ${elapsedSec5}s`);

          console.log("Pass Rider")
          const elapsedSec6 = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`⏱️ ใช้เวลาไป ${elapsedSec6}s`);
          // console.log(`จำนวนสัญญาเพิ่มเติมที่เพิ่มที่ถูกเพิ่ม: ${addedRiderCount} รายการ`);
          await page.waitForTimeout(1000);

          // ดึงข้อมูลทั้งหมดจากหน้าเว็บ
          const draftPremium3 = await page.locator('td.MuiTableCell-body.MUIDataTableBodyCell-root-58').allTextContents();

          let premiumPay;
          let filledPay = 0; // ✅ ประกาศนอก loop เพื่อเก็บค่ารวม
          let insuMainIndex = -1; // ประกาศตัวแปรเพื่อเก็บ index ของแบบประกันหลัก
          insuMainIndex = draftPremium3.findLastIndex(text => text.includes(policyName));

          if (insuMainIndex !== -1) {
            const insuMain = draftPremium3[insuMainIndex];
            const insuMoney = draftPremium3[insuMainIndex + 4];
            const insuPremium = parseFloat(draftPremium3[insuMainIndex + 6]?.replace(/,/g, '')) || 0;
            const insuSpePremium = parseFloat(draftPremium3[insuMainIndex + 8]?.replace(/,/g, '')) || 0;
            const insuCommis = draftPremium3[insuMainIndex + 12];

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
            console.log(`ค่า Premium ที่ชำระที่ยังไม่รวมเบี้ยเพิ่มพิเศษ: ${premiumPay}`);
            console.log(`✅ รวมเบี้ยทั้งหมด (filledPay) คือค่าเบี้ย หลัก บวก rider ที่ซื้อเท่านั้น ไม่ได้คิด bundle ที่แถมมา: ${filledPay}`);
          } else {
            console.log('ไม่พบแบบประกันหลักที่กำหนด');
          }
          console.log("Pass Display Insurance Money")
          const elapsedSec7 = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`⏱️ ใช้เวลาไป ${elapsedSec7}s`);



          // 🔥 เก็บยอด เบี้ยประกันภัยรวมทั้งหมด
          const premiumSummaryBlock = page
            .getByText('เบี้ยประกันภัยรวมทั้งหมด')
            .locator('..')
            .locator('..');

          totalAmount = (
            await premiumSummaryBlock
              .locator('div.MuiGrid-grid-xs-1 p.MuiTypography-body1')
              .first()
              .innerText()
          ).replace(/,/g, '').trim();

          console.log('💰 ยอดเงินรวมสุทธิ =', totalAmount);

          console.log('-------------------------------');
          // Category จัดการผู้รับผลประโยชน์
          const numBeneInt = parseInt(numBene, 10);

          // เปิดหน้าจัดการผู้รับประโยชน์แค่ครั้งเดียว

          if (numBeneInt > 0) {
            await page.getByRole('button', { name: 'จัดการผู้รับประโยชน์' }).click();
            await page.waitForTimeout(500);
          }

          // วนลูปตามจำนวนผู้รับผลประโยชน์
          for (let i = 0; i < numBeneInt; i++) {
            const beneItem = benes?.[i];

            if (!beneItem) {
              throw new Error(`bene หาย index=${i} | numBene=${numBene} | bene.length=${benes?.length}`);
            }

            await page.getByRole('button', { name: 'เพิ่มผู้รับประโยชน์' }).click();
            await page.waitForTimeout(500);

            // ความสัมพันธ์
            await mandatoryFillTab(page, beneItem.beneRela, '#beneficiaryRelationCode', 'ความสัมพันธ์ผู้รับประโยชน์');
            await page.waitForTimeout(500);

            // คำนำหน้า
            await mandatoryFillTab(page, beneItem.benePrefix, '#beneficiaryTitleCode', 'คำนำหน้าผู้รับประโยชน์');
            await page.waitForTimeout(500);

            // ชื่อ
            await mandatoryFillTab(page, beneItem.beneName, '#beneficiaryName', 'ชื่อผู้รับประโยชน์');
            await page.waitForTimeout(500);

            // นามสกุล
            await optionalFillTab(page, beneItem.beneSurname, '#beneficiarySurname', 'นามสกุลผู้รับประโยชน์');
            await page.waitForTimeout(500);

            // อายุ
            await mandatoryFillTab(page, beneItem.beneAge, '#beneficiaryAge', 'อายุผู้รับประโยชน์');
            await page.waitForTimeout(500);

            // เฉลี่ยสัดส่วนผลประโยชน์เท่าๆกัน
            await page.getByText('เฉลี่ยสัดส่วนผลประโยชน์เท่าๆกัน').first().click();
            await page.waitForTimeout(1000);

            // ที่อยู่ปัจจุบัน ดึงค่าจากทะเบียนบ้าน

            const useAddressInput = page
              .getByRole('dialog', { name: 'จัดการผู้รับประโยชน์ Close' })
              .locator('#useAddressTypeCode');

            await useAddressInput.waitFor({
              state: 'visible',
              timeout: 10000,
            });
            await useAddressInput.click({
              force: true,
            });
            await page.waitForTimeout(500);
            await page.keyboard.press('ArrowDown');
            await page.waitForTimeout(300);
            await page.keyboard.press('Enter');
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
          //=============
          // Helper Category คำแถลง
          //=============
          async function forceRadio(page, name, value, label) {
            await page.evaluate(({ name, value }) => {
              const el = document.querySelector(`input[name="${name}"][value="${value}"]`);

              if (!el) {
                throw new Error(`ไม่พบ radio name=${name} value=${value}`);
              }

              el.checked = true;
              el.click();
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
            }, { name, value });

            await page.waitForTimeout(300);

            const checked = await page
              .locator(`input[name="${name}"][value="${value}"]`)
              .isChecked()
              .catch(() => false);

            if (!checked) {
              throw new Error(`❌ เลือก ${label} ไม่สำเร็จ`);
            }

            console.log(`✅ เลือก ${label}`);
          }
          //===== เลือกคำแถลง
          console.log('🩺 เลือกคำแถลงทั้งหมด');

          // ข้อ 4 = ไม่มี
          await page
            .locator('input[name="insureHistoryCompanyAnswer"][value="N"]')
            .click({ force: true });

          await page.waitForTimeout(300);


          // ข้อ 5 = ไม่เคย
          await page
            .locator('input[name="paHealthDeclarationAnswer"][value="N"]')
            .click({ force: true });

          await page.waitForTimeout(300);

          // ภาษี = ไม่มีความประสงค์
          await page
            .locator('input[name="taxAnswer"][value="N"]')
            .click({ force: true });

          await page.waitForTimeout(300);

          // การตลาด = ไม่ยินยอม
          await page
            .locator('input[name="consentAnswer"][value="N"]')
            .click({ force: true });
          await page.waitForTimeout(500);

          console.log('📎 ตรวจ checkbox ที่ required');

          const requiredCheckboxLabels = page.locator(
            'label.MuiFormControlLabel-root:has(span[style*="red"])'
          );

          const requiredCount = await requiredCheckboxLabels.count();

          console.log(`📌 พบ required checkbox = ${requiredCount}`);

          for (let i = 0; i < requiredCount; i++) {

            const label = requiredCheckboxLabels.nth(i);

            const checkbox = label.locator('input[type="checkbox"]');

            const checked = await checkbox.isChecked().catch(() => false);

            if (!checked) {

              await label.click({ force: true });

              console.log(`✅ checked required checkbox index=${i}`);

              await page.waitForTimeout(300);
            }
          }

          console.log('✅ checked required checkbox ครบแล้ว');

          console.log('✅ เลือกคำแถลงทั้งหมดเรียบร้อย');

          await page.getByRole('button', { name: 'บันทึก', exact: true }).click();
          await page.waitForTimeout(1000);

        }
        else if  // ===== FLOW MRTA รหัสใบคำขอ BA010 =====
          (applicationFormCode === 'BA010' && policyType === 'MRTA') {

          console.log('🟣 Run Flow MRTA รหัสใบคำขอ BA010');


          await page.getByRole('button', { name: `Application Code : ${'BA010'} ใบคำขอเอาประกันภัยกลุ่ม แบบคุ้มครองสินเชื่อ (มีคำถามสุขภาพอย่างสั้น)` }).click();
          await page.getByRole('button', { name: 'เพิ่มข้อมูลใหม่' }).click();

          await page.waitForTimeout(1000);
          await page.getByLabel('ประเภทบัตร').click();
          await page.getByText('เลขประจำตัว 13 หลัก', { exact: true }).click();
          await page.waitForTimeout(1000);

          await page.getByRole('dialog', { name: 'ค้นหาหรือเพิ่มสำหรับเลือกข้อมูลลูกค้าเพื่อทำการบันทึกเคสใหม่ จากระบบ CIS Close' }).locator('#cardNo').click();
          await page.getByRole('dialog', { name: 'ค้นหาหรือเพิ่มสำหรับเลือกข้อมูลลูกค้าเพื่อทำการบันทึกเคสใหม่ จากระบบ CIS Close' }).locator('#cardNo').fill(cardNo);
          await page.getByLabel('คำนำหน้า').click();
          await page.getByLabel('คำนำหน้า').fill(cusTitlePrefix);
          await page.getByLabel('คำนำหน้า').press('Tab');


          const inputBirthDate = String(finalData.birthDate || '').trim();

          if (!inputBirthDate) {
            throw new Error('❌ birthDate ไม่มีค่า');
          }

          console.log(`วันเกิดจาก data: ${inputBirthDate}`);

          await page.getByRole('dialog', { name: 'ค้นหาหรือเพิ่มสำหรับเลือกข้อมูลลูกค้าเพื่อทำการบันทึกเคสใหม่ จากระบบ CIS Close' }).locator('#name').click();
          await page.getByRole('dialog', { name: 'ค้นหาหรือเพิ่มสำหรับเลือกข้อมูลลูกค้าเพื่อทำการบันทึกเคสใหม่ จากระบบ CIS Close' }).locator('#name').fill(cusName);
          await page.getByRole('dialog', { name: 'ค้นหาหรือเพิ่มสำหรับเลือกข้อมูลลูกค้าเพื่อทำการบันทึกเคสใหม่ จากระบบ CIS Close' }).locator('#surname').click();
          await page.getByRole('dialog', { name: 'ค้นหาหรือเพิ่มสำหรับเลือกข้อมูลลูกค้าเพื่อทำการบันทึกเคสใหม่ จากระบบ CIS Close' }).locator('#surname').fill(cusSurname);
          await page.getByRole('textbox', { name: 'วันเกิด *' }).click();
          await page.getByRole('textbox', { name: 'วันเกิด *' }).fill(inputBirthDate);
          await page.getByRole('textbox', { name: 'วันเกิด *' }).press('Tab');

          await page.waitForTimeout(500);


          // console.log('👉 gender raw =', gender);
          console.log('👉 finalData.gender =', finalData.gender);

          // ✅ เลือกเพศ ถ้ายังไม่ได้เลือก 
          const genderValue = String(finalData.gender || '').trim();

          const genderLabel = page
            .locator('label.MuiFormControlLabel-root')
            .filter({ hasText: genderValue })
            .first();

          await genderLabel.waitFor({ state: 'visible', timeout: 5000 });

          const genderInput = genderLabel.locator('input[name="genderCode"]');

          if (!(await genderInput.isChecked())) {
            await genderLabel.click({ force: true });
            await page.waitForTimeout(300);
          }
          await page.waitForTimeout(1000);
          await page.getByRole('button', { name: 'ยืนยัน' }).click();
          await page.getByRole('button', { name: 'ตกลง' }).click();
          // หน้าบันทึกและแก้ไขข้อมูลเคสใหม่
          // Category เลขที่ใบคำขอ
          await page.waitForTimeout(1000);
          const appNoInput = page.locator('#section-main #applicationNo');

          await fillTabAndVerify(appNoInput, applicationNo, {
            label: 'Application No',
            matchMode: 'exact',
            duplicateMessage: 'เลขที่ใบคำขอฯนี้มีอยู่ในระบบแล้ว',
            duplicateTimeout: 1200,
          });

          await page.waitForTimeout(1000);
          await page.getByRole('textbox', { name: 'วันที่เขียนใบคำขอ *' }).click();
          await page.getByLabel('วันที่เขียนใบคำขอ *').fill(currentDate + '_');
          await page.waitForTimeout(1000);

          // Category ข้อมูลตัวแทน ใหม่
          await page.getByLabel('ตัวแทนเจ้าของผลงาน *').click();
          const agentContainer = page
            .locator('div.MuiExpansionPanel-root:has(.ExpansionPanelSummaryTitle:text-is("ข้อมูลตัวแทน"))')
            .locator('div:has(:text-is("ตัวแทนเจ้าของผลงาน"))');

          await page.getByLabel('ตัวแทนเจ้าของผลงาน *').click();

          const agentInput = agentContainer.locator('#agentOwnerCode').first();

          await agentInput.fill(agentCode);
          await agentInput.press('Tab');
          await page.waitForTimeout(1000);

          // อ่านค่าจริงจากตัวแสดงผลของ control เดียวกัน
          let agentDisplay = await agentContainer
            .locator('div[class*="singleValue"]')
            .first()
            .innerText()
            .catch(() => '');

          agentDisplay = (agentDisplay || '').replace(/\s+/g, ' ').trim();

          console.log('agentDisplay =', agentDisplay);

          // ตัดเลขตัวแทนออก
          let agentNamePart = agentDisplay.replace(/^\d+\s*[-:]\s*/, '').trim();

          if (agentNamePart === agentDisplay) {
            agentNamePart = agentDisplay.replace(/^\d+\s*/, '').trim();
          }


          // Category รหัสสถาบัน/ คู่ค้า
          await mandatoryFillTab(page, partnerNo, '#orgCode', 'Partner Code');

          await mandatoryFillTab(page, partnerCode2, '#partnerCode:visible', 'Partner Code 2');
          // await page.getByText('ยืนยันมีรูปถ่าย Selfie').click();

          await mandatoryFill(page, height, '#height', 'ส่วนสูง');
          await mandatoryFill(page, weight, '#weight', 'น้ำหนัก');

          // Category ข้อมูลผู้เอาประกัน
          await page.getByRole('textbox', { name: 'วันที่บัตรหมดอายุ *' }).click();
          // 1. สร้าง Object Date สำหรับวันที่ปัจจุบัน
          const currentDate2 = new Date();
          // 2. สร้าง Object Date ใหม่โดยเพิ่มปีไปอีก 10 ปี
          const futureDate = new Date();
          futureDate.setFullYear(currentDate2.getFullYear() + 10);
          // 3. จัดรูปแบบวันที่ในอีก 10 ปีข้างหน้าให้เป็นปีพุทธศักราช
          const formattedFutureDate = getThaiBuddhistDate(futureDate);

          await mandatoryFillTab(page, expirecardNo, '#cardExpireDate', 'วันที่บัตรหมดอายุ');
          await mandatoryFillTab(page, nationality, '#nationalityCode', 'สัญชาติ');
          await mandatoryFillTab(page, documentidentify, '#documentCode', 'เอกสารที่ใช้แสดง');
          //  await page.waitForTimeout(300);


          // ===== สถานภาพ =====
          await mandatoryFillTab(page, maritalStatus, '#maritalStatusCode', 'สถานภาพ');

          await mandatoryFill(page, registerHouseNo, '#registerHouseNo', 'ที่อยู่ตามทะเบียนบ้าน-เลขที่');
          await optionalFill(page, registerMoo, '#registerVillage', 'ที่อยู่ตามทะเบียนบ้าน-หมู่ที่');
          await optionalFill(page, registerVillage, '#registerBuilding', 'ที่อยู่ตามทะเบียนบ้าน-หมู่บ้าน/อาคาร');
          await optionalFill(page, registerSoi, '#registerAlley', 'ที่อยู่ตามทะเบียนบ้าน-ตรอก/ซอย');
          await optionalFill(page, registerRoad, '#registerRoad', 'ที่อยู่ตามทะเบียนบ้าน-ถนน');
          await mandatoryFillTab(page, registerProvince, '#registerProvinceCode', 'ที่อยู่ตามทะเบียนบ้าน-จังหวัด');
          await mandatoryFillTab(page, registerDistrict, '#registerDistrictCode', 'ที่อยู่ตามทะเบียนบ้าน-อำเภอ/เขต');
          await mandatoryFillTab(page, registerSubDistrict, '#registerSubDistrictCode', 'ที่อยู่ตามทะเบียนบ้าน-ตำบล/แขวง');
          await page.waitForTimeout(1000);
          // =============
          // ที่อยู่ปัจจุบัน
          // =============
          // // ===== เงื่อนไข: ถ้า "ที่อยู่ปัจจุบัน ไม่ใช่ ที่อยู่ตามทะเบียนบ้าน"  =====
          await mandatoryFillTab(page, currentUseAddressType, '#currentUseAddressTypeCode', 'ที่อยู่ปัจจุบัน-ใช้ตามที่อยู่');
          if (currentUseAddressType !== 'ที่อยู่ตามทะเบียนบ้านของผู้เอาประกัน') {
            console.log('🏠 ระบุที่อยู่ปัจจุบันเอง');

            // ที่อยู่ปัจจุบัน-เลขที่ (Mandatory) 
            await mandatoryFill(page, currentHouseNo, '#currentHouseNo', 'ที่อยู่ปัจจุบัน-เลขที่');
            await optionalFill(page, currentMoo, '#currentVillage', 'ที่อยู่ปัจจุบัน-หมู่ที่');
            await optionalFill(page, currentVillage, '#currentBuilding', 'ที่อยู่ปัจจุบัน-หมู่บ้าน/อาคาร');
            await optionalFill(page, currentSoi, '#currentAlley', 'ที่อยู่ปัจจุบัน-ตรอก/ซอย');
            await optionalFill(page, currentRoad, '#currentRoad', 'ที่อยู่ปัจจุบัน-ถนน');
            await mandatoryFillTab(page, currentProvince, '#currentProvinceCode', 'ที่อยู่ปัจจุบัน-จังหวัด');
            await mandatoryFillTab(page, currentDistrict, '#currentDistrictCode', 'ที่อยู่ปัจจุบัน-อำเภอ/เขต');
            await mandatoryFillTab(page, currentSubDistrict, '#currentSubDistrictCode', 'ที่อยู่ปัจจุบัน-ตำบล/แขวง');
          }
          // =============
          // สถานที่สะดวกในการติดต่อและส่งเอกสาร
          // =============
          const contactPlaceTypeVal = String(contactPlaceType || '').trim();

          let contactFlagValue = '';

          if (contactPlaceTypeVal === 'ที่อยู่ตามทะเบียนบ้าน') {
            contactFlagValue = 'REG';

          } else if (contactPlaceTypeVal === 'ที่อยู่ปัจจุบัน') {
            contactFlagValue = 'CON';

          } else if (contactPlaceTypeVal === 'สถานที่ทำงาน') {

            // ⚠️ ระบบไม่มี radio ของสถานที่ทำงาน
            // จึง default เป็น REG แทน
            contactFlagValue = 'REG';

            console.log(
              '⚠️ สถานที่ทำงานไม่มี Radio ให้เลือก → Default เป็น ที่อยู่ตามทะเบียนบ้าน (REG)'
            );

          } else {
            throw new Error(`❌ contactPlaceType ไม่ถูกต้อง: ${contactPlaceTypeVal}`);
          }

          const contactRadioInput = page.locator(
            `input[name="contactFlag"][value="${contactFlagValue}"]`
          );

          await contactRadioInput.waitFor({
            state: 'attached',
            timeout: 5000,
          });

          // ✅ click ที่ label ครอบ input แทน input ตรง ๆ
          const contactRadioLabel =
            contactRadioInput.locator('xpath=ancestor::label[1]');

          await contactRadioLabel.click({
            force: true,
          });

          await page.waitForTimeout(300);

          // ✅ verify ว่าติดจริง
          const checked = await contactRadioInput.isChecked();

          if (!checked) {
            throw new Error(
              `❌ เลือกสถานที่สะดวกในการติดต่อไม่สำเร็จ: ${contactPlaceTypeVal} (${contactFlagValue})`
            );
          }

          console.log(
            `✅ เลือกสถานที่สะดวกในการติดต่อ: ${contactPlaceTypeVal}`
          );


          await mandatoryFill(page, mobilePhone, '#currentMobileNo', 'โทรศัพท์มือถือ');
          await optionalFill(page, homePhone, '#currentHomePhoneNo', 'โทรศัพท์บ้าน');
          await optionalFill(page, email, '#currentEmail', 'อีเมลปัจจุบัน');

          await mandatoryFill(page, mobilePhone, '#registerMobileNo', 'โทรศัพท์มือถือ');
          await optionalFill(page, homePhone, '#registerHomePhoneNo', 'โทรศัพท์บ้าน ทะเบียนบ้าน');
          await mandatoryFill(page, email, '#registerEmail', 'อีเมล ทะเบียนบ้าน');

          if (paperOrElectronic === 'Paper') {
            // Category รูปแบบกรมธรรม์
            await page.getByText('แบบรูปเล่มกระดาษ').first().click(); // แก้ Selector ให้ถูกต้องหาก text คือ 'แบบรูปเล่มกระดาษ'
            await page.getByRole('textbox', { name: 'ส่งเอกสารกรมธรรม์ที่ *' }).click();
            await page.getByRole('textbox', { name: 'ส่งเอกสารกรมธรรม์ที่ *' }).fill(policyDeliveryLocation); // ยังคง Hardcode หรือเพิ่มใน NewCaseData
            await page.waitForTimeout(1000);
            await page.getByRole('textbox', { name: 'ส่งเอกสารกรมธรรม์ที่ *' }).press('Tab');
            await page.getByText('แบบรูปเล่มกระดาษ').nth(1).click(); // แก้ Selector ให้ถูกต้องหาก text คือ 'แบบรูปเล่มกระดาษ'
            await page.waitForTimeout(1000);
          }
          else if (paperOrElectronic === 'Email') {
            // Category รูปแบบกรมธรรม์
            await page.getByText('แบบอิเล็กทรอนิกส์').first().click();
            await page.waitForTimeout(1000);
            await page.getByText('แบบอิเล็กทรอนิกส์ โดยจัดส่งตามอีเมล').nth(1).click();
            await page.waitForTimeout(1000);
          }
          console.log("Pass Estamp")
          const elapsedSec3 = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`⏱️ ใช้เวลาไป ${elapsedSec3}s`);


          // =============
          // Category อาชีพ    
          // =============
          await mandatoryFillTab(page, occupationCode, '#currentOccupationCode', 'รหัสอาชีพ');
          await mandatoryFillTab(page, occupationPosition, '#currentPositionName', 'ตำแหน่ง');

          await mandatoryFillTab(page, annualIncome, '#currentIncomePerYear', 'รายได้ต่อปี');
          console.log("Pass Occupation")
          const elapsedSec4 = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`⏱️ ใช้เวลาไป ${elapsedSec4}s`);
          // =============

          //case policyName = a18,19,20 มันให้กรอกเบี้ยแทนทุน
          if (policyName.includes('โอเชี่ยนไลฟ์ โอชิ แพลน 18/10')) {
            await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).click();
            await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).fill(policyName);
            await page.waitForTimeout(1000);
            await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).press('Tab');
            await page.waitForTimeout(1000);
            await page.getByRole('textbox', { name: 'เบี้ยประกันภัยรวม *' }).click();
            await page.waitForTimeout(2000);
            await page.getByRole('textbox', { name: 'เบี้ยประกันภัยรวม *' }).fill(insuredAmount);
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
            //===================
            // ระบุชื่อแบบประกันภัย ด้วย policyCode + policyName
            //===================
            const policyCodeVal = String(policyCode || '').trim();
            const policyNameVal = String(policyName || '').trim();

            const policyNameText = policyNameVal.includes(policyCodeVal)
              ? policyNameVal
              : `${policyCodeVal} - ${policyNameVal}`;

            console.log('📌 policyNameText =', policyNameText);

            const policyNameInput = page.locator('input#planCode');

            await policyNameInput.waitFor({
              state: 'visible',
              timeout: 10000,
            });

            await policyNameInput.click();

            await policyNameInput.evaluate((el, value) => {
              el.focus();
              el.value = '';
              el.dispatchEvent(new Event('input', { bubbles: true }));

              document.execCommand('insertText', false, value);

              el.dispatchEvent(new Event('input', { bubbles: true }));
            }, policyNameText);

            await page.waitForTimeout(800);
            await policyNameInput.press('Enter');
            await page.waitForTimeout(1000);

            const actualPolicyName = await page
              .locator('div[class*="singleValue"]')
              .filter({ hasText: policyCodeVal })
              .first()
              .innerText()
              .catch(() => '');

            console.log('🔎 policyName actual =', actualPolicyName);

            if (!String(actualPolicyName || '').includes(policyCodeVal)) {
              throw new Error(
                `❌ เลือกชื่อแบบประกันภัยผิด expected=${policyNameText} actual=${actualPolicyName}`
              );
            }

            await waitOptionalLoading(page);

            await page.getByRole('textbox', { name: 'จำนวนเงินเอาประกันภัย *' }).type(insuredAmount, { delay: 100 });
            await page.waitForTimeout(1000);
            await page.getByRole('textbox', { name: 'จำนวนเงินเอาประกันภัย *' }).press('Tab');

          }
          console.log("Pass Main Insurance")
          const elapsedSec5 = ((Date.now() - startTime) / 1000).toFixed(2);
          // console.log(`⏱️ ใช้เวลาไป ${elapsedSec5}s`);

          console.log("Pass Rider")
          const elapsedSec6 = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`⏱️ ใช้เวลาไป ${elapsedSec6}s`);
          // console.log(`จำนวนสัญญาเพิ่มเติมที่เพิ่มที่ถูกเพิ่ม: ${addedRiderCount} รายการ`);
          await page.waitForTimeout(1000);

          // ดึงข้อมูลทั้งหมดจากหน้าเว็บ
          const draftPremium3 = await page.locator('td.MuiTableCell-body.MUIDataTableBodyCell-root-58').allTextContents();

          let premiumPay;
          let filledPay = 0; // ✅ ประกาศนอก loop เพื่อเก็บค่ารวม
          let insuMainIndex = -1; // ประกาศตัวแปรเพื่อเก็บ index ของแบบประกันหลัก
          insuMainIndex = draftPremium3.findLastIndex(text => text.includes(policyName));

          if (insuMainIndex !== -1) {
            const insuMain = draftPremium3[insuMainIndex];
            const insuMoney = draftPremium3[insuMainIndex + 4];
            const insuPremium = parseFloat(draftPremium3[insuMainIndex + 6]?.replace(/,/g, '')) || 0;
            const insuSpePremium = parseFloat(draftPremium3[insuMainIndex + 8]?.replace(/,/g, '')) || 0;
            const insuCommis = draftPremium3[insuMainIndex + 12];

            // ✅ ตั้ง index เริ่มต้นไว้ที่แบบประกันหลัก
            let lastRiderIndex = insuMainIndex;

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
            console.log(`ค่า Premium ที่ชำระที่ยังไม่รวมเบี้ยเพิ่มพิเศษ: ${premiumPay}`);
            console.log(`✅ รวมเบี้ยทั้งหมด (filledPay) คือค่าเบี้ย หลัก บวก rider ที่ซื้อเท่านั้น ไม่ได้คิด bundle ที่แถมมา: ${filledPay}`);
          } else {
            console.log('ไม่พบแบบประกันหลักที่กำหนด');
          }
          console.log("Pass Display Insurance Money")
          const elapsedSec7 = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`⏱️ ใช้เวลาไป ${elapsedSec7}s`);


          // 🔥 เก็บยอด เบี้ยประกันภัยรวมทั้งหมด
          const premiumSummaryBlock = page
            .getByText('เบี้ยประกันภัยรวมทั้งหมด')
            .locator('..')
            .locator('..');

          totalAmount = (
            await premiumSummaryBlock
              .locator('div.MuiGrid-grid-xs-1 p.MuiTypography-body1')
              .first()
              .innerText()
          ).replace(/,/g, '').trim();

          console.log('💰 ยอดเงินรวมสุทธิ =', totalAmount);

          console.log('-------------------------------');

          //===================
          // ระบุจำนวนขอกู้ = insuredAmount + 500
          //===================
          const insuredAmountNumberForLoan = Number(
            String(insuredAmount || '').replace(/[^\d]/g, '')
          );

          if (
            !insuredAmountNumberForLoan ||
            Number.isNaN(insuredAmountNumberForLoan)
          ) {
            throw new Error(
              `❌ insuredAmount ไม่ถูกต้อง: ${insuredAmount}`
            );
          }

          const loanAmountNumber = insuredAmountNumberForLoan + 500;
          const loanAmountFormatted = loanAmountNumber.toLocaleString('en-US');

          console.log(`💰 จำนวนเงินขอกู้ = ${insuredAmountNumberForLoan} + 500 = ${loanAmountFormatted}`);

          const loanAmountInput = page.locator('#loanAmount');

          await loanAmountInput.waitFor({
            state: 'visible',
            timeout: 10000,
          });

          const isDisabledOrReadonly = await loanAmountInput
            .evaluate(el => el.disabled || el.readOnly)
            .catch(() => false);

          if (isDisabledOrReadonly) {
            console.log('ℹ️ ข้ามจำนวนขอกู้ เพราะ field disabled/readOnly');
          } else {
            await loanAmountInput.click();
            await loanAmountInput.fill('');

            await loanAmountInput.type(loanAmountFormatted, {
              delay: 100,
            });

            await page.waitForTimeout(1000);
            await loanAmountInput.press('Tab');
          }

          // ✅ เก็บไว้เขียนกลับ Google Sheet
          finalData.loanAmount = loanAmountNumber;
          //=========================
          // By Pass ช่องทางรับผลประโยชน์ เป็น รับเช็คทางไปรษณีย์
          await page.locator('input[name="benefitChannelCode"][value="CHQ"]').click({ force: true });

          //=========================
          // Category จัดการผู้รับผลประโยชน์
          const numBeneInt = parseInt(numBene, 10);

          // เปิดหน้าจัดการผู้รับประโยชน์แค่ครั้งเดียว

          if (numBeneInt > 0) {
            await page.getByRole('button', { name: 'จัดการผู้รับประโยชน์' }).click();
            await page.waitForTimeout(500);
          }

          // วนลูปตามจำนวนผู้รับผลประโยชน์
          for (let i = 0; i < numBeneInt; i++) {
            const beneItem = benes?.[i];

            if (!beneItem) {
              throw new Error(`bene หาย index=${i} | numBene=${numBene} | bene.length=${benes?.length}`);
            }

            await page.getByRole('button', { name: 'เพิ่มผู้รับประโยชน์' }).click();
            await page.waitForTimeout(500);

            // ความสัมพันธ์
            await mandatoryFillTab(page, beneItem.beneRela, '#beneficiaryRelationCode', 'ความสัมพันธ์ผู้รับประโยชน์');
            await page.waitForTimeout(500);

            // คำนำหน้า
            await mandatoryFillTab(page, beneItem.benePrefix, '#beneficiaryTitleCode', 'คำนำหน้าผู้รับประโยชน์');
            await page.waitForTimeout(500);

            // ชื่อ
            await mandatoryFillTab(page, beneItem.beneName, '#beneficiaryName', 'ชื่อผู้รับประโยชน์');
            await page.waitForTimeout(500);

            // นามสกุล
            await optionalFillTab(page, beneItem.beneSurname, '#beneficiarySurname', 'นามสกุลผู้รับประโยชน์');
            await page.waitForTimeout(500);

            // อายุ
            await mandatoryFillTab(page, beneItem.beneAge, '#beneficiaryAge', 'อายุผู้รับประโยชน์');
            await page.waitForTimeout(500);

            // เฉลี่ยสัดส่วนผลประโยชน์เท่าๆกัน
            await page.getByText('เฉลี่ยสัดส่วนผลประโยชน์เท่าๆกัน').first().click();
            await page.waitForTimeout(1000);

            // ที่อยู่ปัจจุบัน ดึงค่าจากทะเบียนบ้าน
            const useAddressInput = page
              .getByRole('dialog', { name: 'จัดการผู้รับประโยชน์ Close' })
              .locator('#useAddressTypeCode');

            await useAddressInput.waitFor({
              state: 'visible',
              timeout: 10000,
            });
            await useAddressInput.click({
              force: true,
            });
            await page.waitForTimeout(500);
            await page.keyboard.press('ArrowDown');
            await page.waitForTimeout(300);
            await page.keyboard.press('Enter');
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
          //=============
          // Helper Category คำแถลง
          //=============
          async function forceRadio(page, name, value, label) {
            await page.evaluate(({ name, value }) => {
              const el = document.querySelector(`input[name="${name}"][value="${value}"]`);

              if (!el) {
                throw new Error(`ไม่พบ radio name=${name} value=${value}`);
              }

              el.checked = true;
              el.click();
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
            }, { name, value });

            await page.waitForTimeout(300);

            const checked = await page
              .locator(`input[name="${name}"][value="${value}"]`)
              .isChecked()
              .catch(() => false);

            if (!checked) {
              throw new Error(`❌ เลือก ${label} ไม่สำเร็จ`);
            }

            console.log(`✅ เลือก ${label}`);
          }
          //===== เลือกคำแถลง
          console.log('🩺 เลือกคำแถลงทั้งหมด');

          // ข้อ 4 = ไม่มี
          await page.locator('input[name="checkHealthDeclare"]').evaluate(el => el.click());
          await page.waitForTimeout(300);
          console.log('📎 เลือกคำแถลงเป็นไม่เคย ไม่มี / ไม่เปลี่ยน / ไม่เป็น / ไม่สูบ / ไม่ดื่ม ทั้งหมด');

          // console.log('✅ checked required checkbox ครบแล้ว');
          // await page.locator('input[name="fatcaRejectAll"]').check({ force: true });
          await page.locator('input[name="fatcaRejectAll"]').evaluate(el => el.click());
          await page.waitForTimeout(300);
          console.log('✅ เลือกการรับรองสถานะและคำยินยอมและตกลงปฏิบัติตามกฎหมาย FATCA ไม่มี/ไม่เป็น');

          //===================
          // ระบุ ไม่ประสงค์ ใช้สิทธิขอยกเว้นภาษีเงินได้ตามกฎหมายว่าด้วยภาษีอากรหรือไม่
          //===================
          const taxSection = page
            .getByText('ผู้ขอเอาประกันภัยประสงค์จะใช้สิทธิขอยกเว้นภาษีเงินได้ตามกฎหมายว่าด้วยภาษีอากรหรือไม่')
            .locator('..')
            .locator('..');

          await taxSection
            .locator('input[name="taxAnswer"][value="N"]')
            .click({ force: true });

          await page.waitForTimeout(300);

          await taxSection
            .locator('input[name="taxAnswer"][value="N"]')
            .click({ force: true });

          //==================
          // ระบุ ไม่ยินยอม เพื่อวัตถุประสงค์ทางการตลาด
          await page.locator('input[name="consentAnswer"][value="N"]').click({ force: true });
          // ระบุ ใช่ / Yes ผู้มีถิ่นที่อยู่ทางภาษี เฉพาะในประเทศไทยใช่หรือไม่ (Do you have tax resident only in Thailand?)
          await page.locator('input[name="crsAnswer"][value="Y"]').click({ force: true });


          // ระบุเมืองเกิด
          const crsCity = page.locator('#crsCity');

          await crsCity.evaluate(el => {
            el.disabled = false;
            el.removeAttribute('disabled');
            el.classList.remove('Mui-disabled');
            el.parentElement?.classList.remove('Mui-disabled');
          });

          await crsCity.click({ force: true });
          await crsCity.fill('');
          await crsCity.type('กทม', { delay: 100 });
          await crsCity.press('Tab');

          await page.waitForTimeout(500);

          const crsCityValue = await crsCity.inputValue();

          if (crsCityValue !== 'กทม') {
            throw new Error(`❌ กรอก crsCity ไม่ติด actual="${crsCityValue}"`);
          }

          console.log('✅ กรอก crsCity = กทม สำเร็จ');

          // กด บันทึก
          await page.getByRole('button', { name: 'บันทึก', exact: true }).click();
          await page.waitForTimeout(1000);

        }
        else if  // ===== FLOW MRTA รหัสใบคำขอ BA011 =====
          (applicationFormCode === 'BA011' && policyType === 'MRTA') {

          console.log('🟣 Run Flow MRTA รหัสใบคำขอ BA011');


          await page.getByRole('button', { name: `Application Code : ${'BA011'} ใบคำขอเอาประกันภัยกลุ่ม แบบคุ้มครองสินเชื่อ (มีคำถามสุขภาพอย่างละเอียด)` }).click();
          await page.getByRole('button', { name: 'เพิ่มข้อมูลใหม่' }).click();

          await page.waitForTimeout(1000);
          await page.getByLabel('ประเภทบัตร').click();
          await page.getByText('เลขประจำตัว 13 หลัก', { exact: true }).click();
          await page.waitForTimeout(1000);

          await page.getByRole('dialog', { name: 'ค้นหาหรือเพิ่มสำหรับเลือกข้อมูลลูกค้าเพื่อทำการบันทึกเคสใหม่ จากระบบ CIS Close' }).locator('#cardNo').click();
          await page.getByRole('dialog', { name: 'ค้นหาหรือเพิ่มสำหรับเลือกข้อมูลลูกค้าเพื่อทำการบันทึกเคสใหม่ จากระบบ CIS Close' }).locator('#cardNo').fill(cardNo);
          await page.getByLabel('คำนำหน้า').click();
          await page.getByLabel('คำนำหน้า').fill(cusTitlePrefix);
          await page.getByLabel('คำนำหน้า').press('Tab');


          const inputBirthDate = String(finalData.birthDate || '').trim();

          if (!inputBirthDate) {
            throw new Error('❌ birthDate ไม่มีค่า');
          }

          console.log(`วันเกิดจาก data: ${inputBirthDate}`);

          await page.getByRole('dialog', { name: 'ค้นหาหรือเพิ่มสำหรับเลือกข้อมูลลูกค้าเพื่อทำการบันทึกเคสใหม่ จากระบบ CIS Close' }).locator('#name').click();
          await page.getByRole('dialog', { name: 'ค้นหาหรือเพิ่มสำหรับเลือกข้อมูลลูกค้าเพื่อทำการบันทึกเคสใหม่ จากระบบ CIS Close' }).locator('#name').fill(cusName);
          await page.getByRole('dialog', { name: 'ค้นหาหรือเพิ่มสำหรับเลือกข้อมูลลูกค้าเพื่อทำการบันทึกเคสใหม่ จากระบบ CIS Close' }).locator('#surname').click();
          await page.getByRole('dialog', { name: 'ค้นหาหรือเพิ่มสำหรับเลือกข้อมูลลูกค้าเพื่อทำการบันทึกเคสใหม่ จากระบบ CIS Close' }).locator('#surname').fill(cusSurname);
          await page.getByRole('textbox', { name: 'วันเกิด *' }).click();
          await page.getByRole('textbox', { name: 'วันเกิด *' }).fill(inputBirthDate);
          await page.getByRole('textbox', { name: 'วันเกิด *' }).press('Tab');

          await page.waitForTimeout(500);


          // console.log('👉 gender raw =', gender);
          console.log('👉 finalData.gender =', finalData.gender);

          // ✅ เลือกเพศ ถ้ายังไม่ได้เลือก 
          const genderValue = String(finalData.gender || '').trim();

          const genderLabel = page
            .locator('label.MuiFormControlLabel-root')
            .filter({ hasText: genderValue })
            .first();

          await genderLabel.waitFor({ state: 'visible', timeout: 5000 });

          const genderInput = genderLabel.locator('input[name="genderCode"]');

          if (!(await genderInput.isChecked())) {
            await genderLabel.click({ force: true });
            await page.waitForTimeout(300);
          }
          await page.waitForTimeout(1000);
          await page.getByRole('button', { name: 'ยืนยัน' }).click();
          await page.getByRole('button', { name: 'ตกลง' }).click();
          // หน้าบันทึกและแก้ไขข้อมูลเคสใหม่
          // Category เลขที่ใบคำขอ
          await page.waitForTimeout(1000);
          const appNoInput = page.locator('#section-main #applicationNo');

          await fillTabAndVerify(appNoInput, applicationNo, {
            label: 'Application No',
            matchMode: 'exact',
            duplicateMessage: 'เลขที่ใบคำขอฯนี้มีอยู่ในระบบแล้ว',
            duplicateTimeout: 1200,
          });

          await page.waitForTimeout(1000);
          await page.getByRole('textbox', { name: 'วันที่เขียนใบคำขอ *' }).click();
          await page.getByLabel('วันที่เขียนใบคำขอ *').fill(currentDate + '_');
          await page.waitForTimeout(1000);

          // Category ข้อมูลตัวแทน ใหม่
          await page.getByLabel('ตัวแทนเจ้าของผลงาน *').click();
          const agentContainer = page
            .locator('div.MuiExpansionPanel-root:has(.ExpansionPanelSummaryTitle:text-is("ข้อมูลตัวแทน"))')
            .locator('div:has(:text-is("ตัวแทนเจ้าของผลงาน"))');

          await page.getByLabel('ตัวแทนเจ้าของผลงาน *').click();

          const agentInput = agentContainer.locator('#agentOwnerCode').first();

          await agentInput.fill(agentCode);
          await agentInput.press('Tab');
          await page.waitForTimeout(1000);

          // อ่านค่าจริงจากตัวแสดงผลของ control เดียวกัน
          let agentDisplay = await agentContainer
            .locator('div[class*="singleValue"]')
            .first()
            .innerText()
            .catch(() => '');

          agentDisplay = (agentDisplay || '').replace(/\s+/g, ' ').trim();

          console.log('agentDisplay =', agentDisplay);

          // ตัดเลขตัวแทนออก
          let agentNamePart = agentDisplay.replace(/^\d+\s*[-:]\s*/, '').trim();

          if (agentNamePart === agentDisplay) {
            agentNamePart = agentDisplay.replace(/^\d+\s*/, '').trim();
          }

          // Category รหัสสถาบัน/ คู่ค้า
          await mandatoryFillTab(page, partnerNo, '#orgCode', 'Partner Code');
          await mandatoryFillTab(page, partnerCode2, '#partnerCode:visible', 'Partner Code 2');
          // await page.getByText('ยืนยันมีรูปถ่าย Selfie').click();



          // Category ข้อมูลผู้เอาประกัน
          await page.getByRole('textbox', { name: 'วันที่บัตรหมดอายุ *' }).click();
          // 1. สร้าง Object Date สำหรับวันที่ปัจจุบัน
          const currentDate2 = new Date();
          // 2. สร้าง Object Date ใหม่โดยเพิ่มปีไปอีก 10 ปี
          const futureDate = new Date();
          futureDate.setFullYear(currentDate2.getFullYear() + 10);
          // 3. จัดรูปแบบวันที่ในอีก 10 ปีข้างหน้าให้เป็นปีพุทธศักราช
          const formattedFutureDate = getThaiBuddhistDate(futureDate);

          await mandatoryFillTab(page, expirecardNo, '#cardExpireDate', 'วันที่บัตรหมดอายุ');
          await mandatoryFillTab(page, nationality, '#nationalityCode', 'สัญชาติ');
          await mandatoryFillTab(page, documentidentify, '#documentCode', 'เอกสารที่ใช้แสดง');
          //  await page.waitForTimeout(300);


          // ===== สถานภาพ =====
          await mandatoryFillTab(page, maritalStatus, '#maritalStatusCode', 'สถานภาพ');

          await mandatoryFill(page, registerHouseNo, '#registerHouseNo', 'ที่อยู่ตามทะเบียนบ้าน-เลขที่');
          await optionalFill(page, registerMoo, '#registerVillage', 'ที่อยู่ตามทะเบียนบ้าน-หมู่ที่');
          await optionalFill(page, registerVillage, '#registerBuilding', 'ที่อยู่ตามทะเบียนบ้าน-หมู่บ้าน/อาคาร');
          await optionalFill(page, registerSoi, '#registerAlley', 'ที่อยู่ตามทะเบียนบ้าน-ตรอก/ซอย');
          await optionalFill(page, registerRoad, '#registerRoad', 'ที่อยู่ตามทะเบียนบ้าน-ถนน');
          await mandatoryFillTab(page, registerProvince, '#registerProvinceCode', 'ที่อยู่ตามทะเบียนบ้าน-จังหวัด');
          await mandatoryFillTab(page, registerDistrict, '#registerDistrictCode', 'ที่อยู่ตามทะเบียนบ้าน-อำเภอ/เขต');
          await mandatoryFillTab(page, registerSubDistrict, '#registerSubDistrictCode', 'ที่อยู่ตามทะเบียนบ้าน-ตำบล/แขวง');
          await page.waitForTimeout(1000);
          // =============
          // ที่อยู่ปัจจุบัน
          // =============
          // // ===== เงื่อนไข: ถ้า "ที่อยู่ปัจจุบัน ไม่ใช่ ที่อยู่ตามทะเบียนบ้าน"  =====
          await mandatoryFillTab(page, currentUseAddressType, '#currentUseAddressTypeCode', 'ที่อยู่ปัจจุบัน-ใช้ตามที่อยู่');
          if (currentUseAddressType !== 'ที่อยู่ตามทะเบียนบ้านของผู้เอาประกัน') {
            console.log('🏠 ระบุที่อยู่ปัจจุบันเอง');

            // ที่อยู่ปัจจุบัน-เลขที่ (Mandatory) 
            await mandatoryFill(page, currentHouseNo, '#currentHouseNo', 'ที่อยู่ปัจจุบัน-เลขที่');
            await optionalFill(page, currentMoo, '#currentVillage', 'ที่อยู่ปัจจุบัน-หมู่ที่');
            await optionalFill(page, currentVillage, '#currentBuilding', 'ที่อยู่ปัจจุบัน-หมู่บ้าน/อาคาร');
            await optionalFill(page, currentSoi, '#currentAlley', 'ที่อยู่ปัจจุบัน-ตรอก/ซอย');
            await optionalFill(page, currentRoad, '#currentRoad', 'ที่อยู่ปัจจุบัน-ถนน');
            await mandatoryFillTab(page, currentProvince, '#currentProvinceCode', 'ที่อยู่ปัจจุบัน-จังหวัด');
            await mandatoryFillTab(page, currentDistrict, '#currentDistrictCode', 'ที่อยู่ปัจจุบัน-อำเภอ/เขต');
            await mandatoryFillTab(page, currentSubDistrict, '#currentSubDistrictCode', 'ที่อยู่ปัจจุบัน-ตำบล/แขวง');
          }
          // =============
          // สถานที่สะดวกในการติดต่อและส่งเอกสาร
          // =============
          const contactPlaceTypeVal = String(contactPlaceType || '').trim();

          let contactFlagValue = '';

          if (contactPlaceTypeVal === 'ที่อยู่ตามทะเบียนบ้าน') {
            contactFlagValue = 'REG';

          } else if (contactPlaceTypeVal === 'ที่อยู่ปัจจุบัน') {
            contactFlagValue = 'CON';

          } else if (contactPlaceTypeVal === 'สถานที่ทำงาน') {

            // ⚠️ ระบบไม่มี radio ของสถานที่ทำงาน
            // จึง default เป็น REG แทน
            contactFlagValue = 'REG';

            console.log(
              '⚠️ สถานที่ทำงานไม่มี Radio ให้เลือก → Default เป็น ที่อยู่ตามทะเบียนบ้าน (REG)'
            );

          } else {
            throw new Error(`❌ contactPlaceType ไม่ถูกต้อง: ${contactPlaceTypeVal}`);
          }

          const contactRadioInput = page.locator(
            `input[name="contactFlag"][value="${contactFlagValue}"]`
          );

          await contactRadioInput.waitFor({
            state: 'attached',
            timeout: 5000,
          });

          // ✅ click ที่ label ครอบ input แทน input ตรง ๆ
          const contactRadioLabel =
            contactRadioInput.locator('xpath=ancestor::label[1]');

          await contactRadioLabel.click({
            force: true,
          });

          await page.waitForTimeout(300);

          // ✅ verify ว่าติดจริง
          const checked = await contactRadioInput.isChecked();

          if (!checked) {
            throw new Error(
              `❌ เลือกสถานที่สะดวกในการติดต่อไม่สำเร็จ: ${contactPlaceTypeVal} (${contactFlagValue})`
            );
          }

          console.log(
            `✅ เลือกสถานที่สะดวกในการติดต่อ: ${contactPlaceTypeVal}`
          );


          await mandatoryFill(page, mobilePhone, '#currentMobileNo', 'โทรศัพท์มือถือ');
          await optionalFill(page, homePhone, '#currentHomePhoneNo', 'โทรศัพท์บ้าน');
          await optionalFill(page, email, '#currentEmail', 'อีเมลปัจจุบัน');

          await mandatoryFill(page, mobilePhone, '#registerMobileNo', 'โทรศัพท์มือถือ');
          await optionalFill(page, homePhone, '#registerHomePhoneNo', 'โทรศัพท์บ้าน ทะเบียนบ้าน');
          await mandatoryFill(page, email, '#registerEmail', 'อีเมล ทะเบียนบ้าน');

          if (paperOrElectronic === 'Paper') {
            // Category รูปแบบกรมธรรม์
            await page.getByText('แบบรูปเล่มกระดาษ').first().click(); // แก้ Selector ให้ถูกต้องหาก text คือ 'แบบรูปเล่มกระดาษ'
            await page.getByRole('textbox', { name: 'ส่งเอกสารกรมธรรม์ที่ *' }).click();
            await page.getByRole('textbox', { name: 'ส่งเอกสารกรมธรรม์ที่ *' }).fill(policyDeliveryLocation); // ยังคง Hardcode หรือเพิ่มใน NewCaseData
            await page.waitForTimeout(1000);
            await page.getByRole('textbox', { name: 'ส่งเอกสารกรมธรรม์ที่ *' }).press('Tab');
            await page.getByText('แบบรูปเล่มกระดาษ').nth(1).click(); // แก้ Selector ให้ถูกต้องหาก text คือ 'แบบรูปเล่มกระดาษ'
            await page.waitForTimeout(1000);
          }
          else if (paperOrElectronic === 'Email') {
            // Category รูปแบบกรมธรรม์
            await page.getByText('แบบอิเล็กทรอนิกส์').first().click();
            await page.waitForTimeout(1000);
            await page.getByText('แบบอิเล็กทรอนิกส์ โดยจัดส่งตามอีเมล').nth(1).click();
            await page.waitForTimeout(1000);
          }
          console.log("Pass Estamp")
          const elapsedSec3 = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`⏱️ ใช้เวลาไป ${elapsedSec3}s`);


          // =============
          // Category อาชีพ    
          // =============
          await mandatoryFillTab(page, occupationCode, '#currentOccupationCode', 'รหัสอาชีพ');
          await mandatoryFillTab(page, occupationPosition, '#currentPositionName', 'ตำแหน่ง');

          await mandatoryFillTab(page, annualIncome, '#currentIncomePerYear', 'รายได้ต่อปี');
          console.log("Pass Occupation")
          const elapsedSec4 = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`⏱️ ใช้เวลาไป ${elapsedSec4}s`);
          // =============

          //case policyName = a18,19,20 มันให้กรอกเบี้ยแทนทุน
          if (policyName.includes('โอเชี่ยนไลฟ์ โอชิ แพลน 18/10')) {
            await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).click();
            await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).fill(policyName);
            await page.waitForTimeout(1000);
            await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).press('Tab');
            await page.waitForTimeout(1000);
            await page.getByRole('textbox', { name: 'เบี้ยประกันภัยรวม *' }).click();
            await page.waitForTimeout(2000);
            await page.getByRole('textbox', { name: 'เบี้ยประกันภัยรวม *' }).fill(insuredAmount);
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
            //===================
            // ระบุชื่อแบบประกันภัย ด้วย policyCode + policyName
            //===================
            const policyCodeVal = String(policyCode || '').trim();
            const policyNameVal = String(policyName || '').trim();

            const policyNameText = policyNameVal.includes(policyCodeVal)
              ? policyNameVal
              : `${policyCodeVal} - ${policyNameVal}`;

            console.log('📌 policyNameText =', policyNameText);

            const policyNameInput = page.locator('input#planCode');

            await policyNameInput.waitFor({
              state: 'visible',
              timeout: 10000,
            });

            await policyNameInput.click();

            await policyNameInput.evaluate((el, value) => {
              el.focus();
              el.value = '';
              el.dispatchEvent(new Event('input', { bubbles: true }));

              document.execCommand('insertText', false, value);

              el.dispatchEvent(new Event('input', { bubbles: true }));
            }, policyNameText);

            await page.waitForTimeout(800);
            await policyNameInput.press('Enter');
            await page.waitForTimeout(1000);

            const actualPolicyName = await page
              .locator('div[class*="singleValue"]')
              .filter({ hasText: policyCodeVal })
              .first()
              .innerText()
              .catch(() => '');

            console.log('🔎 policyName actual =', actualPolicyName);

            if (!String(actualPolicyName || '').includes(policyCodeVal)) {
              throw new Error(
                `❌ เลือกชื่อแบบประกันภัยผิด expected=${policyNameText} actual=${actualPolicyName}`
              );
            }

            await waitOptionalLoading(page);

            await page.getByRole('textbox', { name: 'จำนวนเงินเอาประกันภัย *' }).type(insuredAmount, { delay: 100 });
            await page.waitForTimeout(1000);
            await page.getByRole('textbox', { name: 'จำนวนเงินเอาประกันภัย *' }).press('Tab');

          }
          console.log("Pass Main Insurance")
          const elapsedSec5 = ((Date.now() - startTime) / 1000).toFixed(2);
          // console.log(`⏱️ ใช้เวลาไป ${elapsedSec5}s`);

          console.log("Pass Rider")
          const elapsedSec6 = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`⏱️ ใช้เวลาไป ${elapsedSec6}s`);
          // console.log(`จำนวนสัญญาเพิ่มเติมที่เพิ่มที่ถูกเพิ่ม: ${addedRiderCount} รายการ`);
          await page.waitForTimeout(1000);

          // ดึงข้อมูลทั้งหมดจากหน้าเว็บ
          const draftPremium3 = await page.locator('td.MuiTableCell-body.MUIDataTableBodyCell-root-58').allTextContents();

          let premiumPay;
          let filledPay = 0; // ✅ ประกาศนอก loop เพื่อเก็บค่ารวม
          let insuMainIndex = -1; // ประกาศตัวแปรเพื่อเก็บ index ของแบบประกันหลัก
          insuMainIndex = draftPremium3.findLastIndex(text => text.includes(policyName));

          if (insuMainIndex !== -1) {
            const insuMain = draftPremium3[insuMainIndex];
            const insuMoney = draftPremium3[insuMainIndex + 4];
            const insuPremium = parseFloat(draftPremium3[insuMainIndex + 6]?.replace(/,/g, '')) || 0;
            const insuSpePremium = parseFloat(draftPremium3[insuMainIndex + 8]?.replace(/,/g, '')) || 0;
            const insuCommis = draftPremium3[insuMainIndex + 12];

            // ✅ ตั้ง index เริ่มต้นไว้ที่แบบประกันหลัก
            let lastRiderIndex = insuMainIndex;

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
            console.log(`ค่า Premium ที่ชำระที่ยังไม่รวมเบี้ยเพิ่มพิเศษ: ${premiumPay}`);
            console.log(`✅ รวมเบี้ยทั้งหมด (filledPay) คือค่าเบี้ย หลัก บวก rider ที่ซื้อเท่านั้น ไม่ได้คิด bundle ที่แถมมา: ${filledPay}`);
          } else {
            console.log('ไม่พบแบบประกันหลักที่กำหนด');
          }
          console.log("Pass Display Insurance Money")
          const elapsedSec7 = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`⏱️ ใช้เวลาไป ${elapsedSec7}s`);


          // 🔥 เก็บยอด เบี้ยประกันภัยรวมทั้งหมด
          const premiumSummaryBlock = page
            .getByText('เบี้ยประกันภัยรวมทั้งหมด')
            .locator('..')
            .locator('..');

          totalAmount = (
            await premiumSummaryBlock
              .locator('div.MuiGrid-grid-xs-1 p.MuiTypography-body1')
              .first()
              .innerText()
          ).replace(/,/g, '').trim();

          console.log('💰 ยอดเงินรวมสุทธิ =', totalAmount);

          console.log('-------------------------------');

          //===================
          // ระบุจำนวนขอกู้ = insuredAmount + 500
          //===================
          const insuredAmountNumberForLoan = Number(
            String(insuredAmount || '').replace(/[^\d]/g, '')
          );

          if (
            !insuredAmountNumberForLoan ||
            Number.isNaN(insuredAmountNumberForLoan)
          ) {
            throw new Error(
              `❌ insuredAmount ไม่ถูกต้อง: ${insuredAmount}`
            );
          }

          const loanAmountNumber = insuredAmountNumberForLoan + 500;
          const loanAmountFormatted = loanAmountNumber.toLocaleString('en-US');

          console.log(`💰 จำนวนเงินขอกู้ = ${insuredAmountNumberForLoan} + 500 = ${loanAmountFormatted}`);

          const loanAmountInput = page.locator('#loanAmount');

          await loanAmountInput.waitFor({
            state: 'visible',
            timeout: 10000,
          });

          const isDisabledOrReadonly = await loanAmountInput
            .evaluate(el => el.disabled || el.readOnly)
            .catch(() => false);

          if (isDisabledOrReadonly) {
            console.log('ℹ️ ข้ามจำนวนขอกู้ เพราะ field disabled/readOnly');
          } else {
            await loanAmountInput.click();
            await loanAmountInput.fill('');

            await loanAmountInput.type(loanAmountFormatted, {
              delay: 100,
            });

            await page.waitForTimeout(1000);
            await loanAmountInput.press('Tab');
          }

          // ✅ เก็บไว้เขียนกลับ Google Sheet
          finalData.loanAmount = loanAmountNumber;
          //=========================
          // By Pass ช่องทางรับผลประโยชน์ เป็น รับเช็คทางไปรษณีย์
          await page.locator('input[name="benefitChannelCode"][value="CHQ"]').click({ force: true });

          //=========================
          // Category จัดการผู้รับผลประโยชน์
          const numBeneInt = parseInt(numBene, 10);

          // เปิดหน้าจัดการผู้รับประโยชน์แค่ครั้งเดียว

          if (numBeneInt > 0) {
            await page.getByRole('button', { name: 'จัดการผู้รับประโยชน์' }).click();
            await page.waitForTimeout(500);
          }

          // วนลูปตามจำนวนผู้รับผลประโยชน์
          for (let i = 0; i < numBeneInt; i++) {
            const beneItem = benes?.[i];

            if (!beneItem) {
              throw new Error(`bene หาย index=${i} | numBene=${numBene} | bene.length=${benes?.length}`);
            }

            await page.getByRole('button', { name: 'เพิ่มผู้รับประโยชน์' }).click();
            await page.waitForTimeout(500);

            // ความสัมพันธ์
            await mandatoryFillTab(page, beneItem.beneRela, '#beneficiaryRelationCode', 'ความสัมพันธ์ผู้รับประโยชน์');
            await page.waitForTimeout(500);

            // คำนำหน้า
            await mandatoryFillTab(page, beneItem.benePrefix, '#beneficiaryTitleCode', 'คำนำหน้าผู้รับประโยชน์');
            await page.waitForTimeout(500);

            // ชื่อ
            await mandatoryFillTab(page, beneItem.beneName, '#beneficiaryName', 'ชื่อผู้รับประโยชน์');
            await page.waitForTimeout(500);

            // นามสกุล
            await optionalFillTab(page, beneItem.beneSurname, '#beneficiarySurname', 'นามสกุลผู้รับประโยชน์');
            await page.waitForTimeout(500);

            // อายุ
            await mandatoryFillTab(page, beneItem.beneAge, '#beneficiaryAge', 'อายุผู้รับประโยชน์');
            await page.waitForTimeout(500);

            // เฉลี่ยสัดส่วนผลประโยชน์เท่าๆกัน
            await page.getByText('เฉลี่ยสัดส่วนผลประโยชน์เท่าๆกัน').first().click();
            await page.waitForTimeout(1000);

            // ที่อยู่ปัจจุบัน ดึงค่าจากทะเบียนบ้าน
            const useAddressInput = page
              .getByRole('dialog', { name: 'จัดการผู้รับประโยชน์ Close' })
              .locator('#useAddressTypeCode');

            await useAddressInput.waitFor({
              state: 'visible',
              timeout: 10000,
            });
            await useAddressInput.click({
              force: true,
            });
            await page.waitForTimeout(500);
            await page.keyboard.press('ArrowDown');
            await page.waitForTimeout(300);
            await page.keyboard.press('Enter');
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
          //=============
          // Helper Category คำแถลง
          //=============
          //   async function forceRadio(page, name, value, label) {
          //   await page.evaluate(({ name, value }) => {
          //   const el = document.querySelector(`input[name="${name}"][value="${value}"]`);

          //   if (!el) {
          //     throw new Error(`ไม่พบ radio name=${name} value=${value}`);
          //   }

          //   el.checked = true;
          //   el.click();
          //   el.dispatchEvent(new Event('input', { bubbles: true }));
          //   el.dispatchEvent(new Event('change', { bubbles: true }));
          // }, { name, value });

          // await page.waitForTimeout(300);

          // const checked = await page
          //   .locator(`input[name="${name}"][value="${value}"]`)
          //   .isChecked()
          //   .catch(() => false);

          // if (!checked) {
          //   throw new Error(`❌ เลือก ${label} ไม่สำเร็จ`);
          // }

          // console.log(`✅ เลือก ${label}`);
          // }


          //===== เลือกคำแถลง
          console.log('🩺 เลือกคำแถลงทั้งหมด');

          // ข้อ 4 = ไม่มี
          await page.locator('input[name="checkHealthDeclare"]').evaluate(el => el.click());
          await page.waitForTimeout(300);
          console.log('📎 เลือกคำแถลงเป็นไม่เคย ไม่มี / ไม่เปลี่ยน / ไม่เป็น / ไม่สูบ / ไม่ดื่ม ทั้งหมด');



          // console.log('✅ checked required checkbox ครบแล้ว');
          // await page.locator('input[name="fatcaRejectAll"]').check({ force: true });
          await page.locator('input[name="fatcaRejectAll"]').evaluate(el => el.click());
          await page.waitForTimeout(300);
          console.log('✅ เลือกการรับรองสถานะและคำยินยอมและตกลงปฏิบัติตามกฎหมาย FATCA ไม่มี/ไม่เป็น');

          // ===================
          // BMI ส่วนสูง / น้ำหนัก
          // ===================
          await mandatoryFill(page, height, '#bmiHeight', 'ส่วนสูง');
          await mandatoryFill(page, weight, '#bmiWeight', 'น้ำหนัก');

          //===================
          // ระบุ ไม่ประสงค์ ใช้สิทธิขอยกเว้นภาษีเงินได้ตามกฎหมายว่าด้วยภาษีอากรหรือไม่
          //===================
          const taxSection = page
            .getByText('ผู้ขอเอาประกันภัยประสงค์จะใช้สิทธิขอยกเว้นภาษีเงินได้ตามกฎหมายว่าด้วยภาษีอากรหรือไม่')
            .locator('..')
            .locator('..');

          await taxSection
            .locator('input[name="taxAnswer"][value="N"]')
            .click({ force: true });

          await page.waitForTimeout(300);

          await taxSection
            .locator('input[name="taxAnswer"][value="N"]')
            .click({ force: true });

          //==================
          // ระบุ ไม่ยินยอม เพื่อวัตถุประสงค์ทางการตลาด
          const consentSection = page.locator('fieldset:has(legend:has-text("การยินยอมเพื่อวัตถุประสงค์ทางการตลาด"))')
          await consentSection.getByText('ไม่ยินยอม').click({ force: true });
          await expect(consentSection.locator('input[name="consentAnswer"][value="N"]')).toBeChecked();

          // ระบุ ใช่ / Yes ผู้มีถิ่นที่อยู่ทางภาษี เฉพาะในประเทศไทยใช่หรือไม่ (Do you have tax resident only in Thailand?)
          await page.locator('input[name="crsAnswer"][value="Y"]').click({ force: true });


          // ระบุเมืองเกิด
          const crsCity = page.locator('#crsCity');

          await crsCity.evaluate(el => {
            el.disabled = false;
            el.removeAttribute('disabled');
            el.classList.remove('Mui-disabled');
            el.parentElement?.classList.remove('Mui-disabled');
          });

          await crsCity.click({ force: true });
          await crsCity.fill('');
          await crsCity.type('กทม', { delay: 100 });
          await crsCity.press('Tab');

          await page.waitForTimeout(500);

          const crsCityValue = await crsCity.inputValue();

          if (crsCityValue !== 'กทม') {
            throw new Error(`❌ กรอก crsCity ไม่ติด actual="${crsCityValue}"`);
          }

          console.log('✅ กรอก crsCity = กทม สำเร็จ');

          await autoFillRequiredFields(page);

          // กด บันทึก
          await page.getByRole('button', { name: 'บันทึก', exact: true }).click();
          await page.waitForTimeout(1000);

        }
        else if  // ===== FLOW MRTA รหัสใบคำขอ BA012 =====
          (applicationFormCode === 'BA012' && policyType === 'MRTA') {

          console.log('🟣 Run Flow MRTA รหัสใบคำขอ BA012');

          await page.getByRole('button', { name: `Application Code : ${'BA012'} ใบคำขอเอาประกันภัยกลุ่ม แบบคุ้มครองสินเชื่อ (มีคำถามสุขภาพอย่างสั้น) สำหรับนิติบุคคล` }).click();
          await page.getByRole('button', { name: 'เพิ่มข้อมูลใหม่' }).click();

          await page.waitForTimeout(1000);
          await page.getByLabel('ประเภทบัตร').click();
          await page.getByText('เลขประจำตัว 13 หลัก', { exact: true }).click();
          await page.waitForTimeout(1000);

          await page.getByRole('dialog', { name: 'ค้นหาหรือเพิ่มสำหรับเลือกข้อมูลลูกค้าเพื่อทำการบันทึกเคสใหม่ จากระบบ CIS Close' }).locator('#cardNo').click();
          await page.getByRole('dialog', { name: 'ค้นหาหรือเพิ่มสำหรับเลือกข้อมูลลูกค้าเพื่อทำการบันทึกเคสใหม่ จากระบบ CIS Close' }).locator('#cardNo').fill(cardNo);
          await page.getByLabel('คำนำหน้า').click();
          await page.getByLabel('คำนำหน้า').fill(cusTitlePrefix);
          await page.getByLabel('คำนำหน้า').press('Tab');


          const inputBirthDate = String(finalData.birthDate || '').trim();

          if (!inputBirthDate) {
            throw new Error('❌ birthDate ไม่มีค่า');
          }

          console.log(`วันเกิดจาก data: ${inputBirthDate}`);

          await page.getByRole('dialog', { name: 'ค้นหาหรือเพิ่มสำหรับเลือกข้อมูลลูกค้าเพื่อทำการบันทึกเคสใหม่ จากระบบ CIS Close' }).locator('#name').click();
          await page.getByRole('dialog', { name: 'ค้นหาหรือเพิ่มสำหรับเลือกข้อมูลลูกค้าเพื่อทำการบันทึกเคสใหม่ จากระบบ CIS Close' }).locator('#name').fill(cusName);
          await page.getByRole('dialog', { name: 'ค้นหาหรือเพิ่มสำหรับเลือกข้อมูลลูกค้าเพื่อทำการบันทึกเคสใหม่ จากระบบ CIS Close' }).locator('#surname').click();
          await page.getByRole('dialog', { name: 'ค้นหาหรือเพิ่มสำหรับเลือกข้อมูลลูกค้าเพื่อทำการบันทึกเคสใหม่ จากระบบ CIS Close' }).locator('#surname').fill(cusSurname);
          await page.getByRole('textbox', { name: 'วันเกิด *' }).click();
          await page.getByRole('textbox', { name: 'วันเกิด *' }).fill(inputBirthDate);
          await page.getByRole('textbox', { name: 'วันเกิด *' }).press('Tab');

          await page.waitForTimeout(500);


          // console.log('👉 gender raw =', gender);
          console.log('👉 finalData.gender =', finalData.gender);

          // ✅ เลือกเพศ ถ้ายังไม่ได้เลือก 
          const genderValue = String(finalData.gender || '').trim();

          const genderLabel = page
            .locator('label.MuiFormControlLabel-root')
            .filter({ hasText: genderValue })
            .first();

          await genderLabel.waitFor({ state: 'visible', timeout: 5000 });

          const genderInput = genderLabel.locator('input[name="genderCode"]');

          if (!(await genderInput.isChecked())) {
            await genderLabel.click({ force: true });
            await page.waitForTimeout(300);
          }
          await page.waitForTimeout(1000);
          await page.getByRole('button', { name: 'ยืนยัน' }).click();
          await page.getByRole('button', { name: 'ตกลง' }).click();
          // หน้าบันทึกและแก้ไขข้อมูลเคสใหม่
          // Category เลขที่ใบคำขอ
          await page.waitForTimeout(1000);
          const appNoInput = page.locator('#section-main #applicationNo');

          await fillTabAndVerify(appNoInput, applicationNo, {
            label: 'Application No',
            matchMode: 'exact',
            duplicateMessage: 'เลขที่ใบคำขอฯนี้มีอยู่ในระบบแล้ว',
            duplicateTimeout: 1200,
          });

          await page.waitForTimeout(1000);
          await page.getByRole('textbox', { name: 'วันที่เขียนใบคำขอ *' }).click();
          await page.getByLabel('วันที่เขียนใบคำขอ *').fill(currentDate + '_');
          await page.waitForTimeout(1000);

          // Category ข้อมูลตัวแทน ใหม่
          await page.getByLabel('ตัวแทนเจ้าของผลงาน *').click();
          const agentContainer = page
            .locator('div.MuiExpansionPanel-root:has(.ExpansionPanelSummaryTitle:text-is("ข้อมูลตัวแทน"))')
            .locator('div:has(:text-is("ตัวแทนเจ้าของผลงาน"))');

          await page.getByLabel('ตัวแทนเจ้าของผลงาน *').click();

          const agentInput = agentContainer.locator('#agentOwnerCode').first();

          await agentInput.fill(agentCode);
          await agentInput.press('Tab');
          await page.waitForTimeout(1000);

          // อ่านค่าจริงจากตัวแสดงผลของ control เดียวกัน
          let agentDisplay = await agentContainer
            .locator('div[class*="singleValue"]')
            .first()
            .innerText()
            .catch(() => '');

          agentDisplay = (agentDisplay || '').replace(/\s+/g, ' ').trim();

          console.log('agentDisplay =', agentDisplay);

          // ตัดเลขตัวแทนออก
          let agentNamePart = agentDisplay.replace(/^\d+\s*[-:]\s*/, '').trim();

          if (agentNamePart === agentDisplay) {
            agentNamePart = agentDisplay.replace(/^\d+\s*/, '').trim();
          }

          // Category รหัสสถาบัน/ คู่ค้า
          await mandatoryFillTab(page, partnerNo, '#orgCode', 'Partner Code');
          await mandatoryFillTab(page, partnerCode2, '#partnerCode:visible', 'Partner Code 2');
          // await page.getByText('ยืนยันมีรูปถ่าย Selfie').click();

          // ===================
          //  ส่วนสูง / น้ำหนัก
          // ===================
          await mandatoryFill(page, height, '#height', 'ส่วนสูง');
          await mandatoryFill(page, weight, '#weight', 'น้ำหนัก');

          // Category ข้อมูลผู้เอาประกัน
          await page.getByRole('textbox', { name: 'วันที่บัตรหมดอายุ *' }).click();
          // 1. สร้าง Object Date สำหรับวันที่ปัจจุบัน
          const currentDate2 = new Date();
          // 2. สร้าง Object Date ใหม่โดยเพิ่มปีไปอีก 10 ปี
          const futureDate = new Date();
          futureDate.setFullYear(currentDate2.getFullYear() + 10);
          // 3. จัดรูปแบบวันที่ในอีก 10 ปีข้างหน้าให้เป็นปีพุทธศักราช
          const formattedFutureDate = getThaiBuddhistDate(futureDate);

          await mandatoryFillTab(page, expirecardNo, '#cardExpireDate', 'วันที่บัตรหมดอายุ');
          await mandatoryFillTab(page, nationality, '#nationalityCode', 'สัญชาติ');
          await mandatoryFillTab(page, documentidentify, '#documentCode', 'เอกสารที่ใช้แสดง');
          //  await page.waitForTimeout(300);

          // ===== สถานภาพ =====
          await mandatoryFillTab(page, maritalStatus, '#maritalStatusCode', 'สถานภาพ');

          // ===== เงื่อนไข: ถ้า "สมรส" =====
          if (String(maritalStatus).trim() === 'สมรส') {

            console.log('💍 พบสถานภาพสมรส → กรอกข้อมูลคู่สมรส');

            // // ---- spousePrefix (React select) ----
            await mandatoryFillTab(page, spousePrefix, '#spouseTitleCode', 'คำนำหน้าคู่สมรส');
            await mandatoryFill(page, spouseName, '#spouseName', 'ชื่อคู่สมรส');
            await optionalFill(page, spouseSurname, '#spouseSurname', 'นามสกุลคู่สมรส');

          }

          await mandatoryFill(page, registerHouseNo, '#registerHouseNo', 'ที่อยู่ตามทะเบียนบ้าน-เลขที่');
          await optionalFill(page, registerMoo, '#registerVillage', 'ที่อยู่ตามทะเบียนบ้าน-หมู่ที่');
          await optionalFill(page, registerVillage, '#registerBuilding', 'ที่อยู่ตามทะเบียนบ้าน-หมู่บ้าน/อาคาร');
          await optionalFill(page, registerSoi, '#registerAlley', 'ที่อยู่ตามทะเบียนบ้าน-ตรอก/ซอย');
          await optionalFill(page, registerRoad, '#registerRoad', 'ที่อยู่ตามทะเบียนบ้าน-ถนน');
          await mandatoryFillTab(page, registerProvince, '#registerProvinceCode', 'ที่อยู่ตามทะเบียนบ้าน-จังหวัด');
          await mandatoryFillTab(page, registerDistrict, '#registerDistrictCode', 'ที่อยู่ตามทะเบียนบ้าน-อำเภอ/เขต');
          await mandatoryFillTab(page, registerSubDistrict, '#registerSubDistrictCode', 'ที่อยู่ตามทะเบียนบ้าน-ตำบล/แขวง');
          await page.waitForTimeout(1000);
          // =============
          // ที่อยู่ปัจจุบัน
          // =============
          // // ===== เงื่อนไข: ถ้า "ที่อยู่ปัจจุบัน ไม่ใช่ ที่อยู่ตามทะเบียนบ้าน"  =====
          await mandatoryFillTab(page, currentUseAddressType, '#currentUseAddressTypeCode', 'ที่อยู่ปัจจุบัน-ใช้ตามที่อยู่');
          if (currentUseAddressType !== 'ที่อยู่ตามทะเบียนบ้านของผู้เอาประกัน') {
            console.log('🏠 ระบุที่อยู่ปัจจุบันเอง');

            // ที่อยู่ปัจจุบัน-เลขที่ (Mandatory) 
            await mandatoryFill(page, currentHouseNo, '#currentHouseNo', 'ที่อยู่ปัจจุบัน-เลขที่');
            await optionalFill(page, currentMoo, '#currentVillage', 'ที่อยู่ปัจจุบัน-หมู่ที่');
            await optionalFill(page, currentVillage, '#currentBuilding', 'ที่อยู่ปัจจุบัน-หมู่บ้าน/อาคาร');
            await optionalFill(page, currentSoi, '#currentAlley', 'ที่อยู่ปัจจุบัน-ตรอก/ซอย');
            await optionalFill(page, currentRoad, '#currentRoad', 'ที่อยู่ปัจจุบัน-ถนน');
            await mandatoryFillTab(page, currentProvince, '#currentProvinceCode', 'ที่อยู่ปัจจุบัน-จังหวัด');
            await mandatoryFillTab(page, currentDistrict, '#currentDistrictCode', 'ที่อยู่ปัจจุบัน-อำเภอ/เขต');
            await mandatoryFillTab(page, currentSubDistrict, '#currentSubDistrictCode', 'ที่อยู่ปัจจุบัน-ตำบล/แขวง');
          }

          // =============
          // สถานที่ทำงาน
          // =============
          // ไม่ว่ากรณีไหนก็ให้กรอกเสมอ
          await optionalFill(
            page,
            workPlaceName,
            '#companyName',
            'สถานที่ทำงาน-ชื่อสถานที่ทำงาน'
          );
          // ===== เงื่อนไข: ถ้า "สถานที่ทำงาน ไม่ใช่ ที่อยู่ตามทะเบียนบ้าน หรือที่อยู่ปัจจุบัน"  =====
          await mandatoryFillTab(page, workUseAddressType, '#workUseAddressTypeCode', 'สถานที่ทำงาน-ใช้ตามที่อยู่');

          if (
            workUseAddressType !== 'ที่อยู่ตามทะเบียนบ้านของผู้เอาประกัน' &&
            workUseAddressType !== 'ที่อยู่ปัจจุบันของผู้เอาประกัน'
          ) {
            console.log('🏛 ระบุสถานที่ทำงานเอง');

            // await optionalFill(page, workPlaceName, '#companyName', 'สถานที่ทำงาน-ชื่อสถานที่ทำงาน');
            await optionalFill(page, workHouseNo, '#workHouseNo', 'สถานที่ทำงาน-เลขที่');
            await optionalFill(page, workMoo, '#workVillage', 'สถานที่ทำงาน-หมู่ที่');
            await optionalFill(page, workVillage, '#workBuilding', 'สถานที่ทำงาน-หมู่บ้าน/อาคาร');
            await optionalFill(page, workSoi, '#workAlley', 'สถานที่ทำงาน-ตรอก/ซอย');
            await optionalFill(page, workRoad, '#workRoad', 'สถานที่ทำงาน-ถนน');

            // สถานที่ทำงาน-จังหวัด
            const workProvinceVal = String(workProvince || '').trim();

            if (workProvinceVal !== '') {
              const workProvinceInput = page.locator('#workProvinceCode');

              await workProvinceInput.waitFor({ state: 'visible', timeout: 5000 });
              await workProvinceInput.click();
              await workProvinceInput.fill(workProvinceVal);
              await workProvinceInput.press('Tab');

              await waitSelectCommitted(workProvinceInput, 'จังหวัดสถานที่ทำงาน', 10000);
            }

            // สถานที่ทำงาน-อำเภอ/เขต
            const workDistrictVal = String(workDistrict || '').trim();

            if (workDistrictVal !== '') {
              const workProvinceInputCheck = page.locator('#workProvinceCode');

              await waitSelectCommitted(workProvinceInputCheck, 'จังหวัดสถานที่ทำงาน', 10000);

              const workDistrictInput = page.locator('#workDistrictCode');
              await workDistrictInput.waitFor({ state: 'visible', timeout: 5000 });
              await workDistrictInput.click();
              await workDistrictInput.fill(workDistrictVal);
              await workDistrictInput.press('Tab');

              await waitSelectCommitted(workDistrictInput, 'อำเภอ/เขตสถานที่ทำงาน', 10000);
            }

            // สถานที่ทำงาน-ตำบล/แขวง
            const workSubDistrictVal = String(workSubDistrict || '').trim();

            if (workSubDistrictVal !== '') {
              const workDistrictInputCheck = page.locator('#workDistrictCode');

              await waitSelectCommitted(workDistrictInputCheck, 'อำเภอ/เขตสถานที่ทำงาน', 10000);

              const workSubDistrictInput = page.locator('#workSubDistrictCode');
              await workSubDistrictInput.waitFor({ state: 'visible', timeout: 5000 });
              await workSubDistrictInput.click();
              await workSubDistrictInput.fill(workSubDistrictVal);
              await workSubDistrictInput.press('Tab');

              await waitSelectCommitted(workSubDistrictInput, 'ตำบล/แขวงสถานที่ทำงาน', 10000);
            }
          }

          // =============
          // สถานที่สะดวกในการติดต่อและส่งเอกสาร
          // =============
          const contactPlaceTypeVal = String(contactPlaceType || '').trim();

          let contactFlagValue = '';

          if (contactPlaceTypeVal === 'ที่อยู่ตามทะเบียนบ้าน') {
            contactFlagValue = 'REG';
          } else if (contactPlaceTypeVal === 'ที่อยู่ปัจจุบัน') {
            contactFlagValue = 'CON';
          } else if (contactPlaceTypeVal === 'สถานที่ทำงาน') {
            contactFlagValue = 'WRK';
          } else {
            throw new Error(`❌ contactPlaceType ไม่ถูกต้อง: ${contactPlaceTypeVal}`);
          }

          const contactRadioInput = page.locator(`input[name="contactFlag"][value="${contactFlagValue}"]`);
          await contactRadioInput.waitFor({ state: 'attached', timeout: 5000 });

          // ✅ click ที่ label ครอบ input แทน input ตรง ๆ
          const contactRadioLabel = contactRadioInput.locator('xpath=ancestor::label[1]');
          await contactRadioLabel.click({ force: true });

          await page.waitForTimeout(300);

          // ✅ verify ว่าติดจริง
          const checked = await contactRadioInput.isChecked();
          if (!checked) {
            throw new Error(`❌ เลือกสถานที่สะดวกในการติดต่อไม่สำเร็จ: ${contactPlaceTypeVal} (${contactFlagValue})`);
          }

          console.log(`✅ เลือกสถานที่สะดวกในการติดต่อ: ${contactPlaceTypeVal}`);


          //=============
          //ข้อมูลติดต่อ
          //=============
          await page.waitForTimeout(400);

          await mandatoryFill(page, mobilePhone, '#currentMobileNo', 'โทรศัพท์มือถือ');
          await optionalFill(page, homePhone, '#currentHomePhoneNo', 'โทรศัพท์บ้าน');
          await optionalFillTab(page, workPhone, '#currentWorkPhoneNo', 'โทรศัพท์ที่ทำงาน');
          await optionalFillTab(page, workPhoneExt, '#currentWorkPhoneNoExt', 'ต่อ');


          // Email
          const emailVal = String(email || '').trim();

          if (emailVal !== '') {
            try {
              const emailInput = page.locator('#registerEmail');
              await emailInput.waitFor({
                state: 'visible',
                timeout: 5000,
              });
              await emailInput.click();
              await emailInput.fill(emailVal);
              console.log('✅ fill #registerEmail success');
            } catch {
              console.log('⚠️ #registerEmail ไม่เจอ → fallback #currentEmail');
              const emailInputFallback = page.locator('#currentEmail');
              await emailInputFallback.waitFor({
                state: 'visible',
                timeout: 5000,
              });
              await emailInputFallback.click();
              await emailInputFallback.fill(emailVal);
              console.log('✅ fill #currentEmail success');
            }
            await page.waitForTimeout(500);
          }

          if (paperOrElectronic === 'Paper') {
            // Category รูปแบบกรมธรรม์
            await page.getByText('แบบรูปเล่มกระดาษ').first().click(); // แก้ Selector ให้ถูกต้องหาก text คือ 'แบบรูปเล่มกระดาษ'
            await page.getByRole('textbox', { name: 'ส่งเอกสารกรมธรรม์ที่ *' }).click();
            await page.getByRole('textbox', { name: 'ส่งเอกสารกรมธรรม์ที่ *' }).fill(policyDeliveryLocation); // ยังคง Hardcode หรือเพิ่มใน NewCaseData
            await page.waitForTimeout(1000);
            await page.getByRole('textbox', { name: 'ส่งเอกสารกรมธรรม์ที่ *' }).press('Tab');
            await page.getByText('แบบรูปเล่มกระดาษ').nth(1).click(); // แก้ Selector ให้ถูกต้องหาก text คือ 'แบบรูปเล่มกระดาษ'
            await page.waitForTimeout(1000);
          }
          else if (paperOrElectronic === 'Email') {
            // Category รูปแบบกรมธรรม์
            await page.getByText('แบบอิเล็กทรอนิกส์').first().click();
            await page.waitForTimeout(1000);
            await page.getByText('แบบอิเล็กทรอนิกส์ โดยจัดส่งตามอีเมล').nth(1).click();
            await page.waitForTimeout(1000);
          }
          console.log("Pass Estamp")
          const elapsedSec3 = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`⏱️ ใช้เวลาไป ${elapsedSec3}s`);


          // =============
          // Category อาชีพ    
          // =============
          await mandatoryFillTab(page, occupationCode, '#currentOccupationCode', 'รหัสอาชีพ');
          await mandatoryFillTab(page, occupationPosition, '#currentPositionName', 'ตำแหน่ง');
          await optionalFillTab(page, jobDescription, '#currentJobDesc', 'ลักษณะงานที่ทำ');
          await optionalFillTab(page, businessType, '#currentBusinessTypeDesc', 'ลักษณะธุรกิจ');
          await mandatoryFillTab(page, annualIncome, '#currentIncomePerYear', 'รายได้ต่อปี');

          console.log("Pass Occupation")
          const elapsedSec4 = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`⏱️ ใช้เวลาไป ${elapsedSec4}s`);
          // =============

          //===== เลือกคำแถลง
          console.log('🩺 เลือกคำแถลงทั้งหมด');

          //
          await page.locator('input[name="checkHealthDeclare"]').evaluate(el => el.click());
          await page.waitForTimeout(300);
          console.log('📎 เลือกคำแถลงเป็นไม่เคย ไม่มี / ไม่เปลี่ยน / ไม่เป็น / ไม่สูบ / ไม่ดื่ม ทั้งหมด');

          // ข้อ 4 = ไม่เคย  - ท่านเคยถูกปฏิเสธ เลื่อนการรับประกันภัย
          await page
            .locator('input[id="rejectHistoryAnswer"][value="N"]')
            .click({ force: true });

          await page.waitForTimeout(300);

          // ข้อ 5 = ไม่เคย -  ในระหว่าง 3 ปีที่ผ่านมา 
          await page
            .locator('input[id="treatmentHistory3yearAnswer"][value="N"]')
            .click({ force: true });

          await page.waitForTimeout(300);

          // ข้อ 6 = ไม่เคย -  ท่านเคยได้รับการตรวจวินิจฉัย หรือรับการรักษา
          await page
            .locator('input[id="seriousDiseaseInfoAnswer"][value="N"]')
            .click({ force: true });

          await page.waitForTimeout(300);

          //===============
          //ข้อมูลนิติบุคคลผู้ขอเอาประกันภัย
          //================
          await mandatoryFill(page, workPlaceName, '#juristicName', 'ชื่อนิติบุคคล');
          await mandatoryFill(page, workPhone, '#juristicNo', 'ทะเบียนเลขที่');
          await mandatoryFill(page, registerHouseNo, '#hqNo', 'เลขที่ - สนญ');
          await mandatoryFillTab(page, registerProvince, '#provinceCode', 'จังหวัด - สนญ');
          await mandatoryFillTab(page, registerDistrict, '#districtCode', 'อำเภอ/เขต - สนญ');
          await mandatoryFillTab(page, registerSubDistrict, '#subDistrictCode', 'ตำบล/แขวง - สนญ');

          //case policyName = a18,19,20 มันให้กรอกเบี้ยแทนทุน
          if (policyName.includes('โอเชี่ยนไลฟ์ โอชิ แพลน 18/10')) {
            await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).click();
            await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).fill(policyName);
            await page.waitForTimeout(1000);
            await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).press('Tab');
            await page.waitForTimeout(1000);
            await page.getByRole('textbox', { name: 'เบี้ยประกันภัยรวม *' }).click();
            await page.waitForTimeout(2000);
            await page.getByRole('textbox', { name: 'เบี้ยประกันภัยรวม *' }).fill(insuredAmount);
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
            //===================
            // ระบุชื่อแบบประกันภัย ด้วย policyCode + policyName
            //===================
            const policyCodeVal = String(policyCode || '').trim();
            const policyNameVal = String(policyName || '').trim();

            const policyNameText = policyNameVal.includes(policyCodeVal)
              ? policyNameVal
              : `${policyCodeVal} - ${policyNameVal}`;

            console.log('📌 policyNameText =', policyNameText);

            const policyNameInput = page.locator('input#planCode');

            await policyNameInput.waitFor({
              state: 'visible',
              timeout: 10000,
            });

            await policyNameInput.click();

            await policyNameInput.evaluate((el, value) => {
              el.focus();
              el.value = '';
              el.dispatchEvent(new Event('input', { bubbles: true }));

              document.execCommand('insertText', false, value);

              el.dispatchEvent(new Event('input', { bubbles: true }));
            }, policyNameText);

            await page.waitForTimeout(800);
            await policyNameInput.press('Enter');
            await page.waitForTimeout(1000);

            const actualPolicyName = await page
              .locator('div[class*="singleValue"]')
              .filter({ hasText: policyCodeVal })
              .first()
              .innerText()
              .catch(() => '');

            console.log('🔎 policyName actual =', actualPolicyName);

            if (!String(actualPolicyName || '').includes(policyCodeVal)) {
              throw new Error(
                `❌ เลือกชื่อแบบประกันภัยผิด expected=${policyNameText} actual=${actualPolicyName}`
              );
            }

            await waitOptionalLoading(page);

            await page.getByRole('textbox', { name: 'จำนวนเงินเอาประกันภัย *' }).type(insuredAmount, { delay: 100 });
            await page.waitForTimeout(1000);
            await page.getByRole('textbox', { name: 'จำนวนเงินเอาประกันภัย *' }).press('Tab');

          }

          console.log("Pass Main Insurance")
          const elapsedSec5 = ((Date.now() - startTime) / 1000).toFixed(2);
          // console.log(`⏱️ ใช้เวลาไป ${elapsedSec5}s`);

          console.log("Pass Rider")
          const elapsedSec6 = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`⏱️ ใช้เวลาไป ${elapsedSec6}s`);
          // console.log(`จำนวนสัญญาเพิ่มเติมที่เพิ่มที่ถูกเพิ่ม: ${addedRiderCount} รายการ`);
          await page.waitForTimeout(1000);

          // ดึงข้อมูลทั้งหมดจากหน้าเว็บ
          const draftPremium3 = await page.locator('td.MuiTableCell-body.MUIDataTableBodyCell-root-58').allTextContents();

          let premiumPay;
          let filledPay = 0; // ✅ ประกาศนอก loop เพื่อเก็บค่ารวม
          let insuMainIndex = -1; // ประกาศตัวแปรเพื่อเก็บ index ของแบบประกันหลัก
          insuMainIndex = draftPremium3.findLastIndex(text => text.includes(policyName));

          if (insuMainIndex !== -1) {
            const insuMain = draftPremium3[insuMainIndex];
            const insuMoney = draftPremium3[insuMainIndex + 4];
            const insuPremium = parseFloat(draftPremium3[insuMainIndex + 6]?.replace(/,/g, '')) || 0;
            const insuSpePremium = parseFloat(draftPremium3[insuMainIndex + 8]?.replace(/,/g, '')) || 0;
            const insuCommis = draftPremium3[insuMainIndex + 12];

            // ✅ ตั้ง index เริ่มต้นไว้ที่แบบประกันหลัก
            let lastRiderIndex = insuMainIndex;

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
            console.log(`ค่า Premium ที่ชำระที่ยังไม่รวมเบี้ยเพิ่มพิเศษ: ${premiumPay}`);
            console.log(`✅ รวมเบี้ยทั้งหมด (filledPay) คือค่าเบี้ย หลัก บวก rider ที่ซื้อเท่านั้น ไม่ได้คิด bundle ที่แถมมา: ${filledPay}`);
          } else {
            console.log('ไม่พบแบบประกันหลักที่กำหนด');
          }
          console.log("Pass Display Insurance Money")
          const elapsedSec7 = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`⏱️ ใช้เวลาไป ${elapsedSec7}s`);


          // 🔥 เก็บยอด เบี้ยประกันภัยรวมทั้งหมด
          const premiumSummaryBlock = page
            .getByText('เบี้ยประกันภัยรวมทั้งหมด')
            .locator('..')
            .locator('..');

          totalAmount = (
            await premiumSummaryBlock
              .locator('div.MuiGrid-grid-xs-1 p.MuiTypography-body1')
              .first()
              .innerText()
          ).replace(/,/g, '').trim();

          console.log('💰 ยอดเงินรวมสุทธิ =', totalAmount);

          console.log('-------------------------------');

          //===================
          // ระบุจำนวนขอกู้ = insuredAmount + 500
          //===================
          const insuredAmountNumberForLoan = Number(
            String(insuredAmount || '').replace(/[^\d]/g, '')
          );

          if (
            !insuredAmountNumberForLoan ||
            Number.isNaN(insuredAmountNumberForLoan)
          ) {
            throw new Error(
              `❌ insuredAmount ไม่ถูกต้อง: ${insuredAmount}`
            );
          }

          const loanAmountNumber = insuredAmountNumberForLoan + 500;
          const loanAmountFormatted = loanAmountNumber.toLocaleString('en-US');

          console.log(`💰 จำนวนเงินขอกู้ = ${insuredAmountNumberForLoan} + 500 = ${loanAmountFormatted}`);

          const loanAmountInput = page.locator('#loanAmount');

          await loanAmountInput.waitFor({
            state: 'visible',
            timeout: 10000,
          });

          const isDisabledOrReadonly = await loanAmountInput
            .evaluate(el => el.disabled || el.readOnly)
            .catch(() => false);

          if (isDisabledOrReadonly) {
            console.log('ℹ️ ข้ามจำนวนขอกู้ เพราะ field disabled/readOnly');
          } else {
            await loanAmountInput.click();
            await loanAmountInput.fill('');

            await loanAmountInput.type(loanAmountFormatted, {
              delay: 100,
            });

            await page.waitForTimeout(1000);
            await loanAmountInput.press('Tab');
          }

          // ✅ เก็บไว้เขียนกลับ Google Sheet
          finalData.loanAmount = loanAmountNumber;
          // ===================
          // ช่องทางรับผลประโยชน์ = รับเช็คทางไปรษณีย์
          // ===================
          const benefitChannelSection = page.locator(
            'fieldset:has(input[name="benefitChannelCode"])'
          );
          const chqLabel = benefitChannelSection.locator(
            'label:has(input[name="benefitChannelCode"][value="CHQ"])'
          );
          await chqLabel.scrollIntoViewIfNeeded();
          await chqLabel.click({ force: true });
          await page.waitForTimeout(300);
          const isChecked = await benefitChannelSection
            .locator('input[name="benefitChannelCode"][value="CHQ"]')
            .evaluate(el => el.checked)
            .catch(() => false);

          if (!isChecked) {
            throw new Error('❌ เลือก benefitChannelCode = CHQ ไม่สำเร็จ');
          }

          console.log('✅ เลือก benefitChannelCode = CHQ สำเร็จ');

          //===================
          // ข้อ 12 = ไม่มี -  นิติบุคคลผู้ขอเอาประกันภัยมี หรือเคยมีการทําประกันชีวิตกลุ่ม
          //====================
          await page
            .locator('input[id="juristicInsureHistoryAnswer"][value="N"]')
            .click({ force: true });

          await page.waitForTimeout(300);

          // console.log('✅ checked required checkbox ครบแล้ว');
          // await page.locator('input[name="fatcaRejectAll"]').check({ force: true });
          await page.locator('input[name="juristicFatcaCheckbox"]').evaluate(el => el.click());
          await page.waitForTimeout(300);

          console.log('✅ เลือกการรับรองสถานะและคำยินยอมและตกลงปฏิบัติตามกฎหมาย FATCA ไม่มี/ไม่เป็น');
          //============
          //สําหรับสถาบันการเงินภายใต้ข้อกําหนดของ FATCA ที่มี GIIN
          //============  
          await mandatoryFill(page, registerHouseNo, '#fatcaJuristicGiinNo', 'หมายเลข GIIN ของผู้ขอเอาประกันภัย (นิติบุคคล) ');
          await mandatoryFill(page, workPhone, '#fatcaJuristicNo', 'เลขทะเบียนนิติบุคคล');
          await mandatoryFillTab(page, nationality, '#fatcaJuristicCountry', 'ประเทศที่จดทะเบียนหรือจัดตั้ง');

          // 1.  ผู้ขอเอาประกันภัย (นิติบุคคล) เป็นนิติบุคคลอเมริกัน (นิติบุคคลที่จดทะเบียนในประเทศสหรัฐอเมริกา) ใช่หรือไม่
          await page
            .locator('input[id="fatcaJuristicUsaAnswer"][value="N"]')
            .click({ force: true });

          await page.waitForTimeout(300);

          // 2. ผู้ขอเอาประกันภัย (นิติบุคคล) เป็นสถาบันการเงิน ภายใต้ข้อกําหนดของ FATCA ใช่หรือไม่
          await page
            .locator('input[id="fatcaJuristicBankAnswer"][value="N"]')
            .click({ force: true });

          await page.waitForTimeout(300);

          // 3. ผู้ขอเอาประกันภัย (นิติบุคคล) เป็นนิติบุคคลที่มีรายได้จากการลงทุนในหลักทรัพย์ (
          await page
            .locator('input[id="fatcaJuristicInvestAnswer"][value="N"]')
            .click({ force: true });

          await page.waitForTimeout(300);

          //
          //===================
          // ระบุ ไม่ประสงค์ ใช้สิทธิขอยกเว้นภาษีเงินได้ตามกฎหมายว่าด้วยภาษีอากรหรือไม่
          //===================
          const taxSection = page
            .getByText('ผู้ขอเอาประกันภัยประสงค์จะใช้สิทธิขอยกเว้นภาษีเงินได้ตามกฎหมายว่าด้วยภาษีอากรหรือไม่')
            .locator('..')
            .locator('..');

          await taxSection
            .locator('input[name="taxAnswer"][value="N"]')
            .click({ force: true });

          await page.waitForTimeout(300);

          await taxSection
            .locator('input[name="taxAnswer"][value="N"]')
            .click({ force: true });

          //==================
          // ระบุ ไม่ยินยอม เพื่อวัตถุประสงค์ทางการตลาด
          const consentSection = page.locator('fieldset:has(legend:has-text("การยินยอมเพื่อวัตถุประสงค์ทางการตลาด"))')
          await consentSection.getByText('ไม่ยินยอม').click({ force: true });
          await expect(consentSection.locator('input[name="consentAnswer"][value="N"]')).toBeChecked();

          // ระบุ ใช่ / Yes ผู้มีถิ่นที่อยู่ทางภาษี เฉพาะในประเทศไทยใช่หรือไม่ (Do you have tax resident only in Thailand?)
          await page.locator('input[name="crsAnswer"][value="Y"]').click({ force: true });


          // ระบุเมืองเกิด
          const crsCity = page.locator('#crsCity');

          await crsCity.evaluate(el => {
            el.disabled = false;
            el.removeAttribute('disabled');
            el.classList.remove('Mui-disabled');
            el.parentElement?.classList.remove('Mui-disabled');
          });

          await crsCity.click({ force: true });
          await crsCity.fill('');
          await crsCity.type('กทม', { delay: 100 });
          await crsCity.press('Tab');

          await page.waitForTimeout(500);

          const crsCityValue = await crsCity.inputValue();

          if (crsCityValue !== 'กทม') {
            throw new Error(`❌ กรอก crsCity ไม่ติด actual="${crsCityValue}"`);
          }

          console.log('✅ กรอก crsCity = กทม สำเร็จ');

          await autoFillRequiredFields(page);

          // กด บันทึก
          await page.getByRole('button', { name: 'บันทึก', exact: true }).click();
          await page.waitForTimeout(1000);

        }
        else if  // ===== FLOW IND รหัสใบคำขอ 02052 =====
          (applicationFormCode === '02052' && policyType === 'IND') {

          console.log('🟣 Run Flow IND รหัสใบคำขอ 02052');


          await page.getByRole('button', { name: `Application Code : ${'02052'} ใบคำขอเอาประกันชีวิตประเภทอุตสาหกรรม` }).click();
          await page.getByRole('button', { name: 'เพิ่มข้อมูลใหม่' }).click();

          await page.waitForTimeout(1000);
          await page.getByLabel('ประเภทบัตร').click();
          await page.getByText('เลขประจำตัว 13 หลัก', { exact: true }).click();
          await page.waitForTimeout(1000);

          await page.getByRole('dialog', { name: 'ค้นหาหรือเพิ่มสำหรับเลือกข้อมูลลูกค้าเพื่อทำการบันทึกเคสใหม่ จากระบบ CIS Close' }).locator('#cardNo').click();
          await page.getByRole('dialog', { name: 'ค้นหาหรือเพิ่มสำหรับเลือกข้อมูลลูกค้าเพื่อทำการบันทึกเคสใหม่ จากระบบ CIS Close' }).locator('#cardNo').fill(cardNo);
          await page.getByLabel('คำนำหน้า').click();
          await page.getByLabel('คำนำหน้า').fill(cusTitlePrefix);
          await page.getByLabel('คำนำหน้า').press('Tab');


          const inputBirthDate = String(finalData.birthDate || '').trim();

          if (!inputBirthDate) {
            throw new Error('❌ birthDate ไม่มีค่า');
          }

          console.log(`วันเกิดจาก data: ${inputBirthDate}`);

          await page.getByRole('dialog', { name: 'ค้นหาหรือเพิ่มสำหรับเลือกข้อมูลลูกค้าเพื่อทำการบันทึกเคสใหม่ จากระบบ CIS Close' }).locator('#name').click();
          await page.getByRole('dialog', { name: 'ค้นหาหรือเพิ่มสำหรับเลือกข้อมูลลูกค้าเพื่อทำการบันทึกเคสใหม่ จากระบบ CIS Close' }).locator('#name').fill(cusName);
          await page.getByRole('dialog', { name: 'ค้นหาหรือเพิ่มสำหรับเลือกข้อมูลลูกค้าเพื่อทำการบันทึกเคสใหม่ จากระบบ CIS Close' }).locator('#surname').click();
          await page.getByRole('dialog', { name: 'ค้นหาหรือเพิ่มสำหรับเลือกข้อมูลลูกค้าเพื่อทำการบันทึกเคสใหม่ จากระบบ CIS Close' }).locator('#surname').fill(cusSurname);
          await page.getByRole('textbox', { name: 'วันเกิด *' }).click();
          await page.getByRole('textbox', { name: 'วันเกิด *' }).fill(inputBirthDate);
          await page.getByRole('textbox', { name: 'วันเกิด *' }).press('Tab');

          await page.waitForTimeout(500);


          // console.log('👉 gender raw =', gender);
          console.log('👉 finalData.gender =', finalData.gender);

          // ✅ เลือกเพศ ถ้ายังไม่ได้เลือก 
          const genderValue = String(finalData.gender || '').trim();

          const genderLabel = page
            .locator('label.MuiFormControlLabel-root')
            .filter({ hasText: genderValue })
            .first();

          await genderLabel.waitFor({ state: 'visible', timeout: 5000 });

          const genderInput = genderLabel.locator('input[name="genderCode"]');

          if (!(await genderInput.isChecked())) {
            await genderLabel.click({ force: true });
            await page.waitForTimeout(300);
          }
          await page.waitForTimeout(1000);
          await page.getByRole('button', { name: 'ยืนยัน' }).click();
          await page.getByRole('button', { name: 'ตกลง' }).click();
          // หน้าบันทึกและแก้ไขข้อมูลเคสใหม่
          // Category เลขที่ใบคำขอ
          await page.waitForTimeout(1000);
          const appNoInput = page.locator('#section-main #applicationNo');

          await fillTabAndVerify(appNoInput, applicationNo, {
            label: 'Application No',
            matchMode: 'exact',
            duplicateMessage: 'เลขที่ใบคำขอฯนี้มีอยู่ในระบบแล้ว',
            duplicateTimeout: 1200,
          });

          await page.waitForTimeout(1000);
          await page.getByRole('textbox', { name: 'วันที่เขียนใบคำขอ *' }).click();
          await page.getByLabel('วันที่เขียนใบคำขอ *').fill(currentDate + '_');
          await page.waitForTimeout(1000);

          // Category ข้อมูลตัวแทน ใหม่
          await page.getByLabel('ตัวแทนเจ้าของผลงาน *').click();
          const agentContainer = page
            .locator('div.MuiExpansionPanel-root:has(.ExpansionPanelSummaryTitle:text-is("ข้อมูลตัวแทน"))')
            .locator('div:has(:text-is("ตัวแทนเจ้าของผลงาน"))');

          await page.getByLabel('ตัวแทนเจ้าของผลงาน *').click();

          const agentInput = agentContainer.locator('#agentOwnerCode').first();

          await agentInput.fill(agentCode);
          await agentInput.press('Tab');
          await page.waitForTimeout(1000);

          // อ่านค่าจริงจากตัวแสดงผลของ control เดียวกัน
          let agentDisplay = await agentContainer
            .locator('div[class*="singleValue"]')
            .first()
            .innerText()
            .catch(() => '');

          agentDisplay = (agentDisplay || '').replace(/\s+/g, ' ').trim();

          console.log('agentDisplay =', agentDisplay);

          // ตัดเลขตัวแทนออก
          let agentNamePart = agentDisplay.replace(/^\d+\s*[-:]\s*/, '').trim();

          if (agentNamePart === agentDisplay) {
            agentNamePart = agentDisplay.replace(/^\d+\s*/, '').trim();
          }


          // Category รหัสสถาบัน/ คู่ค้า
          await mandatoryFillTab(page, partnerNo, '#orgCode', 'Partner Code');
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

          await mandatoryFillTab(page, expirecardNo, '#cardExpireDate', 'วันที่บัตรหมดอายุ');
          await mandatoryFillTab(page, nationality, '#nationalityCode', 'สัญชาติ');
          await mandatoryFillTab(page, documentidentify, '#documentCode', 'เอกสารที่ใช้แสดง');
          //  await page.waitForTimeout(300);


          // ===== สถานภาพ =====
          await mandatoryFillTab(page, maritalStatus, '#maritalStatusCode', 'สถานภาพ');

          // ===== เงื่อนไข: ถ้า "สมรส" =====
          if (String(maritalStatus).trim() === 'สมรส') {

            console.log('💍 พบสถานภาพสมรส → กรอกข้อมูลคู่สมรส');

            // // ---- spousePrefix (React select) ----
            await mandatoryFillTab(page, spousePrefix, '#spouseTitleCode', 'คำนำหน้าคู่สมรส');
            await mandatoryFill(page, spouseName, '#spouseName', 'ชื่อคู่สมรส');
            await optionalFill(page, spouseSurname, '#spouseSurname', 'นามสกุลคู่สมรส');

          }

          await mandatoryFill(page, registerHouseNo, '#registerHouseNo', 'ที่อยู่ตามทะเบียนบ้าน-เลขที่');
          await optionalFill(page, registerMoo, '#registerVillage', 'ที่อยู่ตามทะเบียนบ้าน-หมู่ที่');
          await optionalFill(page, registerVillage, '#registerBuilding', 'ที่อยู่ตามทะเบียนบ้าน-หมู่บ้าน/อาคาร');
          await optionalFill(page, registerSoi, '#registerAlley', 'ที่อยู่ตามทะเบียนบ้าน-ตรอก/ซอย');
          await optionalFill(page, registerRoad, '#registerRoad', 'ที่อยู่ตามทะเบียนบ้าน-ถนน');
          await mandatoryFillTab(page, registerProvince, '#registerProvinceCode', 'ที่อยู่ตามทะเบียนบ้าน-จังหวัด');
          await mandatoryFillTab(page, registerDistrict, '#registerDistrictCode', 'ที่อยู่ตามทะเบียนบ้าน-อำเภอ/เขต');
          await mandatoryFillTab(page, registerSubDistrict, '#registerSubDistrictCode', 'ที่อยู่ตามทะเบียนบ้าน-ตำบล/แขวง');
          await page.waitForTimeout(1000);
          // =============
          // ที่อยู่ปัจจุบัน
          // =============
          // // ===== เงื่อนไข: ถ้า "ที่อยู่ปัจจุบัน ไม่ใช่ ที่อยู่ตามทะเบียนบ้าน"  =====
          await mandatoryFillTab(page, currentUseAddressType, '#currentUseAddressTypeCode', 'ที่อยู่ปัจจุบัน-ใช้ตามที่อยู่');
          if (currentUseAddressType !== 'ที่อยู่ตามทะเบียนบ้านของผู้เอาประกัน') {
            console.log('🏠 ระบุที่อยู่ปัจจุบันเอง');

            // ที่อยู่ปัจจุบัน-เลขที่ (Mandatory) 
            await mandatoryFill(page, currentHouseNo, '#currentHouseNo', 'ที่อยู่ปัจจุบัน-เลขที่');
            await optionalFill(page, currentMoo, '#currentVillage', 'ที่อยู่ปัจจุบัน-หมู่ที่');
            await optionalFill(page, currentVillage, '#currentBuilding', 'ที่อยู่ปัจจุบัน-หมู่บ้าน/อาคาร');
            await optionalFill(page, currentSoi, '#currentAlley', 'ที่อยู่ปัจจุบัน-ตรอก/ซอย');
            await optionalFill(page, currentRoad, '#currentRoad', 'ที่อยู่ปัจจุบัน-ถนน');
            await mandatoryFillTab(page, currentProvince, '#currentProvinceCode', 'ที่อยู่ปัจจุบัน-จังหวัด');
            await mandatoryFillTab(page, currentDistrict, '#currentDistrictCode', 'ที่อยู่ปัจจุบัน-อำเภอ/เขต');
            await mandatoryFillTab(page, currentSubDistrict, '#currentSubDistrictCode', 'ที่อยู่ปัจจุบัน-ตำบล/แขวง');

          }

          // =============
          // สถานที่ทำงาน
          // =============
          // ไม่ว่ากรณีไหนก็ให้กรอกเสมอ
          await optionalFill(page, workPlaceName, '#companyName', 'สถานที่ทำงาน-ชื่อสถานที่ทำงาน');
          // ===== เงื่อนไข: ถ้า "สถานที่ทำงาน ไม่ใช่ ที่อยู่ตามทะเบียนบ้าน หรือที่อยู่ปัจจุบัน"  =====
          await mandatoryFillTab(page, workUseAddressType, '#workUseAddressTypeCode', 'สถานที่ทำงาน-ใช้ตามที่อยู่');

          if (
            workUseAddressType !== 'ที่อยู่ตามทะเบียนบ้านของผู้เอาประกัน' &&
            workUseAddressType !== 'ที่อยู่ปัจจุบันของผู้เอาประกัน'
          ) {
            console.log('🏛 ระบุสถานที่ทำงานเอง');
            await optionalFill(page, workHouseNo, '#workHouseNo', 'สถานที่ทำงาน-เลขที่');
            await optionalFill(page, workMoo, '#workVillage', 'สถานที่ทำงาน-หมู่ที่');
            await optionalFill(page, workVillage, '#workBuilding', 'สถานที่ทำงาน-หมู่บ้าน/อาคาร');
            await optionalFill(page, workSoi, '#workAlley', 'สถานที่ทำงาน-ตรอก/ซอย');
            await optionalFill(page, workRoad, '#workRoad', 'สถานที่ทำงาน-ถนน');

            // สถานที่ทำงาน-จังหวัด
            const workProvinceVal = String(workProvince || '').trim();

            if (workProvinceVal !== '') {
              const workProvinceInput = page.locator('#workProvinceCode');

              await workProvinceInput.waitFor({ state: 'visible', timeout: 5000 });
              await workProvinceInput.click();
              await workProvinceInput.fill(workProvinceVal);
              await workProvinceInput.press('Tab');

              await waitSelectCommitted(workProvinceInput, 'จังหวัดสถานที่ทำงาน', 10000);
            }

            // สถานที่ทำงาน-อำเภอ/เขต
            const workDistrictVal = String(workDistrict || '').trim();

            if (workDistrictVal !== '') {
              const workProvinceInputCheck = page.locator('#workProvinceCode');

              await waitSelectCommitted(workProvinceInputCheck, 'จังหวัดสถานที่ทำงาน', 10000);

              const workDistrictInput = page.locator('#workDistrictCode');
              await workDistrictInput.waitFor({ state: 'visible', timeout: 5000 });
              await workDistrictInput.click();
              await workDistrictInput.fill(workDistrictVal);
              await workDistrictInput.press('Tab');

              await waitSelectCommitted(workDistrictInput, 'อำเภอ/เขตสถานที่ทำงาน', 10000);
            }

            // สถานที่ทำงาน-ตำบล/แขวง
            const workSubDistrictVal = String(workSubDistrict || '').trim();

            if (workSubDistrictVal !== '') {
              const workDistrictInputCheck = page.locator('#workDistrictCode');

              await waitSelectCommitted(workDistrictInputCheck, 'อำเภอ/เขตสถานที่ทำงาน', 10000);

              const workSubDistrictInput = page.locator('#workSubDistrictCode');
              await workSubDistrictInput.waitFor({ state: 'visible', timeout: 5000 });
              await workSubDistrictInput.click();
              await workSubDistrictInput.fill(workSubDistrictVal);
              await workSubDistrictInput.press('Tab');

              await waitSelectCommitted(workSubDistrictInput, 'ตำบล/แขวงสถานที่ทำงาน', 10000);
            }
          }

          // =============
          // สถานที่สะดวกในการติดต่อและส่งเอกสาร
          // =============

          const contactPlaceTypeVal = String(contactPlaceType || '').trim();

          let contactFlagValue = '';

          if (contactPlaceTypeVal === 'ที่อยู่ตามทะเบียนบ้าน') {
            contactFlagValue = 'REG';
          } else if (contactPlaceTypeVal === 'ที่อยู่ปัจจุบัน') {
            contactFlagValue = 'CON';
          } else if (contactPlaceTypeVal === 'สถานที่ทำงาน') {
            contactFlagValue = 'WRK';
          } else {
            throw new Error(`❌ contactPlaceType ไม่ถูกต้อง: ${contactPlaceTypeVal}`);
          }

          const contactRadioInput = page.locator(`input[name="contactFlag"][value="${contactFlagValue}"]`);
          await contactRadioInput.waitFor({ state: 'attached', timeout: 5000 });

          // ✅ click ที่ label ครอบ input แทน input ตรง ๆ
          const contactRadioLabel = contactRadioInput.locator('xpath=ancestor::label[1]');
          await contactRadioLabel.click({ force: true });

          await page.waitForTimeout(300);

          // ✅ verify ว่าติดจริง
          const checked = await contactRadioInput.isChecked();
          if (!checked) {
            throw new Error(`❌ เลือกสถานที่สะดวกในการติดต่อไม่สำเร็จ: ${contactPlaceTypeVal} (${contactFlagValue})`);
          }

          console.log(`✅ เลือกสถานที่สะดวกในการติดต่อ: ${contactPlaceTypeVal}`);

          //============
          await page.waitForTimeout(400);

          await mandatoryFill(page, mobilePhone, '#currentMobileNo', 'โทรศัพท์มือถือ');
          await optionalFill(page, homePhone, '#currentHomePhoneNo', 'โทรศัพท์บ้าน');
          await optionalFillTab(page, workPhone, '#currentWorkPhoneNo', 'โทรศัพท์ที่ทำงาน');
          await optionalFillTab(page, workPhoneExt, '#currentWorkPhoneNoExt', 'ต่อ');

          // // Email
          const emailVal = String(email || '').trim();
          if (emailVal !== '') {
            try {
              const emailInput = page.locator('#registerEmail');
              await emailInput.waitFor({
                state: 'visible',
                timeout: 5000,
              });

              await emailInput.click();
              await emailInput.fill(emailVal);
              console.log('✅ fill #registerEmail success');
            } catch {
              console.log('⚠️ #registerEmail ไม่เจอ → fallback #currentEmail');
              const emailInputFallback = page.locator('#currentEmail');
              await emailInputFallback.waitFor({
                state: 'visible',
                timeout: 5000,
              });
              await emailInputFallback.click();
              await emailInputFallback.fill(emailVal);
              console.log('✅ fill #currentEmail success');
            }
            await page.waitForTimeout(500);
          }


          if (paperOrElectronic === 'Paper') {
            // Category รูปแบบกรมธรรม์
            await page.getByText('แบบรูปเล่มกระดาษ').first().click(); // แก้ Selector ให้ถูกต้องหาก text คือ 'แบบรูปเล่มกระดาษ'
            await page.getByRole('textbox', { name: 'ส่งเอกสารกรมธรรม์ที่ *' }).click();
            await page.getByRole('textbox', { name: 'ส่งเอกสารกรมธรรม์ที่ *' }).fill(policyDeliveryLocation); // ยังคง Hardcode หรือเพิ่มใน NewCaseData
            await page.waitForTimeout(1000);
            await page.getByRole('textbox', { name: 'ส่งเอกสารกรมธรรม์ที่ *' }).press('Tab');
            await page.getByText('แบบรูปเล่มกระดาษ').nth(1).click(); // แก้ Selector ให้ถูกต้องหาก text คือ 'แบบรูปเล่มกระดาษ'
            await page.waitForTimeout(1000);
          }
          else if (paperOrElectronic === 'Email') {
            // Category รูปแบบกรมธรรม์
            await page.getByText('แบบอิเล็กทรอนิกส์').first().click();
            await page.waitForTimeout(1000);
            await page.getByText('แบบอิเล็กทรอนิกส์ โดยจัดส่งตามอีเมล').nth(1).click();
            await page.waitForTimeout(1000);
          }
          console.log("Pass Estamp")
          const elapsedSec3 = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`⏱️ ใช้เวลาไป ${elapsedSec3}s`);


          // =============
          // Category อาชีพ    
          // =============
          await mandatoryFillTab(page, occupationCode, '#currentOccupationCode', 'รหัสอาชีพ');
          await mandatoryFillTab(page, occupationPosition, '#currentPositionName', 'ตำแหน่ง');
          await optionalFillTab(page, jobDescription, '#currentJobDesc', 'ลักษณะงานที่ทำ');
          await optionalFillTab(page, businessType, '#currentBusinessTypeDesc', 'ลักษณะธุรกิจ');
          await mandatoryFillTab(page, annualIncome, '#currentIncomePerYear', 'รายได้ต่อปี');

          // =============
          // ท่านใช้รถจักรยานยนต์ในการทำงานหรือไม่ 
          // =============
          // ใช้รถจักรยานยนต์
          const useMotorcycleVal = String(useMotorcycle || '').trim();

          let motorcycleValue = '';

          if (useMotorcycleVal === 'ใช้') {
            motorcycleValue = 'Y';
          } else if (useMotorcycleVal === 'ไม่ใช้') {
            motorcycleValue = 'N';
          } else {
            throw new Error(`❌ useMotorcycle ไม่ถูกต้อง: ${useMotorcycleVal}`);
          }

          const motorcycleInput = page.locator(`input[name="motorcycleWork"][value="${motorcycleValue}"]`);
          await motorcycleInput.waitFor({ state: 'attached', timeout: 5000 });

          // MUI radio ให้กด label ครอบ input แทน
          const motorcycleLabel = motorcycleInput.locator('xpath=ancestor::label[1]');
          await motorcycleLabel.click({ force: true });

          await page.waitForTimeout(300);

          if (!(await motorcycleInput.isChecked())) {
            throw new Error(`❌ เลือกใช้รถจักรยานยนต์ไม่สำเร็จ: ${useMotorcycleVal}`);
          }

          console.log(`✅ เลือกใช้รถจักรยานยนต์: ${useMotorcycleVal}`);

          // =============
          console.log("Pass Occupation")
          const elapsedSec4 = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`⏱️ ใช้เวลาไป ${elapsedSec4}s`);
          //case policyName = a18,19,20 มันให้กรอกเบี้ยแทนทุน
          if (policyName.includes('โอเชี่ยนไลฟ์ โอชิ แพลน 18/10')) {
            await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).click();
            await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).fill(policyName);
            await page.waitForTimeout(1000);
            await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).press('Tab');
            await page.waitForTimeout(1000);
            await page.getByRole('textbox', { name: 'เบี้ยประกันภัยรวม *' }).click();
            await page.waitForTimeout(2000);
            await page.getByRole('textbox', { name: 'เบี้ยประกันภัยรวม *' }).fill(insuredAmount);
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
            await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).type(policyName, { delay: 100 });
            await page.waitForTimeout(1000);
            await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).press('Tab');
            await page.waitForTimeout(1000);

            await waitOptionalLoading(page);

            await page.getByRole('textbox', { name: 'จำนวนเงินเอาประกันภัย *' }).type(insuredAmount, { delay: 100 });
            await page.waitForTimeout(1000);
            await page.getByRole('textbox', { name: 'จำนวนเงินเอาประกันภัย *' }).press('Tab');

            await waitOptionalLoading(page);

            await page.getByRole('textbox', { name: 'งวดการชำระ *' }).click();
            await page.getByRole('textbox', { name: 'งวดการชำระ *' }).type(paymentPeriod, { delay: 100 });
            await page.getByRole('textbox', { name: 'งวดการชำระ *' }).press('Tab');
            await page.waitForTimeout(1000);
            //แบบประกันหายเลือกกดอีกครั้ง
            await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).click();
            await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).type(policyName, { delay: 100 });
            await page.waitForTimeout(1000);
            await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).press('Tab');
            await page.waitForTimeout(1000);
          }
          console.log("Pass Main Insurance")
          const elapsedSec5 = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`⏱️ ใช้เวลาไป ${elapsedSec5}s`);

          // เก็บจำนวนสัญญาเพิ่มเติม
          let addedRiderCount = 0;

          // 🔥 check ปุ่มเพิ่ม rider ก่อน
          const addRiderBtn = page.getByRole('button', { name: 'เพิ่มสัญญาเพิ่มเติม', exact: true });

          if (riderList.length > 0) {
            const isVisible = await addRiderBtn.isVisible().catch(() => false);

            if (!isVisible) {
              throw new Error(
                `❌ ต้องมี Rider (${riderList.length}) แต่ไม่พบปุ่ม "เพิ่มสัญญาเพิ่มเติม"`
              );
            }
          }

          // เริ่มทำการ loop เพิ่มสัญญาเพิ่มเติมตามข้อมูลจาก write-result.js > buildRiders()
          for (const rider of riderList) {
            const riderName = String(rider.riderName || rider.riderCode || '').trim();
            const riderAmount = String(rider.riderCoverage || rider.riderPremium || '').trim();

            if (!riderName) {
              throw new Error(`❌ Rider ไม่มีชื่อ: ${JSON.stringify(rider)}`);
            }

            if (!riderAmount) {
              throw new Error(`❌ Rider ${riderName} ไม่มีทุนหรือเบี้ย`);
            }

            // 🔥 check ปุ่มทุกครั้งก่อนกด (กัน UI bug)
            const addRiderBtn = page.getByRole('button', { name: 'เพิ่มสัญญาเพิ่มเติม', exact: true });

            if (!(await addRiderBtn.isVisible().catch(() => false))) {
              throw new Error(`❌ ปุ่มเพิ่ม Rider หายระหว่างทำงาน (rider=${riderName})`);
            }

            await page.waitForTimeout(1500);
            await addRiderBtn.click();

            const riderNameInput = page.getByRole('textbox', { name: 'ชื่อสัญญาเพิ่มเติม *' });
            await riderNameInput.click();
            await riderNameInput.fill(riderName);
            await riderNameInput.press('Tab');

            await page.waitForTimeout(1000);

            try {

              await page.getByText('กรุณาเลือก').click({
                timeout: 10000,
              });

            } catch (err) {

              throw new Error(
                `❌ Rider ${riderName} เลือกทุน/แผนความคุ้มครองไม่สำเร็จ ภายใน 10 วินาที`
              );
            }


            const riderAmountInput = page.getByRole('textbox', {
              name: 'ทุนประกันภัย/แผนความคุ้มครอง *',
            });

            // await riderAmountInput.click();

            try {

              await riderAmountInput.click({
                timeout: 10000,
              });

            } catch (err) {

              throw new Error(
                `❌ Rider ${riderName} ไม่เลือกทุนประกันภัย/แผนความคุ้มครองได้ ภายใน 10 วินาที`
              );
            }

            if (riderAmount.toLowerCase() === 'any') {

              console.log(`ℹ️ Rider ${riderName} ใช้ Any → เลือกรายการแรกจาก dropdown`);

              await page.waitForTimeout(500);

              await page.keyboard.press('ArrowDown');
              await page.waitForTimeout(300);

              await page.keyboard.press('Enter');
              await page.waitForTimeout(500);

            } else {

              await riderAmountInput.fill(riderAmount);
              await riderAmountInput.press('Tab');

            }


            await page.waitForTimeout(1500);

            const addBtn = page.getByRole('button', { name: 'เพิ่ม' });

            // ✅ รอให้ปุ่ม เพิ่ม กดได้ ภายใน 10 วิ
            try {
              await addBtn.waitFor({
                state: 'visible',
                timeout: 10000,
              });

              await expect(addBtn).toBeEnabled({
                timeout: 10000,
              });

            } catch {
              throw new Error(
                `❌ ไม่สามารถกด เพิ่ม Rider ${riderName} คาดว่าหาทุนไม่พบ`
              );
            }

            await addBtn.click();
            await page.waitForTimeout(1000);

            // ✅ ถ้ากดเพิ่มแล้ว dialog ยังไม่ปิด + มี error สีแดง แปลว่าเพิ่ม Rider ไม่สำเร็จ
            const riderDialogStillOpen = await page
              .getByText('สัญญาเพิ่มเติม', { exact: true })
              .isVisible()
              .catch(() => false);

            const riderCoverageError = await page
              .getByText('กรุณาระบุ ทุนประกันภัย/แผนความคุ้มครอง')
              .isVisible()
              .catch(() => false);

            if (riderDialogStillOpen && riderCoverageError) {
              throw new Error(
                `❌ Rider ${riderName} เพิ่มไม่สำเร็จ: ไม่พบทุนประกันภัย/แผนความคุ้มครอง หรือไม่ได้เลือกทุน`
              );
            }

            // ✅ กันเคส dialog ยังเปิดค้าง แม้ไม่เจอข้อความ error
            if (riderDialogStillOpen) {
              throw new Error(
                `❌ Rider ${riderName} เพิ่มไม่สำเร็จ: หน้าต่างสัญญาเพิ่มเติมยังไม่ปิดหลังจากกดเพิ่ม`
              );
            }

            addedRiderCount++;
          }
          console.log("Pass Rider")
          const elapsedSec6 = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`⏱️ ใช้เวลาไป ${elapsedSec6}s`);
          console.log(`จำนวนสัญญาเพิ่มเติมที่เพิ่มที่ถูกเพิ่ม: ${addedRiderCount} รายการ`);
          await page.waitForTimeout(1000);

          // ดึงข้อมูลทั้งหมดจากหน้าเว็บ
          const draftPremium3 = await page.locator('td.MuiTableCell-body.MUIDataTableBodyCell-root-58').allTextContents();

          let premiumPay;
          let filledPay = 0; // ✅ ประกาศนอก loop เพื่อเก็บค่ารวม
          let insuMainIndex = -1; // ประกาศตัวแปรเพื่อเก็บ index ของแบบประกันหลัก
          insuMainIndex = draftPremium3.findLastIndex(text => text.includes(policyName));

          if (insuMainIndex !== -1) {
            const insuMain = draftPremium3[insuMainIndex];
            const insuMoney = draftPremium3[insuMainIndex + 4];
            const insuPremium = parseFloat(draftPremium3[insuMainIndex + 6]?.replace(/,/g, '')) || 0;
            const insuSpePremium = parseFloat(draftPremium3[insuMainIndex + 8]?.replace(/,/g, '')) || 0;
            const insuCommis = draftPremium3[insuMainIndex + 12];

            // ✅ รวมเบี้ยหลักกับเบี้ยพิเศษหลักก่อน
            filledPay = insuPremium + insuSpePremium;
            const riderConfigsForCheck = [...riderList];

            if (policyName.includes('โอเชี่ยนไลฟ์ โอชิ แพลน 18/10')) {
              riderConfigsForCheck.unshift({
                riderName: 'CPA.2.13',
                riderCoverage: '10000',
              });
            }

            const displayedRiders = [];
            let lastRiderIndex = insuMainIndex;

            for (const riderConfig of riderConfigsForCheck) {
              const riderNameIndex = draftPremium3.findIndex((text, index) => {
                // ค้นหาข้อความชื่อ rider ที่อยู่หลังจากตำแหน่งของ rider ตัวล่าสุด
                return index > lastRiderIndex && text.includes(riderConfig.riderName);
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
                displayedRiders.push(rider);
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

            //       console.log('-------------------------------');
            console.log(`ค่า Premium ที่ชำระที่ยังไม่รวมเบี้ยเพิ่มพิเศษ: ${premiumPay}`);
            console.log(`✅ รวมเบี้ยทั้งหมด (filledPay) คือค่าเบี้ย หลัก บวก rider ที่ซื้อเท่านั้น ไม่ได้คิด bundle ที่แถมมา: ${filledPay}`);
          } else {
            console.log('ไม่พบแบบประกันหลักที่กำหนด');
          }
          console.log("Pass Display Insurance Money")
          const elapsedSec7 = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`⏱️ ใช้เวลาไป ${elapsedSec7}s`);
          console.log('-------------------------------');

          // =============
          // Category การชำระเบี้ยประกันภัย
          // =============

          const payerTypeVal = String(payerType || '').trim();

          let payerValue = '';

          if (payerTypeVal === 'ชำระเอง') {
            payerValue = '1';
          } else if (payerTypeVal === 'ผู้อื่น(โปรดระบุรายละเอียด)') {
            payerValue = '2';
          } else {
            throw new Error(`❌ payerType ไม่ถูกต้อง: ${payerTypeVal}`);
          }

          const payerInput = page.locator(`input[name="payerCode"][value="${payerValue}"]`);
          await payerInput.waitFor({ state: 'attached', timeout: 5000 });

          // ใช้ evaluate เป็นตัวจบ เพราะ MUI click แล้ว state ไม่เปลี่ยน
          await page.evaluate((val) => {
            const el = document.querySelector(`input[name="payerCode"][value="${val}"]`);
            if (!el) throw new Error(`ไม่พบ payerCode value=${val}`);

            el.click();
            el.checked = true;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }, payerValue);

          await page.waitForTimeout(300);

          if (!(await payerInput.isChecked())) {
            throw new Error(`❌ เลือก payerType ไม่สำเร็จ: ${payerTypeVal}`);
          }

          console.log(`✅ เลือก payerType: ${payerTypeVal}`);


          // ==================================================
          // 🔥 กรณี "ผู้อื่น" → กรอกข้อมูลเพิ่ม
          // ==================================================
          if (payerValue === '2') {

            console.log('👤 payerType = ผู้อื่น → กรอกข้อมูลผู้ชำระเบี้ย');

            // ===== ผู้ชำระเบี้ยประกันภัย-คำนำหน้า =====
            await optionalFillTab(page, payerPrefix, '#payerTitleCode', 'ผู้ชำระเบี้ยประกันภัย-คำนำหน้า');
            await optionalFill(page, payerName, '#payerName', 'ผู้ชำระเบี้ยประกันภัย-ชื่อ');
            await optionalFill(page, payerSurname, '#payerSurname', 'ผู้ชำระเบี้ยประกันภัย-นามสกุล');
            await optionalFill(page, payerAge, '#payerAge', 'ผู้ชำระเบี้ยประกันภัย-อายุ');
            await mandatoryFillTab(page, payerUseAddressType, '#useAddressTypeCode', 'ผู้ชำระเบี้ยประกันภัย-ใช้ตามที่อยู่');
            await optionalFill(page, payerHouseNo, '#houseNo', 'ผู้ชำระเบี้ยประกันภัย-เลขที่');
            await optionalFill(page, payerMoo, '#village', 'ผู้ชำระเบี้ยประกันภัย-หมู่ที่');
            await optionalFill(page, payerVillage, '#building', 'ผู้ชำระเบี้ยประกันภัย-หมู่บ้าน/อาคาร');
            await optionalFill(page, payerSoi, '#alley', 'ผู้ชำระเบี้ยประกันภัย-ตรอก/ซอย');
            await optionalFill(page, payerRoad, '#road', 'ผู้ชำระเบี้ยประกันภัย-ถนน');
            await mandatoryFillTab(page, payerProvince, '#provinceCode', 'ผู้ชำระเบี้ยประกันภัย-จังหวัด');
            await optionalFillTab(page, payerDistrict, '#districtCode', 'ผู้ชำระเบี้ยประกันภัย-อำเภอ/เขต');
            await optionalFillTab(page, payerSubDistrict, '#subDistrictCode', 'ผู้ชำระเบี้ยประกันภัย-ตำบล/แขวง');
            await optionalFillTab(page, payerMobile, '#section-payment #mobileNo', 'ผู้ชำระเบี้ยประกันภัย-โทรศัพท์มือถือ');
            await optionalFillTab(page, payerRelation, '#relationCode', 'ความสัมพันธ์กับผู้ขอเอาประกัน');
            await page.waitForTimeout(500);
            // ===== ผู้ชำระเบี้ยประกันภัย-เอกสารที่ใช้แสดง =====
            await optionalFillTab(page, payerDocument, '#section-payment #documentCode', 'ผู้ชำระเบี้ยประกันภัย-เอกสารที่ใช้แสดง');
            // ===== ผู้ชำระเบี้ยประกันภัย-เลขที่บัตร =====
            await optionalFillTab(page, payerCardNo, '#section-payment #cardNo', 'ผู้ชำระเบี้ยประกันภัย-เลขที่บัตร');
            // ===== ผู้ชำระเบี้ยประกันภัย-อาชีพ =====
            await optionalFillTab(page, payerOccupation, '#section-payment #occupationCode', 'ผู้ชำระเบี้ยประกันภัย-อาชีพ');
          }

          // =============
          const finalTempReceiptNo = String(finalData.tempReceiptNo || tempReceiptNo || '').trim();

          await page.getByRole('textbox', { name: 'เลขที่ใบรับเงินชั่วคราว *' }).click();
          await page.getByRole('textbox', { name: 'เลขที่ใบรับเงินชั่วคราว *' }).fill(finalTempReceiptNo);
          await page.getByRole('textbox', { name: 'เลขที่ใบรับเงินชั่วคราว *' }).press('Tab');

          await page.waitForTimeout(1000);
          await page.getByText('โอนเงินเจ้าของบัญชีเงินฝาก').first().click();
          await mandatoryFillTab(page, 'ธนาคารกรุงเทพ', '#payinBankAccountCode', 'ธนาคารโอน');
          await mandatoryFill(page, 'ออโตเมทดาต้า', '#payinBranch', 'สาขาโอน');
          await mandatoryFill(page, '1234567890', '#bankAccountNo', 'เลขที่บัญชีโอน');


          const prefix = cusTitlePrefix || '';
          const name = cusName || '';
          const surname = cusSurname || '';

          const fullName = `${prefix}${name} ${surname}`.trim();
          // await page.getByRole('textbox', { name: 'ชื่อบัญชี *' }).fill(fullName);
          const el = page.getByRole('textbox', { name: 'ชื่อบัญชี *' });

          await el.waitFor({ state: 'visible', timeout: 5000 });
          await el.click();
          await el.fill(fullName);

          // 🔍 log ค่าใน input จริง
          const actualValue = await el.inputValue();

          console.log('✅ Mandatory Fill ชื่อบัญชีโอน:', fullName);

          // 🔥 เก็บค่าจาก <p> ไว้ในตัวแปร
          totalAmount = (
            await page
              .locator('tr', { hasText: 'รวมทั้งหมด' })
              .locator('td')
              .nth(9)
              .locator('p.MuiTypography-body1')
              .innerText()
          ).replace(/,/g, '');

          console.log('💰 ยอดเงินรวมสุทธิ =', totalAmount);

          // 🔥 เอาไปใช้กับ mandatoryFill
          await mandatoryFill(
            page,
            totalAmount,
            '#amount4',
            'จำนวนเงินโอน'
          );

          await page.waitForTimeout(1000);
          await page.getByText('รับเช็คทางไปรษณีย์').first().click();
          await page.waitForTimeout(1000);

          // Category จัดการผู้รับผลประโยชน์
          const numBeneInt = parseInt(numBene, 10);

          // เปิดหน้าจัดการผู้รับประโยชน์แค่ครั้งเดียว

          if (numBeneInt > 0) {
            await page.getByRole('button', { name: 'จัดการผู้รับประโยชน์' }).click();
            await page.waitForTimeout(500);
          }

          // วนลูปตามจำนวนผู้รับผลประโยชน์
          for (let i = 0; i < numBeneInt; i++) {
            const beneItem = benes?.[i];

            if (!beneItem) {
              throw new Error(`bene หาย index=${i} | numBene=${numBene} | bene.length=${benes?.length}`);
            }

            await page.getByRole('button', { name: 'เพิ่มผู้รับประโยชน์' }).click();

            // ความสัมพันธ์
            await page.getByRole('textbox', { name: 'ความสัมพันธ์ *' }).click();
            await page.getByRole('textbox', { name: 'ความสัมพันธ์ *' }).fill(beneItem.beneRela);
            await page.getByRole('textbox', { name: 'ความสัมพันธ์ *' }).press('Tab');
            await page.waitForTimeout(500);

            // คำนำหน้า
            await page.getByRole('textbox', { name: 'คำนำหน้า *' }).click();
            await page.getByRole('textbox', { name: 'คำนำหน้า *' }).fill(beneItem.benePrefix);
            await page.getByRole('textbox', { name: 'คำนำหน้า *' }).press('Tab');
            await page.waitForTimeout(500);

            // ชื่อ
            await page.getByRole('textbox', { name: 'ชื่อ *' }).click();
            await page.getByRole('textbox', { name: 'ชื่อ *' }).fill(beneItem.beneName);
            await page.waitForTimeout(500);

            // นามสกุล
            await page.getByLabel('จัดการผู้รับประโยชน์').locator('div').filter({ hasText: /^นามสกุล$/ }).nth(1).click();
            await page.getByRole('textbox', { name: 'นามสกุล', exact: true }).fill(beneItem.beneSurname);
            await page.waitForTimeout(500);

            // อายุ
            await page.getByRole('textbox', { name: 'อายุ *' }).click();
            await page.getByRole('textbox', { name: 'อายุ *' }).fill(beneItem.beneAge);
            await page.waitForTimeout(500);

            // เฉลี่ยสัดส่วนผลประโยชน์เท่าๆกัน
            await page.getByText('เฉลี่ยสัดส่วนผลประโยชน์เท่าๆกัน').first().click();
            await page.waitForTimeout(1000);

            // ที่อยู่ปัจจุบัน ดึงค่าจากทะเบียนบ้าน
            const useAddressInput = page
              .getByRole('dialog', { name: 'จัดการผู้รับประโยชน์ Close' })
              .locator('#useAddressTypeCode input');
            await useAddressInput.click();
            await page.waitForTimeout(500);
            await page.keyboard.press('ArrowDown');
            await page.waitForTimeout(300);
            await page.keyboard.press('Enter');
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

          const ageInt = parseInt(age, 10);
          // const gender = gender; // "ชาย" หรือ "หญิง"
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
          await mandatoryFill(page, height, '#bmiHeight', 'ส่วนสูง');

          await mandatoryFill(page, weight, '#bmiWeight', 'น้ำหนัก');

          await page.getByText('เลือกการรับรองสถานะและคำยินยอมและตกลงปฏิบัติตามกฎหมาย FATCA ไม่มี/ไม่เป็น').first().click();
          await page.waitForTimeout(1000);
          await page.getByText('ไม่มีความประสงค์').first().click();
          await page.waitForTimeout(1000);
          await page.getByText('ไม่ยินยอม').first().click();
          await page.waitForTimeout(1000);

          if (ageInt < 21) {
            // ถ้าอายุต่ำกว่า 15 ปี ให้กรอกข้อมูลผู้ปกครอง
            console.log(`ผู้เอาประกันอายุ ${age} ปี, ต้องกรอกข้อมูลผู้ปกครอง`);

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
          await autoFillRequiredFields(page);

          //ส่งพิจารณา
          console.log("Pass All checkbox")
          const elapsedSec9 = ((Date.now() - startTime) / 1000).toFixed(2);
          console.log(`⏱️ ใช้เวลาไป ${elapsedSec9}s`);

          await page.getByRole('button', { name: 'บันทึก', exact: true }).click();
          await page.waitForTimeout(1000);

        }
        else {

          throw new Error(
            `❌ applicationFormCode ไม่รองรับ: ${applicationFormCode}`
          );
        }

        //============ เริ่ม Stage 1 = Deposit Success ==================
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
        await page.getByRole('textbox', { name: 'เลขที่ใบคำขอ' }).fill(applicationNo);
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
        if (environment === 'UAT') {
          await page.goto('https://uatnbs.thaisamut.co.th/nbsweb/secure/home.html');
        }
        else if (environment === 'SIT') {
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


        const partnerNoVal = String(partnerNo || '').trim();
        const partnerNameVal = String(partner || '').trim();

        const channelCodeText =
          `${partnerNoVal.slice(0, 3)}-${partnerNoVal.slice(3)} : ${partnerNameVal}`;

        console.log('🏦 channelCodeText =', channelCodeText);

        const input = page.locator('#channelCode input');

        await input.click();

        await input.evaluate((el, value) => {
          el.focus();

          el.value = '';

          el.dispatchEvent(new Event('input', { bubbles: true }));

          document.execCommand(
            'insertText',
            false,
            value
          );

          el.dispatchEvent(new Event('input', { bubbles: true }));
        }, channelCodeText);

        await page.waitForTimeout(500);

        await input.press('Enter');

        console.log('✅ ระบุสาขาต้นสังกัด รับฝาก สำเร็จ');

        await page.waitForTimeout(200);

        // ระบุรับฝากจาก
        const depositFromText = 'ตัวแทน';
        const depositFromInput = page.locator('#depositFrom input');
        await depositFromInput.click();
        await depositFromInput.evaluate((el, value) => {
          el.focus();
          el.value = '';
          el.dispatchEvent(new Event('input', { bubbles: true }));
          document.execCommand(
            'insertText',
            false,
            value
          );
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }, depositFromText);
        await page.waitForTimeout(500);
        await depositFromInput.press('Enter');
        console.log('✅ ระบุรับฝากจาก = ตัวแทน สำเร็จ');

        //ระบุตัวแทนในรับฝาก ใหม่
        // await page.getByText('ตัวแทน').first().click();
        await page.waitForTimeout(200);
        // await page.getByRole('textbox', { name: 'กรุณาระบุ' }).first().click();
        await page.getByRole('textbox', { name: 'กรุณาระบุ' }).first().fill(agentFirstName); // กรอกชื่อจากตัวแทน
        await page.getByRole('textbox', { name: 'กรุณาระบุ' }).nth(1).click();
        await page.waitForTimeout(200);
        await page.getByRole('textbox', { name: 'กรุณาระบุ' }).nth(1).fill(agentLastName); // กรอกนามสกุลจากตัวแทน
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

        await page.locator('.MuiGrid-root.MuiGrid-container.MuiGrid-spacing-xs-1 > div:nth-child(3) > .MuiFormControl-root > .MuiInputBase-root > .MuiInputBase-input').click();
        await page.locator('.MuiInputBase-root.MuiInput-root.MuiInput-underline.MuiInputBase-fullWidth.MuiInput-fullWidth.Mui-focused > .MuiInputBase-input').fill(totalAmount);


        await page.waitForTimeout(500);
        await page.getByRole('button', { name: 'บันทึก' }).click();
        await page.waitForTimeout(500);

        await page.getByRole('button', { name: 'รายการใบคำขอ/กรมธรรม์ *  เพิ่มข้อมูล' }).getByRole('button').click();
        await page.getByText('เลือก').click();
        await page.getByRole('textbox').fill('เคสใหม่');
        await page.getByRole('textbox').press('Tab');
        await page.getByText('เลือก').first().click();


        const policyTypeText =
          policyType === 'ORD'
            ? 'สามัญ'
            : policyType === 'MRTA'
              ? 'สามัญ'
              : policyType === 'PA'
                ? 'PA'
                : policyType === 'IND'
                  ? 'อุตสาหกรรม'
                  : '';

        if (!policyTypeText) {
          throw new Error(`❌ policyType ไม่รองรับ: ${policyType}`);
        }

        // ประเภทกรมธรรม์
        const policyTypeInput = page.locator('input#policyTypeSearch');

        await policyTypeInput.waitFor({
          state: 'visible',
          timeout: 10000,
        });

        await policyTypeInput.click();
        await policyTypeInput.fill('');
        await policyTypeInput.type(policyTypeText, { delay: 100 });
        await policyTypeInput.press('Tab');
        console.log('✅ เลือกประเภทกรมธรรม์ =', policyTypeText);
        await page.waitForTimeout(500);

        // เลขที่ใบคำขอ
        await page
          .locator('div:has-text("ค้นหารายการใบคำขอ/กรมธรรม์")')
          .locator('label:has-text("เลขที่ใบคำขอ")')
          .locator('..')
          .locator('input')
          .first()
          .fill(applicationNo);

        console.log('✅ เลขที่ใบคำขอ =', applicationNo);

        await page.waitForTimeout(500);
        await page.getByRole('button', { name: 'ค้นหา', exact: true }).click();
        await page.waitForTimeout(600);
        await page.getByRole('button', { name: 'ยืนยัน' }).click();
        await page.getByText('เลือก').first().click();

        // ===================
        // ระบุชื่อแบบประกันภัย
        // ===================

        if (
          policyType === 'ORD' ||
          policyType === 'PA' ||
          policyType === 'IND' ||
          (
            policyType === 'MRTA' &&
            applicationFormCode === 'BA012'
          )
        ) {
          const planInput = page.locator('input#planCode').last();
          async function selectPlan(searchText) {
            console.log(`🔎 ค้นหาแบบประกันด้วย: ${searchText}`);
            await planInput.waitFor({
              state: 'attached',
              timeout: 5000
            });

            await planInput.evaluate(el => {
              el.scrollIntoView({
                block: 'center'
              });
              el.focus();
            });

            await planInput.evaluate((el, value) => {
              el.focus();
              el.value = '';
              el.dispatchEvent(new Event('input', {
                bubbles: true
              }));

              document.execCommand(
                'insertText',
                false,
                value
              );

              el.dispatchEvent(new Event('input', {
                bubbles: true
              }));

            }, searchText);

            const option = page.locator('div[class*="option"]').first();

            const hasOption = await option
              .waitFor({ state: 'visible', timeout: 3000 })
              .then(() => true)
              .catch(() => false);

            if (!hasOption) {
              console.log(`⚠️ ไม่พบ option ภายใน 3 วิ: ${searchText}`);
              return '';
            }

            await option.click();
            console.log('✅ click option สำเร็จ');

            await page.waitForTimeout(1000);

            const actualPlan = await page
              .locator('div[class*="singleValue"]')
              .filter({ hasText: new RegExp(`${policyCode}|${policyName}`) })
              .first()
              .innerText()
              .catch(() => '');

            console.log(`🔎 actualPlan หลังค้น "${searchText}" =`, actualPlan);

            return String(actualPlan || '').trim();
          }

          let actualPlan = await selectPlan(policyName);

          if (!actualPlan.includes(policyName) && !actualPlan.includes(policyCode)) {
            console.log(`⚠️ ค้นด้วยชื่อไม่สำเร็จ → fallback ใช้ policyCode=${policyCode}`);
            actualPlan = await selectPlan(policyCode);
          }

          if (!actualPlan.includes(policyName) && !actualPlan.includes(policyCode)) {
            throw new Error(`❌ เลือกแบบประกันไม่สำเร็จ policyName=${policyName} policyCode=${policyCode}`);
          }

          console.log('✅ เลือกแบบประกันสำเร็จ:', actualPlan);

        } else if (policyType === 'MRTA') {
          const policyCodeVal = String(policyCode || '').trim();
          const policyNameVal = String(policyName || '').trim();
          const newPolicyName = `${policyCodeVal} : ${policyNameVal}`;

          console.log('📌 newPolicyName =', newPolicyName);

          const planInput = page.locator('input#planCode');

          await planInput.waitFor({ state: 'visible', timeout: 10000 });
          await planInput.click();

          await planInput.evaluate((el, value) => {
            el.focus();
            el.value = '';
            el.dispatchEvent(new Event('input', { bubbles: true }));
            document.execCommand('insertText', false, value);
            el.dispatchEvent(new Event('input', { bubbles: true }));
          }, newPolicyName);

          await page.waitForTimeout(800);
          await planInput.press('Enter');
          await page.waitForTimeout(1000);

          console.log('✅ เลือกแบบประกัน MRTA สำเร็จ');
        }
        await page.locator('div:nth-child(8) > .MuiFormControl-root > .MuiInputBase-root > .MuiInputBase-input').click();
        await page.locator('.MuiInputBase-root.MuiInput-root.MuiInput-underline.MuiInputBase-fullWidth.MuiInput-fullWidth.Mui-focused > .MuiInputBase-input').fill(totalAmount);
        await page.locator('.MuiInputBase-root.MuiInput-root.MuiInput-underline.MuiInputBase-fullWidth.MuiInput-fullWidth.Mui-focused > .MuiInputBase-input').press('Tab');
        await page.waitForTimeout(1000);

        const customerTitleInput = page.locator('#customerTitle').nth(1);

        await customerTitleInput.click();
        await customerTitleInput.fill(cusTitlePrefix);
        await customerTitleInput.press('Tab');

        await page.locator('div:nth-child(10) > .MuiFormControl-root > .MuiInputBase-root > .MuiInputBase-input').click();
        await page.locator('.MuiInputBase-root.MuiInput-root.MuiInput-underline.MuiInputBase-fullWidth.MuiInput-fullWidth.Mui-focused > .MuiInputBase-input').fill(cusName); //ใส่ชื่อ
        await page.locator('.MuiInputBase-root.MuiInput-root.MuiInput-underline.MuiInputBase-fullWidth.MuiInput-fullWidth.Mui-focused > .MuiInputBase-input').press('Tab');
        await page.locator('.MuiInputBase-root.MuiInput-root.MuiInput-underline.MuiInputBase-fullWidth.MuiInput-fullWidth.Mui-focused > .MuiInputBase-input').click();
        await page.locator('.MuiInputBase-root.MuiInput-root.MuiInput-underline.MuiInputBase-fullWidth.MuiInput-fullWidth.Mui-focused > .MuiInputBase-input').fill(cusSurname); //ใส่นามสกุล
        await page.locator('.MuiInputBase-root.MuiInput-root.MuiInput-underline.MuiInputBase-fullWidth.MuiInput-fullWidth.Mui-focused > .MuiInputBase-input').press('Tab');
        await page.waitForTimeout(500);
        await page.locator('[id^="mui-autocomplete"]').fill(agentCode);
        await page.locator(`text=${agentCode}`).click();
        await page.waitForTimeout(3000);
        await page.getByRole('button', { name: 'บันทึก', exact: true }).click();
        await page.waitForTimeout(500);
        await page.getByText('บันทึก').nth(3).click();

        await page.getByRole('button', { name: 'ตกลง' }).click();
        await page.waitForTimeout(1000);

        //log out from 0001
        await page.getByRole('button', { name: '' }).click();
        await page.waitForTimeout(500);
        await page.getByRole('button', { name: 'ตกลง' }).click();
        await page.waitForTimeout(1000);

        // logout NBS จริงๆ ผ่าน url เพื่อเคลียร์ session ก่อน login boss
        try {
          await page.goto(
            environment === 'SIT'
              ? 'https://sitnbs.thaisamut.co.th/nbsweb/secure/logout.html'
              : 'https://uatnbs.thaisamut.co.th/nbsweb/secure/logout.html',
            { waitUntil: 'domcontentloaded', timeout: 3000 }
          );
        } catch (err) {
          console.log('⚠️ logout เกิน 3 วิ / ไม่ redirect → ข้ามไป step ถัดไป');
        }

        // Login NBS as boss
        // ก่อนกรอก username/password ต้องอยู่หน้า login nbsweb (home.html) เท่านั้น
        // ถ้าไม่ใช่ (เด้งไป nbsportal) gotoLoginWithRetry จะ goto กลับมาให้
        await gotoLoginWithRetry(
          page,
          environment === 'SIT'
            ? 'https://sitnbs.thaisamut.co.th/nbsweb/secure/home.html'
            : 'https://uatnbs.thaisamut.co.th/nbsweb/secure/home.html'
        );

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
        await page.locator('div:nth-child(2) > .MuiFormControl-root > .MuiInputBase-root > .MuiInputBase-input').first().fill(applicationNo);
        await page.locator('div:nth-child(2) > .MuiFormControl-root > .MuiInputBase-root > .MuiInputBase-input').first().press('Tab');
        await page.locator('div:nth-child(5) > .MuiFormControl-root > .MuiInputBase-root > .MuiInputBase-input').click();

        await page.locator('.MuiInputBase-root.MuiInput-root.MuiInput-underline.MuiInputBase-fullWidth.MuiInput-fullWidth.Mui-focused > .MuiInputBase-input').fill(totalAmount);

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


        // Step บันทึกเลขรับฝากใหม่
        const firstRow = page.locator('tbody tr').first();
        await firstRow.waitFor({ state: 'visible', timeout: 10000 });

        depositReceiptNo = (await firstRow.locator('td').nth(14).innerText())
          .replace(/\s+/g, ' ')
          .trim();

        console.log(`เลขใบรับฝาก: ${depositReceiptNo}`);
        console.log("อนุมัติรับฝากสำเร็จ เหลือแค่ตรวจสอบนะก้ะ")
        status = 'Inprogress';
        result = 'Deposit Success';
        remark = 'ตั้งรับฝาก และอนุมัติสำเร็จ รอตรวจสอบและออกกรมธรรม์';

        console.log('🔓 กำลังกด Logout boss');

        const logoutBtn = page.locator(
          'button:has(i[title="ออกจากระบบ"])'
        ).first();

        await logoutBtn.waitFor({
          state: 'visible',
          timeout: 10000,
        });

        await logoutBtn.click();
        await page.waitForTimeout(500);

        // ===== Popup ยืนยันออกจากระบบ =====
        const confirmLogoutBtn = page.getByRole('button', {
          name: 'ตกลง',
        }).first();

        await confirmLogoutBtn.waitFor({
          state: 'visible',
          timeout: 10000,
        });

        await confirmLogoutBtn.click();

        console.log('✅ กดยืนยันออกจากระบบแล้ว');
        await page.locator('#username').waitFor({
          state: 'visible',
          timeout: 15000,
        });

        console.log('✅ Logout สำเร็จ');


        await writeResult({
          no,
          applicationNo,
          status,
          result,
          remark,
          depositReceiptNo,
          policyNo,
        });

        alreadyWroteResult = true;
      }

      // ============ จบ Stage 1 = Deposit Success ==================

      // ============ เริ่ม Stage 2 = Waiting Policy No ==================
      if (shouldStartFromStage3) {
        console.log('⏭️ ข้าม Stage 2 เพราะเป็น Inprogress + Waiting Policy No');
      } else {

        for (let stage2Attempt = 1; stage2Attempt <= 2; stage2Attempt++) {
          console.log(`🔁 Stage 2 Attempt ${stage2Attempt}`);

          // logout NBS จริงๆ ผ่าน url เพื่อเคลียร์ session ก่อน login mg0001
          try {
            await page.goto(
              environment === 'SIT'
                ? 'https://sitnbs.thaisamut.co.th/nbsweb/secure/logout.html'
                : 'https://uatnbs.thaisamut.co.th/nbsweb/secure/logout.html',
              { waitUntil: 'domcontentloaded', timeout: 3000 }
            );
          } catch (err) {
            console.log('⚠️ logout เกิน 3 วิ / ไม่ redirect → ข้ามไป step ถัดไป');
          }

          // ก่อนกรอก username/password ต้องอยู่หน้า login nbsweb (home.html) เท่านั้น
          await gotoLoginWithRetry(
            page,
            environment === 'SIT'
              ? 'https://sitnbs.thaisamut.co.th/nbsweb/secure/home.html'
              : 'https://uatnbs.thaisamut.co.th/nbsweb/secure/home.html'
          );

          // ===== Login ด้วย mg0001 =====
          await page.locator('#username').fill('mg0001');
          await page.locator('#password').fill('12');
          await page.getByRole('button', { name: 'Login' }).click();

          console.log('✅ Login mg0001 สำเร็จ');

          await page.getByRole('menuitem', { name: 'ระบบงานให้บริการ' }).click();
          await page.getByRole('menuitem', { name: 'ระบบจัดการข้อมูลเคสใหม่ สำนักงานใหญ่' }).click();
          await page.getByRole('button', { name: 'จัดการข้อมูลเคสใหม่' }).click();
          await page.getByRole('button', { name: 'ตรวจสอบข้อมูลเคสใหม่' }).click();

          await page.waitForTimeout(1000);

          await waitCheckerTableReady(page);

          // รอ table stable จริง
          await page.waitForTimeout(1500);

          const toolbarReadyText = await page
            .locator('.MUIDataTableToolbar-left-8')
            .first()
            .innerText()
            .catch(() => '');

          console.log('📊 Toolbar =', toolbarReadyText);

          // ===== ค้นหาใบคำขอ =====
          await mandatoryFill(page, applicationNo, '#applicationNo', 'ระบุเลขใบคำขอ');

          const appNoCriteriaInput = page.locator('#applicationNo').first();

          await expect(appNoCriteriaInput).toHaveValue(String(applicationNo), {
            timeout: 10000,
          });

          console.log(`✅ criteria เลขใบคำขอถูกต้อง = ${applicationNo}`);

          // หน่วงให้ React commit criteria ก่อน
          await page.waitForTimeout(800);

          const searchBtn = page.getByRole('button', { name: 'ค้นหา', exact: true });

          await searchBtn.waitFor({ state: 'visible', timeout: 10000 });
          await expect(searchBtn).toBeEnabled({ timeout: 10000 });

          await searchBtn.click({ force: true });
          console.log('✅ กดค้นหาแล้ว');

          await page.waitForTimeout(1000);

          // รอบแรกใช้ firstSearchRow
          const firstSearchRow = page.locator('tbody tr').first();

          await expect(firstSearchRow).toContainText(applicationNo, {
            timeout: 10000,
          });

          console.log(`✅ ตารางค้นหาแสดงใบคำขอ ${applicationNo}`);

          await firstSearchRow.waitFor({ state: 'visible', timeout: 10000 });

          const searchCells = await firstSearchRow
            .locator('td')
            .allInnerTexts()
            .catch(() => []);

          const cleanCells = searchCells
            .map(t => String(t || '').replace(/\s+/g, ' ').trim())
            .filter(Boolean);

          const statusIdx = cleanCells.findIndex(t => t === 'สถานะใบคำขอ');
          const appNoIdx = cleanCells.findIndex(t => t === String(applicationNo));

          let caseStatus =
            statusIdx >= 0
              ? cleanCells[statusIdx + 1] || ''
              : appNoIdx >= 0
                ? cleanCells[appNoIdx + 2] || ''
                : '';

          console.log('📌 สถานะใบคำขอรอบค้นหา =', caseStatus || 'ไม่พบสถานะ');

          if (caseStatus.includes('รอพิจารณา')) {
            status = 'Inprogress';
            result = 'Waiting Policy No';
            remark = 'สถานะใบคำขอเป็นรอพิจารณาแล้ว';

            await writeResult({
              no,
              applicationNo,
              status,
              result,
              remark,
              depositReceiptNo,
              policyNo,
            });

            alreadyWroteResult = true;

            console.log('🔓 Logout mg0001 ก่อนเข้า Stage 3');

            try {
              await page.goto(
                environment === 'SIT'
                  ? 'https://sitnbs.thaisamut.co.th/nbsweb/secure/logout.html'
                  : 'https://uatnbs.thaisamut.co.th/nbsweb/secure/logout.html',
                { waitUntil: 'domcontentloaded', timeout: 3000 }
              );
            } catch (err) {
              console.log('⚠️ logout เกิน 3 วิ / ไม่ redirect → ข้ามไป step ถัดไป');
            }


            await page.waitForTimeout(1000);

            console.log('✅ สถานะใบคำขอ = รอพิจารณา → ไป Stage 3');
            break;
          }

          if (
            caseStatus.includes('อนุมัติรับประกัน') ||
            caseStatus.includes('อนุมัติ') ||
            caseStatus.includes('ออกกรมธรรม์')
          ) {
            console.log(`⏭️ พบสถานะ ${caseStatus} → บันทึก Waiting Policy No แล้วไปรอบถัดไป`);

            status = 'Inprogress';
            result = 'Waiting Policy No';
            remark = `ข้าม Stage 2 เพราะสถานะเป็น ${caseStatus}`;

            await writeResult({
              no,
              applicationNo,
              status,
              result,
              remark,
              depositReceiptNo,
              policyNo,
            });

            alreadyWroteResult = true;

            try {
              await page.goto(
                environment === 'SIT'
                  ? 'https://sitnbs.thaisamut.co.th/nbsweb/secure/logout.html'
                  : 'https://uatnbs.thaisamut.co.th/nbsweb/secure/logout.html',
                { waitUntil: 'domcontentloaded', timeout: 3000 }
              );
            } catch (err) {
              console.log('⚠️ logout เกิน 3 วิ / ไม่ redirect → ข้ามไป step ถัดไป');
            }


            await page.waitForTimeout(1000);

            break;
          }



          if (caseStatus.includes('กำลังประมวลผล')) {
            console.log(`⏳ พบสถานะ ${caseStatus} → คงไว้ที่ Deposit Success แล้วไปเคสถัดไป`);

            status = 'Inprogress';
            result = 'Deposit Success';
            remark = `สถานะใบคำขอยังกำลังประมวลผล`;

            await writeResult({
              no,
              applicationNo,
              status,
              result,
              remark,
              depositReceiptNo,
              policyNo,
            });

            alreadyWroteResult = true;

            try {
              await page.goto(
                environment === 'SIT'
                  ? 'https://sitnbs.thaisamut.co.th/nbsweb/secure/logout.html'
                  : 'https://uatnbs.thaisamut.co.th/nbsweb/secure/logout.html',
                { waitUntil: 'domcontentloaded', timeout: 3000 }
              );
            } catch (err) {
              console.log('⚠️ logout เกิน 3 วิ / ไม่ redirect → ข้ามไป step ถัดไป');
            }


            await page.waitForTimeout(1000);

            continue mainLoop;
          }

          if (!caseStatus.includes('รอตรวจสอบข้อมูล')) {
            throw new Error(
              `❌ สถานะใบคำขอไม่พร้อมตรวจสอบ actual="${caseStatus || 'ไม่พบสถานะ'}"`
            );
          }

          console.log('✅ สถานะใบคำขอ = รอตรวจสอบข้อมูล');
          // ===== กดตรวจสอบข้อมูลเคสใหม่ =====
          await firstSearchRow
            .locator('button:has(i[title="ตรวจสอบข้อมูลเคสใหม่"])')
            .first()
            .click();

          console.log('✅ กดตรวจสอบข้อมูลเคสใหม่แล้ว');

          await page.waitForTimeout(3000);

          // ===== เช็คสถานะการชำระเบี้ย =====
          const paymentStatus = (
            await page.locator('p.MuiTypography-body1', {
              hasText: /ชำระครบ|ชำระเกิน|ชำระขาด/
            }).last().innerText({ timeout: 5000 })
          ).trim();

          console.log('💰 สถานะการชำระเบี้ย =', paymentStatus);

          if (paymentStatus !== 'ชำระครบ' && paymentStatus !== 'ชำระเกิน') {
            throw new Error(`❌ สถานะการชำระเบี้ยไม่ถูกต้อง: ${paymentStatus}`);
          }

          // ===== กดยืนยันตรวจสอบข้อมูล =====
          await page.getByRole('button', {
            name: 'ยืนยันตรวจสอบข้อมูล',
            exact: true,
          }).click();

          console.log('✅ กดยืนยันตรวจสอบข้อมูลแล้ว');


          // ===== เช็ค popup หลังยืนยันตรวจสอบข้อมูล ถ้า Action ไม่ได้ใน 20 วิ => FAIL =====
          // ===== จัดการ popup หลังยืนยันตรวจสอบข้อมูล =====
          const CHECK_POPUP_TIMEOUT_MS = 40000;
          const checkPopupStart = Date.now();

          let lastPopupText = '';
          let shouldFailByPopup = false;
          let failPopupText = '';
          let actionSuccess = false;

          while (Date.now() - checkPopupStart < CHECK_POPUP_TIMEOUT_MS) {
            const dialogs = await page.locator('[role="dialog"], .MuiDialog-root').all();

            let foundPopup = false;

            for (const dialog of dialogs.reverse()) {
              const visible = await dialog.isVisible().catch(() => false);
              if (!visible) continue;

              foundPopup = true;

              const rawText = await dialog.innerText({ timeout: 1000 }).catch(() => '');
              const popupText = String(rawText || '')
                .replace(/\s+/g, ' ')
                .replace(/^แจ้งเตือน\s*/g, '')
                .trim();

              const compactPopupText = popupText.replace(/\s+/g, '');

              if (popupText) {
                lastPopupText = popupText;
                console.log(`⚠️ พบ popup หลังยืนยันตรวจสอบข้อมูล: ${popupText}`);
              }

              // ✅ เคส FAIL ทันที: แบบประกันไม่ตรงกับรายการรับฝาก
              if (
                compactPopupText.includes('ไม่สามารถบันทึกรายการได้') &&
                compactPopupText.includes('แบบประกันในใบคำขอกับรายการรับฝาก') &&
                compactPopupText.includes('มีข้อมูลไม่ตรงกัน')
              ) {
                shouldFailByPopup = true;
                failPopupText = popupText || 'ไม่สามารถบันทึกรายการได้ เนื่องจากข้อมูล แบบประกัน ในใบคำขอ กับ รายการรับฝาก มีข้อมูลไม่ตรงกัน กรุณาตรวจสอบ';
                break;
              }

              // ✅ popup confirm ปกติ → ต้องกดยืนยัน
              if (
                compactPopupText.includes('เมื่อท่านกดยืนยันระบบจะดำเนินการตรวจสอบและประมวลผลข้อมูลเคสใหม่') ||
                compactPopupText.includes('ท่านต้องการยืนยันตรวจสอบข้อมูลใบคำขอหรือไม่')
              ) {
                const confirmBtn = dialog
                  .getByRole('button', { name: 'ยืนยัน', exact: true })
                  .first();

                if (await confirmBtn.isVisible().catch(() => false)) {
                  console.log('✅ เจอ popup confirm → กดยืนยัน');
                  await confirmBtn.click({ timeout: 5000, force: true }).catch(() => { });
                  await page.waitForTimeout(1000);
                  continue;
                }

                console.log('⚠️ เจอ popup confirm แต่กดปุ่ม ยืนยัน ไม่ได้ จะ retry');
                continue;
              }

              // ✅ popup อื่น ๆ → พยายามกด ปิด / Close / ตกลง
              const closeBtn = dialog
                .locator(
                  'button:has-text("ปิด"), button:has-text("Close"), button:has-text("ตกลง"), button[aria-label="Close"]'
                )
                .first();

              if (await closeBtn.isVisible().catch(() => false)) {
                console.log('🔁 เจอ popup อื่น ๆ → พยายามกดปิด/ตกลง');
                await closeBtn.click({ timeout: 5000, force: true }).catch(() => { });
                await page.waitForTimeout(1000);
                continue;
              }

              console.log('⚠️ เจอ popup แต่ไม่พบปุ่มที่กดได้ จะ retry');
            }

            if (shouldFailByPopup) {
              break;
            }

            if (!foundPopup) {
              const elapsed = Date.now() - checkPopupStart;

              // รอบแรก: ยังไม่ครบ 15 วิ → รอต่อ
              if (elapsed < 10000) {
                await page.waitForTimeout(500);
                continue;
              }

              // เกิน 10 วิแล้ว → try เช็ค popup ซ้ำอีกครั้ง
              console.log('🔁 ครบ 10 วิแล้วยังไม่เจอ popup → ลองเช็ค popup ซ้ำอีกครั้ง');

              const retryDialogs = await page.locator('[role="dialog"], .MuiDialog-root').all();

              let foundRetryPopup = false;

              for (const retryDialog of retryDialogs.reverse()) {
                const retryVisible = await retryDialog.isVisible().catch(() => false);
                if (!retryVisible) continue;

                const retryRawText = await retryDialog.innerText({ timeout: 1000 }).catch(() => '');
                const retryPopupText = String(retryRawText || '')
                  .replace(/\s+/g, ' ')
                  .replace(/^แจ้งเตือน\s*/g, '')
                  .trim();

                if (retryPopupText) {
                  foundRetryPopup = true;
                  lastPopupText = retryPopupText;
                  console.log(`⚠️ พบ popup จาก retry หลัง 10 วิ: ${retryPopupText}`);
                  break;
                }
              }

              // ถ้า retry แล้วเจอ popup → กลับไปวน while เพื่อให้ logic ด้านบนจัดการ
              if (foundRetryPopup) {
                await page.waitForTimeout(500);
                continue;
              }

              // ถ้า retry แล้วยังไม่เจอ → ถือว่าผ่านจุด popup แล้ว ไป flow ถัดไป
              console.log('✅ ไม่พบ popup หลัง retry 10 วิ → ไป flow ถัดไป');
              actionSuccess = true;
              break;
            }

            await page.waitForTimeout(500);
          }

          // ✅ เจอ popup แบบประกันไม่ตรง → FAIL
          if (shouldFailByPopup) {
            throw new Error(`❌ ${failPopupText}`);
          }

          // ✅ ครบ 40 วิแล้วยังจัดการ popup/action ไม่สำเร็จ → FAIL
          if (!actionSuccess) {
            throw new Error(
              `❌ ${lastPopupText || 'หลังยืนยันตรวจสอบข้อมูลแล้ว popup/action ไม่สำเร็จภายใน 40 วินาที'}`
            );
          }

          const busyPopupText =
            'รายการเลขใบคำขอนี้กำลังถูกใช้งานโดยผู้ใช้งานท่านอื่น กรุณาทำรายการใหม่ภายหลัง';

          let busyPopupMessage = '';

          for (let attempt = 1; attempt <= 10; attempt++) {
            busyPopupMessage = await page
              .locator('[role="dialog"]')
              .filter({ hasText: 'รายการเลขใบคำขอนี้กำลังถูกใช้งาน' })
              .last()
              .innerText({ timeout: 1000 })
              .catch(() => '');

            busyPopupMessage = String(busyPopupMessage || '')
              .replace(/\s+/g, ' ')
              .trim();

            if (busyPopupMessage.includes('รายการเลขใบคำขอนี้กำลังถูกใช้งาน')) {
              break;
            }

            await page.waitForTimeout(500);
          }

          if (busyPopupMessage.includes('รายการเลขใบคำขอนี้กำลังถูกใช้งาน')) {
            const finalPopupMessage =
              busyPopupMessage.match(/รายการเลขใบคำขอนี้กำลังถูกใช้งาน.*?ภายหลัง/)?.[0] ||
              busyPopupText;

            console.log(`⚠️ พบ concurrent popup: ${finalPopupMessage}`);

            // ปิด popup เดิมก่อน
            await page
              .getByRole('dialog')
              .filter({ hasText: 'รายการเลขใบคำขอนี้กำลังถูกใช้งาน' })
              .last()
              .getByRole('button', { name: 'ตกลง' })
              .click()
              .catch(() => { });

            await handleConcurrentRemark(page, environment, applicationNo);

            // กลับไปเริ่ม Stage 2 ใหม่
            console.log('🔁 กลับไปทำ Stage 2 ใหม่หลังเคลียร์ concurrent');
            await gotoLoginWithRetry(
              page,
              environment === 'SIT'
                ? 'https://sitnbs.thaisamut.co.th/nbsweb/secure/home.html'
                : 'https://uatnbs.thaisamut.co.th/nbsweb/secure/home.html'
            );

            continue;
          }
          // ===== กด popup ต่อเนื่อง =====
          for (let i = 0; i < 5; i++) {
            const clicked = await autoConfirmDialogs(page);
            if (!clicked) break;
          }

          // ===== กลับหน้าค้นหา / รอหน้า search =====
          await page.waitForTimeout(3000);

          // ถ้ามีปุ่ม Back ให้กดกลับ
          const backBtn = page.getByText('Back').first();
          if (await backBtn.isVisible().catch(() => false)) {
            await backBtn.click();
            await page.waitForTimeout(1000);
          }

          await waitCheckerTableReady(page);

          // ===== ค้นหาใบคำขออีกรอบ เพื่อเช็ค รอพิจารณา =====
          await mandatoryFill(page, applicationNo, '#applicationNo', 'ระบุเลขใบคำขอ');

          const approveAppNoCriteriaInput = page.locator('#applicationNo').first();

          await expect(approveAppNoCriteriaInput).toHaveValue(String(applicationNo), {
            timeout: 10000,
          });

          console.log(`✅ criteria เลขใบคำขอรอบหลังถูกต้อง = ${applicationNo}`);

          // const searchBtn = page.getByRole('button', { name: 'ค้นหา', exact: true });
          const approveSearchBtn = page.getByRole('button', {
            name: 'ค้นหา',
            exact: true
          });

          await approveSearchBtn.waitFor({ state: 'visible', timeout: 10000 });
          await expect(approveSearchBtn).toBeEnabled({ timeout: 10000 });

          await approveSearchBtn.click({ force: true });
          console.log('✅ กดค้นหาแล้ว');

          await page.waitForTimeout(1000);

          // กันกรณีกดแล้วไม่ query / table ไม่ refresh
          // const firstSearchRow = page.locator('tbody tr').first();

          const firstApproveRow = page.locator('tbody tr').first();

          await expect(firstApproveRow).toContainText(applicationNo, {
            timeout: 10000,
          });

          console.log(`✅ ตารางค้นหาแสดงใบคำขอ ${applicationNo}`);


          await firstApproveRow.waitFor({ state: 'visible', timeout: 15000 });

          let approveStatus = '';

          try {
            const approveStatusCell = firstApproveRow
              .locator('td')
              .filter({ hasText: 'รอพิจารณา' })
              .first();

            await approveStatusCell.waitFor({
              state: 'visible',
              timeout: 10000,
            });

            approveStatus = (await approveStatusCell.innerText()).trim();

          } catch {
            const allCells = await firstApproveRow
              .locator('td')
              .allInnerTexts()
              .catch(() => []);

            const cleanCells = allCells
              .map(t => String(t || '').replace(/\s+/g, ' ').trim())
              .filter(Boolean);

            const statusIdx = cleanCells.findIndex(t => t === 'สถานะใบคำขอ');
            const appNoIdx = cleanCells.findIndex(t => t === String(applicationNo));

            approveStatus =
              statusIdx >= 0
                ? cleanCells[statusIdx + 1] || ''
                : appNoIdx >= 0
                  ? cleanCells[appNoIdx + 2] || ''
                  : '';
          }

          console.log('📌 สถานะใบคำขอหลังยืนยัน =', approveStatus);

          if (approveStatus.includes('รอตรวจสอบข้อมูล')) {
            status = 'Inprogress';
            result = 'Deposit Success';
            remark = `หลังยืนยันแล้วสถานะยังเป็น ${approveStatus}`;

            await writeResult({
              no,
              applicationNo,
              status,
              result,
              remark,
              depositReceiptNo,
              policyNo,
            });

            alreadyWroteResult = true;

            try {
              await page.goto(
                environment === 'SIT'
                  ? 'https://sitnbs.thaisamut.co.th/nbsweb/secure/logout.html'
                  : 'https://uatnbs.thaisamut.co.th/nbsweb/secure/logout.html',
                { waitUntil: 'domcontentloaded', timeout: 3000 }
              );
            } catch (err) {
              console.log('⚠️ logout เกิน 3 วิ / ไม่ redirect → ข้ามไป step ถัดไป');
            }


            await page.waitForTimeout(1000);

            continue mainLoop;
          }

          if (!approveStatus.includes('รอพิจารณา')) {
            throw new Error(
              `❌ หลังยืนยันแล้ว สถานะไม่ใช่ "รอพิจารณา" actual="${approveStatus || 'ไม่พบสถานะ'}"`
            );
          }

          caseStatus = approveStatus;

          console.log('✅ สถานะเปลี่ยนเป็น รอพิจารณา แล้ว');

          status = 'Inprogress';
          result = 'Waiting Policy No';
          remark = 'รอพิจารณา และออกกรมธรรม์';

          console.log('🔓 กำลังกด Logout boss');

          const logoutBtn2 = page.locator(
            'button:has(i[title="ออกจากระบบ"])'
          ).first();

          await logoutBtn2.waitFor({
            state: 'visible',
            timeout: 10000,
          });

          await logoutBtn2.click();
          await page.waitForTimeout(500);

          // ===== Popup ยืนยันออกจากระบบ =====
          const confirmLogoutBtn2 = page.getByRole('button', {
            name: 'ตกลง',
          }).first();

          await confirmLogoutBtn2.waitFor({
            state: 'visible',
            timeout: 10000,
          });

          await confirmLogoutBtn2.click();

          console.log('✅ กดยืนยันออกจากระบบแล้ว');
          await page.locator('#username').waitFor({
            state: 'visible',
            timeout: 15000,
          });

          console.log('✅ Logout สำเร็จ');

          status = 'Inprogress';
          result = 'Waiting Policy No';
          remark = 'รอพิจารณา และออกกรมธรรม์';

          await writeResult({
            no,
            applicationNo,
            status,
            result,
            remark,
            depositReceiptNo,
            policyNo,
          });
          alreadyWroteResult = true;

          break;
        }

        if (result === 'Waiting Policy No') {
          console.log('✅ Stage 2 จบแล้ว → ไป Stage 3 ต่อ');
        }
      }

      //============ จบ Stage 2 = Waiting Policy No ==================


      if (
        result !== 'Waiting Policy No' &&
        result !== 'PASS'
      ) {
        throw new Error(`❌ Stage 2 ไม่สำเร็จ result="${result}"`);
      }

      //============ เริ่ม Stage 3 = Check Policy No ==================

      // ===== Login ด้วย Boss เพื่อตรวจสอบ Step การออก Policy =====
      // logout NBS จริงๆ ผ่าน url เพื่อเคลียร์ session ก่อน login boss
      try {
        await page.goto(
          environment === 'SIT'
            ? 'https://sitnbs.thaisamut.co.th/nbsweb/secure/logout.html'
            : 'https://uatnbs.thaisamut.co.th/nbsweb/secure/logout.html',
          { waitUntil: 'domcontentloaded', timeout: 3000 }
        );
      } catch (err) {
        console.log('⚠️ logout เกิน 3 วิ / ไม่ redirect → ข้ามไป step ถัดไป');
      }

      // ก่อนกรอก username/password ต้องอยู่หน้า login nbsweb (home.html) เท่านั้น
      await gotoLoginWithRetry(
        page,
        environment === 'SIT'
          ? 'https://sitnbs.thaisamut.co.th/nbsweb/secure/home.html'
          : 'https://uatnbs.thaisamut.co.th/nbsweb/secure/home.html'
      );

      await page.locator('#username').fill('boss');
      await page.locator('#password').fill('12');
      await page.getByRole('button', { name: 'Login' }).click();

      console.log('✅ Login boss สำเร็จ');

      await page.getByRole('menuitem', { name: 'ระบบงานให้บริการ' }).click();
      await page.getByRole('menuitem', { name: 'ระบบจัดการข้อมูลเคสใหม่ สำนักงานใหญ่' }).click();
      await page.getByRole('button', { name: 'ดูแลระบบ' }).click();
      await page.getByRole('button', { name: 'ค้นหาประวัติการส่งข้อมูลไประบบที่เกี่ยวข้อง' }).click();

      await page.waitForTimeout(1000);

      await mandatoryFill(page, applicationNo, '#applicationNo', 'ระบุเลขใบคำขอ');

      const finalAppNoInput = page.locator('#applicationNo').first();

      await expect(finalAppNoInput).toHaveValue(String(applicationNo), {
        timeout: 10000,
      });

      console.log(`✅ criteria เลขใบคำขอ Stage 3 ถูกต้อง = ${applicationNo}`);

      // หน่วงให้ React/MUI commit ค่า
      await page.waitForTimeout(800);

      const finalSearchBtn = page.getByRole('button', {
        name: 'ค้นหา',
        exact: true
      });

      await finalSearchBtn.waitFor({
        state: 'visible',
        timeout: 10000,
      });

      await expect(finalSearchBtn).toBeEnabled({
        timeout: 10000,
      });

      await finalSearchBtn.click({ force: true });

      console.log('✅ กดค้นหา Stage 3 แล้ว');

      await page.waitForTimeout(3000);

      // ===== รอ data grid =====
      // ===== ดึงผลลัพธ์ Data Grid หลังออกกรมธรรม์ =====
      const finalSearchRow = page.locator('tbody tr').first();

      await finalSearchRow.waitFor({
        state: 'visible',
        timeout: 15000,
      });

      const cells = await finalSearchRow.locator('td').allInnerTexts();
      const rowText = cells.map(t => String(t || '').trim());

      function getValueAfterLabel(label) {
        const idx = rowText.findIndex(t => t === label);
        if (idx === -1) return '';
        return String(rowText[idx + 1] || '').trim();
      }


      policyNo = getValueAfterLabel('เลขกรมธรรม์');

      const checkStatuses = [
        'Underwrite Rule',
        'Payment Status',
        'Receive Application',
        'Generate Policy',
        'Receipt Status',
        'Hermes Status',
        'AS400 Status',
        'CIS Status',
      ];

      const statusMap = {};
      const invalidStatuses = [];

      for (const label of checkStatuses) {
        const value = getValueAfterLabel(label);
        statusMap[label] = value;

        if (value !== 'Pass' && value !== 'Skip') {
          invalidStatuses.push(`${label}=${value || 'ไม่พบค่า'}`);
        }
      }

      console.log('📄 เลขกรมธรรม์ =', policyNo);
      console.log('📌 Status Map =', statusMap);

      const elapsedSecPolicy = ((Date.now() - startTime) / 1000).toFixed(2);

      if (!policyNo) {
        status = 'FAIL';

        if (
          ![
            'Deposit Success',
            'Waiting Policy No'
          ].includes(result)
        ) {
          result = 'FAIL';
        }
        remark = `[${elapsedSecPolicy}s] ไม่พบเลขกรมธรรม์`;
        throw new Error(remark);
      }

      depositReceiptNo = depositReceiptNo || '';

      if (invalidStatuses.length > 0) {
        status = 'Inprogress';
        result = 'Found Policy But Not Sucessful';
        remark =
          `[${elapsedSecPolicy}s] พบเลขกรมธรรม์ ${policyNo} แต่มีบาง Status ไม่สมบูรณ์ กรุณาตรวจสอบ | ` +
          invalidStatuses.join(' | ');

        console.log('⚠️', remark);

        await writeResult({
          no,
          applicationNo,
          status: 'Done - Please Check',
          result: 'Deposit Success',
          remark: remark.slice(0, 500),
          depositReceiptNo,
          policyNo,
        });

        alreadyWroteResult = true;

        continue;

      } else {
        status = 'Done';
        result = 'PASS';
        remark = `[${elapsedSecPolicy}s] Success`;

        console.log('✅ ออกกรมธรรม์สำเร็จ ทุก Status เป็น Pass หรือ Skip');

        await writeResult({
          no,
          applicationNo,
          status: 'Done',
          result: 'PASS',
          remark,
          depositReceiptNo,
          policyNo,
        });

        alreadyWroteResult = true;

        continue;
      }
      //============ จบ Stage 3 = Check Policy No All Done ==================


    } catch (err) {
      const errorMessage = err?.message ? String(err.message) : String(err);

      const isRunnerStopped =
        page.isClosed?.() ||
        /Target page, context or browser has been closed/i.test(errorMessage) ||
        /Test ended/i.test(errorMessage) ||
        /browser has been closed/i.test(errorMessage);

      if (isRunnerStopped) {
        console.log(`🛑 Runner stopped while processing ${applicationNo}`);
        throw err; // สำคัญ: ออกจาก while ทันที
      }

      status = 'FAIL';

      if (
        ![
          'Deposit Success',
          'Waiting Policy No',
          'พบเลขกรมธรรม์ แต่มีบาง Status ไม่สมบูรณ์ กรุณาตรวจสอบ'
        ].includes(result)
      ) {
        result = 'FAIL';
      }

      remark = errorMessage;
      console.error(`❌ Test failed for applicationNo ${applicationNo}:`, err);
    } finally {
      try {
        const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);

        if (!alreadyWroteResult) {
          await writeResult({
            no,
            applicationNo,
            status,
            result,
            remark: String(remark || '').startsWith('[')
              ? String(remark || '').slice(0, 500)
              : `[${elapsedSec}s] ${remark}`.slice(0, 500),
            depositReceiptNo,
            policyNo,
          });
        }


        console.log(`📝 Write result success: ${applicationNo} => ${status}`);
      } catch (writeErr) {
        console.error(
          `❌ Write Google Sheet failed for applicationNo ${applicationNo}:`,
          writeErr
        );
      }


      await context.close().catch(() => { });

    }
  }
});