/**
 * Digital Sale — Phase 1 Data Preparation Script
 * ครอบคลุม: ค้นหาแบบประกัน → กรอกข้อมูล → แนบบัตร → OTP → เลือกช่องทางเงินสด → จดเลขใบคำขอ
 *
 * วิธีใช้: แก้ไข TEST_DATA ด้านล่างก่อนรัน
 */

const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

// ─── Config: แก้ไขข้อมูลที่นี่ ───────────────────────────────────────────────
const TEST_DATA = {
  // ชื่อแบบประกันที่ต้องการค้นหา
  productName: 'โอเชี่ยนไลฟ์ เฟิร์ส เลิฟ',

  // ข้อมูลผู้เอาประกัน
  gender:     process.env.DS_GENDER     || 'ผู้ชาย',        // 'ผู้ชาย' หรือ 'ผู้หญิง'
  firstName:  process.env.DS_FIRSTNAME  || 'สมชาย',
  lastName:   process.env.DS_LASTNAME   || 'ใจดี',
  idCard:     process.env.DS_IDCARD     || '3563136069897',
  birthDate:  process.env.DS_BIRTHDATE  || '10/01/2539',    // DD/MM/YYYY (พ.ศ.)
  phone:      process.env.DS_PHONE      || '0812345678',
  email:      process.env.DS_EMAIL      || 'test@example.com',

  // เบี้ยประกันภัย (บาท)
  premium:        process.env.DS_PREMIUM        || '20000',

  // ข้อมูลยืนยันตัวตน (Step 6.5)
  nationality:    process.env.DS_NATIONALITY    || 'ชาวไทย',     // 'ชาวไทย' หรือ 'ชาวต่างชาติ'
  idCardExpiry:   process.env.DS_IDCARD_EXPIRY  || '31/12/2573', // DD/MM/YYYY (พ.ศ.) หรือ 'ตลอดชีพ'
  prefix:         process.env.DS_PREFIX         || 'นาย',        // นาย / นาง / นางสาว / ฯลฯ

  // ไฟล์บัตรประชาชน
  idCardImagePath: path.resolve(__dirname, 'fixtures', 'id_card.jpg'),
  selfieImagePath: path.resolve(__dirname, 'fixtures', 'id_card.jpg'), // ภาพถ่ายคู่บัตร (ใช้ไฟล์เดียวกันถ้าไม่มี)

  // Step 8: ข้อมูลสุขภาพ
  height:     process.env.DS_HEIGHT        || '170',        // ส่วนสูง (ซ.ม.)
  weight:     process.env.DS_WEIGHT        || '70',         // น้ำหนัก (ก.ก.)

  // Step 9: CRS/FATCA
  birthCity:  process.env.DS_BIRTH_CITY    || 'กรุงเทพมหานคร',

  // Step 10: ข้อมูลส่วนบุคคล
  maritalStatus:   process.env.DS_MARITAL     || 'โสด',
  occupationGroup: process.env.DS_OCC_GROUP   || 'พนักงานบริษัท',
  occupation:      process.env.DS_OCC         || 'พนักงานบริษัท',
  annualIncome:    process.env.DS_INCOME      || '500000',
  houseNo:         process.env.DS_HOUSE_NO    || '1',
  province:        process.env.DS_PROVINCE    || 'กรุงเทพมหานคร',
  district:        process.env.DS_DISTRICT    || 'บางนา',

  // Step 11: ผู้รับผลประโยชน์
  beneficiaryPrefix:    process.env.DS_BEN_PREFIX  || 'นาง',
  beneficiaryFirstName: process.env.DS_BEN_FNAME   || 'สมหญิง',
  beneficiaryLastName:  process.env.DS_BEN_LNAME   || 'ใจดี',
  beneficiaryRelation:  process.env.DS_BEN_REL     || 'มารดา',
  beneficiaryAge:       process.env.DS_BEN_AGE     || '55',

  // Step 12: สิทธิขอยกเว้นภาษี (true = มีความประสงค์)
  wantTaxExemption: (process.env.DS_TAX_EXEMPT !== 'false'),

  // Step 13.5: วิธีการรับเล่มกรมธรรม์และใบเสร็จ
  // 'e-policy' หรือ 'ไปรษณีย์'
  policyDelivery: process.env.DS_POLICY_DELIVERY || 'e-policy',
  receiptDelivery: process.env.DS_RECEIPT_DELIVERY || 'e-policy',
};

const BASE_URL = 'https://uat2-oceanlife.ochi.link/';

// ─────────────────────────────────────────────────────────────────────────────

test.setTimeout(300000); // 5 นาที — รองรับการรอ OTP แบบ manual

