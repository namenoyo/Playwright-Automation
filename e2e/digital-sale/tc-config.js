/**
 * Digital Sale — TC Registry
 *
 * ไฟล์นี้กำหนดเฉพาะ: flow, expect outcome
 * ข้อมูล test (gender, DOB, premium ฯลฯ) ดึงจาก Google Sheet column "Test Data" ที่ runtime
 * ผ่าน data/gsheet-loader.js → ไม่ต้อง hard-code ใน config นี้
 *
 * รัน TC เดียว:
 *   TC_ID=TC_DS_001 npx playwright test digital-sale/digital-sale-tc.spec.js --headed
 *
 * รันทุก TC ใน config:
 *   npx playwright test digital-sale/digital-sale-tc.spec.js --headed
 */

const TC_LIST = [
  // ─── Flow 1: เลือกผลิตภัณฑ์ & คำนวณ ─────────────────────────────────────

  {
    id: 'TC_DS_001',
    title: 'เลือกผลิตภัณฑ์ First Love 1810 — Happy Path',
    module: 'Digital Sale / Product',
    priority: 'H',
    type: 'Positive',
    flow: 'product-selection',
    // data: ดึงจาก Google Sheet → gsheet-loader.loadTcData(id)
    expect: {
      urlContains:      '/identity',
      formSelector:     '.radio-label',
      actualResultText: 'แสดงหน้ากรอกข้อมูลผู้เอาประกัน URL: /identity',
    },
  },

  {
    id: 'TC_DS_002',
    title: 'เลือกผลิตภัณฑ์ Save & Protect 888 — Happy Path',
    module: 'Digital Sale / Product',
    priority: 'H',
    type: 'Positive',
    flow: 'product-selection',
    // data: ดึงจาก Google Sheet → gsheet-loader.loadTcData(id)
    expect: {
      urlContains:      '/identity',
      formSelector:     '.radio-label',
      // paymentModeVerify ถูก set อัตโนมัติจาก sheetData.paymentMode ใน spec file
      actualResultText: 'แสดงหน้ากรอกข้อมูลผู้เอาประกัน URL: /identity',
    },
  },

  // TC_DS_003, ... เพิ่มที่นี่
];

module.exports = TC_LIST;
