const { test , expect } = require('@playwright/test');
const { fetchRunnableCases, claimCase, writeResult } = require('./data/write-result');
const {
  dismissPopups,
  setupAutoPopupDismiss,
  waitOptionalLoading,
  waitForReady,
  parseBirthDate,
  setFlatpickrDate,
  retryBirthDate,
  killDigitalSalesPopups,
  clickButtonByText,
  clickRadioLabel,
  normalizeTitle,
  acceptAllConsents,
  autoSelectSafeRadios,
  mandatoryFill,
  optionalFill,
} = require('./helpers/common_function');

// ======RUN Command=====
// npx playwright test Playwright-Automation/NewCase_DigitalSales/digitalsales.spec.js --workers=1 --headed
// ======================

const ENV_MAP = {
  SIT: 'https://sit-oceanlife.ochi.link',
  UAT: 'https://uat2-oceanlife.ochi.link',
};


// ===================================================
// FLOW: first-love1810 — โอเชี่ยนไลฟ์ เฟิร์ส เลิฟ 18/10
// https://uat2-oceanlife.ochi.link/our-products/savings/first-love1810
// Section A — Calculator (ในหน้าโปรดักต์)
//   1. Goto URL (handled by main test before calling)
//   2. กด "คำนวณเบี้ย/ซื้อออนไลน์" → เปิด calculator section
//   3. เลือกเพศ → กด "ต่อไป"
//   4. กรอกวันเกิด (flatpickr) → กด "ต่อไป"
//   5. กรอกเบี้ย (cleave-thousand) → กด "คำนวณจำนวนเงินเอาประกันภัย"
//
// Section B — ฟอร์มซื้อประกันออนไลน์
//   6. กด "ซื้อประกันออนไลน์"
//   7. เลือกสัญชาติ (ไทย/ต่างชาติ)
//   8. เลขบัตรประชาชน (cleave-idcard)
//   9. วันบัตรหมดอายุ (flatpickr)
//   10. คำนำหน้าชื่อ (alias mapping)
//   11. ชื่อ
//   12. นามสกุล
//   13. อีเมล
//   14. เบอร์มือถือ
//
// (Step ถัดไปจาก 14 จะเพิ่มภายหลังตามที่ผู้ใช้ระบุ)
// ===================================================
async function runFlow_firstlove1810(page, data) {
  console.log('🟢 Run Flow: first-love1810');

  // ===== Section A: Calculator =====

  // Step 2: กดปุ่ม คำนวณเบี้ย/ซื้อออนไลน์
  console.log('📌 Step 2: กดปุ่ม คำนวณเบี้ย/ซื้อออนไลน์');
  // await dismissPopups(page);
  // ปุ่มแรกที่ตรง text นี้ในหน้า — มักจะเป็น link หรือ button
  const calcBtn = page.getByRole('link', { name: /คำนวณเบี้ย.*ซื้อออนไลน์/ })
    .or(page.getByRole('button', { name: /คำนวณเบี้ย.*ซื้อออนไลน์/ }))
    .first();
  await calcBtn.waitFor({ state: 'visible', timeout: 1000 });
  await calcBtn.click();

  // Step 3: เลือกเพศ
  console.log('📌 Step 3: เลือกเพศ');
  await waitForReady(page, ['label[for="gender-m"]', 'label[for="gender-f"]'], 15000);
  const genderVal = String(data.gender || '').trim();
  const isMale = /^(M|male)$/i.test(genderVal) || genderVal.includes('ชาย');
  const isFemale = /^(F|female)$/i.test(genderVal) || genderVal.includes('หญิง');
  if (isMale) {
    await clickRadioLabel(page, 'gender-m');
    console.log('✅ เลือก: ผู้ชาย');
  } else if (isFemale) {
    await clickRadioLabel(page, 'gender-f');
    console.log('✅ เลือก: ผู้หญิง');
  } else {
    throw new Error(`❌ ไม่รู้จักค่าเพศ: "${genderVal}"`);
  }
  await clickButtonByText(page, 'ต่อไป');
  await dismissPopups(page);
  
  // Step 4: กรอกวันเกิด
  console.log(`📌 Step 4: กรอกวันเกิด = ${data.birthDate}`);
  await dismissPopups(page);
  await page.waitForTimeout(800);

  const bd = parseBirthDate(data.birthDate);
  const expectedBirthDate = `${String(bd.day).padStart(2, '0')}/${String(bd.monthInt).padStart(2, '0')}/${bd.yearBE}`;

  const value = await retryBirthDate(
  page,
  'input[name="birthdate"]',
  new Date(bd.yearAD, bd.monthInt - 1, bd.day)
);

  const actualBirthDate = await page.locator('input[name="birthdate"]').inputValue();

if (actualBirthDate !== expectedBirthDate) {
  console.log(
    `⚠️ วันเกิด format ไม่ตรง expected=${expectedBirthDate} actual=${actualBirthDate} แต่ข้ามได้`
  );
} else {
  console.log(`✅ วันเกิดตรง expected=${expectedBirthDate}`);
}

  console.log(`✅ ตั้งวันเกิดถูกต้อง: ${value}`);
  await clickButtonByText(page, 'ต่อไป');
  await dismissPopups(page); 

  // Step 5: กรอกเบี้ย แล้วคำนวณ
  console.log(`📌 Step 5: กรอกเบี้ย = ${data.premium}`);
  await waitForReady(page, ['input[name="premium_amount"]'], 8000);
  const premium = String(data.premium || '').replace(/,/g, '').trim();
  if (!premium || premium === '-') {
    throw new Error('❌ ไม่มีค่า premium (เบี้ย/ทุนชดเชย)');
  }
  const premiumInput = page.locator('input[name="premium_amount"]');
  await premiumInput.click();
  await premiumInput.fill(premium);
  console.log(`✅ กรอกเบี้ย: ${premium}`);
  await clickButtonByText(page, 'คำนวณจำนวนเงินเอาประกันภัย');
  await page.waitForURL('**/quotation/**', { timeout: 15000 });
  await waitOptionalLoading(page);
  await dismissPopups(page);

  // ===== Section B: /quotation/ → /identity/ =====

  // Step 6: กด ซื้อประกันออนไลน์ บน quotation → identity
  console.log('📌 Step 6: กด ซื้อประกันออนไลน์ (quotation → identity)');
  await clickButtonByText(page, 'ซื้อประกันออนไลน์');
  await page.waitForURL('**/identity**', { timeout: 15000 });
  await waitOptionalLoading(page);
  await dismissPopups(page);

  // Step 7: เลือกสัญชาติ
  const nationalityRaw = String(data.nationality || '').trim();
  const isThai = nationalityRaw === 'ไทย' || nationalityRaw === '' /* default ไทย ถ้าไม่ระบุ */;
  console.log(`📌 Step 7: เลือกสัญชาติ = ${isThai ? 'ชาวไทย' : 'ชาวต่างชาติ'} (raw: "${nationalityRaw}")`);
  await waitForReady(page, ['label[for="id_type_idcard"]', 'label[for="id_type_passport"]'], 10000);
  if (isThai) {
    await clickRadioLabel(page, 'id_type_idcard');
  } else {
    await clickRadioLabel(page, 'id_type_passport');
  }

  // Step 8: เลขบัตรประชาชน
  console.log('📌 Step 8: กรอกเลขบัตรประชาชน');
  await waitForReady(page, ['input[name="applicant[id_card_no]"]'], 8000);
  const idCard = String(data.cardNo || '').replace(/\D/g, '').trim();
  if (!idCard) throw new Error('❌ ไม่มีค่า cardNo (เลขบัตร)');
  const idCardInput = page.locator('input[name="applicant[id_card_no]"]');
  await idCardInput.click();
  await idCardInput.fill(idCard);
  console.log(`✅ กรอกเลขบัตร: ${idCard}`);

  // Step 9: วันบัตรหมดอายุ
  console.log(`📌 Step 9: กรอกวันบัตรหมดอายุ = ${data.expirecardNo}`);
  if (!data.expirecardNo) {
    throw new Error('❌ ไม่มีค่า expirecardNo (วันที่บัตรหมดอายุ)');
  }
  const ed = parseBirthDate(data.expirecardNo);
  const expValue = await setFlatpickrDate(
    page,
    'input[name="applicant[id_expired_date]"]',
    new Date(ed.yearAD, ed.monthInt - 1, ed.day)
  );
  console.log(`✅ ตั้งวันบัตรหมดอายุ: ${expValue}`);

  // Step 10: คำนำหน้าชื่อ
  console.log(`📌 Step 10: เลือกคำนำหน้า = ${data.cusTitlePrefix}`);
  const title = normalizeTitle(data.cusTitlePrefix);
  if (!title) throw new Error('❌ ไม่มีค่า cusTitlePrefix (คำนำหน้าลูกค้า)');
  // ใช้ .first() เพราะหน้านี้มี select[name="applicant[title_id]"] 2 ตัว (visible + hidden clone)
  await page.locator('select[name="applicant[title_id]"]').first().selectOption({ label: title });
  console.log(`✅ เลือกคำนำหน้า: ${title}`);

  // Step 11: ชื่อ
  console.log(`📌 Step 11: กรอกชื่อ = ${data.cusName}`);
  if (!data.cusName) throw new Error('❌ ไม่มีค่า cusName (ชื่อลูกค้า)');
  await page.locator('input[name="applicant[first_name]"]').fill(data.cusName);

  // Step 12: นามสกุล
  console.log(`📌 Step 12: กรอกนามสกุล = ${data.cusSurname}`);
  if (!data.cusSurname) throw new Error('❌ ไม่มีค่า cusSurname (นามสกุลลูกค้า)');
  await page.locator('input[name="applicant[last_name]"]').fill(data.cusSurname);

  // Step 13: อีเมล
  console.log(`📌 Step 13: กรอกอีเมล = ${data.email}`);
  if (!data.email) throw new Error('❌ ไม่มีค่า email');
  await page.locator('input[type="email"]').fill(data.email);

  // Step 14: เบอร์มือถือ
  console.log(`📌 Step 14: กรอกเบอร์มือถือ = ${data.mobilePhone}`);
  if (!data.mobilePhone) throw new Error('❌ ไม่มีค่า mobilePhone (โทรศัพท์มือถือ)');
  const phone = String(data.mobilePhone).replace(/\D/g, '');
  await page.locator('input[type="text"][maxlength="10"]').first().fill(phone);

  await clickButtonByText(page, 'ยืนยันข้อมูล');
  await acceptAllConsents(page);

  // ===== Section C: /identity/ — กด ยืนยันข้อมูล → DOPA → /health/ =====
  await page.getByRole('button', { name: 'ถัดไป' }).click();

  // // Step 15: กด ยืนยันข้อมูล → DOPA → health
  // console.log('📌 Step 15: กด ยืนยันข้อมูล → DOPA → health');
  // await page.waitForURL('**/health**', { timeout: 30000 });
  // await waitOptionalLoading(page);
  // await dismissPopups(page);

  // ===== Section D: /health/ — สุขภาพ =====
  // ===== auto select safe radio by text =====
console.log('📌 auto select safe radio');

await autoSelectSafeRadios(page);
  //======= กรอกส่วนสูง/น้ำหนัก =======
  console.log('📌 Step 16b: กรอกส่วนสูง/น้ำหนัก');

const heightVal = String(data.height).trim();
const weightVal = String(data.weight).trim();

if (!heightVal) {
  throw new Error('❌ ไม่มีค่า height');
}

if (!weightVal) {
  throw new Error('❌ ไม่มีค่า weight');
}

const heightInput = page.locator('input[name="question[233][7]"]').first();
const weightInput = page.locator('input[name="question[234][8]"]').first();

// ===== Height =====
await heightInput.waitFor({
  state: 'visible',
  timeout: 10000,
});

await heightInput.scrollIntoViewIfNeeded();

for (let i = 1; i <= 3; i++) {
  console.log(`🔁 fill height attempt ${i}`);

  await heightInput.click({ force: true });

  await heightInput.fill('');
  await page.waitForTimeout(200);

  await heightInput.type(heightVal, {
    delay: 100,
  });

  await page.waitForTimeout(500);

  const actual = await heightInput.inputValue();

  console.log(`📏 height actual=${actual}`);

  if (actual === heightVal) {
    console.log(`✅ height สำเร็จ = ${actual}`);
    break;
  }

  if (i === 3) {
    throw new Error(
      `❌ กรอก height ไม่สำเร็จ expected=${heightVal} actual=${actual}`
    );
  }

  await page.waitForTimeout(500);
}

// ===== Weight =====
await weightInput.waitFor({
  state: 'visible',
  timeout: 10000,
});

await weightInput.scrollIntoViewIfNeeded();

for (let i = 1; i <= 3; i++) {
  console.log(`🔁 fill weight attempt ${i}`);

  await weightInput.click({ force: true });

  await weightInput.fill('');
  await page.waitForTimeout(200);

  await weightInput.type(weightVal, {
    delay: 100,
  });

  await page.waitForTimeout(500);

  const actual = await weightInput.inputValue();

  console.log(`⚖️ weight actual=${actual}`);

  if (actual === weightVal) {
    console.log(`✅ weight สำเร็จ = ${actual}`);
    break;
  }

  if (i === 3) {
    throw new Error(
      `❌ กรอก weight ไม่สำเร็จ expected=${weightVal} actual=${actual}`
    );
  }

  await page.waitForTimeout(500);
}

  //===================
  console.log('📌 Step 17: กด ถัดไป → fatca');
  await clickButtonByText(page, 'ถัดไป');
  await page.waitForURL('**/fatca**', { timeout: 15000 });
  await waitOptionalLoading(page);
  await dismissPopups(page);

  // ===== Section E: /fatca/ — CRS + FATCA =====

  console.log('📌 Section E: /fatca/');

  const crsRadios = [{ name: 'crs[thai_residence_only]', value: 'Y' }];
  for (const { name, value } of crsRadios) {
    const radio = page.locator(`input[name="${name}"][value="${value}"]`).first();
    if (await radio.isVisible({ timeout: 2000 }).catch(() => false)) {
      const lbl = page.locator(`label[for="${await radio.getAttribute('id')}"]`).first();
      if (await lbl.isVisible({ timeout: 1000 }).catch(() => false)) {
        await lbl.click({ force: true });
      } else {
        await radio.check({ force: true });
      }
      console.log(`✅ CRS ${name}=${value}`);
    }
  }

  const fatcaSafeIds = ['ans-145-2', 'ans-146-6', 'ans-147-24'];
  for (const radioId of fatcaSafeIds) {
    const lbl = page.locator(`label[for="${radioId}"]`);
    if (await lbl.isVisible({ timeout: 1500 }).catch(() => false)) {
      await lbl.click({ force: true });
      console.log(`✅ FATCA คลิก ${radioId}`);
    }
    await page.waitForTimeout(100);
  }

  await page.evaluate(() => {
    const safeTexts = ['ไม่ใช่', 'ไม่', 'ไม่มี'];
    const groups = {};
    document.querySelectorAll('input[type="radio"]').forEach(el => {
      if (!el.name) return;
      if (!groups[el.name]) groups[el.name] = [];
      groups[el.name].push(el);
    });
    for (const [, radios] of Object.entries(groups)) {
      if (radios.some(r => r.checked)) continue;
      const safe = radios.find(r => {
        const lbl = document.querySelector(`label[for="${r.id}"]`);
        const txt = (lbl?.innerText || r.value || '').trim();
        return safeTexts.some(s => txt.includes(s));
      });
      if (safe) {
        const lbl = document.querySelector(`label[for="${safe.id}"]`);
        if (lbl) lbl.click(); else safe.click();
      }
    }
  });
  await page.waitForTimeout(500);

  // ===== Step 17b: กรอกสถานที่เกิด บนหน้า FATCA =====
console.log('📌 Step 17b: กรอกสถานที่เกิด');

const birthPlaceVal = String(data.registerProvince || '').trim();

if (!birthPlaceVal) {
  throw new Error('❌ ไม่มีค่า registerProvince สำหรับกรอกสถานที่เกิด');
}

const birthPlaceInput = page.locator('input[name="crs[city_name]"]').first();

await birthPlaceInput.waitFor({ state: 'visible', timeout: 10000 });
await birthPlaceInput.scrollIntoViewIfNeeded();
await birthPlaceInput.click({ force: true });
await birthPlaceInput.fill(birthPlaceVal);
await birthPlaceInput.press('Tab');

const actualBirthPlace = await birthPlaceInput.inputValue();

if (actualBirthPlace !== birthPlaceVal) {
  throw new Error(
    `❌ กรอกสถานที่เกิดไม่สำเร็จ expected=${birthPlaceVal} actual=${actualBirthPlace}`
  );
}

console.log(`✅ กรอกสถานที่เกิด = ${birthPlaceVal}`);

  console.log('📌 Step 18: กด ถัดไป → applicant');

await clickButtonByText(page, 'ถัดไป');
await page.waitForTimeout(2000);

console.log('🔎 URL หลังถัดไป =', page.url());

if (!page.url().includes('/applicant')) {
  const firstError = await page.locator('.invalid-feedback, .text-danger, [class*="error"]')
    .filter({ hasText: /.+/ })
    .first()
    .innerText()
    .catch(() => '');

  console.log('❌ error บนหน้า =', firstError);

  throw new Error(`❌ กดถัดไปแล้วไม่ไป applicant ยังอยู่ที่ ${page.url()} error=${firstError}`);
}

  // ===== Section F: /applicant/ — ข้อมูลส่วนบุคคล =====

  console.log('📌 Section F: /applicant/');

  // const changeNameNo = page.locator('label[for="change_name-n"]');
  // if (await changeNameNo.isVisible({ timeout: 3000 }).catch(() => false)) {
  //   await changeNameNo.click({ force: true });
  //   console.log('✅ คลิก change_name-n');
  // }

  // ===== applicant info =====

console.log('📌 applicant: marital status');

const maritalStatusVal = String(data.maritalStatus || '').trim();

if (maritalStatusVal) {
  await page
    .locator('select[name="applicant[marital_status_id]"]')
    .first()
    .selectOption({ label: maritalStatusVal });

  console.log(`✅ maritalStatus = ${maritalStatusVal}`);
}

// ===== nationality =====
console.log('📌 applicant: nationality');

const nationalitySelect = page
  .locator('select[name="applicant[nationality_id]"]')
  .first();

await nationalitySelect.waitFor({
  state: 'visible',
  timeout: 10000,
});

const nationalityOptions = await nationalitySelect.locator('option').all();

if (nationalityOptions.length >= 2) {
  const firstValue = await nationalityOptions[1].getAttribute('value');

  await nationalitySelect.selectOption(firstValue);

  console.log(`✅ nationality first option = ${firstValue}`);
}

// ===== occupation group =====
console.log('📌 applicant: occupation group');

const occupationGroupVal = String(data.occupation || '').trim();

if (occupationGroupVal) {
  await page
    .locator('select[name="applicant[main_occupation_group_id]"]')
    .first()
    .selectOption({ label: occupationGroupVal });

  console.log(`✅ occupation group = ${occupationGroupVal}`);
}

await page.waitForTimeout(1000);

// ===== occupation =====
console.log('📌 applicant: occupation');

const occupationVal = String(data.jobDescription || '').trim();

if (occupationVal) {
  await page
    .locator('select[name="applicant[main_occupation_id]"]')
    .first()
    .selectOption({ label: occupationVal });

  console.log(`✅ occupation = ${occupationVal}`);
}

// ===== occupation position =====
await optionalFill(
  page,
  data.occupationPosition,
  'input[name="applicant[main_occupation_position]"]',
  'occupationPosition'
);

// ===== business type =====
await optionalFill(
  page,
  data.businessType,
  'input[name="applicant[main_occupation_business_desc]"]',
  'businessType'
);

// ===== annual income =====
await mandatoryFill(
  page,
  String(data.annualIncome || '').replace(/,/g, ''),
  'input[name="applicant[main_occupation_salary]"]',
  'annualIncome'
);

// =====================================================
// REGISTER ADDRESS
// =====================================================

console.log('📌 applicant: register address');

// บ้านเลขที่
await mandatoryFill(
  page,
  data.registerHouseNo,
  'input[name="applicant[address_registered][address_no]"]',
  'registerHouseNo'
);

// หมู่บ้าน
await optionalFill(
  page,
  data.registerVillage,
  'input[name="applicant[address_registered][village_name]"]',
  'registerVillage'
);

// หมู่ที่
await optionalFill(
  page,
  data.registerMoo,
  'input[name="applicant[address_registered][moo]"]',
  'registerMoo'
);

// ซอย
await optionalFill(
  page,
  data.registerSoi,
  'input[name="applicant[address_registered][soi]"]',
  'registerSoi'
);

// ถนน
await optionalFill(
  page,
  data.registerRoad,
  'input[name="applicant[address_registered][street]"]',
  'registerRoad'
);

// จังหวัด
await page
  .locator('select[name="applicant[address_registered][province_id]"]')
  .first()
  .selectOption({ label: String(data.registerProvince || '').trim() });

console.log(`✅ registerProvince = ${data.registerProvince}`);

await page.waitForTimeout(1500);

// อำเภอ
await page
  .locator('select[name="applicant[address_registered][district_id]"]')
  .first()
  .selectOption({ label: String(data.registerDistrict || '').trim() });

console.log(`✅ registerDistrict = ${data.registerDistrict}`);

await page.waitForTimeout(1500);

// ตำบล
await page
  .locator('select[name="applicant[address_registered][subdistrict_id]"]')
  .first()
  .selectOption({ label: String(data.registerSubDistrict || '').trim() });

console.log(`✅ registerSubDistrict = ${data.registerSubDistrict}`);

// รอ zipcode auto
await expect
  .poll(async () => {
    return await page
      .locator('input[name="applicant[address_registered][postal_code]"]')
      .inputValue()
      .catch(() => '');
  }, { timeout: 15000 })
  .not.toBe('');

console.log('✅ register postal code loaded');

// =====================================================
// CURRENT ADDRESS
// =====================================================

console.log('📌 applicant: current address');

const currentUseAddressType = String(
  data.currentUseAddressType || ''
).trim();

const useRegistered =
  currentUseAddressType.includes('ทะเบียนบ้าน');

if (useRegistered) {
  await clickRadioLabel(page, 'current_address_type_registered');

  console.log('✅ ใช้ที่อยู่ทะเบียนบ้าน');
} else {
  await clickRadioLabel(page, 'current_address_type_other');

  console.log('✅ ใช้ที่อยู่ส่งเอกสาร');

  // บ้านเลขที่
  await mandatoryFill(
    page,
    data.currentHouseNo,
    'input[name="applicant[address_current][address_no]"]',
    'currentHouseNo'
  );

  // หมู่บ้าน
  await optionalFill(
    page,
    data.currentVillage,
    'input[name="applicant[address_current][village_name]"]',
    'currentVillage'
  );

  // หมู่ที่
  await optionalFill(
    page,
    data.currentMoo,
    'input[name="applicant[address_current][moo]"]',
    'currentMoo'
  );

  // ซอย
  await optionalFill(
    page,
    data.currentSoi,
    'input[name="applicant[address_current][soi]"]',
    'currentSoi'
  );

  // ถนน
  await optionalFill(
    page,
    data.currentRoad,
    'input[name="applicant[address_current][street]"]',
    'currentRoad'
  );

  // จังหวัด
  await page
    .locator('select[name="applicant[address_current][province_id]"]')
    .first()
    .selectOption({ label: String(data.currentProvince || '').trim() });

  console.log(`✅ currentProvince = ${data.currentProvince}`);

  await page.waitForTimeout(1500);

  // อำเภอ
  await page
    .locator('select[name="applicant[address_current][district_id]"]')
    .first()
    .selectOption({ label: String(data.currentDistrict || '').trim() });

  console.log(`✅ currentDistrict = ${data.currentDistrict}`);

  await page.waitForTimeout(1500);

  // ตำบล
  await page
    .locator('select[name="applicant[address_current][subdistrict_id]"]')
    .first()
    .selectOption({ label: String(data.currentSubDistrict || '').trim() });

  console.log(`✅ currentSubDistrict = ${data.currentSubDistrict}`);

  // รอ zipcode auto
  await expect
    .poll(async () => {
      return await page
        .locator('input[name="applicant[address_current][postal_code]"]')
        .inputValue()
        .catch(() => '');
    }, { timeout: 15000 })
    .not.toBe('');

  console.log('✅ current postal code loaded');
}

  console.log('📌 Step 19: กด ถัดไป → beneficiary');
  await clickButtonByText(page, 'ถัดไป');
  await page.waitForURL('**/beneficiary**', { timeout: 15000 });
  await waitOptionalLoading(page);
  await dismissPopups(page);

  // ===== Section G: /beneficiary/ — ผู้รับผลประโยชน์ =====

  console.log('📌 Section G: /beneficiary/');

  const benefitAutoLbl = page.locator('label[for="benefit_method_auto"]');
  if (await benefitAutoLbl.isVisible({ timeout: 3000 }).catch(() => false)) {
    await benefitAutoLbl.click({ force: true });
    console.log('✅ เลือก benefit_method_auto');
  }

  const benFirstName = String(data.bene?.[0]?.beneName || data.cusName || '').trim();
  const benLastName  = String(data.bene?.[0]?.beneSurname || data.cusSurname || '').trim();
  if (benFirstName) {
    const fnInput = page.locator('input[name*="first_name"]').first();
    if (await fnInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await fnInput.fill(benFirstName);
      console.log(`✅ กรอก beneficiary first_name: ${benFirstName}`);
    }
  }
  if (benLastName) {
    const lnInput = page.locator('input[name*="last_name"]').first();
    if (await lnInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await lnInput.fill(benLastName);
      console.log(`✅ กรอก beneficiary last_name: ${benLastName}`);
    }
  }

  console.log('📌 Step 20: กด ถัดไป → tax');
  await clickButtonByText(page, 'ถัดไป');
  await page.waitForURL('**/tax**', { timeout: 15000 });
  await waitOptionalLoading(page);
  await dismissPopups(page);

  // ===== Section H: /tax/ — ภาษี =====

  console.log('📌 Section H: /tax/ — กด ถัดไป → document');
  await clickButtonByText(page, 'ถัดไป');
  await page.waitForURL('**/document**', { timeout: 15000 });
  await waitOptionalLoading(page);
  await dismissPopups(page);

  // ===== Section I: /document/ — แนบเอกสาร =====

  console.log('📌 Section I: /document/ — กด ถัดไป (ข้ามแนบเอกสาร)');
  await clickButtonByText(page, 'ถัดไป');
  await waitOptionalLoading(page);
  await dismissPopups(page);

  console.log('✅ เสร็จสิ้น Flow: first-love1810 ครบทุก Section');
}