test('Digital Sale Phase 1 — สร้างใบคำขอใหม่ (data prep)', async ({ page }) => {

  // ── 0. เตรียม fixtures folder ────────────────────────────────────────────
  const fixturesDir = path.resolve(__dirname, 'fixtures');
  if (!fs.existsSync(fixturesDir)) {
    fs.mkdirSync(fixturesDir, { recursive: true });
    console.log('📁 Created fixtures/ folder — กรุณาวางไฟล์ id_card.jpg ไว้ใน playwright/fixtures/');
  }

  // ── 1. เปิดหน้าเว็บ Digital Sale ─────────────────────────────────────────
  console.log('🌐 เปิดหน้าเว็บ Digital Sale UAT...');
  await page.goto(BASE_URL);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);

  // ── 1.1 ปิด Cookie Banner (ถ้ามี) ────────────────────────────────────────
  const cookieBtn = page.getByRole('button', { name: /ยอมรับ/i });
  if (await cookieBtn.isVisible().catch(() => false)) {
    console.log('🍪  กด "ยอมรับ" cookie banner...');
    await cookieBtn.click();
    await page.waitForTimeout(500);
  }

  // ── 2. กด "ซื้อประกันออนไลน์" ในเมนูหลัก ────────────────────────────────
  console.log('🖱️  กด "ซื้อประกันออนไลน์" ในเมนู...');
  const buyOnlineLink = page.getByRole('link', { name: /^ซื้อประกันออนไลน์$/i });
  await buyOnlineLink.waitFor({ state: 'visible', timeout: 10000 });
  await buyOnlineLink.click();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(800);

  // ── 3. กดปุ่ม Search (ค้นหาข้อมูล) ──────────────────────────────────────
  console.log('🔍  กดปุ่ม Search...');
  const searchToggle = page.locator('a[data-search-component]')
    .or(page.getByRole('link', { name: 'ค้นหาข้อมูล' })).first();
  await searchToggle.waitFor({ state: 'visible', timeout: 10000 });
  await searchToggle.click();
  await page.waitForTimeout(600);

  // ── 4. ค้นหาชื่อแบบประกัน ─────────────────────────────────────────────
  console.log(`🔎  ค้นหา: "${TEST_DATA.productName}"...`);
  const searchInput = page.locator('#cmp-search, input[name="keyword"]').first();
  await searchInput.waitFor({ state: 'visible', timeout: 10000 });
  await searchInput.fill(TEST_DATA.productName);
  await page.waitForTimeout(500);

  const searchBtn = page.getByRole('button', { name: /^search$/i });
  await searchBtn.waitFor({ state: 'visible', timeout: 5000 });
  await searchBtn.click();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);

  // ── 5. เลือกแบบประกัน จากผลการค้นหา ─────────────────────────────────────
  console.log(`🛡️  เลือกแบบประกัน: "${TEST_DATA.productName}"...`);

  // ปิด OneSignal push notification popup ถ้ามี (ขึ้นมาบังก่อนคลิก)
  const oneSignalBtn = page.locator('#onesignal-slidedown-container button').last();
  if (await oneSignalBtn.isVisible().catch(() => false)) {
    console.log('🔔  ปิด OneSignal notification popup...');
    await oneSignalBtn.click();
    await page.waitForTimeout(500);
  }

  // หา URL จาก stretched-link ใน li.result__item แล้ว navigate ตรง (หลีกเลี่ยง overlay intercept)
  const productItem = page.locator('li.result__item')
    .filter({ hasText: new RegExp(TEST_DATA.productName, 'i') }).first();
  await productItem.waitFor({ state: 'visible', timeout: 15000 });

  const productHref = await productItem.locator('a.stretched-link').getAttribute('href').catch(() => null);

  if (productHref) {
    const purchaseUrl = `${productHref}?purchase_intent=1`;
    console.log(`🔗  Navigate ไป: ${purchaseUrl}`);
    await page.goto(purchaseUrl);
  } else {
    await productItem.locator('a.stretched-link').click({ force: true });
  }
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);

  // ── 6. กรอกข้อมูลส่วนตัว ─────────────────────────────────────────────────
  console.log('📝  กรอกข้อมูลส่วนตัว...');

  // ── 6.1 เลือกเพศ (.question__choices > div) ──────────────────────────────
  console.log(`🚻  เลือกเพศ: ${TEST_DATA.gender}...`);

  // รอ calculator panel เปิด (มาพร้อม ?purchase_intent=1)
  await page.locator('.question__choices').waitFor({ state: 'visible', timeout: 10000 })
    .catch(() => {});

  const genderBtn = page.locator('.question__choices')
    .getByText(TEST_DATA.gender, { exact: true });

  if (await genderBtn.isVisible().catch(() => false)) {
    await genderBtn.click();
    await page.waitForTimeout(400);
    console.log(`✅  เลือกเพศ: ${TEST_DATA.gender} แล้ว`);
  } else {
    console.warn(`⚠️  ไม่พบปุ่มเลือกเพศ "${TEST_DATA.gender}" ใน .question__choices`);
  }

  // ── 6.2 เลือกวันเกิดผ่าน Flatpickr (input[name="birthdate"]) ─────────────
  console.log(`📅  เลือกวันเกิด: ${TEST_DATA.birthDate} (พ.ศ.) ผ่านปฏิทิน...`);

  // แปลง DD/MM/YYYY (พ.ศ.) → ตัวเลข
  const [bDay, bMonth, bYearBE] = TEST_DATA.birthDate.split('/').map(Number);
  const bYearCE = bYearBE - 543;

  // ชื่อเดือนภาษาไทย (index 1-based) — ตรงกับ option ใน Flatpickr month dropdown
  const THAI_MONTHS = [
    '', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
  ];

  // รอให้ step วันเกิดปรากฏ (auto-advance มาจาก gender step)
  const birthInput = page.locator('input[name="birthdate"].flatpickr-input');
  await birthInput.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});

  if (await birthInput.isVisible().catch(() => false)) {
    // คลิกเปิด Flatpickr calendar
    await birthInput.click();
    await page.waitForTimeout(500);

    const cal = page.locator('.flatpickr-calendar.open, .flatpickr-calendar');

    // เลือกเดือน (combobox label="Month" มีชื่อเดือนไทย)
    await cal.getByLabel('Month').selectOption(THAI_MONTHS[bMonth]);
    await page.waitForTimeout(300);

    // เลือกปี (combobox ที่สองใช้ พ.ศ.)
    await cal.locator('select').last().selectOption(String(bYearBE));
    await page.waitForTimeout(300);

    // คลิกวันที่ — aria-label รูปแบบ "มกราคม 10, 1996" (ค.ศ.)
    const dayLabel = `${THAI_MONTHS[bMonth]} ${bDay}, ${bYearCE}`;
    await page.getByLabel(dayLabel, { exact: false }).first().click();
    await page.waitForTimeout(500);

    console.log(`✅  เลือกวันเกิด ${TEST_DATA.birthDate} (${dayLabel}) สำเร็จ`);
  } else {
    console.warn('⚠️  ไม่พบ input[name="birthdate"] — ข้ามขั้นตอนนี้');
  }

  await page.waitForTimeout(500);

  // ── 6.3 กรอกเบี้ยประกันภัย แล้วกด "คำนวณจำนวนเงินเอาประกันภัย" ──────────
  console.log(`💰  กรอกเบี้ยประกันภัย: ${TEST_DATA.premium} บาท...`);

  // รอให้ step เบี้ยปรากฏ (auto-advance มาจาก calendar)
  const premiumField = page.getByRole('textbox', { name: 'ระบุจำนวนเบี้ยประกันภัย' });
  await premiumField.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});

  if (await premiumField.isVisible().catch(() => false)) {
    await premiumField.click();
    await premiumField.fill(TEST_DATA.premium);
    await page.waitForTimeout(400);
    console.log(`✅  กรอกเบี้ยประกันภัย ${TEST_DATA.premium} บาท แล้ว`);
  } else {
    console.warn('⚠️  ไม่พบ field เบี้ยประกันภัย');
  }

  // กดปุ่ม "คำนวณจำนวนเงินเอาประกันภัย"
  console.log('🧮  กดปุ่ม "คำนวณจำนวนเงินเอาประกันภัย"...');
  const calcBtn = page.getByRole('button', { name: 'คำนวณจำนวนเงินเอาประกันภัย' });

  if (await calcBtn.isVisible().catch(() => false)) {
    await calcBtn.click();
    // รอ navigate ไป quotation page (มี UUID ใน URL)
    await page.waitForURL(/\/quotation\//, { timeout: 15000 }).catch(() => {});
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    console.log('✅  คำนวณเสร็จสิ้น — อยู่ที่หน้า quotation แล้ว');
  } else {
    console.warn('⚠️  ไม่พบปุ่ม "คำนวณจำนวนเงินเอาประกันภัย"');
  }

  await page.waitForTimeout(500);

  // ── 6.4 กดปุ่ม "ซื้อประกันออนไลน์" (อยู่ใน quotation page เท่านั้น) ────────
  console.log('🛒  กดปุ่ม "ซื้อประกันออนไลน์"...');
  // ใช้ getByRole('button') เท่านั้น — nav menu ใช้ link ไม่ใช่ button
  const buyNowBtn = page.getByRole('button', { name: /ซื้อประกันออนไลน์/i });

  await buyNowBtn.waitFor({ state: 'visible', timeout: 15000 });
  await buyNowBtn.click();
  await page.waitForURL(/\/identity/, { timeout: 15000 }).catch(() => {});
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
  console.log('✅  เข้าสู่หน้ายืนยันตัวตนแล้ว');

  // ── 6.5 กรอกข้อมูลยืนยันตัวตน ───────────────────────────────────────────
  console.log('📋  กรอกข้อมูลยืนยันตัวตน...');

  // รอ Livewire render form ก่อนกรอก
  await page.locator('.radio-label').first()
    .waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});

  // ปิด OneSignal notification popup ถ้ามี (อาจบังฟอร์ม)
  const oneSignalClose2 = page.locator('#onesignal-slidedown-container button').last();
  if (await oneSignalClose2.isVisible().catch(() => false)) {
    await oneSignalClose2.click();
    await page.waitForTimeout(500);
  }

  // helper: หา input จาก floating label — ใช้ direct child (>) เพื่อให้ specific
  const inputByLabel = (text) =>
    page.locator('div:has(> input[placeholder=" "])').filter({ hasText: text })
      .locator('input')
      .first();

  // helper: ซ่อน overlay ที่บัง (OneSignal + LiveChat) ด้วย JS
  const dismissOverlays = async () => {
    await page.evaluate(() => {
      const onesignal = document.getElementById('onesignal-slidedown-container');
      if (onesignal) onesignal.style.setProperty('display', 'none', 'important');
      const chat = document.getElementById('chat-widget-container');
      if (chat) chat.style.setProperty('display', 'none', 'important');
    }).catch(() => {});
  };

  // 6.5.1 เลือกสัญชาติ — คลิก label (.radio-label) แทน radio input เพราะ label intercepts
  console.log(`   🌏 เลือกสัญชาติ: ${TEST_DATA.nationality}...`);
  const nationalityRadio = page.getByRole('radio', { name: TEST_DATA.nationality });
  const isAlreadyChecked = await nationalityRadio.isChecked().catch(() => false);
  if (!isAlreadyChecked) {
    const nationalityLabel = page.locator('.radio-label').filter({ hasText: TEST_DATA.nationality });
    if (await nationalityLabel.isVisible().catch(() => false)) {
      await nationalityLabel.click();
      await page.waitForTimeout(300);
    }
  } else {
    console.log(`   ✅  สัญชาติ "${TEST_DATA.nationality}" ถูกเลือกอยู่แล้ว`);
  }

  // ซ่อน overlay ทั้งหมดก่อนกรอกฟอร์ม
  await dismissOverlays();

  // 6.5.2 กรอกเลขบัตรประชาชน
  console.log(`   🪪 กรอกเลขบัตรประชาชน: ${TEST_DATA.idCard}...`);
  const idCardInput = inputByLabel('เลขบัตรประชาชนของผู้ขอเอาประกัน');
  if (await idCardInput.isVisible().catch(() => false)) {
    await idCardInput.fill(TEST_DATA.idCard);
    await page.waitForTimeout(300);
  }

  // 6.5.3 วันหมดอายุบัตรประชาชน
  console.log(`   📅 วันหมดอายุบัตร: ${TEST_DATA.idCardExpiry}...`);
  await dismissOverlays();
  if (TEST_DATA.idCardExpiry === 'ตลอดชีพ') {
    // ติ๊ก checkbox ตลอดชีพ — คลิก .checkbox-label แทน input (label intercepts)
    const lifetimeChk = page.getByRole('checkbox', { name: /ตลอดชีพ/i });
    if (await lifetimeChk.isVisible().catch(() => false)) {
      const isChecked = await lifetimeChk.isChecked().catch(() => false);
      if (!isChecked) {
        const lifetimeLabel = page.locator('label.checkbox-label').filter({ hasText: /ตลอดชีพ/i });
        if (await lifetimeLabel.isVisible().catch(() => false)) {
          await lifetimeLabel.click();
        } else {
          await lifetimeChk.click({ force: true });
        }
      }
      await page.waitForTimeout(300);
      console.log('   ✅  ติ๊ก "ตลอดชีพ" แล้ว');
    }
  } else {
    // เปิด Flatpickr แล้วเลือกวัน
    const [eDay, eMonth, eYearBE] = TEST_DATA.idCardExpiry.split('/').map(Number);
    const eYearCE = eYearBE - 543;
    const THAI_MONTHS_EXP = [
      '', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
    ];
    const expiryInput = page.locator('input[name="applicant[id_expired_date]"]').first();

    if (await expiryInput.isVisible().catch(() => false)) {
      await expiryInput.click();
      await page.waitForTimeout(400);
      const calExp = page.locator('.flatpickr-calendar.open');
      await calExp.getByLabel('Month').selectOption(THAI_MONTHS_EXP[eMonth]);
      await page.waitForTimeout(200);
      await calExp.locator('select').last().selectOption(String(eYearBE));
      await page.waitForTimeout(200);
      const expDayLabel = `${THAI_MONTHS_EXP[eMonth]} ${eDay}, ${eYearCE}`;
      await page.getByLabel(expDayLabel, { exact: false }).first().click();
      await page.waitForTimeout(400);
      console.log(`   ✅  วันหมดอายุ ${TEST_DATA.idCardExpiry} แล้ว`);
    }
  }

  // 6.5.4 คำนำหน้าชื่อ
  console.log(`   🏷️  เลือกคำนำหน้า: ${TEST_DATA.prefix}...`);
  const prefixSelect = page.getByRole('combobox').first();
  if (await prefixSelect.isVisible().catch(() => false)) {
    await prefixSelect.selectOption(TEST_DATA.prefix);
    await page.waitForTimeout(800); // รอ Livewire re-render หลัง prefix เปลี่ยน
  }

  // ซ่อน overlay ก่อนกรอกชื่อ (OneSignal / LiveChat อาจ pop ขึ้นมาระหว่างนี้)
  await dismissOverlays();

  // helper: fill input ที่อาจเป็น readonly — ลอง fill() ก่อน ถ้าไม่ได้ใช้ evaluate force-set
  const forceFill = async (locator, value) => {
    const isReadonly = await locator.evaluate(el => el.readOnly || el.disabled).catch(() => false);
    if (isReadonly) {
      await locator.evaluate((el, v) => {
        el.removeAttribute('readonly'); el.disabled = false;
        el.value = v;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, value);
    } else {
      await locator.click();
      await locator.fill(value);
    }
  };

  // 6.5.5 ชื่อ — regex /^ชื่อ/ เพื่อ match label ที่ขึ้นต้นด้วย "ชื่อ"
  console.log(`   ✏️  กรอกชื่อ: ${TEST_DATA.firstName}...`);
  const firstNameInput = inputByLabel(/ชื่อ/);
  await firstNameInput.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
  if (await firstNameInput.isVisible().catch(() => false)) {
    await forceFill(firstNameInput, TEST_DATA.firstName);
    console.log(`   ✅  กรอกชื่อ "${TEST_DATA.firstName}" แล้ว`);
    await page.waitForTimeout(300);
  } else {
    console.log('   ⚠️  ไม่พบ field ชื่อ');
  }

  // 6.5.6 นามสกุล
  console.log(`   ✏️  กรอกนามสกุล: ${TEST_DATA.lastName}...`);
  const lastNameInput = inputByLabel(/นามสกุล/);
  if (await lastNameInput.isVisible().catch(() => false)) {
    await forceFill(lastNameInput, TEST_DATA.lastName);
    console.log(`   ✅  กรอกนามสกุล "${TEST_DATA.lastName}" แล้ว`);
    await page.waitForTimeout(300);
  } else {
    console.log('   ⚠️  ไม่พบ field นามสกุล');
  }

  // 6.5.7 อีเมล
  console.log(`   📧  กรอกอีเมล: ${TEST_DATA.email}...`);
  const emailInput = inputByLabel('อีเมล');
  if (await emailInput.isVisible().catch(() => false)) {
    await emailInput.fill(TEST_DATA.email);
    await page.waitForTimeout(300);
  }

  // 6.5.8 หมายเลขโทรศัพท์
  console.log(`   📱  กรอกเบอร์โทร: ${TEST_DATA.phone}...`);
  const phoneInput = inputByLabel('หมายเลขโทรศัพท์');
  if (await phoneInput.isVisible().catch(() => false)) {
    await phoneInput.fill(TEST_DATA.phone);
    await page.waitForTimeout(300);
  }

  // 6.5.9 กดปุ่ม "ยืนยันข้อมูล"
  console.log('   ✅  กดปุ่ม "ยืนยันข้อมูล"...');
  const confirmBtn = page.getByRole('button', { name: /ยืนยันข้อมูล/i });
  await confirmBtn.waitFor({ state: 'visible', timeout: 10000 });
  await confirmBtn.click();
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
  console.log('✅  ยืนยันข้อมูลตัวตนเสร็จสิ้น');

  // ── 7. ยอมรับ consent ทั้งหมด แล้วกด ถัดไป → /health ─────────────────────
  console.log('📋  ยอมรับ consent และกด "ถัดไป"...');

  // helper: ยอมรับ consent modal แล้ว force-close
  const acceptConsent = async (modalId) => {
    const acceptBtn = page.locator(`${modalId} .btn--submit`);
    if (await acceptBtn.isVisible().catch(() => false)) {
      await acceptBtn.click();
      await page.waitForTimeout(300);
    }
    await page.evaluate((id) => {
      const m = document.querySelector(id);
      if (m) { m.classList.remove('show'); m.style.display = 'none'; }
      document.querySelector('.modal-backdrop')?.remove();
      document.body.classList.remove('modal-open');
    }, modalId).catch(() => {});
  };

  // รอ consent labels ปรากฏ
  await page.locator('label.checkbox-label[data-target^="#consent-"]').first()
    .waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  await dismissOverlays();

  const consentLabels = await page.locator('label.checkbox-label[data-target^="#consent-"]').all();
  console.log(`   พบ ${consentLabels.length} consent(s)`);

  for (const lbl of consentLabels) {
    const target = await lbl.getAttribute('data-target');
    if (!target) continue;
    const checkboxId = await lbl.getAttribute('for');
    const isChecked = checkboxId
      ? await page.locator(`#${checkboxId}`).isChecked().catch(() => false)
      : false;
    if (!isChecked) {
      await lbl.click();
      await page.waitForTimeout(500);
      await acceptConsent(target);
      await page.waitForTimeout(300);
    }
  }

  // ปิด modal ที่อาจค้างอยู่
  await page.evaluate(() => {
    document.querySelectorAll('.modal.show').forEach(m => {
      m.classList.remove('show'); m.style.display = 'none';
    });
    document.querySelector('.modal-backdrop')?.remove();
    document.body.classList.remove('modal-open');
  }).catch(() => {});
  await dismissOverlays();
  await page.waitForTimeout(500);

  const nextToHealth = page.locator('button[type="submit"]:has-text("ถัดไป")');
  await nextToHealth.waitFor({ state: 'visible', timeout: 10000 });
  await nextToHealth.click();
  await page.waitForURL(/\/health/, { timeout: 15000 }).catch(() => {});
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
  console.log('✅  ยอมรับ consent เสร็จสิ้น — เข้าสู่หน้าข้อมูลสุขภาพ');

  // ── 8. ข้อมูลสุขภาพ (/health) ─────────────────────────────────────────────
  console.log('🏥  กรอกข้อมูลสุขภาพ...');
  await dismissOverlays();
  await page.locator('input[type="number"]').first()
    .waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});

  // ส่วนสูง (number input แรก)
  const heightInput = page.locator('input[type="number"]').first();
  if (await heightInput.isVisible().catch(() => false)) {
    await heightInput.fill(TEST_DATA.height);
  }
  // น้ำหนัก (number input ที่สอง)
  const weightInput = page.locator('input[type="number"]').nth(1);
  if (await weightInput.isVisible().catch(() => false)) {
    await weightInput.fill(TEST_DATA.weight);
  }

  // คลิก "ไม่/ไม่มี/ไม่เคย" (ตัวแรกของแต่ละ radio group)
  await page.evaluate(() => {
    const seen = new Set();
    document.querySelectorAll('input[type="radio"]').forEach(r => {
      if (!seen.has(r.name)) {
        seen.add(r.name);
        const lbl = r.nextElementSibling;
        if (lbl) lbl.click(); else r.click();
      }
    });
  });
  await page.waitForTimeout(500);
  await dismissOverlays();

  await page.locator('button:has-text("ถัดไป")').click();
  await page.waitForURL(/\/fatca/, { timeout: 15000 }).catch(() => {});
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
  console.log('✅  กรอกข้อมูลสุขภาพเสร็จสิ้น');

  // ── 9. CRS/FATCA (/fatca) ─────────────────────────────────────────────────
  console.log('🌍  กรอกข้อมูล CRS/FATCA...');
  await dismissOverlays();
  await page.locator('input[type="radio"]').first()
    .waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});

  // CRS: มีถิ่นที่อยู่ทางภาษีเฉพาะในประเทศไทย → ใช่ (radio แรก)
  await page.evaluate(() => {
    const r = document.querySelector('input[name="crs[only_thailand]"]');
    if (r) { const lbl = r.nextElementSibling; if (lbl) lbl.click(); else r.click(); }
  });
  await page.waitForTimeout(300);

  // เมืองที่เกิด
  const birthCityInput = page.locator('input[name="crs[city_name]"]');
  if (await birthCityInput.isVisible().catch(() => false)) {
    await birthCityInput.fill(TEST_DATA.birthCity);
  }

  // ประเทศที่เกิด → Thailand (value 246)
  const birthCountrySelect = page.locator('select[name="crs[country_id]"]');
  if (await birthCountrySelect.isVisible().catch(() => false)) {
    await birthCountrySelect.selectOption('246');
  }

  // FATCA: คลิก "ไม่" ตัวแรกของทุก radio group ยกเว้น CRS
  await page.evaluate(() => {
    const seen = new Set();
    document.querySelectorAll('input[type="radio"]').forEach(r => {
      if (r.name === 'crs[only_thailand]') return;
      if (!seen.has(r.name)) {
        seen.add(r.name);
        const lbl = r.nextElementSibling;
        if (lbl) lbl.click(); else r.click();
      }
    });
  });
  await page.waitForTimeout(500);
  await dismissOverlays();

  await page.locator('button:has-text("ถัดไป")').click();
  await page.waitForURL(/\/applicant/, { timeout: 15000 }).catch(() => {});
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
  console.log('✅  กรอก CRS/FATCA เสร็จสิ้น');

  // ── 10. ข้อมูลส่วนบุคคล (/applicant) ────────────────────────────────────
  console.log('👤  กรอกข้อมูลส่วนบุคคล...');
  await dismissOverlays();
  await page.locator('select[name="applicant[nationality_id]"]')
    .waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});

  // สัญชาติ
  const natSel = page.locator('select[name="applicant[nationality_id]"]');
  if (await natSel.isVisible().catch(() => false)) await natSel.selectOption('ไทย');

  // สถานภาพสมรส
  const maritalSel = page.locator('select[name="applicant[marital_status_id]"]');
  if (await maritalSel.isVisible().catch(() => false)) await maritalSel.selectOption(TEST_DATA.maritalStatus);

  // กลุ่มอาชีพ
  const occGroupSel = page.locator('select[name="applicant[main_occupation_group_id]"]');
  if (await occGroupSel.isVisible().catch(() => false)) {
    await occGroupSel.selectOption(TEST_DATA.occupationGroup);
    await page.waitForTimeout(600);
  }

  // อาชีพ (โหลดหลังจากเลือกกลุ่ม)
  const occSel = page.locator('select[name="applicant[main_occupation_id]"]');
  if (await occSel.isVisible().catch(() => false)) {
    await occSel.selectOption(TEST_DATA.occupation).catch(() =>
      occSel.evaluate(s => {
        const opt = Array.from(s.options).find(o => o.value !== '');
        if (opt) { s.value = opt.value; s.dispatchEvent(new Event('change', { bubbles: true })); }
      })
    );
  }

  // รายได้ต่อปี
  const incomeInput = page.getByRole('textbox', { name: 'รายได้ (ต่อปี)' });
  if (await incomeInput.isVisible().catch(() => false)) await incomeInput.fill(TEST_DATA.annualIncome);

  // บ้านเลขที่
  const houseInput = page.getByRole('textbox', { name: 'บ้านเลขที่' });
  if (await houseInput.isVisible().catch(() => false)) await houseInput.fill(TEST_DATA.houseNo);

  // จังหวัด → รอ district โหลด
  const provinceSel = page.locator('select[name="applicant[address_registered][province_id]"]');
  if (await provinceSel.isVisible().catch(() => false)) {
    await provinceSel.selectOption(TEST_DATA.province);
    await page.waitForTimeout(800);
  }

  // เขต/อำเภอ
  const districtSel = page.locator('select[name="applicant[address_registered][district_id]"]');
  if (await districtSel.isVisible().catch(() => false)) {
    await districtSel.selectOption(TEST_DATA.district).catch(() =>
      districtSel.evaluate(s => {
        const opt = Array.from(s.options).find(o => o.value !== '');
        if (opt) { s.value = opt.value; s.dispatchEvent(new Event('change', { bubbles: true })); }
      })
    );
    await page.waitForTimeout(800);
  }

  // แขวง/ตำบล (เลือก option แรกที่ไม่ใช่ placeholder)
  const subdistrictSel = page.locator('select[name="applicant[address_registered][subdistrict_id]"]');
  if (await subdistrictSel.isVisible().catch(() => false)) {
    await subdistrictSel.evaluate(s => {
      const opt = Array.from(s.options).find(o => o.value !== '');
      if (opt) { s.value = opt.value; s.dispatchEvent(new Event('change', { bubbles: true })); }
    }).catch(() => {});
    await page.waitForTimeout(300);
  }

  await dismissOverlays();
  await page.locator('button:has-text("ถัดไป")').click();
  await page.waitForURL(/\/beneficiary/, { timeout: 15000 }).catch(() => {});
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
  console.log('✅  กรอกข้อมูลส่วนบุคคลเสร็จสิ้น');

  // ── 11. ผู้รับผลประโยชน์ (/beneficiary) ──────────────────────────────────
  console.log('👥  กรอกข้อมูลผู้รับผลประโยชน์...');
  await dismissOverlays();
  await page.locator('select[name*="beneficiary"][name*="title_id"]')
    .waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});

  const benPrefix = page.locator('select[name*="beneficiary"][name*="title_id"]').first();
  if (await benPrefix.isVisible().catch(() => false)) await benPrefix.selectOption(TEST_DATA.beneficiaryPrefix);

  const benFirst = page.locator('input[name*="beneficiary"][name*="first_name"]').first();
  if (await benFirst.isVisible().catch(() => false)) await benFirst.fill(TEST_DATA.beneficiaryFirstName);

  const benLast = page.locator('input[name*="beneficiary"][name*="last_name"]').first();
  if (await benLast.isVisible().catch(() => false)) await benLast.fill(TEST_DATA.beneficiaryLastName);

  const benRelation = page.locator('select[name*="beneficiary"][name*="relation_id"]').first();
  if (await benRelation.isVisible().catch(() => false)) await benRelation.selectOption(TEST_DATA.beneficiaryRelation);

  // ใช้ name$="[age]" (ends-with) เพื่อหลีกเลี่ยง "percentage" ที่มี substring "age"
  const benAge = page.locator('input[name$="[age]"]').first();
  if (await benAge.isVisible().catch(() => false)) {
    await benAge.fill(TEST_DATA.beneficiaryAge);
    console.log(`   ✅  กรอกอายุผู้รับผลประโยชน์ ${TEST_DATA.beneficiaryAge} แล้ว`);
  } else {
    console.warn('   ⚠️  ไม่พบ field อายุผู้รับผลประโยชน์');
  }

  await dismissOverlays();
  await page.locator('button:has-text("ถัดไป")').click();
  await page.waitForURL(/\/tax/, { timeout: 15000 }).catch(() => {});
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
  console.log('✅  กรอกผู้รับผลประโยชน์เสร็จสิ้น');

  // ── 12. สิทธิขอยกเว้นภาษี (/tax) ─────────────────────────────────────────
  console.log('💼  เลือกสิทธิขอยกเว้นภาษี...');
  await dismissOverlays();
  await page.locator('input[type="radio"]').first()
    .waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});

  // คลิก radio ตามที่กำหนด (index 0 = ไม่มีความประสงค์, index 1 = มีความประสงค์)
  const taxRadioIdx = TEST_DATA.wantTaxExemption ? 1 : 0;
  await page.evaluate((idx) => {
    const radios = document.querySelectorAll('input[type="radio"]');
    const r = radios[idx];
    if (r) { const lbl = r.nextElementSibling; if (lbl) lbl.click(); else r.click(); }
  }, taxRadioIdx);
  await page.waitForTimeout(300);

  await dismissOverlays();
  await page.locator('button:has-text("ถัดไป")').click();
  await page.waitForURL(/\/document/, { timeout: 15000 }).catch(() => {});
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
  console.log('✅  เลือกสิทธิภาษีเสร็จสิ้น');

  // ── 13. อัปโหลดเอกสาร (/document) ───────────────────────────────────────
  console.log('📎  อัปโหลดเอกสาร...');
  await dismissOverlays();
  await page.waitForTimeout(1000);

  // ภาพหน้าบัตรประชาชน
  if (fs.existsSync(TEST_DATA.idCardImagePath)) {
    await page.locator('input[name="idcard_front"]')
      .setInputFiles(TEST_DATA.idCardImagePath).catch(() => {});
    await page.waitForTimeout(1000);
    console.log('   ✅  อัปโหลดภาพหน้าบัตรแล้ว');
  } else {
    console.warn(`⚠️  ไม่พบไฟล์: ${TEST_DATA.idCardImagePath} — ข้ามขั้นตอนนี้`);
  }

  // ภาพถ่ายคู่บัตร
  if (fs.existsSync(TEST_DATA.selfieImagePath)) {
    await page.locator('input[name="idcard_selfie"]')
      .setInputFiles(TEST_DATA.selfieImagePath).catch(() => {});
    await page.waitForTimeout(1000);
    console.log('   ✅  อัปโหลดภาพถ่ายคู่บัตรแล้ว');
  }

  await dismissOverlays();
  await page.locator('button:has-text("ถัดไป")').click();
  await page.waitForURL(/\/policy/, { timeout: 15000 }).catch(() => {});
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
  console.log('✅  อัปโหลดเอกสารเสร็จสิ้น');

  // ── 13.5 แจ้งวิธีการรับเล่มกรมธรรม์ (/policy) ───────────────────────────
  console.log('📬  เลือกวิธีการรับกรมธรรม์และใบเสร็จ...');
  await dismissOverlays();
  await page.waitForTimeout(1000);

  // radio name="policy_format"      : EMAIL = e-policy, POSTAL = ไปรษณีย์
  // radio name="document_delivery_format" : EMAIL = e-policy, POSTAL = ไปรษณีย์
  const deliveryValueMap = { 'e-policy': 'EMAIL', 'ไปรษณีย์': 'POSTAL' };

  const clickDeliveryLabel = async (fieldName, choice) => {
    const val = deliveryValueMap[choice] || 'EMAIL';
    const id = `${fieldName}_${val.toLowerCase()}`;
    const lbl = page.locator(`label[for="${id}"]`);
    if (await lbl.isVisible().catch(() => false)) {
      await lbl.click();
      await page.waitForTimeout(600);
      // ปิด modal ที่อาจโผล่หลังเลือก (ePolicyModal, postalPolicyModal, eReceiptModal)
      const openModal = page.locator('.modal.show').filter({ has: page.locator('[data-dismiss="modal"]') });
      if (await openModal.isVisible().catch(() => false)) {
        await openModal.locator('[data-dismiss="modal"]').click();
        await page.waitForTimeout(500);
        console.log('   🔔  ปิด popup แจ้งเตือนแล้ว');
      }
      return true;
    }
    return false;
  };

  // วิธีการรับเล่มกรมธรรม์
  const policyOk = await clickDeliveryLabel('policy_format', TEST_DATA.policyDelivery);
  if (policyOk) {
    console.log(`   ✅  เลือกรับกรมธรรม์แบบ: ${TEST_DATA.policyDelivery}`);
  } else {
    console.warn(`   ⚠️  ไม่พบตัวเลือก "${TEST_DATA.policyDelivery}" สำหรับกรมธรรม์`);
  }

  // วิธีการรับเอกสารใบเสร็จ
  const receiptOk = await clickDeliveryLabel('document_delivery_format', TEST_DATA.receiptDelivery);
  if (receiptOk) {
    console.log(`   ✅  เลือกรับใบเสร็จแบบ: ${TEST_DATA.receiptDelivery}`);
  } else {
    console.warn(`   ⚠️  ไม่พบตัวเลือก "${TEST_DATA.receiptDelivery}" สำหรับใบเสร็จ`);
  }

  await dismissOverlays();
  await page.locator('button:has-text("ถัดไป")').click();
  await page.waitForURL(/\/confirm/, { timeout: 15000 }).catch(() => {});
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
  console.log('✅  เลือกวิธีรับกรมธรรม์เสร็จสิ้น');

  // ── 13.6 ยืนยันคำสั่งซื้อ (/confirm) ────────────────────────────────────
  console.log('✔️   กดปุ่ม "ยืนยันคำสั่งซื้อ"...');
  await dismissOverlays();
  const confirmOrderBtn = page.locator('button[wire\\:click*="confirmed"]');
  await confirmOrderBtn.waitFor({ state: 'visible', timeout: 10000 });
  await confirmOrderBtn.click();
  await page.waitForTimeout(2000);

  // ── 13.6.1 ปิด quotationOutdatedModal (ถ้ามี — ไม่มีปุ่มปิด ต้อง force close)
  const outdatedModal = page.locator('#quotationOutdatedModal');
  if (await outdatedModal.isVisible().catch(() => false)) {
    console.log('   ⚠️  พบ quotationOutdatedModal — force close...');
    await page.evaluate(() => {
      const m = document.querySelector('#quotationOutdatedModal');
      if (m) { m.classList.remove('show'); m.style.display = 'none'; }
      document.querySelector('.modal-backdrop')?.remove();
      document.body.classList.remove('modal-open');
    });
    await page.waitForTimeout(500);
  }
  console.log('✅  กดยืนยันคำสั่งซื้อเสร็จสิ้น');

  // ── 14. OTP — ขอรหัสผ่าน confirmOtpModal ────────────────────────────────
  console.log('📱  รอ confirmOtpModal...');
  const otpModal = page.locator('#confirmOtpModal');
  await otpModal.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});

  if (await otpModal.isVisible().catch(() => false)) {
    // กรอกเบอร์โทร (wire:model="phone_number")
    const phoneOtpInput = otpModal.locator('input[wire\\:model="phone_number"], input[wire\\:model\\.defer="phone_number"]');
    if (await phoneOtpInput.isVisible().catch(() => false)) {
      const currentVal = await phoneOtpInput.inputValue().catch(() => '');
      if (!currentVal) {
        await phoneOtpInput.fill(TEST_DATA.phone);
        await page.waitForTimeout(300);
        console.log(`   ✅  กรอกเบอร์โทร ${TEST_DATA.phone} ใน OTP modal แล้ว`);
      } else {
        console.log(`   ℹ️  เบอร์โทรมีค่าอยู่แล้ว: ${currentVal}`);
      }
    }

    // กด "ขอรหัส"
    const sendOtpBtn = otpModal.locator('button[wire\\:click="send"]');
    if (await sendOtpBtn.isVisible().catch(() => false)) {
      await sendOtpBtn.click();
      await page.waitForTimeout(2000); // รอ OTP generate
      console.log('   ✅  กด "ขอรหัส" แล้ว — รอ OTP...');
    }

    // ── 14.1 ดึง OTP จากหน้าจอ (UAT แสดง "Debug OTP: XXXXXX" บนหน้า)
    const otpDebugEl = otpModal.locator('p').filter({ hasText: /Debug OTP/i });
    const otpDebugText = await otpDebugEl.innerText().catch(() => '');
    const otpCode = otpDebugText.match(/Debug OTP[:\s]+(\d+)/i)?.[1] || '';

    if (otpCode) {
      console.log(`   🔑  ดึง OTP ได้: ${otpCode}`);

      // กรอก OTP ทีละ digit ผ่าน evaluate — trigger input/change events สำหรับ Livewire/Alpine
      const filledCount = await page.evaluate(({ otp }) => {
        const modal = document.querySelector('#confirmOtpModal');
        // กรองเฉพาะ input ที่ visible (offsetParent !== null) เพื่อหลีกเลี่ยง phone input ที่ซ่อนอยู่
        const inputs = modal
          ? Array.from(modal.querySelectorAll('input')).filter(el => el.offsetParent !== null)
          : [];
        inputs.forEach((inp, i) => {
          if (i < otp.length) {
            inp.value = otp[i];
            inp.dispatchEvent(new Event('input', { bubbles: true }));
            inp.dispatchEvent(new Event('change', { bubbles: true }));
            inp.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
          }
        });
        return inputs.length;
      }, { otp: otpCode });
      console.log(`   ✅  กรอก OTP ${otpCode} ใน ${filledCount} ช่อง แล้ว`);
      await page.waitForTimeout(500);

      // กด "ยืนยัน" (wire:click="verify") ผ่าน evaluate
      const confirmed = await page.evaluate(() => {
        const modal = document.querySelector('#confirmOtpModal');
        const btn = modal && Array.from(modal.querySelectorAll('button'))
          .find(b => b.textContent.trim() === 'ยืนยัน');
        if (btn) { btn.click(); return true; }
        return false;
      });
      if (confirmed) {
        await page.waitForTimeout(3000);
        console.log('   ✅  กด "ยืนยัน" OTP เสร็จสิ้น');
      } else {
        console.warn('   ⚠️  ไม่พบปุ่ม "ยืนยัน" ใน OTP modal');
      }
    } else {
      console.warn('   ⚠️  ไม่พบ Debug OTP บนหน้าจอ — รอ manual 2 นาที...');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📱  กรุณากรอก OTP บนหน้าจอแล้วกดยืนยันด้วยตัวเอง');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      await page.waitForTimeout(120000);
    }
  }

  // ── 15. เลือกช่องทางชำระเงิน (/payment) ─────────────────────────────────
  console.log('💵  รอหน้า payment และเลือกช่องทางชำระเงิน: เงินสด...');
  await page.waitForURL(/\/payment/, { timeout: 15000 }).catch(() => {});
  await page.waitForLoadState('domcontentloaded');
  await dismissOverlays();
  await page.waitForTimeout(1000);

  // payment ใช้ label.payment__item (Alpine.js @click) ไม่ใช่ radio button
  const cashClicked = await page.evaluate(() => {
    const label = Array.from(document.querySelectorAll('label.payment__item'))
      .find(l => l.textContent.includes('เงินสด'));
    if (!label) return false;
    label.click();
    return true;
  });

  if (cashClicked) {
    console.log('✅  เลือก "เงินสด" แล้ว');
    await page.waitForTimeout(500);
    // กด ถัดไป (submit button แสดงเมื่อเลือก payment method แล้ว)
    await page.evaluate(() => {
      const btn = document.querySelector('button[type="submit"].btn--submit');
      if (btn) btn.click();
    });
    await page.waitForURL(/\/success/, { timeout: 15000 }).catch(() => {});
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    console.log('✅  ชำระเงิน (เงินสด) เสร็จสิ้น');
  } else {
    console.warn('⚠️  ไม่พบ label เงินสด — อาจต้องเลือกช่องทางชำระเงินด้วยตัวเอง');
  }

  // ── 16. หน้า success — ดึงเลขที่อ้างอิง (/success) ──────────────────────
  console.log('🔍  ดึงเลขที่อ้างอิง...');
  await page.waitForURL(/\/success/, { timeout: 15000 }).catch(() => {});
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);

  let referenceNumber = 'ไม่พบ';
  const bodyText = await page.locator('body').innerText().catch(() => '');
  // หน้า success แสดง "ตามเลขที่อ้างอิง 6781613"
  const refMatch = bodyText.match(/ตามเลขที่อ้างอิง\s+(\d+)/i)
    || bodyText.match(/(?:ใบคำขอ|เลขที่|อ้างอิง|Ref)[^\d]*(\d{6,12})/i)
    || bodyText.match(/\b(\d{7,12})\b/);
  if (refMatch) {
    referenceNumber = refMatch[1];
  }

  // กดปุ่ม "เสร็จสิ้น" เพื่อจบ flow
  const finishBtn = page.getByRole('button', { name: /เสร็จสิ้น/i })
    .or(page.locator('a').filter({ hasText: /เสร็จสิ้น/i }));
  if (await finishBtn.first().isVisible().catch(() => false)) {
    await finishBtn.first().click();
    await page.waitForTimeout(1000);
    console.log('✅  กด "เสร็จสิ้น" แล้ว');
  }

  const result = {
    timestamp: new Date().toISOString(),
    referenceNumber,
    testData: { firstName: TEST_DATA.firstName, lastName: TEST_DATA.lastName, phone: TEST_DATA.phone },
    url: page.url(),
  };
  const resultPath = path.resolve(__dirname, 'fixtures', 'last_run_result.json');
  fs.writeFileSync(resultPath, JSON.stringify(result, null, 2), 'utf8');

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🎉  เสร็จสิ้น Phase 1`);
  console.log(`📋  เลขใบคำขอ: ${referenceNumber}`);
  console.log(`💾  บันทึกผลที่: playwright/fixtures/last_run_result.json`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

/*
 * SETUP:
 * ──────────────────────────────────────────────────────
 * 1. วางไฟล์รูปบัตรประชาชนไว้ที่:  playwright/fixtures/id_card.jpg
 *
 * 2. (Optional) ตั้ง env vars แทนการแก้ TEST_DATA:
 *    set DS_GENDER=ผู้ชาย
 *    set DS_FIRSTNAME=สมชาย
 *    set DS_LASTNAME=ใจดี
 *    set DS_IDCARD=1100100100001
 *    set DS_BIRTHDATE=10/01/2539
 *    set DS_PHONE=0812345678
 *    set DS_EMAIL=test@example.com
 *    set DS_PREMIUM=20000
 *    set DS_NATIONALITY=ชาวไทย
 *    set DS_IDCARD_EXPIRY=ตลอดชีพ
 *    set DS_PREFIX=นาย
 *
 * 3. รันคำสั่ง:
 *    cd playwright
 *    npx playwright test digital-sale-phase1.spec.js --headed
 *
 * ⚠️  หมายเหตุ:
 *    - Script จะหยุดรอ 2 นาทีตอน OTP — กรอก OTP บนหน้าจอด้วยตัวเอง
 *    - เลขใบคำขอจะถูกบันทึกไว้ที่ playwright/fixtures/last_run_result.json
 *    - หาก selector ไม่ตรงกับหน้าจริง ให้ใช้ --headed แล้ว inspect element
 * ──────────────────────────────────────────────────────
 */
