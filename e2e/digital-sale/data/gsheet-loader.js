/**
 * Digital Sale — Google Sheet Test Data Loader
 * ดึงและ parse ข้อมูลจาก column "Test Data" (col I, index 8) ของ Google Sheet
 * ใช้เป็น source of truth แทนการ hard-code ใน tc-config.js
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const THAI_MONTHS = [
  '', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

/**
 * Parse raw "Test Data" text (key: value format, one per line) into structured JS object
 * รองรับ fields: URL, Product slug, Gender, DOB, Premium, Insured, Payment mode, Button
 */
function parseTestData(rawText) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const kv = {};
  for (const line of lines) {
    const idx = line.indexOf(':');
    if (idx > 0) {
      const key = line.slice(0, idx).trim().toLowerCase();
      const val = line.slice(idx + 1).trim();
      kv[key] = val;
    }
  }

  const data = {};

  // URL → derive product slug + category (e.g. /our-products/savings/first-love1810)
  const url = kv['url'] || '';
  const urlMatch = url.match(/\/our-products\/([^/]+)\/([^?/]+)/);
  if (urlMatch) {
    const [, category, slug] = urlMatch;
    data.product = { slug, category, searchKeyword: slug.replace(/-/g, ' ') };
  } else if (kv['product slug']) {
    const slug = kv['product slug'];
    data.product = { slug, category: 'savings', searchKeyword: slug.replace(/-/g, ' ') };
  }

  // Gender: ชาย → ผู้ชาย, หญิง → ผู้หญิง
  const genderRaw = (kv['gender'] || '').trim();
  if (genderRaw === 'ชาย' || genderRaw === 'ผู้ชาย') data.gender = 'ผู้ชาย';
  else if (genderRaw === 'หญิง' || genderRaw === 'ผู้หญิง') data.gender = 'ผู้หญิง';
  else if (genderRaw) data.gender = genderRaw;

  // DOB: DD/MM/YYYY(BE) → { day, month (Thai name), yearBE }
  const dob = kv['dob'] || '';
  const dobMatch = dob.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dobMatch) {
    const monthNum = parseInt(dobMatch[2], 10);
    data.birthDate = {
      day: parseInt(dobMatch[1], 10),
      month: THAI_MONTHS[monthNum] || String(monthNum),
      yearBE: parseInt(dobMatch[3], 10),
    };
  }

  // Premium: "20,000 บาท" → "20000"
  const premium = kv['premium'] || '';
  if (premium) data.premium = premium.replace(/[,\s]/g, '').replace('บาท', '').trim();

  // Insured: "500,000 บาท" → "500000"
  const insured = kv['insured'] || '';
  if (insured) data.insuredAmount = insured.replace(/[,\s]/g, '').replace('บาท', '').trim();

  // Payment mode
  if (kv['payment mode']) data.paymentMode = kv['payment mode'];

  // Button (calc button text)
  if (kv['button']) data.calcBtnName = kv['button'];

  return data;
}

/**
 * โหลด Test Data จาก Google Sheet สำหรับ TC ID ที่ระบุ
 * @param {string} tcId - เช่น "TC_DS_001"
 * @returns {object} structured test data
 */
async function loadTcData(tcId) {
  const credDir = path.resolve(__dirname, '../../credentials');
  const secretFile = fs.readdirSync(credDir).find(f => f.startsWith('client_secret'));
  const secret = JSON.parse(fs.readFileSync(path.join(credDir, secretFile), 'utf8'));
  const token = JSON.parse(fs.readFileSync(path.join(credDir, 'token.json'), 'utf8'));
  const { client_secret, client_id, redirect_uris } = secret.installed || secret.web;
  const auth = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  auth.setCredentials(token);
  const sheets = google.sheets({ version: 'v4', auth });

  const config = JSON.parse(fs.readFileSync(
    path.resolve(__dirname, '../../../Projects/Digital Sale/gsheet-config.json'), 'utf8'
  ));

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: config.sheet_id,
    range: `${config.sheet_name}!A:M`,
  });

  const rows = res.data.values || [];
  const row = rows.find(r => (r[1] || '').trim() === tcId);
  if (!row) throw new Error(`ไม่พบ TC "${tcId}" ใน Google Sheet (tab: ${config.sheet_name})`);

  const testDataRaw = row[8] || ''; // column I = index 8 = Test Data
  console.log(`📋 [${tcId}] Test Data จาก Sheet:\n${testDataRaw}`);

  const parsed = parseTestData(testDataRaw);
  console.log(`📋 [${tcId}] Parsed:`, JSON.stringify(parsed));
  return parsed;
}

module.exports = { loadTcData };
