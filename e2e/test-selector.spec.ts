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
const { sendTestResultToGoogleSheetGSAppScript } = require('../utils/google-sheet-gsappscript.helper');
// @ts-ignore
const { logSelectorsSoftAssert } = require('../Reuseable/log');
const Selector = require('../locators/Selector.locator');

const ENV = process.env.ENV || 'sit';

test.describe('Selector Panel Test (Playwright)', () => {
  test('TC-Test_Selector-Main-Label-001', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000);
    const loginPage = new LoginPage(page, ENV);
    const cisPage = new CISPage(page);
    let status = 'Passed';
    let errorMessage = '';
    let assertionLog = '';
    try {
      await loginPage.goto();
      await loginPage.login(validUser.username, validUser.password);
      await cisPage.goToCustomerInfo();
      const customerId = await cisPage.searchPolicyAndGetCustomerId(policyNo);
      await cisPage.clickDiamondButtonAndWaitClaimHistory(customerId);

      const CIS_DETAIL_MENU_KEYS = [
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_In_Page_1_Menu_Bar_Label',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_In_Page_2_Menu_Bar_Label',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_In_Page_3_Menu_Bar_Label',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_In_Page_4_Menu_Bar_Label',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_In_Page_5_Menu_Bar_Label',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_In_Page_6_Menu_Bar_Label',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_In_Page_7_Menu_Bar_Label',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_In_Page_8_Menu_Bar_Label',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_In_Page_9_Menu_Bar_Label',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_In_Page_10_Menu_Bar_Label',
      ];
      const selectorsToCheck = CIS_DETAIL_MENU_KEYS.map(key => ({
        label: key,
        locator: page => page.locator(Selector[key])
      }));
      const result = await logSelectorsSoftAssert(page, selectorsToCheck, true);
      assertionLog = result.assertionLog;
      if (result.status === 'Failed') status = 'Failed';
    } catch (e) {
      status = 'Failed';
      errorMessage = e.message || String(e);
      throw e;
    } finally {
      await sendTestResultToGoogleSheetGSAppScript({
        suite: 'Selector Panel',
        caseName: testInfo.title,
        assertionLog,
        status,
        testTime: new Date().toLocaleString(),
        tester: process.env.TESTER || 'Auto',
        duration: testInfo.duration,
        errorMessage
      });
    }
  });

  test('TC-Test_Selector-001', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000);
    const loginPage = new LoginPage(page, ENV);
    const cisPage = new CISPage(page);
    let status = 'Passed';
    let errorMessage = '';
    let assertionLog = '';
    try {
      await loginPage.goto();
      await loginPage.login(validUser.username, validUser.password);
      await cisPage.goToCustomerInfo();
      const customerId = await cisPage.searchPolicyAndGetCustomerId(policyNo);
      await cisPage.clickDiamondButtonAndWaitClaimHistory(customerId);

      const PANEL001_KEYS = [
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_1_Header_Panel',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_2_Detail_Panel',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_3_Detail_Panel',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_4_Detail_Panel',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_5_Detail_Panel',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_6_Detail_Panel',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_7_Detail_Panel',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_8_Detail_Panel',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_9_Detail_Panel',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_10_Detail_Panel',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_11_Detail_Panel',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_12_Detail_Panel',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_13_Detail_Panel',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_14_Detail_Panel',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_15_Detail_Panel',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_16_Detail_Panel',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_17_Detail_Panel',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_18_Detail_Panel',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_19_Detail_Panel',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_20_Detail_Panel',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_21_Detail_Panel',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_22_Detail_Panel',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_23_Detail_Panel',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_24_Detail_Panel',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_25_Detail_Panel',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_26_Detail_Panel',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_27_Detail_Panel',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_28_Detail_Panel',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_29_Detail_Panel',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_30_Detail_Panel',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_31_Detail_Panel',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_32_Detail_Panel',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_33_Detail_Panel',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_34_Detail_Panel',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_35_Detail_Panel',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_36_Detail_Panel',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_37_Detail_Panel',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_38_Detail_Panel',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_39_Detail_Panel',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_40_Detail_Panel',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_41_Detail_Panel',
      ];
      const selectorsToCheck = PANEL001_KEYS.map(key => ({
        label: key,
        locator: page => page.locator(Selector[key])
      }));
      const result = await logSelectorsSoftAssert(page, selectorsToCheck, true);
      assertionLog = result.assertionLog;
      if (result.status === 'Failed') status = 'Failed';
    } catch (e) {
      status = 'Failed';
      errorMessage = e.message || String(e);
      throw e;
    } finally {
      await sendTestResultToGoogleSheetGSAppScript({
        suite: 'Selector Panel',
        caseName: testInfo.title,
        assertionLog,
        status,
        testTime: new Date().toLocaleString(),
        tester: process.env.TESTER || 'Auto',
        duration: testInfo.duration,
        errorMessage
      });
    }
  });

  test('TC-Test_Selector-002', async ({ page }, testInfo) => {
    testInfo.setTimeout(60000);
    const loginPage = new LoginPage(page, ENV);
    const cisPage = new CISPage(page);
    let status = 'Passed';
    let errorMessage = '';
    let assertionLog = '';
    try {
      await loginPage.goto();
      await loginPage.login(validUser.username, validUser.password);
      await cisPage.goToCustomerInfo();
      const customerId = await cisPage.searchPolicyAndGetCustomerId(policyNo);
      await cisPage.clickDiamondButtonAndWaitClaimHistory(customerId);

      const PANEL002_KEYS = [
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_2_In_Page_1_Header_Panel',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_2_In_Page_2_Button',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_2_In_Page_3_Head_Column_Data_Grid',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_2_In_Page_4_Data_Grid',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_2_In_Page_5_Data_Grid',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_2_In_Page_6_Head_Column_Data_Grid',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_2_In_Page_7_Data_Grid',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_2_In_Page_8_Data_Grid',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_2_In_Page_9_Head_Column_Data_Grid',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_2_In_Page_10_Data_Grid',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_2_In_Page_11_Data_Grid',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_2_In_Page_12_Head_Column_Data_Grid',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_2_In_Page_13_Data_Grid',
        'SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_2_In_Page_14_Data_Grid',
      ];
      const selectorsToCheck = PANEL002_KEYS.map(key => ({
        label: key,
        locator: page => page.locator(Selector[key])
      }));
      const result = await logSelectorsSoftAssert(page, selectorsToCheck, true);
      assertionLog = result.assertionLog;
      if (result.status === 'Failed') status = 'Failed';
    } catch (e) {
      status = 'Failed';
      errorMessage = e.message || String(e);
      throw e;
    } finally {
      await sendTestResultToGoogleSheetGSAppScript({
        suite: 'Selector Panel',
        caseName: testInfo.title,
        assertionLog,
        status,
        testTime: new Date().toLocaleString(),
        tester: process.env.TESTER || 'Auto',
        duration: testInfo.duration,
        errorMessage
      });
    }
  });
});