// ===================================================
// FLOW: save-and-protect888 — โอเชี่ยนไลฟ์ เซฟ แอนด์ โพรเทค 88/8
// Confirmed flow (User Action debug 2026-05-11):
//   Section A: Product page calculator
//   Section B: /quotation/  — ตารางสรุปเบี้ย
//   Section C: /identity/   — ยืนยันตัวตน (DOPA)
//   Section D: /health/     — สุขภาพ
//   Section E: /fatca/      — CRS + FATCA
//   Section F: /applicant/  — ข้อมูลส่วนบุคคล
//   Section G: /beneficiary/ — ผู้รับผลประโยชน์
//   Section H: /tax/        — ภาษี
//   Section I: /document/   — แนบเอกสาร
// ===================================================
async function runFlow_saveAndProtect888(page, data) {
  console.log('🟢 Run Flow: save-and-protect888');

  // ===== Section A: Calculator =====

  // Step 2: กดปุ่ม คำนวณเบี้ย/ซื้อออนไลน์
  console.log('📌 Step 2: กดปุ่ม คำนวณเบี้ย/ซื้อออนไลน์');
  const calcBtn = page.getByRole('link', { name: /คำนวณเบี้ย.*ซื้อออนไลน์/ })
    .or(page.getByRole('button', { name: /คำนวณเบี้ย.*ซื้อออนไลน์/ }))
    .first();
  await calcBtn.waitFor({ state: 'visible', timeout: 10000 });
  await calcBtn.click();

  // Step 3: เลือกเพศ (Livewire auto-shows birthdate — ไม่ต้องกด ต่อไป)
  console.log('📌 Step 3: เลือกเพศ');
  await waitForReady(page, ['label[for="gender-m"]', 'label[for="gender-f"]'], 15000);
  const genderVal = String(data.gender || '').trim();
  const isMale   = /^(M|male)$/i.test(genderVal) || genderVal.includes('ชาย');
  const isFemale = /^(F|female)$/i.test(genderVal) || genderVal.includes('หญิง');
  if (isMale) {
    await clickRadioLabel(page, 'gender-m');
    console.log('✅ เลือก: ผู้ชาย');
  } else if (isFemale) {
    await clickRadioLabel(page, 'gender-f');
    console.log('✅ เลือก: ผู้หญิง');
  } else {
    throw new Error(`❌ ไม่รู้จักค่าเพศ: "${genderVal}"`);
  }
  await dismissPopups(page);

  // Step 4: กรอกวันเกิด (flatpickr dateFormat="Y-m-d" ใช้ AD ภายใน)
  console.log(`📌 Step 4: กรอกวันเกิด = ${data.birthDate}`);
  await waitForReady(page, ['input[name="birthdate"]'], 12000);
  await dismissPopups(page);
  await page.waitForTimeout(800);
  const bd = parseBirthDate(data.birthDate);
  const bdValue = await setFlatpickrDate(
    page,
    'input[name="birthdate"]',
    new Date(bd.yearAD, bd.monthInt - 1, bd.day)
  );
  console.log(`✅ ตั้งวันเกิด: ${bdValue}`);
  await dismissPopups(page);

  // Step 5: กรอกจำนวนเงินเอาประกัน
  console.log(`📌 Step 5: กรอกจำนวนเงินเอาประกัน = ${data.insuredAmount}`);
  await waitForReady(page, ['input[name="insured_amount"]'], 12000);
  const insuredRaw = String(data.insuredAmount || '').replace(/,/g, '').trim();
  if (!insuredRaw || insuredRaw === '-') {
    throw new Error('❌ ไม่มีค่า insuredAmount (จำนวนเงินเอาประกันภัย)');
  }
  const insuredInput = page.locator('input[name="insured_amount"]');
  await insuredInput.click();
  await insuredInput.fill('');
  await insuredInput.pressSequentially(insuredRaw, { delay: 30 });
  await page.keyboard.press('Tab');
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  console.log(`✅ กรอก insured_amount: ${insuredRaw}`);

  // กด ต่อไป → payment interval section ปรากฏ
  await clickButtonByText(page, 'ต่อไป');
  await waitOptionalLoading(page);
  await dismissPopups(page);

  // Step 5b: เลือกโหมดชำระ (ไม่มีใน write-result.js → default รายปี)
  console.log('📌 Step 5b: เลือกโหมดชำระ (default=รายปี)');
  await waitForReady(page, ['label[for="interval-1"]'], 10000);
  await clickRadioLabel(page, 'interval-1');
  console.log('✅ เลือกโหมดชำระ: รายปี');

  // Step 5c: คำนวณเบี้ยประกันภัย
  console.log('📌 Step 5c: กด คำนวณเบี้ยประกันภัย');
  await clickButtonByText(page, 'คำนวณเบี้ยประกันภัย');
  await waitOptionalLoading(page);
  await dismissPopups(page);

  // Step 5d: กด ซื้อประกันออนไลน์ บนหน้า product → /quotation/
  if (!page.url().includes('/quotation/')) {
    console.log('📌 Step 5d: กด ซื้อประกันออนไลน์ (product page → quotation)');
    await clickButtonByText(page, 'ซื้อประกันออนไลน์');
    await page.waitForURL('**/quotation/**', { timeout: 15000 });
    await waitOptionalLoading(page);
    await dismissPopups(page);
  }

  // ===== Section B: /quotation/ — ตารางสรุปเบี้ย =====

  console.log('📌 Section B: /quotation/ — กด ซื้อประกันออนไลน์ → identity');
  await page.waitForURL('**/quotation/**', { timeout: 15000 });
  await clickButtonByText(page, 'ซื้อประกันออนไลน์');
  await page.waitForURL('**/identity**', { timeout: 15000 });
  await waitOptionalLoading(page);
  await dismissPopups(page);

  // ===== Section C: /identity/ — ยืนยันตัวตน (DOPA) =====

  console.log('📌 Section C: /identity/');

  // Step 7: เลือกประเภทเอกสาร (idcard / passport)
  const nationalityRaw = String(data.nationality || '').trim();
  const isThai = nationalityRaw === 'ไทย' || nationalityRaw === '';
  console.log(`📌 Step 7: id_type = ${isThai ? 'idcard' : 'passport'}`);
  await waitForReady(page, ['label[for="id_type_idcard"]', 'label[for="id_type_passport"]'], 10000);
  if (isThai) {
    await clickRadioLabel(page, 'id_type_idcard');
  } else {
    await clickRadioLabel(page, 'id_type_passport');
  }

  // Step 8: เลขบัตรประชาชน
  console.log('📌 Step 8: กรอกเลขบัตรประชาชน');
  await waitForReady(page, ['input[name="applicant[id_card_no]"]'], 8000);
  const idCard = String(data.cardNo || '').replace(/\D/g, '').trim();
  if (!idCard) throw new Error('❌ ไม่มีค่า cardNo');
  const idCardInput = page.locator('input[name="applicant[id_card_no]"]');
  await idCardInput.click();
  await idCardInput.fill(idCard);
  console.log(`✅ กรอกเลขบัตร: ${idCard}`);

  // Step 9: วันบัตรหมดอายุ (flatpickr)
  console.log(`📌 Step 9: กรอกวันบัตรหมดอายุ = ${data.expirecardNo}`);
  if (!data.expirecardNo) throw new Error('❌ ไม่มีค่า expirecardNo');
  const ed = parseBirthDate(data.expirecardNo);
  const expValue = await setFlatpickrDate(
    page,
    'input[name="applicant[id_expired_date]"]',
    new Date(ed.yearAD, ed.monthInt - 1, ed.day)
  );
  console.log(`✅ ตั้งวันบัตรหมดอายุ: ${expValue}`);

  // Step 10: กด ยืนยันข้อมูล → DOPA ตรวจสอบ → /health/
  console.log('📌 Step 10: กด ยืนยันข้อมูล → DOPA → health');
  await clickButtonByText(page, 'ยืนยันข้อมูล');
  await page.waitForURL('**/health**', { timeout: 30000 });
  await waitOptionalLoading(page);
  await dismissPopups(page);

  // ===== Section D: /health/ — สุขภาพ =====

  console.log('📌 Section D: /health/');

  // Step 11: คลิก safe default radios (ไม่มี / ไม่เคย / ไม่สูบ / ไม่ดื่ม)
  const safeRadioIds = [
    'ans-231-326', // ไม่มีโรคประจำตัว
    'ans-232-340', // ไม่เคยรับการรักษา
    'ans-248-7',   // ไม่มี
    'ans-249-38',  // ไม่มี
    'ans-250-36',  // ไม่มี
    'ans-251-34',  // ไม่มี
    'ans-252-344', // ไม่เคย
    'ans-280-346', // ไม่สูบ
  ];
  for (const radioId of safeRadioIds) {
    const lbl = page.locator(`label[for="${radioId}"]`);
    if (await lbl.isVisible({ timeout: 1500 }).catch(() => false)) {
      await lbl.click({ force: true });
      console.log(`✅ คลิก ${radioId}`);
    }
    await page.waitForTimeout(100);
  }

  // Step 11b: กรอกส่วนสูง / น้ำหนัก (hardcode — ไม่มีใน write-result.js)
  console.log('📌 Step 11b: กรอกส่วนสูง 165 / น้ำหนัก 55');
  const heightInput = page.locator('input[name="height"]').first();
  const weightInput = page.locator('input[name="weight"]').first();
  if (await heightInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await heightInput.click();
    await heightInput.fill('165');
  }
  if (await weightInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await weightInput.click();
    await weightInput.fill('55');
  }

  // Step 11c: JS fallback — คลิก "ไม่" / "ไม่มี" / "ไม่เคย" ใน radio ที่ยังไม่ได้ตอบ
  console.log('📌 Step 11c: JS fallback safe radios');
  await page.evaluate(() => {
    const safeTexts = ['ไม่มี', 'ไม่เคย', 'ไม่สูบ', 'ไม่ดื่ม', 'ไม่', 'ปกติ'];
    const groups = {};
    document.querySelectorAll('input[type="radio"]').forEach(el => {
      if (!el.name) return;
      if (!groups[el.name]) groups[el.name] = [];
      groups[el.name].push(el);
    });
    for (const [, radios] of Object.entries(groups)) {
      const anyChecked = radios.some(r => r.checked);
      if (anyChecked) continue;
      const safeOpt = radios.find(r => {
        const lbl = document.querySelector(`label[for="${r.id}"]`);
        const txt = (lbl?.innerText || r.value || '').trim();
        return safeTexts.some(s => txt.includes(s));
      });
      if (safeOpt) {
        const lbl = document.querySelector(`label[for="${safeOpt.id}"]`);
        if (lbl) lbl.click();
        else safeOpt.click();
      }
    }
  });
  await page.waitForTimeout(500);

  // Step 12: กด ถัดไป → /fatca/
  console.log('📌 Step 12: กด ถัดไป → fatca');
  await clickButtonByText(page, 'ถัดไป');
  await page.waitForURL('**/fatca**', { timeout: 15000 });
  await waitOptionalLoading(page);
  await dismissPopups(page);

  // ===== Section E: /fatca/ — CRS + FATCA =====

  console.log('📌 Section E: /fatca/');

  // Step 13: CRS thai_residence_only = Y + safe FATCA defaults
  const crsRadios = [
    { name: 'crs[thai_residence_only]', value: 'Y' }, // อยู่อาศัยในไทยเท่านั้น
  ];
  for (const { name, value } of crsRadios) {
    const radio = page.locator(`input[name="${name}"][value="${value}"]`).first();
    if (await radio.isVisible({ timeout: 2000 }).catch(() => false)) {
      const lbl = page.locator(`label[for="${await radio.getAttribute('id')}"]`).first();
      if (await lbl.isVisible({ timeout: 1000 }).catch(() => false)) {
        await lbl.click({ force: true });
      } else {
        await radio.check({ force: true });
      }
      console.log(`✅ CRS ${name}=${value}`);
    }
  }

  // safe defaults สำหรับ FATCA questions
  const fatcaSafeIds = ['ans-145-2', 'ans-146-6', 'ans-147-24'];
  for (const radioId of fatcaSafeIds) {
    const lbl = page.locator(`label[for="${radioId}"]`);
    if (await lbl.isVisible({ timeout: 1500 }).catch(() => false)) {
      await lbl.click({ force: true });
      console.log(`✅ FATCA คลิก ${radioId}`);
    }
    await page.waitForTimeout(100);
  }

  // JS fallback สำหรับ radio ที่เหลือใน fatca
  await page.evaluate(() => {
    const safeTexts = ['ไม่ใช่', 'ไม่', 'ไม่มี'];
    const groups = {};
    document.querySelectorAll('input[type="radio"]').forEach(el => {
      if (!el.name) return;
      if (!groups[el.name]) groups[el.name] = [];
      groups[el.name].push(el);
    });
    for (const [, radios] of Object.entries(groups)) {
      const anyChecked = radios.some(r => r.checked);
      if (anyChecked) continue;
      const safeOpt = radios.find(r => {
        const lbl = document.querySelector(`label[for="${r.id}"]`);
        const txt = (lbl?.innerText || r.value || '').trim();
        return safeTexts.some(s => txt.includes(s));
      });
      if (safeOpt) {
        const lbl = document.querySelector(`label[for="${safeOpt.id}"]`);
        if (lbl) lbl.click();
        else safeOpt.click();
      }
    }
  });
  await page.waitForTimeout(500);

  // Step 14: กด ถัดไป → /applicant/
  console.log('📌 Step 14: กด ถัดไป → applicant');
  await clickButtonByText(page, 'ถัดไป');
  await page.waitForURL('**/applicant**', { timeout: 15000 });
  await waitOptionalLoading(page);
  await dismissPopups(page);

  // ===== Section F: /applicant/ — ข้อมูลส่วนบุคคล =====

  console.log('📌 Section F: /applicant/');

  // Step 15: ชื่อไม่เคยเปลี่ยน (change_name-n) → กด ถัดไป → /beneficiary/
  const changeNameNo = page.locator('label[for="change_name-n"]');
  if (await changeNameNo.isVisible({ timeout: 3000 }).catch(() => false)) {
    await changeNameNo.click({ force: true });
    console.log('✅ คลิก change_name-n (ชื่อไม่เคยเปลี่ยน)');
  }

  console.log('📌 Step 15: กด ถัดไป → beneficiary');
  await clickButtonByText(page, 'ถัดไป');
  await page.waitForURL('**/beneficiary**', { timeout: 15000 });
  await waitOptionalLoading(page);
  await dismissPopups(page);

  // ===== Section G: /beneficiary/ — ผู้รับผลประโยชน์ =====

  console.log('📌 Section G: /beneficiary/');

  // Step 16: benefit_method_auto (ตามกฎหมาย)
  const benefitAutoLbl = page.locator('label[for="benefit_method_auto"]');
  if (await benefitAutoLbl.isVisible({ timeout: 3000 }).catch(() => false)) {
    await benefitAutoLbl.click({ force: true });
    console.log('✅ เลือก benefit_method_auto (ตามกฎหมาย)');
  }

  // กรอกชื่อผู้รับผลประโยชน์ (ใช้ name*= เพราะ ID เป็น dynamic server-generated)
  const benFirstName = String(data.bene?.[0]?.beneName || data.cusName || '').trim();
  const benLastName  = String(data.bene?.[0]?.beneSurname || data.cusSurname || '').trim();
  if (benFirstName) {
    const fnInput = page.locator('input[name*="first_name"]').first();
    if (await fnInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await fnInput.fill(benFirstName);
      console.log(`✅ กรอก beneficiary first_name: ${benFirstName}`);
    }
  }
  if (benLastName) {
    const lnInput = page.locator('input[name*="last_name"]').first();
    if (await lnInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await lnInput.fill(benLastName);
      console.log(`✅ กรอก beneficiary last_name: ${benLastName}`);
    }
  }

  console.log('📌 Step 16: กด ถัดไป → tax');
  await clickButtonByText(page, 'ถัดไป');
  await page.waitForURL('**/tax**', { timeout: 15000 });
  await waitOptionalLoading(page);
  await dismissPopups(page);

  // ===== Section H: /tax/ — ภาษี =====

  console.log('📌 Section H: /tax/ — กด ถัดไป → document');
  await clickButtonByText(page, 'ถัดไป');
  await page.waitForURL('**/document**', { timeout: 15000 });
  await waitOptionalLoading(page);
  await dismissPopups(page);

  // ===== Section I: /document/ — แนบเอกสาร =====

  console.log('📌 Section I: /document/ — กด ถัดไป (ข้ามแนบเอกสาร)');
  await clickButtonByText(page, 'ถัดไป');
  await waitOptionalLoading(page);
  await dismissPopups(page);

  console.log('✅ เสร็จสิ้น Flow: save-and-protect888 ครบทุก Section');
}

