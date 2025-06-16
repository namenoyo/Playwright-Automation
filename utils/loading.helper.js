// loading.helper.js
// ฟังก์ชันช่วยรอ loading dialog "กรุณารอสักครู่" ให้หายไป
const { expect } = require('@playwright/test');

async function waitForLoadingDialogGone(page) {
  const loadingLocator = page.getByText('กรุณารอสักครู่', { exact: false });
  try {
    // รอให้ loading ปรากฏ (ถ้ามี) ภายใน 10 วินาที
    await loadingLocator.waitFor({ state: 'visible', timeout: 10000 });
  } catch (e) {
    // ถ้าไม่เจอ loading ภายใน 10 วินาที ให้ข้ามไป
  }
  try {
    // รอให้ loading หายไป (detached) ภายใน 60 วินาที
    await loadingLocator.waitFor({ state: 'detached', timeout: 60000 });
  } catch (e) {
    // ถ้าไม่เจอ loading ก็ข้ามไป
  }
}

module.exports = { waitForLoadingDialogGone };
