// // calendarHelper.js

// /**
//  * เลือกวันจาก calendar โดยรับค่าเป็น yyyyMMdd (ปี ค.ศ.)
//  * @param {import('@playwright/test').Page} page - Playwright page
//  * @param {string} yyyymmdd - วันที่ในรูปแบบ yyyyMMdd เช่น "20251203"
//  * @param {import('@playwright/test').Locator|string} dateInputSelector - selector ของ input หรือ Locator ที่เปิด calendar
//  */
// async function selectDate(page, yyyymmdd, dateInputSelector, RV = null) {
//   // 🔹 แยกวัน เดือน ปี (ค.ศ.)
//   const year = parseInt(yyyymmdd.substring(0, 4), 10);
//   const month = parseInt(yyyymmdd.substring(4, 6), 10);
//   const day = parseInt(yyyymmdd.substring(6, 8), 10);

//   // 🔹 Map เดือนภาษาไทย
//   const monthMap = {
//     1: 'มกราคม', 2: 'กุมภาพันธ์', 3: 'มีนาคม', 4: 'เมษายน',
//     5: 'พฤษภาคม', 6: 'มิถุนายน', 7: 'กรกฎาคม', 8: 'สิงหาคม',
//     9: 'กันยายน', 10: 'ตุลาคม', 11: 'พฤศจิกายน', 12: 'ธันวาคม'
//   };

//   // 🔹 แปลงปี ค.ศ. → พุทธ
//   const targetYearBuddhist = year + 543;
//   const targetMonthYear = `${monthMap[month]}, ${targetYearBuddhist}`;

//   console.log(`เลือกวันที่: ${day} ${monthMap[month]} ${targetYearBuddhist}`);

//   // 1️⃣ เปิด calendar
//   if (typeof dateInputSelector === 'string') {
//     await page.locator(dateInputSelector).click();
//   } else {
//     await dateInputSelector.click();
//   }

//   // 2️⃣ เลือกเดือนและปี (เฉพาะ calendar ที่เปิดจริง display:block)
//   let currentMonthYear = (
//     await page.locator('.calendar[style*="display: block"] .title').first().textContent()
//   ).trim();

//   while (currentMonthYear !== targetMonthYear) {
//     const [currentMonth, currentYear] = currentMonthYear.split(',').map(s => s.trim());
//     const currentMonthNum = parseInt(Object.keys(monthMap).find(k => monthMap[k] === currentMonth), 10);
//     const currentYearNum = parseInt(currentYear, 10); // ปีพุทธ

//     const currentValue = currentYearNum * 12 + currentMonthNum;
//     const targetValue = targetYearBuddhist * 12 + month;

//     if (currentValue > targetValue) {
//       // ย้อนกลับ ‹
//       await page.locator('.calendar[style*="display: block"] td.button.nav >> text=‹').click();
//     } else {
//       // ไปข้างหน้า ›
//       await page.locator('.calendar[style*="display: block"] td.button.nav >> text=›').click();
//     }

//     currentMonthYear = (
//       await page.locator('.calendar[style*="display: block"] .title').first().textContent()
//     ).trim();
//   }

//   // 3️⃣ เลือกวัน (exact match เท่านั้น)
//   if (RV) {
//     await page
//       .locator('.calendar[style*="display: block"] td.day.false')
//       .filter({ hasText: new RegExp(`^${day}$`) })
//       .first({ timeout: 5000 })
//       .click({ timeout: 5000 });
//   } else {
//     await page
//       .locator('.calendar[style*="display: block"] td.day.null')
//       .filter({ hasText: new RegExp(`^${day}$`) })
//       .first({ timeout: 5000 })
//       .click({ timeout: 5000 });
//   }
  

    

// }

// module.exports = { selectDate };



// calendarHelper.js

