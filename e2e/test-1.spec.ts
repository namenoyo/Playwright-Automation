import { test, expect } from '@playwright/test';
// @ts-ignore
const { LoginPage } = require('../pages/login.page');
// @ts-ignore
const { CISPage } = require('../pages/cis.page');
// @ts-ignore
const { validUser } = require('../data/login.data');
// @ts-ignore
const { policyNo } = require('../data/cis.data');

const ENV = process.env.ENV || 'sit';

test('CIS Customer Info Search', async ({ page }) => {
  const loginPage = new LoginPage(page, ENV);
  const cisPage = new CISPage(page);
  await loginPage.goto();
  await loginPage.login(validUser.username, validUser.password);
  await cisPage.goToCustomerInfo();
  await cisPage.searchPolicy(policyNo);
  await cisPage.clickDiamondButton();
  // สามารถเพิ่ม expect ตรวจสอบผลลัพธ์ได้'
});
