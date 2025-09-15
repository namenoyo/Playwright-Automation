const { test, expect } = require('@playwright/test');
const { popupAlert, getMaxWorkers } = require('../../utils/common');
const { chunkRange } = require('../../utils/common');
const { data_matrix_endorse } = require('../../data/Alteration/data_endorse.data');

const MAX_POSSIBLE_WORKERS = getMaxWorkers();

test.describe.configure({ mode: 'parallel' }); // ให้เคสในไฟล์นี้รันขนานได้

let array_result_query;

test.beforeAll(async () => {
    array_result_query = data_matrix_endorse;
});

for (let chunkIndex = 0; chunkIndex < MAX_POSSIBLE_WORKERS; chunkIndex++) {
    test(`worker ${chunkIndex + 1}`, async ({ page }, testInfo) => {
        const configured = testInfo.config.workers;
        const workers =
            typeof configured === 'number' ? configured : 1; // เผื่อกรณีตั้งแบบเปอร์เซ็นต์

        // ถ้า chunkIndex เกินจำนวน workers จริง ให้ข้ามเคสนี้
        test.skip(chunkIndex >= workers, `Only ${workers} workers are active`);

        // ดึงข้อมูลจาก DB
        const rows = array_result_query; // ได้ array กลับมาแล้ว

        const { start, end } = chunkRange(chunkIndex, workers, rows.length);
        const mySlice = rows.slice(start, end);

        console.log(mySlice.length);
    })
};