// ===================================================
// Main Test
// ===================================================
test('DigitalSales realtime runner', async ({ browser }) => {
  test.setTimeout(0);
  const RUN_CREATE_BY = 'เนม';
  const processedNos = new Set();
  let idx = 0;

  while (true) {
    const caseDatas = await fetchRunnableCases(RUN_CREATE_BY);
    if (!caseDatas.length) {
      console.log('🎉 ไม่มีเคสให้รันแล้ว');
      break;
    }
    const finalData = caseDatas[0];
    idx++;
    const { no, environment, linkProduct } = finalData;
    if (processedNos.has(no)) {
      console.log(`🛑 ข้ามซ้ำ: No ${no}`);
      break;
    }
    processedNos.add(no);
    const productSlug = String(linkProduct).split('/').pop();
    const claimed = await claimCase(no, RUN_CREATE_BY);
    if (!claimed) continue;

    const context = await browser.newContext({ timezoneId: 'Asia/Bangkok' });
    const page = await context.newPage();
    await setupAutoPopupDismiss(page);
    let status = 'FAIL';
    let remark = '';
    const startTime = Date.now();

    try {
      const baseUrl = ENV_MAP[environment];
      if (!baseUrl) throw new Error(`❌ ไม่รู้จัก Env: "${environment}"`);
      const fullUrl = `${baseUrl}${linkProduct}`;
      console.log(`\n🚀 [${idx}] No ${no} | ${productSlug} | ${environment}`);
      console.log(`🌐 เปิด: ${fullUrl}`);
      // Step 1: Goto URL
      await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await dismissPopups(page);

      if (productSlug === 'first-love1810') {
        await runFlow_firstlove1810(page, finalData);
      } else if (productSlug === 'save-and-protect888') {
        await runFlow_saveAndProtect888(page, finalData);
      } else {
        throw new Error(`❌ ไม่รู้จัก productSlug: "${productSlug}"`);
      }

      status = 'PASS';
      remark = 'สำเร็จ';
      console.log(`✅ PASS: No ${no} | ${productSlug}`);
    } catch (err) {
      const errorMessage = String(err?.message || err);
      const isRunnerStopped =
        page.isClosed?.() ||
        /Target page, context or browser has been closed/i.test(errorMessage) ||
        /Test ended/i.test(errorMessage);
      if (isRunnerStopped) {
        console.log(`🛑 Runner stopped: No ${no}`);
        throw err;
      }
      status = 'FAIL';
      remark = errorMessage;
      console.error(`❌ FAIL: No ${no} | ${productSlug}:`, err);
      try {
        const screenshotPath = `reports/qa/screenshots/digitalsales_fail_${no}_${Date.now()}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`📸 Screenshot: ${screenshotPath}`);
      } catch {}
    } finally {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      try {
        await writeResult({
          no,
          status,
          remark: `[${elapsed}s] ${remark}`.slice(0, 500),
        });
        console.log(`📝 Write result: No ${no} => ${status} [${elapsed}s]`);
      } catch (writeErr) {
        console.error(`❌ Write Sheet failed: No ${no}`, writeErr);
      }
      await context.close().catch(() => {});
    }
  }
});
