import { test, expect } from '@playwright/test';
import writeHelpers from './data/write-result.js';
import { generateTempReceipt } from './helpers/tempReceipt.js';
const {
  waitIfPaused,
  initPauseControl,
  waitSelectCommitted,
  optionalFill,
  optionalFillTab,
  mandatoryFill,
  mandatoryFillTab
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

async function gotoLoginWithRetry(page, url) {
  const MAX_RETRY = 2; // refresh ได้ 2 ครั้ง (รวมครั้งแรก = 3 รอบ)

  for (let attempt = 0; attempt <= MAX_RETRY; attempt++) {
    console.log(`🌐 เข้า URL [รอบที่ ${attempt + 1}]`);

    await page.goto(url, { waitUntil: 'domcontentloaded' });

    try {
      // รอ #username ไม่เกิน 10 วิ
      await page.locator('#username').waitFor({
        state: 'visible',
        timeout: 10000
      });

      console.log('✅ เจอ #username แล้ว');
      return true; // ผ่าน
    } catch (err) {
      console.log(`⚠️ ไม่เจอ #username (รอบ ${attempt + 1})`);

      if (attempt === MAX_RETRY) {
        console.log('❌ retry ครบแล้ว → FAIL');
        throw new Error('Login page not loaded (#username not found)');
      }

      console.log('🔄 refresh แล้วลองใหม่...');
      await page.reload({ waitUntil: 'domcontentloaded' });
    }
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
  const RUN_CREATE_BY = 'เนม'; // 👈 วางก่อน loop (แนะนำ)



while (true) {
  const caseDatas = await fetchRunnableCases(RUN_CREATE_BY);

    if (!caseDatas.length) {
      console.log('🎉 ไม่มีเคสให้รันแล้ว');
      break;
    }

    const finalData = caseDatas[0];
    idx++;

const applicationNoKey = String(finalData.applicationNo || '').trim();

if (processedApplicationNos.has(applicationNoKey)) {
  console.log(`🛑 ข้ามใบคำขอซ้ำในรอบเดียวกัน: ${applicationNoKey}`);
  break; // หรือ continue ก็ได้ แต่แนะนำ break
}

processedApplicationNos.add(applicationNoKey);

    const {
      no,                 //ฟิลด์ No. เอาไว้ระบุว่า row ไหนใน sheet เพื่อเขียนผลกลับไปถูกต้อง
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

const riderList = Array.isArray(riders) ? riders : [];

const expectedRiderCount = Number(numRider || 0);

if (riderList.length !== expectedRiderCount) {
  throw new Error(
    `จำนวน Rider ไม่ตรง: sheet=${expectedRiderCount} | parsed=${riderList.length}`
  );
}

const benes = finalData.bene || [];

    console.log(`🚀 เริ่มรันใบคำขอที่ [${idx}] - ${applicationNo} | 🙍🏻‍♂️ ${RUN_CREATE_BY} `);

    const startTime = Date.now();
    let status = 'FAIL';
    let remark = '';
    let depositReceiptNo = '';

    const claimed = await claimCase(no, RUN_CREATE_BY);
if (!claimed) {
  console.log(`⏭️ Skip No ${no} / ${applicationNo} because row is not Ready for Test/Retest`);
  continue;
}

    const context = await browser.newContext();
    const page = await context.newPage();

    try {
     
      const tempNo = String(finalData.tempReceiptNo || '').trim();

if (!tempNo && policyType === 'ORD') {  //จะเข้าโฟลวเบิกใบรับเงินชั่วคราวต่อเมื่อเป็น ORD
  console.log('⚠️ tempReceiptNo ว่าง → run generate flow');

  const generatedTempReceiptNo = await generateTempReceipt(page, finalData);

  finalData.tempReceiptNo = generatedTempReceiptNo;

  await writeTempReceiptNo(no, generatedTempReceiptNo);

  console.log('🔓 generate temp receipt เสร็จแล้ว → logout NBS เพื่อเริ่ม flow หลักใหม่');

  await page.goto(
    environment === 'SIT'
      ? 'https://sitnbs.thaisamut.co.th/nbsweb/secure/logout.html'
      : 'https://uatnbs.thaisamut.co.th/nbsweb/secure/logout.html',
    { waitUntil: 'domcontentloaded' }
  );

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
(applicationFormCode === '02052'&&  policyType === 'ORD') {
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

    // Function to get the current date in Thai Buddhist year format
    function getThaiBuddhistDate(date = new Date()) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear() + 543;
  return `${day}/${month}/${year}`;
  }

  const currentDate = getThaiBuddhistDate();

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

  const agentParts = agentNamePart.split(' ').filter(Boolean);
  const agentFirstName = agentParts.slice(0, -1).join(' ') || '';
  const agentLastName = agentParts.slice(-1).join('') || '';

  console.log('agentFirstName =', agentFirstName);
  console.log('agentLastName =', agentLastName);

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

  // =============
  // ที่อยู่ปัจจุบัน
  // =============
  // // ===== เงื่อนไข: ถ้า "ที่อยู่ปัจจุบัน ไม่ใช่ ที่อยู่ตามทะเบียนบ้าน"  =====
  await mandatoryFill(page, currentUseAddressType, '#currentUseAddressTypeCode', 'ที่อยู่ปัจจุบัน-ใช้ตามที่อยู่');
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
  // ===== เงื่อนไข: ถ้า "สถานที่ทำงาน ไม่ใช่ ที่อยู่ตามทะเบียนบ้าน หรือที่อยู่ปัจจุบัน"  =====
  await mandatoryFillTab(page, workUseAddressType, '#workUseAddressTypeCode', 'สถานที่ทำงาน-ใช้ตามที่อยู่');

  if (
    workUseAddressType !== 'ที่อยู่ตามทะเบียนบ้านของผู้เอาประกัน' &&
    workUseAddressType !== 'ที่อยู่ปัจจุบันของผู้เอาประกัน'
  ) {
    console.log('🏛 ระบุสถานที่ทำงานเอง');

  await optionalFill(page, workPlaceName, '#companyName', 'สถานที่ทำงาน-ชื่อสถานที่ทำงาน');
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
      const emailInput = page.locator('#registerEmail');
    
      await emailInput.click();
      await emailInput.fill(emailVal);
    
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
      // await expect(page.getByText('กรุณารอสักครู่...')).toBeVisible({ timeout: 60000 });
      // await expect(page.getByText('กรุณารอสักครู่...')).not.toBeVisible({ timeout: 60000 });

      await waitOptionalLoading(page);

      await page.getByRole('textbox', { name: 'จำนวนเงินเอาประกันภัย *' }).type(insuredAmount, { delay: 100 });
      await page.waitForTimeout(1000);
      await page.getByRole('textbox', { name: 'จำนวนเงินเอาประกันภัย *' }).press('Tab');
      // await page.waitForTimeout(3000);
      // await expect(page.getByText('กรุณารอสักครู่...')).toBeVisible({ timeout: 60000 });
      // await expect(page.getByText('กรุณารอสักครู่...')).not.toBeVisible({ timeout: 60000 });
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
    // await page.getByRole('textbox', { name: 'งวดการชำระ *' }).click();
    // await page.getByRole('textbox', { name: 'งวดการชำระ *' }).fill(paymentPeriod);
    // await page.getByRole('textbox', { name: 'งวดการชำระ *' }).press('Tab');
    //await page.waitForTimeout(5000);


    
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

  // await page.waitForTimeout(1000);
  // await page.getByText('กรุณาเลือก').click();

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
      // await page.getByRole('textbox', { name: 'เลขที่ใบรับเงินชั่วคราว *' }).click();
      // await page.getByRole('textbox', { name: 'เลขที่ใบรับเงินชั่วคราว *' }).fill(tempReceiptNo);
      // await page.getByRole('textbox', { name: 'เลขที่ใบรับเงินชั่วคราว *' }).press('Tab');

      const finalTempReceiptNo = String(finalData.tempReceiptNo || tempReceiptNo || '').trim();

  await page.getByRole('textbox', { name: 'เลขที่ใบรับเงินชั่วคราว *' }).click();
  await page.getByRole('textbox', { name: 'เลขที่ใบรับเงินชั่วคราว *' }).fill(finalTempReceiptNo);
  await page.getByRole('textbox', { name: 'เลขที่ใบรับเงินชั่วคราว *' }).press('Tab');

      await page.waitForTimeout(1000);
      await page.getByText('โอนเงินเจ้าของบัญชีเงินฝาก').first().click();

     await mandatoryFillTab(page,'ธนาคารกรุงเทพ', '#payinBankAccountCode','ธนาคารโอน');
     await mandatoryFill(page,'ออโตเมทดาต้า', '#payinBranch','สาขาโอน');
     await mandatoryFill(page,'1234567890', '#bankAccountNo','เลขที่บัญชีโอน');

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
  const totalAmount = (
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

} 
else if  // ===== FLOW PA รหัสใบคำขอ PST-P08-0012 =====
(applicationFormCode === 'PST-P08-0012'&&  policyType === 'PA') {

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

  // Function to get the current date in Thai Buddhist year format
  function getThaiBuddhistDate(date = new Date()) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear() + 543;
  return `${day}/${month}/${year}`;
  }

  const currentDate = getThaiBuddhistDate();

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

  const agentParts = agentNamePart.split(' ').filter(Boolean);
  const agentFirstName = agentParts.slice(0, -1).join(' ') || '';
  const agentLastName = agentParts.slice(-1).join('') || '';

  console.log('agentFirstName =', agentFirstName);
  console.log('agentLastName =', agentLastName);

  //  // Category รหัสสถาบัน/ คู่ค้า
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
  //  await page.waitForTimeout(300);


  // // // ===== สถานภาพ =====
  // await mandatoryFillTab(page, maritalStatus, '#maritalStatusCode', 'สถานภาพ');

  // // ===== เงื่อนไข: ถ้า "สมรส" =====
  // if (String(maritalStatus).trim() === 'สมรส') {

  // console.log('💍 พบสถานภาพสมรส → กรอกข้อมูลคู่สมรส');

  // // // ---- spousePrefix (React select) ----
  // await mandatoryFillTab(page, spousePrefix, '#spouseTitleCode', 'คำนำหน้าคู่สมรส');
  // await mandatoryFill(page, spouseName, '#spouseName', 'ชื่อคู่สมรส');
  // await optionalFill(page, spouseSurname, '#spouseSurname', 'นามสกุลคู่สมรส');
  
  // }
    // =============
    // ที่อยู่ตามทะเบียนบ้าน
    // =============
    // await page.locator('#registerHouseNo').click();
    // await fillAndVerify(page.locator('#registerHouseNo'), registerHouseNo, {
    //   label: 'เลขที่บ้าน',
    //   matchMode: 'exact',
    // });
  await mandatoryFill(page, registerHouseNo, '#registerHouseNo', 'ที่อยู่ตามทะเบียนบ้าน-เลขที่');
  await optionalFill(page, registerMoo, '#registerVillage', 'ที่อยู่ตามทะเบียนบ้าน-หมู่ที่');
  await optionalFill(page, registerVillage, '#registerBuilding', 'ที่อยู่ตามทะเบียนบ้าน-หมู่บ้าน/อาคาร');    
  await optionalFill(page, registerSoi, '#registerAlley', 'ที่อยู่ตามทะเบียนบ้าน-ตรอก/ซอย');
  await optionalFill(page, registerRoad, '#registerRoad', 'ที่อยู่ตามทะเบียนบ้าน-ถนน');    
  await mandatoryFillTab(page, registerProvince, '#registerProvinceCode', 'ที่อยู่ตามทะเบียนบ้าน-จังหวัด');
  await mandatoryFillTab(page, registerDistrict, '#registerDistrictCode', 'ที่อยู่ตามทะเบียนบ้าน-อำเภอ/เขต');    
  await mandatoryFillTab(page, registerSubDistrict, '#registerSubDistrictCode', 'ที่อยู่ตามทะเบียนบ้าน-ตำบล/แขวง');    

  // =============
  // ที่อยู่ปัจจุบัน
  // =============
  // // ===== เงื่อนไข: ถ้า "ที่อยู่ปัจจุบัน ไม่ใช่ ที่อยู่ตามทะเบียนบ้าน"  =====
  await mandatoryFill(page, currentUseAddressType, '#currentUseAddressTypeCode', 'ที่อยู่ปัจจุบัน-ใช้ตามที่อยู่');
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

  // // =============
  // // สถานที่ทำงาน
  // // =============
  // // ===== เงื่อนไข: ถ้า "สถานที่ทำงาน ไม่ใช่ ที่อยู่ตามทะเบียนบ้าน หรือที่อยู่ปัจจุบัน"  =====
  // await mandatoryFillTab(page, workUseAddressType, '#workUseAddressTypeCode', 'สถานที่ทำงาน-ใช้ตามที่อยู่');

  // if (
  //   workUseAddressType !== 'ที่อยู่ตามทะเบียนบ้านของผู้เอาประกัน' &&
  //   workUseAddressType !== 'ที่อยู่ปัจจุบันของผู้เอาประกัน'
  // ) {
  //   console.log('🏛 ระบุสถานที่ทำงานเอง');

  // await optionalFill(page, workPlaceName, '#companyName', 'สถานที่ทำงาน-ชื่อสถานที่ทำงาน');
  // await optionalFill(page, workHouseNo, '#workHouseNo', 'สถานที่ทำงาน-เลขที่');
  // await optionalFill(page, workMoo, '#workVillage', 'สถานที่ทำงาน-หมู่ที่');
  // await optionalFill(page, workVillage, '#workBuilding', 'สถานที่ทำงาน-หมู่บ้าน/อาคาร');
  // await optionalFill(page, workSoi, '#workAlley', 'สถานที่ทำงาน-ตรอก/ซอย');
  // await optionalFill(page, workRoad, '#workRoad', 'สถานที่ทำงาน-ถนน');  

  //   // สถานที่ทำงาน-จังหวัด
  // const workProvinceVal = String(workProvince || '').trim();

  // if (workProvinceVal !== '') {
  //   const workProvinceInput = page.locator('#workProvinceCode');

  //   await workProvinceInput.waitFor({ state: 'visible', timeout: 5000 });
  //   await workProvinceInput.click();
  //   await workProvinceInput.fill(workProvinceVal);
  //   await workProvinceInput.press('Tab');

  //   await waitSelectCommitted(workProvinceInput, 'จังหวัดสถานที่ทำงาน', 10000);
  // }

  // // สถานที่ทำงาน-อำเภอ/เขต
  // const workDistrictVal = String(workDistrict || '').trim();

  // if (workDistrictVal !== '') {
  //   const workProvinceInputCheck = page.locator('#workProvinceCode');

  //   await waitSelectCommitted(workProvinceInputCheck, 'จังหวัดสถานที่ทำงาน', 10000);

  //   const workDistrictInput = page.locator('#workDistrictCode');
  //   await workDistrictInput.waitFor({ state: 'visible', timeout: 5000 });
  //   await workDistrictInput.click();
  //   await workDistrictInput.fill(workDistrictVal);
  //   await workDistrictInput.press('Tab');

  //   await waitSelectCommitted(workDistrictInput, 'อำเภอ/เขตสถานที่ทำงาน', 10000);
  // }

  // // สถานที่ทำงาน-ตำบล/แขวง
  // const workSubDistrictVal = String(workSubDistrict || '').trim();

  // if (workSubDistrictVal !== '') {
  //   const workDistrictInputCheck = page.locator('#workDistrictCode');

  //   await waitSelectCommitted(workDistrictInputCheck, 'อำเภอ/เขตสถานที่ทำงาน', 10000);

  //   const workSubDistrictInput = page.locator('#workSubDistrictCode');
  //   await workSubDistrictInput.waitFor({ state: 'visible', timeout: 5000 });
  //   await workSubDistrictInput.click();
  //   await workSubDistrictInput.fill(workSubDistrictVal);
  //   await workSubDistrictInput.press('Tab');

  //   await waitSelectCommitted(workSubDistrictInput, 'ตำบล/แขวงสถานที่ทำงาน', 10000);
  // }
  // }

  // =============
  // สถานที่สะดวกในการติดต่อและส่งเอกสาร
  // =============
    // await page.getByRole('radio', { name: 'ที่อยู่ปัจจุบัน ' }).click();

  // const contactPlaceTypeVal = String(contactPlaceType || '').trim();

  // let contactFlagValue = '';

  // if (contactPlaceTypeVal === 'ที่อยู่ตามทะเบียนบ้าน') {
  //   contactFlagValue = 'REG';
  // } else if (contactPlaceTypeVal === 'ที่อยู่ปัจจุบัน') {
  //   contactFlagValue = 'CON';
  // } 
  // // else if (contactPlaceTypeVal === 'สถานที่ทำงาน') {
  // //   contactFlagValue = 'WRK';
  // // } 
  // else {
  //   throw new Error(`❌ contactPlaceType ไม่ถูกต้อง: ${contactPlaceTypeVal}`);
  // }

  // const contactRadioInput = page.locator(`input[name="contactFlag"][value="${contactFlagValue}"]`);
  // await contactRadioInput.waitFor({ state: 'attached', timeout: 5000 });

  // // ✅ click ที่ label ครอบ input แทน input ตรง ๆ
  // const contactRadioLabel = contactRadioInput.locator('xpath=ancestor::label[1]');
  // await contactRadioLabel.click({ force: true });

  // await page.waitForTimeout(300);

  // // ✅ verify ว่าติดจริง
  // const checked = await contactRadioInput.isChecked();
  // if (!checked) {
  //   throw new Error(`❌ เลือกสถานที่สะดวกในการติดต่อไม่สำเร็จ: ${contactPlaceTypeVal} (${contactFlagValue})`);
  // }

  // console.log(`✅ เลือกสถานที่สะดวกในการติดต่อ: ${contactPlaceTypeVal}`);

  // //============
  //   await page.waitForTimeout(400);

  // await mandatoryFill(page, mobilePhone, '#currentMobileNo', 'โทรศัพท์มือถือ');
  // await optionalFill(page, homePhone, '#currentHomePhoneNo', 'โทรศัพท์บ้าน');
  // await optionalFillTab(page, workPhone, '#currentWorkPhoneNo', 'โทรศัพท์ที่ทำงาน');
  // await optionalFillTab(page, workPhoneExt, '#currentWorkPhoneNoExt', 'ต่อ');
  await optionalFill(page, homePhone, '#currentHomePhoneNo', 'โทรศัพท์บ้าน ปัจจุบัน');

  await mandatoryFill(page, mobilePhone, '#registerMobileNo', 'โทรศัพท์มือถือ');
  await optionalFill(page, homePhone, '#registerHomePhoneNo', 'โทรศัพท์บ้าน ทะเบียนบ้าน');
  
  // await optionalFillTab(page, workPhone, '#currentHomePhoneNo', 'โทรศัพท์ที่ทำงาน');
    // Email
    // const emailVal = String(email || '').trim();

    // if (emailVal !== '') {
    //   // const emailInput = page.getByText('อีเมล').nth(1);
    // const emailInput = page.locator('#registerEmail');
    //   await emailInput.click();
    //   await emailInput.fill(emailVal);
    
    //   await page.waitForTimeout(500);
    // }
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
    // await optionalFillTab(page, businessType, '#currentBusinessTypeDesc', 'ลักษณะธุรกิจ');
    await mandatoryFillTab(page, annualIncome, '#currentIncomePerYear', 'รายได้ต่อปี');

  // =============
  // ท่านใช้รถจักรยานยนต์ในการทำงานหรือไม่ 
  // =============
  //  // ใช้รถจักรยานยนต์
  //     const useMotorcycleVal = String(useMotorcycle || '').trim();

  //     let motorcycleValue = '';

  //     if (useMotorcycleVal === 'ใช้') {
  //       motorcycleValue = 'Y';
  //     } else if (useMotorcycleVal === 'ไม่ใช้') {
  //       motorcycleValue = 'N';
  //     } else {
  //       throw new Error(`❌ useMotorcycle ไม่ถูกต้อง: ${useMotorcycleVal}`);
  //     }

  //     const motorcycleInput = page.locator(`input[name="motorcycleWork"][value="${motorcycleValue}"]`);
  //     await motorcycleInput.waitFor({ state: 'attached', timeout: 5000 });

  //     // MUI radio ให้กด label ครอบ input แทน
  //     const motorcycleLabel = motorcycleInput.locator('xpath=ancestor::label[1]');
  //     await motorcycleLabel.click({ force: true });

  //     await page.waitForTimeout(300);

  //     if (!(await motorcycleInput.isChecked())) {
  //       throw new Error(`❌ เลือกใช้รถจักรยานยนต์ไม่สำเร็จ: ${useMotorcycleVal}`);
  //     }

  //     console.log(`✅ เลือกใช้รถจักรยานยนต์: ${useMotorcycleVal}`);
    
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
      // await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).click();
      // await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).type(policyName, { delay: 100 });
      // await page.waitForTimeout(1000);
      // await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).press('Tab');
      // await page.waitForTimeout(1000);

      const policyNameInput = page.getByRole('textbox', {  name: 'ชื่อแบบประกันภัย *',  });

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
      // await expect(page.getByText('กรุณารอสักครู่...')).toBeVisible({ timeout: 60000 });
      // await expect(page.getByText('กรุณารอสักครู่...')).not.toBeVisible({ timeout: 60000 });

      await waitOptionalLoading(page);

      // await page.getByRole('textbox', { name: 'ทุนประกันภัย *' }).type(insuredAmount, { delay: 100 });
      // await page.waitForTimeout(1000);
      // await page.getByRole('textbox', { name: 'ทุนประกันภัย *' }).press('Tab');
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
      // const premiumVal = String(premium || '').trim();

      // const compensationInput = page.getByRole('textbox', {
      //   name: 'ทุนชดเชย *',
      // });

      // if (premiumVal !== '') {

      //   await compensationInput.click();

      //   // ===== กรณี Any =====
      //   if (premiumVal.toLowerCase() === 'any') {

      //     console.log('ℹ️ premium = Any → เลือกรายการแรก');

      //     await page.waitForTimeout(500);

      //     await page.keyboard.press('ArrowDown');
      //     await page.waitForTimeout(300);

      //     await page.keyboard.press('Enter');
      //     await page.waitForTimeout(500);

      //   }

      //   // ===== กรณีมีค่าปกติ =====
      //   else {

      //     await compensationInput.type(premiumVal, {
      //       delay: 100,
      //     });

      //     await page.waitForTimeout(1000);

      //     await compensationInput.press('Tab');
      //   }
      // }
      // else {

      //   console.log('ℹ️ ไม่มีการระบุทุนชดเชย');

      // }
      //===================
      // ระบุทุดชดเชย
      //==================
      const premiumVal = String(premium || '').trim();

      const compensationInput = page.getByRole('textbox', {
        name: 'ทุนชดเชย *',
      });

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

    const compensationContainer = compensationInput.locator(
      'xpath=ancestor::div[contains(@class,"css-1phiq9s-container")][1]'
    );

    currentValue = await compensationContainer
      .locator('div[class*="singleValue"]')
      .first()
      .innerText()
      .catch(() => '');
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
      // await page.waitForTimeout(3000);
      // await expect(page.getByText('กรุณารอสักครู่...')).toBeVisible({ timeout: 60000 });
      // await expect(page.getByText('กรุณารอสักครู่...')).not.toBeVisible({ timeout: 60000 });
      await waitOptionalLoading(page);

      // await page.getByRole('textbox', { name: 'งวดการชำระ *' }).click();
      // await page.getByRole('textbox', { name: 'งวดการชำระ *' }).type(paymentPeriod, { delay: 100 });
      // await page.getByRole('textbox', { name: 'งวดการชำระ *' }).press('Tab');
      // await page.waitForTimeout(1000);
      //แบบประกันหายเลือกกดอีกครั้ง
      // await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).click();
      // await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).type(policyName, { delay: 100 });
      // await page.waitForTimeout(1000);
      // await page.getByRole('textbox', { name: 'ชื่อแบบประกันภัย *' }).press('Tab');
      // await page.waitForTimeout(1000);
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
  // await page.getByRole('textbox', { name: 'ความสัมพันธ์ *' }).click();
  // await page.getByRole('textbox', { name: 'ความสัมพันธ์ *' }).fill(beneItem.beneRela);
  // await page.getByRole('textbox', { name: 'ความสัมพันธ์ *' }).press('Tab');
  
  await mandatoryFillTab(page, beneItem.beneRela, '#beneficiaryRelationCode', 'ความสัมพันธ์ผู้รับประโยชน์');
  await page.waitForTimeout(500);
  // คำนำหน้า
  // await page.getByRole('textbox', { name: 'คำนำหน้า *' }).click();
  // await page.getByRole('textbox', { name: 'คำนำหน้า *' }).fill(beneItem.benePrefix);
  // await page.getByRole('textbox', { name: 'คำนำหน้า *' }).press('Tab');

  await mandatoryFillTab(page, beneItem.benePrefix, '#beneficiaryTitleCode', 'คำนำหน้าผู้รับประโยชน์');
  await page.waitForTimeout(500);

  // ชื่อ
  // await page.getByRole('textbox', { name: 'ชื่อ *' }).click();
  // await page.getByRole('textbox', { name: 'ชื่อ *' }).fill(beneItem.beneName);
  await mandatoryFillTab(page, beneItem.beneName, '#beneficiaryName', 'ชื่อผู้รับประโยชน์');
  await page.waitForTimeout(500);

  // นามสกุล
  // await page.getByLabel('จัดการผู้รับประโยชน์').locator('div').filter({ hasText: /^นามสกุล$/ }).nth(1).click();
  // await page.getByRole('textbox', { name: 'นามสกุล', exact: true }).fill(beneItem.beneSurname);
  await optionalFillTab(page, beneItem.beneSurname, '#beneficiarySurname', 'นามสกุลผู้รับประโยชน์');
  await page.waitForTimeout(500);

  // อายุ
  // await page.getByRole('textbox', { name: 'อายุ *' }).click();
  // await page.getByRole('textbox', { name: 'อายุ *' }).fill(beneItem.beneAge);
  await mandatoryFillTab(page, beneItem.beneAge, '#beneficiaryAge', 'อายุผู้รับประโยชน์');
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
    // await page.getByText('เลือกคำแถลงเป็น ไม่เคย/ไม่มี/ไม่เปลี่ยน/ไม่เป็น/ไม่สูบ/ไม่ดื่ม ทั้งหมด').first().click();
    // await page.waitForTimeout(1000);

    // await page.getByText('เลือกการรับรองสถานะและคำยินยอมและตกลงปฏิบัติตามกฎหมาย FATCA ไม่มี/ไม่เป็น').first().click();
    // await page.waitForTimeout(1000);
    // await page.getByText('ไม่มีความประสงค์').first().click();
    // await page.waitForTimeout(1000);
    // await page.getByText('ไม่ยินยอม').first().click();
    // await page.waitForTimeout(1000);
   console.log('🩺 เลือกคำแถลงทั้งหมด');

  // ข้อ 4 → ไม่มี
  await page
    .locator('input[name="insureHistoryCompanyAnswer"]')
    .first()
    .check({ force: true });
  
  // ข้อ 5 → ไม่เคย
  await page
    .locator('input[name="paHealthDeclarationAnswer"]')
    .first()
    .check({ force: true });
  
  // ภาษี → ไม่มีความประสงค์
  await page
    .locator('input[name="taxAnswer"]')
    .nth(1)
    .check({ force: true });
  
  // การตลาด → ไม่ยินยอม
  await page
    .locator('input[name="consentAnswer"]')
    .nth(1)
    .check({ force: true });
  
  await page.waitForTimeout(500);
  
  console.log('✅ เลือกคำแถลงเรียบร้อย');



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

} 
else if  // ===== FLOW IND รหัสใบคำขอ 02052 =====
(applicationFormCode === '02052'&&  policyType === 'IND') {

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

  // Function to get the current date in Thai Buddhist year format
  function getThaiBuddhistDate(date = new Date()) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear() + 543;
  return `${day}/${month}/${year}`;
  }

  const currentDate = getThaiBuddhistDate();

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

  const agentParts = agentNamePart.split(' ').filter(Boolean);
  const agentFirstName = agentParts.slice(0, -1).join(' ') || '';
  const agentLastName = agentParts.slice(-1).join('') || '';

  console.log('agentFirstName =', agentFirstName);
  console.log('agentLastName =', agentLastName);



  //  // Category รหัสสถาบัน/ คู่ค้า
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


  // // ===== สถานภาพ =====
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
    // await page.locator('#registerHouseNo').click();
    // await fillAndVerify(page.locator('#registerHouseNo'), registerHouseNo, {
    //   label: 'เลขที่บ้าน',
    //   matchMode: 'exact',
    // });
  await mandatoryFill(page, registerHouseNo, '#registerHouseNo', 'ที่อยู่ตามทะเบียนบ้าน-เลขที่');
  await optionalFill(page, registerMoo, '#registerVillage', 'ที่อยู่ตามทะเบียนบ้าน-หมู่ที่');
  await optionalFill(page, registerVillage, '#registerBuilding', 'ที่อยู่ตามทะเบียนบ้าน-หมู่บ้าน/อาคาร');    
  await optionalFill(page, registerSoi, '#registerAlley', 'ที่อยู่ตามทะเบียนบ้าน-ตรอก/ซอย');
  await optionalFill(page, registerRoad, '#registerRoad', 'ที่อยู่ตามทะเบียนบ้าน-ถนน');    
  await mandatoryFillTab(page, registerProvince, '#registerProvinceCode', 'ที่อยู่ตามทะเบียนบ้าน-จังหวัด');
  await mandatoryFillTab(page, registerDistrict, '#registerDistrictCode', 'ที่อยู่ตามทะเบียนบ้าน-อำเภอ/เขต');    
  await mandatoryFillTab(page, registerSubDistrict, '#registerSubDistrictCode', 'ที่อยู่ตามทะเบียนบ้าน-ตำบล/แขวง');    

  // =============
  // ที่อยู่ปัจจุบัน
  // =============
  // // ===== เงื่อนไข: ถ้า "ที่อยู่ปัจจุบัน ไม่ใช่ ที่อยู่ตามทะเบียนบ้าน"  =====
  await mandatoryFill(page, currentUseAddressType, '#currentUseAddressTypeCode', 'ที่อยู่ปัจจุบัน-ใช้ตามที่อยู่');
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
  // ===== เงื่อนไข: ถ้า "สถานที่ทำงาน ไม่ใช่ ที่อยู่ตามทะเบียนบ้าน หรือที่อยู่ปัจจุบัน"  =====
  await mandatoryFillTab(page, workUseAddressType, '#workUseAddressTypeCode', 'สถานที่ทำงาน-ใช้ตามที่อยู่');

  if (
    workUseAddressType !== 'ที่อยู่ตามทะเบียนบ้านของผู้เอาประกัน' &&
    workUseAddressType !== 'ที่อยู่ปัจจุบันของผู้เอาประกัน'
  ) {
    console.log('🏛 ระบุสถานที่ทำงานเอง');

  await optionalFill(page, workPlaceName, '#companyName', 'สถานที่ทำงาน-ชื่อสถานที่ทำงาน');
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
    // await page.getByRole('radio', { name: 'ที่อยู่ปัจจุบัน ' }).click();

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
      const emailInput = page.locator('#registerEmail');
    
      await emailInput.click();
      await emailInput.fill(emailVal);
    
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
      // await expect(page.getByText('กรุณารอสักครู่...')).toBeVisible({ timeout: 60000 });
      // await expect(page.getByText('กรุณารอสักครู่...')).not.toBeVisible({ timeout: 60000 });

      await waitOptionalLoading(page);

      await page.getByRole('textbox', { name: 'จำนวนเงินเอาประกันภัย *' }).type(insuredAmount, { delay: 100 });
      await page.waitForTimeout(1000);
      await page.getByRole('textbox', { name: 'จำนวนเงินเอาประกันภัย *' }).press('Tab');
      // await page.waitForTimeout(3000);
      // await expect(page.getByText('กรุณารอสักครู่...')).toBeVisible({ timeout: 60000 });
      // await expect(page.getByText('กรุณารอสักครู่...')).not.toBeVisible({ timeout: 60000 });
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
    // await page.getByRole('textbox', { name: 'งวดการชำระ *' }).click();
    // await page.getByRole('textbox', { name: 'งวดการชำระ *' }).fill(paymentPeriod);
    // await page.getByRole('textbox', { name: 'งวดการชำระ *' }).press('Tab');
    //await page.waitForTimeout(5000);


    
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

  // await page.waitForTimeout(1000);
  // await page.getByText('กรุณาเลือก').click();

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

  // const riderAmountInput = page.getByRole('textbox', {
  //   name: 'ทุนประกันภัย/แผนความคุ้มครอง *',
  // });

  // await riderAmountInput.click();
  // await riderAmountInput.fill(riderAmount);
  // await riderAmountInput.press('Tab');

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

  // await addBtn.click();
  // await page.waitForTimeout(1000);

  // addedRiderCount++;

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
     
  //       console.log(`จำนวนสัญญาเพิ่มเติมทั้งหมด: ${displayedRiders.length} รายการ`);
  // displayedRiders.forEach((rider, index) => {
  //         console.log(`Rider ตัวที่ ${index + 1}: ${rider.name}`);
  //         console.log(`  - จำนวนเงินเอาประกันภัย: ${rider.money}`);
  //         console.log(`  - เบี้ยประกันภัย: ${rider.premium}`);
  //         console.log(`  - เบี้ยเพิ่มพิเศษ: ${rider.spePremium}`);
  //         console.log(`  - ค่าบำเหน็จ: ${rider.commis}`);
  //       });
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
    //Error Premium Check
    //const cells = await page.$$eval('td.MuiTableCell-root.MuiTableCell-body', els => els.map(e => e.innerText));
    //console.log(JSON.stringify(cells, null, 2));

    //แสดงแค่บางอัน 290 more items
    //const supermapone = await page.locator('td.MuiTableCell-body.MUIDataTableBodyCell-root-58').allTextContents();
    //console.log('ค่าเบี้ยทั้งหมด:td.MuiTableCell-root.MuiTableCell-body.MUIDataTableBodyCell-root-58', supermapone);

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
  await mandatoryFillTab(page,'ธนาคารกรุงเทพ', '#payinBankAccountCode','ธนาคารโอน');
  await mandatoryFill(page,'ออโตเมทดาต้า', '#payinBranch','สาขาโอน');
  await mandatoryFill(page,'1234567890', '#bankAccountNo','เลขที่บัญชีโอน');
   
  

    
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
  const totalAmount = (
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

} 
else {

  throw new Error(
    `❌ applicationFormCode ไม่รองรับ: ${applicationFormCode}`
  );
}
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
    await page.getByText('เลือก').first().click();
    await page.waitForTimeout(500);
    // กำหนดเงื่อนไขเพื่อคลิกที่ข้อความที่ถูกต้องตามค่า partnerNo
    if (partnerNo === '8500001') {
      await page.getByText('850-0001 : Digital Sales').first().click();
    } else if (partnerNo === '8100001') {
      await page.getByText('810-0001 : ฝ่ายธุรกิจสถาบัน').first().click();
    } else if (partnerNo === '8290001') {
      await page.getByText('829-0001 : Worksite (ALT2)').first().click();
    }
    await page.waitForTimeout(200);
    await page.getByText('เลือก').first().click();
    await page.waitForTimeout(500);


    //ระบุตัวแทนในรับฝาก ใหม่
  await page.getByText('ตัวแทน').first().click();
  await page.waitForTimeout(200);
  await page.getByRole('textbox', { name: 'กรุณาระบุ' }).first().click();
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
    : policyType === 'PA'
    ? 'อุบัติเหตุ'
    : policyType === 'IND'
    ? 'อุตสาหกรรม'
    : '';

    if (!policyTypeText) {
    throw new Error(`❌ policyType ไม่รองรับ: ${policyType}`);
    }

    await page.locator('#policyTypeSearch').nth(1).fill(policyTypeText);

    // await page.locator('#policyTypeSearch').nth(1).fill('สามัญ');

    await page.locator('#policyTypeSearch').nth(1).press('Tab');
    await page.getByRole('region').filter({ hasText: 'เหตุผลที่รับฝาก *เคสใหม่ประเภทข้อมูล *ใบคำขอประเภทกรมธรรม์ * option สามัญ,' }).getByRole('textbox').nth(3).click();
    await page.getByRole('region').filter({ hasText: 'เหตุผลที่รับฝาก *เคสใหม่ประเภทข้อมูล *ใบคำขอประเภทกรมธรรม์ *สามัญเลขที่ใบคำขอ * ' }).getByRole('textbox').nth(3).fill(applicationNo); //ใส่เลขใบคำขอ
    await page.getByRole('button', { name: 'ค้นหา', exact: true }).click();
    await page.waitForTimeout(600);
    await page.getByRole('button', { name: 'ยืนยัน' }).click();
    await page.getByText('เลือก').first().click();


    // สมมติว่า policyName มีค่าคือ "A19 - โอเชี่ยนไลฟ์ โอชิ แพลน 18/10"
    // ใบรับฝากคือ policyName มีค่าคือ "A19 : โอเชี่ยนไลฟ์ โอชิ แพลน 18/10"
    let newPolicyName = policyName.replace(' - ', ' : ');

    await page.locator('#planCode').nth(1).fill(newPolicyName); //ใส่แบบประกัน
    await page.locator('#planCode').nth(1).press('Tab');
    await page.locator('div:nth-child(8) > .MuiFormControl-root > .MuiInputBase-root > .MuiInputBase-input').click();
     await page.locator('.MuiInputBase-root.MuiInput-root.MuiInput-underline.MuiInputBase-fullWidth.MuiInput-fullWidth.Mui-focused > .MuiInputBase-input').fill(totalAmount);
    await page.locator('.MuiInputBase-root.MuiInput-root.MuiInput-underline.MuiInputBase-fullWidth.MuiInput-fullWidth.Mui-focused > .MuiInputBase-input').press('Tab');
    await page.waitForTimeout(1000);
    await page.getByText('เลือก').click();
    await page.locator('#customerTitle').nth(1).fill(cusTitlePrefix); //ใส่คำนำหน้าชื่อ
    await page.locator('#customerTitle').nth(1).press('Tab');
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
    console.log(`🛑 Runner stopped while processing ${applicationNo}`);
    throw err; // สำคัญ: ออกจาก while ทันที
  }

  status = 'FAIL';
  remark = errorMessage;
  console.error(`❌ Test failed for applicationNo ${applicationNo}:`, err);
} finally {
      try {
        const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);

       await writeResult({
  no,
  applicationNo,
  status,
  remark: `[${elapsedSec}s] ${remark}`.slice(0, 500),
  depositReceiptNo
});

        console.log(`📝 Write result success: ${applicationNo} => ${status}`);
      } catch (writeErr) {
        console.error(
          `❌ Write Google Sheet failed for applicationNo ${applicationNo}:`,
          writeErr
        );
      }

// await page.close().catch(() => {});
      await context.close().catch(() => {});

    }
  }
});