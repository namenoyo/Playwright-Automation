import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const barrierFile = path.resolve(process.cwd(), 'sync_ready.txt');
const totalWorkers = parseInt(process.env.PLAYWRIGHT_WORKERS || '1', 10);

if (fs.existsSync(barrierFile)) fs.unlinkSync(barrierFile);

async function waitForAllReady() {
    while (true) {
        const count = fs.existsSync(barrierFile)
            ? fs.readFileSync(barrierFile, 'utf8').trim().split('\n').filter(Boolean).length
            : 0;
        if (count >= totalWorkers) break;
        await new Promise(r => setTimeout(r, 1000));
    }
}

function now() {
    return new Date().toISOString().split('T')[1]; // เวลาแบบ HH:mm:ss.sss
}

const array = ['1', '2'];

for (const no of array) {
    test(`sync workers - ${no}`, async ({ page }, testInfo) => {
        const id = testInfo.parallelIndex;

        console.log(`[${now()}] 🧩 Worker ${id}: doing process 1...`);
        await page.waitForTimeout(1000 + id * 700); // จำลองว่าแต่ละ worker ช้าเร็วต่างกัน
        console.log(`[${now()}] ✅ Worker ${id}: process 1 done`);

        fs.appendFileSync(barrierFile, `ready-${id}\n`);

        await waitForAllReady();

        console.log(`[${now()}] 🚀 Worker ${id}: starting process 2`);
        await page.waitForTimeout(1000);
    });
}


