// loading.helper.js
// ฟังก์ชันช่วยรอ loading dialog "กรุณารอสักครู่" ให้หายไป
const { expect } = require('@playwright/test');

async function waitForLoadingDialogVisible(page, timeout = 60000) {
  const loadingLocator = page.getByText('กรุณารอสักครู่', { exact: false });
  try {
    await loadingLocator.waitFor({ state: 'visible', timeout });
  } catch (e) {
    // ถ้าไม่เจอ loading ภายใน timeout ให้ข้ามไป
  }
}

async function waitForLoadingDialogGone(page, timeout = 60000) {
  const loadingLocator = page.getByText('กรุณารอสักครู่', { exact: false });
  try {
    await loadingLocator.waitFor({ state: 'detached', timeout });
  } catch (e) {
    // ถ้าไม่เจอ loading ก็ข้ามไป
  }
}

module.exports = { waitForLoadingDialogGone, waitForLoadingDialogVisible };
