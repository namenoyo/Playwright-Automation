// utils/dateAdjuster.js
const holidaysAndWeekends = require("./holidays");

function adjustDate(dateString) {
  let newDate = new Date(dateString);

  while (true) {
    const yyyy = newDate.getFullYear();
    const mm = String(newDate.getMonth() + 1).padStart(2, "0");
    const dd = String(newDate.getDate()).padStart(2, "0");
    const formattedDate = `${yyyy}-${mm}-${dd}`;

    const dayOfWeek = newDate.getDay(); // 0=Sun ... 6=Sat
    const isHoliday = holidaysAndWeekends.includes(formattedDate);

    if (isHoliday) {
      // ==== เคสวันหยุด ====
      if (dayOfWeek === 6) {
        // เสาร์
        newDate.setDate(newDate.getDate() + 2);
        continue;
      }
      if (dayOfWeek === 0) {
        // อาทิตย์
        newDate.setDate(newDate.getDate() + 1);
        continue;
      }
      if (dayOfWeek === 5) {
        // ศุกร์
        newDate.setDate(newDate.getDate() + 3);
        continue;
      }

      // วันหยุดอื่น ๆ (ที่ไม่ใช่ ศุกร์/เสาร์/อาทิตย์)
      const nextDay = new Date(newDate);
      nextDay.setDate(newDate.getDate() + 1);

      if (nextDay.getDay() === 5) {
        // ถ้าวันถัดไปตรงกับศุกร์ → กระโดดไปจันทร์
        newDate.setDate(newDate.getDate() + 3);
        continue;
      } else {
        newDate.setDate(newDate.getDate() + 1);
        continue;
      }
    } else {
      // ==== ไม่ใช่วันหยุด ====
      if (dayOfWeek === 6) {
        newDate.setDate(newDate.getDate() + 2);
        continue;
      }
      if (dayOfWeek === 0) {
        newDate.setDate(newDate.getDate() + 1);
        continue;
      }
      if (dayOfWeek === 5) {
        newDate.setDate(newDate.getDate() + 3);
        continue;
      }
    }

    // ถ้าไม่เข้าเงื่อนไขใด ๆ แปลว่าเจอวันปกติ
    break;
  }

  const yyyy = newDate.getFullYear();
  const mm = String(newDate.getMonth() + 1).padStart(2, "0");
  const dd = String(newDate.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

module.exports = {adjustDate};
