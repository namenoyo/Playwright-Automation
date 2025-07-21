
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const cisData = require('../data/cis.data');
const { sendTestResultToGoogleSheetGSAppScript } = require('../utils/google-sheet-gsappscript.helper');
const { GoogleSheet } = require('../utils/google-sheet-OAuth.helper');
const { formatQuery } = require('../utils/common');

test.describe('API Customer Policy', () => {
  let context;
  let results = [];
  let policyNumbers = [];


  test.beforeAll(async () => {
    context = await test.request.newContext();
    results = [];
    // DEBUG: log โครงสร้าง cisData
    console.log('cisData typeof:', typeof cisData);
    if (Array.isArray(cisData)) {
      console.log('cisData[0]:', JSON.stringify(cisData[0]));
    } else if (cisData && typeof cisData === 'object') {
      console.log('cisData keys:', Object.keys(cisData));
      if (Array.isArray(cisData.policyNumbers)) {
        console.log('cisData.policyNumbers[0]:', JSON.stringify(cisData.policyNumbers[0]));
      }
    }
    // รองรับทั้งกรณี export array ตรงๆ, array ของ object, หรือ object ที่มี key policyNo/policy_number
    if (Array.isArray(cisData.policyNumbers) && typeof cisData.policyNumbers[0] === 'string') {
      policyNumbers = cisData.policyNumbers;
    } else if (Array.isArray(cisData.policyNumbers) && typeof cisData.policyNumbers[0] === 'object') {
      policyNumbers = cisData.policyNumbers.map(obj => obj.policyNo || obj.policy_number).filter(Boolean);
    } else if (Array.isArray(cisData) && typeof cisData[0] === 'object') {
      policyNumbers = cisData.map(obj => obj.policyNo || obj.policy_number).filter(Boolean);
    } else if (cisData.policyNo || cisData.policy_number) {
      policyNumbers = [cisData.policyNo || cisData.policy_number];
    } else {
      policyNumbers = [];
    }
    console.log('policyNumbers:', policyNumbers.slice(0, 5));
    if (!policyNumbers.length) throw new Error('No policyNumbers found in cis.data.js');
  });

  test('GET all customer by policyNumbers', async () => {
    for (const policyNo of policyNumbers) {
      const url = `https://11.100.8.44/thaisamut/rs/cisappapi/v2/customer/policy?policyNo=${policyNo}`;
      const resp = await context.get(url, { ignoreHTTPSErrors: true });
      expect(resp.ok()).toBeTruthy();
      const contentType = resp.headers()['content-type'] || '';
      const text = await resp.text();
      if (contentType.includes('application/json') && text.trim()) {
        const data = JSON.parse(text);
        console.log('API DATA:', data); // log ข้อมูลที่ได้จาก API
        if (Array.isArray(data)) {
          for (const item of data) {
            results.push({
              policyNo: item.policyNo,
              name: item.name,
              surname: item.surname,
              genderName: item.genderName,
              cardNo: item.cardNo,
              cardType: item.cardType,
              apiData: item
            });
          }
        } else {
          results.push({
            policyNo: data.policyNo,
            name: data.name,
            surname: data.surname,
            genderName: data.genderName,
            cardNo: data.cardNo,
            cardType: data.cardType,
            apiData: data // เก็บข้อมูล API DATA ทั้งหมด
          });
        }
        console.log('Success:', policyNo);
      } else {
        console.log('Not JSON or empty body:', policyNo, resp.status());
      }
    }
  });

  test.afterAll(async () => {



    // Log ผลลัพธ์ทั้งหมดก่อน export
    console.log('All results:', results);

    // Export to Google Sheet (// ตรวจสอบในนี้ได้เลย tab : API_Swagger_Alteration ) แบบทีละแถว พร้อม API DATA เต็ม
    try {
      for (const r of results) {
        await sendTestResultToGoogleSheetGSAppScript({
          suite: 'API_Swagger_Alteration',
          caseName: r.policyNo,
          assertionLog: JSON.stringify(r.apiData, null, 2), // ส่งข้อมูล API DATA เต็ม
          status: 'Success',
          testTime: new Date().toLocaleString(),
          tester: process.env.TESTER || 'Auto',
          duration: '',
          errorMessage: ''
        });
      }
      console.log('Exported to Google Sheet API_Swagger_Alteration');
    } catch (err) {
      console.error('Failed to export to Google Sheet:', err);
    }

    await context.dispose();
  });
});


test ('Prepare Test Data - Step 2', async () => {
  const gs = new GoogleSheet();

  // เริ่มต้น Auth
  const auth = await gs.initAuth();

  // ส่ง spreadsheetId และ range มาจากไฟล์ test
  const spreadsheetId = '1HTN4nBwcEt2Uff4Al2vaa49db-kbc_LTe0G_99lB3FY'; 
  const range = 'ดึงจาก API_Data_swagger.spec.js!G2:H'; 

  const rows = await gs.fetchSheetData(auth, spreadsheetId, range);

  console.log('=== Google Sheet Data ===');
  console.table(rows);

  // ตัวอย่างการตรวจสอบข้อมูล
  expect(rows.length).toBeGreaterThan(0);

  const query_step2 = await gs.fetchSheetData(auth, spreadsheetId, 'Step_Prepare_Test Data!E7');
  console.log('=== Query Step 2 ===', typeof query_step2[0][0]);

  console.log('=== Formatted Query ===', formatQuery(query_step2[0][0]));

  // // update ข้อมูลลง google sheet
  // const updatedRows = await gs.updateRows(auth, spreadsheetId, 'ดึงจาก API_Data_swagger.spec.js!G9:H', rows);
  // console.log('=== Updated Rows ===', updatedRows);
});

