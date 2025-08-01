const { test, expect, request } = require('@playwright/test');
const { sendresultn8nbot } = require('../../utils/common');

test('n8n send parameter to webhook', async ({ page }) => {
    test.setTimeout(3000000)

    const resulttest = 'pass'
    const testcase = 'เช็คเบี้ยประกัน ของ โครงการ SP Life';
    const plangroup = 'MRTA';
    const insuresum = 50000;
    const counttotalcase = 2110;
    const countpass = 1800;
    const countfail = 200;

    // แปลงเป็นเวลาประเทศไทย
    const options = {
        timeZone: 'Asia/Bangkok',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };

    const startdate = new Date();
    // ใช้ Intl.DateTimeFormat แล้วแปลงให้เป็นรูปแบบที่ต้องการ
    const startformatter = new Intl.DateTimeFormat('th-TH', options);
    const startparts = startformatter.formatToParts(startdate);
    // แปลง parts ให้เป็น string แบบ dd/mm/yyyy hh:mm:ss
    const startdateformat = `${startparts.find(p => p.type === 'day')?.value}/${startparts.find(p => p.type === 'month')?.value}/${startparts.find(p => p.type === 'year')?.value} ${startparts.find(p => p.type === 'hour')?.value}:${startparts.find(p => p.type === 'minute')?.value}:${startparts.find(p => p.type === 'second')?.value}`;

    const finishdate = new Date();
    // ใช้ Intl.DateTimeFormat แล้วแปลงให้เป็นรูปแบบที่ต้องการ
    const finishformatter = new Intl.DateTimeFormat('th-TH', options);
    const finishparts = finishformatter.formatToParts(finishdate);

    // แปลง parts ให้เป็น string แบบ dd/mm/yyyy hh:mm:ss
    const finishdateformat = `${finishparts.find(p => p.type === 'day')?.value}/${finishparts.find(p => p.type === 'month')?.value}/${finishparts.find(p => p.type === 'year')?.value} ${finishparts.find(p => p.type === 'hour')?.value}:${finishparts.find(p => p.type === 'minute')?.value}:${finishparts.find(p => p.type === 'second')?.value}`;

    await sendresultn8nbot(resulttest, testcase, plangroup, insuresum, counttotalcase, countpass, countfail, startdateformat, finishdateformat);


    const dataList = [
        { name: 'เพื่อนคู่ทรัพย์ 1 พลัส' },
        { name: 'เพื่อนคู่ทรัพย์ 2 พลัส' },
        { name: 'เพื่อนคู่ทรัพย์ 3 พลัส' }
    ];

    for (let i = 0; i < dataList.length; i++) {
        let retryCount = 0;
        const maxRetries = 3;
        const timeout = 10000;

        while (retryCount < maxRetries) {
            try {
                // console.log(`▶️ ชุดที่ ${i + 1} (${dataList[i].name})`);

                console.log(`▶️  เริ่มการทดสอบ row_unique ${i + 1}`);

                // ⏱️ กำหนด timeout ต่อรอบ (เช่น 20 วินาที)
                await Promise.race([

                    (async () => {
                        await page.goto('https://sp-life-sit.ochi.link/thaisamut/pub/splife/login.html', {
                                waitUntil: 'networkidle'
                            });

                            await page.locator('input[type="text"]').fill('5300385');
                            await page.locator('input[type="password"]').fill('Ocean@55');
                            await page.locator('span', { hasText: 'เข้าสู่ระบบ' }).click();
                            await page.waitForNavigation({ waitUntil: 'networkidle' });
                            await page.locator('button', { hasText: 'สร้างใบเสนอราคา' }).nth(1).click();
                        if (retryCount <= 2) {
                            await page.locator('span', { hasText: 'ย้อนกลับ' }).click();
                            await page.locator('h6', { hasText: 'เพื่อนคู่ทรัพย์ 1 พลัส' }).click();
                        } else {
                            await page.locator('h6', { hasText: 'เพื่อนคู่ทรัพย์ 1 พลัส' }).click();
                        }

                    })(),

                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('⏰ Loop timeout (10s)')), timeout)
                    )
                ]);

                // await page.goto('https://sp-life-sit.ochi.link/thaisamut/pub/splife/login.html', {
                //     waitUntil: 'networkidle'
                // });

                // await page.locator('input[type="text"]').fill('5300385');
                // await page.locator('input[type="password"]').fill('Ocean@55');
                // await page.locator('span', { hasText: 'เข้าสู่ระบบ' }).click();
                // await page.waitForNavigation({ waitUntil: 'networkidle' });
                // await page.locator('button', { hasText: 'สร้างใบเสนอราคา' }).nth(1).click();
                // await page.locator('span', { hasText: 'ย้อนกลับ' }).click();
                // await page.locator('h6', { hasText: 'เพื่อนคู่ทรัพย์ 1 พลัส' }).click();

                break; // สำเร็จแล้ว → ออกจาก while retry

            } catch (err) {
                retryCount++;
                // console.warn(`❌ ล้มเหลวในชุดที่ ${i + 1} รอบที่ ${retryCount}: ${err.message}`);

                console.warn(`❌ การทดสอบ row_unique ${i + 1} ล้มเหลวในครั้งที่ ${retryCount} : ${err.message}`);

                if (retryCount >= maxRetries) {
                    // console.error(`🛑 ล้มเหลวเกินกำหนดในชุดที่ ${i + 1}, ข้ามไปยังชุดถัดไป`);
                    console.error(`🛑 การทดสอบล้มเหลวเกินกำหนดใน row_unique ${i + 1}, ข้ามไปยังชุดถัดไป`);
                    await page.screenshot({ path: `screenshots/SPLife/row_unique-${i + 1}.png`, fullPage: true });
                } else {
                    // console.log(`🔄 กำลังเริ่มใหม่ชุดที่ ${i + 1} รอบที่ ${retryCount + 1}`);

                    console.log(`🔄 กำลังเริ่มทดสอบ row_unique ${i + 1} รอบที่ ${retryCount + 1}`);
                    // await this.page.reload(); // หรือทำ clean up
                }
            }
        }
    }
})