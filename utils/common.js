const path = require('path');
const fs = require('fs');

const normalizeText = (text) => {
    // เปลี่ยน code &nbsp เป็น ค่าว่าง
    const codespace = String(text).replace(/\u00A0/g, ' ');
    // เปลี่ยน ค่าว่างหลายช่อง ให้เป็นค่าว่างช่องเดียว
    return codespace.replace(/\s+/g, ' ');
}

const changeobjecttoarray = (dataobject) => {
    const resultchangeobj = dataobject.rows.map(obj => Object.values(obj));
    return resultchangeobj;
}

const pulldataobjectfromkeys = (dataobject, field) => {
    const resultdatabasekeys = dataobject.rows.map(obj => field.map(key => obj[key]));
    return resultdatabasekeys;
}

const formatQuery = (query) => {
    return query
    .replace(/--.*$/gm, '')     // ลบ comment `-- ...` ทุกบรรทัด
    .replace(/\s*\n\s*/g, ' ')  // แปลงบรรทัดใหม่เป็น space
    .trim();
}

export const split_total_unit = (total_unit) => {
    const split_total = total_unit.replace(' บาท', '');
    return split_total;
}

const { quotationLocator } = require('../locators/SP_Life/splife.locators');
class popupAlert {
    constructor(page) {
        this.page = page;
        this.quatationlocator = quotationLocator(page);
    }

    async popupAlertMessage() {

        // ดึงข้อความใน pop-up แจ้งเตือน
        let popupmessage = '';

        await this.page.waitForTimeout(150); // รอ 150 ms

        if (await this.quatationlocator.popupAlert.isVisible({ timeout: 10000 })) {
            // ถ้า pop-up แจ้งเตือนปรากฏขึ้น ให้ดึงข้อความใน pop-up
            popupmessage = await this.quatationlocator.popupAlert.innerText();

            // ถ้ามี pop-up แจ้งเตือน ให้ปิด pop-up
            await this.quatationlocator.closePopupButton.click();
        } else if (await this.quatationlocator.popupAlertServer.isVisible({ timeout: 10000 })) {
            // ถ้า pop-up แจ้งเตือนปรากฏขึ้น ให้ดึงข้อความใน pop-up
            popupmessage = await this.quatationlocator.popupAlertServer.innerText();

            // ถ้ามี pop-up แจ้งเตือน ให้ปิด pop-up
            await this.quatationlocator.closePopupErrorServerButton.click();
        }

        return { popupmessage };
    }
}

const chunkRange = (index, totalChunks, totalItems) => {
  const size = Math.ceil(totalItems / totalChunks);
  const start = index * size;
  const end = Math.min(start + size, totalItems);
  return { start, end };
}

// อ่านจำนวน workers ที่ถูกเซฟไว้ตอนเริ่ม
const getMaxWorkers = () => {
  const filePath = path.resolve(__dirname, '../config/.worker_count');
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return parseInt(content, 10) || 1;
  } catch (e) {
    return 1;
  }
}

module.exports = { popupAlert, normalizeText, changeobjecttoarray, pulldataobjectfromkeys, formatQuery, split_total_unit, chunkRange, getMaxWorkers };