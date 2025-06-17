import { test, expect } from '@playwright/test';
// @ts-ignore
const { LoginPage } = require('../pages/login.page');
// @ts-ignore
const { CISPage } = require('../pages/cis.page');
// @ts-ignore
const { validUser } = require('../data/login.data');
// @ts-ignore
const { policyNo } = require('../data/cis.data');
// @ts-ignore
const { updateTestStatus } = require('../utils/google-sheet.helper');

const ENV = process.env.ENV || 'sit';

test('TS_Test_Google-Sheet', async ({ page }, testInfo) => {
  const loginPage = new LoginPage(page, ENV);
  const cisPage = new CISPage(page);
  let status = 'Passed';
  try {
    await loginPage.goto();
    await loginPage.login(validUser.username, validUser.password);
    await cisPage.goToCustomerInfo();
    await cisPage.searchPolicy(policyNo);
    await cisPage.clickDiamondButton();
    // สามารถเพิ่ม expect ตรวจสอบผลลัพธ์ได้
  } catch (e) {
    status = 'Failed';
    throw e;
  } finally {
    // อัปเดตผลลัพธ์ลง Google Sheet
    await updateTestStatus(testInfo.title, status);
  }
});
