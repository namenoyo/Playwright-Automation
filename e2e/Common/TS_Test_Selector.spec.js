// TS_Test_Selector.spec.js (Playwright version)
const { test, expect } = require('@playwright/test');
const Selector = require('../../fixtures/Selector');
const { Go_to_NBS } = require('../../helpers/playwright-Go_to_NBS');
const { Go_to_CIS } = require('../../helpers/playwright-Go_to_CIS');
const { searchAndOpenCisPolicyDetail } = require('../../helpers/playwright-cis_Policy_Detail');
const { waitForCustomerInfoAndClaimHistory } = require('../../helpers/playwright-API_Wait');
const loginTestCases = require('../../fixtures/Data_Username');
const url = require('../../fixtures/Env_NBS_URL');
const testData = require('../../fixtures/Data_Test');

const testUser = loginTestCases.find(tc => tc.expectSuccess);
const NBS_URL = url.ENV_SIT_NBS;

test.describe('ตรวจสอบหน้าค้นหาข้อมูลลูกค้า', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1536, height: 960 }); // macbook-16
    await Go_to_NBS(page, {
      url: NBS_URL,
      userIndex: loginTestCases.findIndex(u => u.username === testUser.username)
    });
  });

  test('TC-Test_Selector-Main-Label-001', async ({ page }) => {
    await Go_to_CIS(page);
    const policyNo = testData[0].ORD_Policy_no;
    await searchAndOpenCisPolicyDetail(page, policyNo);
    await waitForCustomerInfoAndClaimHistory(page, Selector.SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_1_Header_Panel);
    // ตรวจสอบ selector หลัก
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
    for (const key of CIS_DETAIL_MENU_KEYS) {
      const sel = Selector[key];
      const selector = typeof sel === 'function' ? sel(policyNo) : sel;
      await expect(page.locator(selector)).toBeVisible();
    }
  });

  test('TC-Test_Selector-001', async ({ page }) => {
    await Go_to_CIS(page);
    const policyNo = testData[0].ORD_Policy_no;
    await searchAndOpenCisPolicyDetail(page, policyNo);
    await waitForCustomerInfoAndClaimHistory(page, Selector.SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_1_Header_Panel);
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
    for (const key of PANEL001_KEYS) {
      const sel = Selector[key];
      const selector = typeof sel === 'function' ? sel(policyNo) : sel;
      await expect(page.locator(selector)).toBeVisible();
    }
  });

  // ...สามารถแปลง test case อื่นๆ เพิ่มเติมได้ในรูปแบบเดียวกันนี้...
});
