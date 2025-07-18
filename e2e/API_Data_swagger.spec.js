
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const cisData = require('../data/cis.data');
const { sendTestResultToGoogleSheetGSAppScript } = require('../utils/google-sheet-gsappscript.helper');

import { googleSheet } from '../utils/google-sheet.helper';

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


test ('Prepare Test Data - Step 2', async ({ request }) => {
  const googlesheet = new googleSheet();

  const tokenapi = 'my-secret-token';
  const spreadsheetid = '17Is4JKQymvdsOV32YgFBUvzUzghAy5r1QIF31nRBTVw';
  const sheetname = 'Jira';
  const columns = '';

  const apiUrl = `https://script.google.com/a/macros/ocean.co.th/s/AKfycbz5QSaYwBQRqBU5YM1qEA1ie9MNsTmmVcdM0PY0zTB9X1VS3y8xoIYcyOUl-n37gp6t/exec?token=${tokenapi}&spreadsheet=${spreadsheetid}&sheet=${sheetname}&cols=${columns}`;

  console.log('Fetching data from API Google Sheet:', apiUrl);

  const response = await request.get(apiUrl);
  console.log(response);
  // const data = await response.json();
  // console.log('Fetched data:', data);

  // const data = await googlesheet.fetchDataFromAPIGoogleSheet(apiUrl);
  // console.log(data)
})