/**
 * เลือกวันจาก calendar โดยรับค่าเป็น yyyyMMdd (ปี ค.ศ.)
 * @param {import('@playwright/test').Page} page - Playwright page
 * @param {string} yyyymmdd - วันที่ในรูปแบบ yyyyMMdd เช่น "20251203"
 * @param {import('@playwright/test').Locator|string} dateInputSelector - selector ของ input หรือ Locator ที่เปิด calendar
 */
async function selectDate(page, yyyymmdd, dateInputSelector, RV = null) {
  // 🔹 แยกวัน เดือน ปี (ค.ศ.)
  const year = parseInt(yyyymmdd.substring(0, 4), 10);
  const month = parseInt(yyyymmdd.substring(4, 6), 10);
  const day = parseInt(yyyymmdd.substring(6, 8), 10);

  // 🔹 Map เดือนภาษาไทย
  const monthMap = {
    1: 'มกราคม', 2: 'กุมภาพันธ์', 3: 'มีนาคม', 4: 'เมษายน',
    5: 'พฤษภาคม', 6: 'มิถุนายน', 7: 'กรกฎาคม', 8: 'สิงหาคม',
    9: 'กันยายน', 10: 'ตุลาคม', 11: 'พฤศจิกายน', 12: 'ธันวาคม'
  };

  // 🔹 แปลงปี ค.ศ. → พุทธ
  const targetYearBuddhist = year + 543;
  const targetMonthYear = `${monthMap[month]}, ${targetYearBuddhist}`;

  console.log(`เลือกวันที่: ${day} ${monthMap[month]} ${targetYearBuddhist}`);

  // 1️⃣ เปิด calendar
  if (typeof dateInputSelector === 'string') {
    await page.locator(dateInputSelector).click();
  } else {
    await dateInputSelector.click();
  }

  // 2️⃣ เลือกเดือนและปี
  let currentMonthYear = (
    await page.locator('.calendar[style*="display: block"] .title').first().textContent()
  ).trim();

  while (currentMonthYear !== targetMonthYear) {
    const [currentMonth, currentYear] = currentMonthYear.split(',').map(s => s.trim());
    const currentMonthNum = parseInt(Object.keys(monthMap).find(k => monthMap[k] === currentMonth), 10);
    const currentYearNum = parseInt(currentYear, 10); // ปีพุทธ

    const currentValue = currentYearNum * 12 + currentMonthNum;
    const targetValue = targetYearBuddhist * 12 + month;

    // 🔹 ถ้าปีไม่ตรง → ใช้ << หรือ >> เพื่อเปลี่ยนทีละปี
    if (currentYearNum !== targetYearBuddhist) {
      if (currentYearNum > targetYearBuddhist) {
        await page.locator('.calendar[style*="display: block"] td.button.nav >> text=«').click();
      } else {
        await page.locator('.calendar[style*="display: block"] td.button.nav >> text=»').click();
      }
    }
    // 🔹 ถ้าปีตรงแล้วแต่เดือนยังไม่ตรง → ใช้ < หรือ > เพื่อเปลี่ยนเดือน
    else {
      if (currentValue > targetValue) {
        await page.locator('.calendar[style*="display: block"] td.button.nav >> text=‹').click();
      } else {
        await page.locator('.calendar[style*="display: block"] td.button.nav >> text=›').click();
      }
    }

    // อัปเดต title ปัจจุบันหลังเปลี่ยน
    currentMonthYear = (
      await page.locator('.calendar[style*="display: block"] .title').first().textContent()
    ).trim();
  }

  // 3️⃣ เลือกวัน (exact match เท่านั้น)
  const dayLocator = RV
    ? '.calendar[style*="display: block"] td.day.false'
    : '.calendar[style*="display: block"] td.day.null';

  await page
    .locator(dayLocator)
    .filter({ hasText: new RegExp(`^${day}$`) })
    .first({ timeout: 5000 })
    .click({ timeout: 5000 });
}

module.exports = { selectDate };
