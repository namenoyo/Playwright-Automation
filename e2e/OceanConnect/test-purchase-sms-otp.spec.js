const { test, expect } = require('@playwright/test');

test.describe.configure({ mode: 'parallel' }); // ให้เคสในไฟล์นี้รันขนานได้

test('Purchase SMS OTP', async ({ page }) => {

    test.setTimeout(600000); // ตั้ง timeout เป็น 10 นาที

    const idcard = '4727713711739';
    const name = 'ทดสอบ';
    const username = 'เทส';
    const phoneno = '0933995963';
    const email = 'thanakrit.ph@ocean.co.th';

    await page.goto('https://uat2-oceanlife.ochi.link/');
    await page.waitForLoadState('networkidle');

    await page.getByRole('link', { name: 'ซื้อประกันออนไลน์' }).click({ timeout: 10000 });
    await page.waitForLoadState('networkidle');

    await page.locator('div:nth-child(4) > input').check();
    await page.locator('a[href="https://uat2-oceanlife.ochi.link/our-products/personal-accident/oceanlife-pa-easy?purchase_intent=1#purchase"]').click({ timeout: 10000 });
    await page.waitForLoadState('networkidle');

    await page.getByLabel('1 / 5').getByRole('button', { name: 'เลือกแผนนี้' }).click({ timeout: 10000 });
    await page.waitForLoadState('networkidle');

    await page.getByText('ไม่เคย').click({ timeout: 10000 });
    await page.getByRole('button', { name: 'ต่อไป  ' }).click({ timeout: 10000 });
    await page.waitForLoadState('networkidle');

    await page.getByText('ผู้ชาย').click({ timeout: 10000 });
    await page.waitForLoadState('networkidle');

    await page.locator('input[name="birthdate"]').click({ timeout: 10000 });
    await page.getByRole('combobox').nth(3).selectOption('1996');
    await page.getByLabel('ตุลาคม 1,').click({ timeout: 10000 });
    // await page.locator('span[aria-label="ตุลาคม 1, 2010"]');
    await page.waitForLoadState('networkidle');

    await page.getByText('เลือกกลุ่มอาชีพ').nth(2).click({ timeout: 10000 });
    await page.locator('div').filter({ hasText: /^พนักงานบริษัท$/ }).click({ timeout: 10000 });
    await page.waitForTimeout(1000);
    await page.getByText('อาชีพ', { exact: true }).nth(2).click({ timeout: 10000 });
    await page.locator('div').filter({ hasText: /^พนักงานธนาคาร$/ }).click({ timeout: 10000 });
    await page.getByRole('button', { name: ' คำนวณเบี้ยประกันภัย' }).click({ timeout: 10000 });
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: ' ซื้อประกันออนไลน์' }).click({ timeout: 10000 });
    await page.waitForLoadState('networkidle');

    await page.locator('input[name="applicant[id_card_no]"]').click({ timeout: 10000 });
    await page.locator('input[name="applicant[id_card_no]"]').type(idcard, { delay: 100 });
    await page.locator('#applicant-identity div').filter({ hasText: 'เลขบัตรประชาชนของผู้ขอเอาประกัน วันบัตรหมดอายุ ตลอดชีพ วันบัตรหมดอายุ' }).locator('input[name="applicant[id_expired_date]"]').click({ timeout: 10000 });
    await page.getByRole('combobox').nth(2).selectOption('2026');
    await page.getByLabel('ตุลาคม 8,').first().click({ timeout: 10000 });
    await page.locator('.selectbox__label').first().click({ timeout: 10000 });
    await page.locator('#applicant-profile div').filter({ hasText: /^นาย$/ }).click({ timeout: 10000 });
    await page.locator('input[name="applicant[first_name]"]').click({ timeout: 10000 });
    await page.locator('input[name="applicant[first_name]"]').type(name, { delay: 100 });
    await page.locator('input[name="applicant[last_name]"]').click({ timeout: 10000 });
    await page.locator('input[name="applicant[last_name]"]').type(username, { delay: 100 });
    await page.locator('input[type="email"]').click({ timeout: 10000 });
    await page.locator('input[type="email"]').type(email, { delay: 100 });
    await page.locator('#applicant-profile div').filter({ hasText: 'อีเมล หมายเลขโทรศัพท์มือถือ' }).locator('input[type="text"]').click({ timeout: 10000 });
    await page.locator('#applicant-profile div').filter({ hasText: 'อีเมล หมายเลขโทรศัพท์มือถือ' }).locator('input[type="text"]').type(phoneno, { delay: 100 });
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: ' ยืนยันข้อมูล' }).click({ timeout: 10000 });

    await page.locator('label').filter({ hasText: 'ข้าพเจ้าได้อ่าน และทำความเข้าใจข้อกำหนดและเงื่อนไขการใช้บริการเว็บไซต์ และนโยบาย' }).click({ timeout: 10000 });
    await expect(page.locator('div[class="modal-content"]').getByText('ข้อกำหนดและเงื่อนไขการใช้บริการเว็บไซต์ www.ocean.co.th')).toBeVisible({ timeout: 30000 });
    await page.locator('div[class="modal-content"]', { hasText: 'กรุณาอ่านรายละเอียดและยอมรับเงื่อนไขการใช้งาน' }).getByRole('button', { name: 'ยอมรับ', exact: true }).click({ timeout: 10000 });
    await expect(page.locator('div[class="modal-content"]').getByText('ข้อกำหนดและเงื่อนไขการใช้บริการเว็บไซต์ www.ocean.co.th')).not.toBeVisible({ timeout: 30000 });

    await page.locator('label').filter({ hasText: 'ข้าพเจ้าได้รับทราบเงื่อนไขการสมัครขอเอาประกันภัยทางอิเล็กทรอนิกส์และเข้าใจข้อควา' }).click({ timeout: 10000 });
    await expect(page.locator('div[class="modal-content"]').getByText('ข้าพเจ้าผู้ขอเอาประกันภัย/ผู้แทนโดยชอบธรรม ขอยืนยันรับทราบและเข้าใจผลิตภัณฑ์ประกันภัย ดังนี้')).toBeVisible({ timeout: 30000 });
    await page.locator('div[class="modal-content"]', { hasText: 'กรุณาอ่านรายละเอียดและยอมรับเงื่อนไขการใช้งาน' }).getByRole('button', { name: 'ยอมรับ', exact: true }).click({  timeout: 10000 });
    await expect(page.locator('div[class="modal-content"]').getByText('ข้าพเจ้าผู้ขอเอาประกันภัย/ผู้แทนโดยชอบธรรม ขอยืนยันรับทราบและเข้าใจผลิตภัณฑ์ประกันภัย ดังนี้')).not.toBeVisible({ timeout: 30000 });

    await page.getByRole('button', { name: 'ถัดไป' }).click({ timeout: 10000 });
    await page.waitForLoadState('networkidle');

    await page.locator('input[name="question[138][7]"]').click({ timeout: 10000 });
    await page.locator('input[name="question[138][7]"]').type('175');
    await page.locator('input[name="question[139][8]"]').click({ timeout: 10000 });
    await page.locator('input[name="question[139][8]"]').type('90');
    await page.getByRole('button', { name: 'ถัดไป' }).click({ timeout: 10000 });
    await page.waitForLoadState('networkidle');

    await page.getByText('สัญชาติ').nth(2).click({ timeout: 10000 });
    await page.getByText('ไทย', { exact: true }).nth(1).click({ timeout: 10000 });
    await page.locator('input[name="applicant[main_occupation_position]"]').click({ timeout: 10000 });
    await page.locator('input[name="applicant[main_occupation_position]"]').type('ทดสอบ', { delay: 100 });
    await page.getByRole('textbox', { name: 'รายได้ (ต่อปี)' }).click({ timeout: 10000 });
    await page.getByRole('textbox', { name: 'รายได้ (ต่อปี)' }).type('20,0000', { delay: 100 });
    await page.getByRole('textbox', { name: 'บ้านเลขที่' }).click({ timeout: 10000 });
    await page.getByRole('textbox', { name: 'บ้านเลขที่' }).type('111', { delay: 100 });
    await page.locator('input[name="applicant[address_registered][postal_code]"]').click({ timeout: 10000 });
    await page.locator('input[name="applicant[address_registered][postal_code]"]').type('10600', { delay: 100 });
    await page.getByText('- วัดท่าพระ บางกอกใหญ่ กรุงเทพมหานคร').click({ timeout: 10000 });
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: 'ถัดไป' }).click({ timeout: 10000 });
    await page.waitForLoadState('networkidle');

    await page.getByText('คำนำหน้าชื่อ').nth(2).click({ timeout: 10000 });
    await page.locator('div').filter({ hasText: /^นาย$/ }).click({ timeout: 10000 });
    await page.getByRole('textbox').nth(4).click({ timeout: 10000 });
    await page.getByRole('textbox').nth(4).type('ทดสอบ', { delay: 100 });
    await page.getByRole('textbox').nth(5).click({ timeout: 10000 });
    await page.getByRole('textbox').nth(5).type('เทส', { delay: 100 });
    await page.getByText('เลือกความสัมพันธ์').nth(2).click({ timeout: 10000 });
    await page.locator('div').filter({ hasText: /^บิดา$/ }).click({ timeout: 10000 });
    await page.getByRole('spinbutton').nth(1).click({ timeout: 10000 });
    await page.getByRole('spinbutton').nth(1).type('30', { delay: 100 });
    await page.getByRole('button', { name: 'ถัดไป' }).click({ timeout: 10000 });
    await page.waitForLoadState('networkidle');

    await page.getByText('ไม่มีความประสงค์').click({ timeout: 10000 });
    await page.getByRole('button', { name: 'ถัดไป' }).click({ timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // await page.getByRole('button', { name: 'ถ่ายภาพ ' }).nth(0).click({ timeout: 10000 });
    // await expect(page.locator('div[class="modal-content"]', { hasText: 'กรุณาสแกน QR Code เพื่อถ่ายภาพ' })).toBeVisible({ timeout: 30000 });
    const fileInput_idcard_front = page.locator('input[name="idcard_front"]');
    await fileInput_idcard_front.setInputFiles('D:/Automate/Playwright/Playwright-Automation/pic/ochi-thank@2x.png');
    const fileInput_selfie = page.locator('input[name="selfie"]');
    await fileInput_selfie.setInputFiles('D:/Automate/Playwright/Playwright-Automation/pic/ochi-thank@2x.png');
    const fileInput_idcard = page.locator('input[name="idcard_selfie"]');
    await fileInput_idcard.setInputFiles('D:/Automate/Playwright/Playwright-Automation/pic/ochi-thank@2x.png');
    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: 'ถัดไป' }).click({ timeout: 10000 });
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: 'ถัดไป' }).click({ timeout: 10000 });
    await page.waitForLoadState('networkidle');

    await page.waitForTimeout(1000);
    await page.getByRole('button', { name: 'ยืนยันคำสั่งซื้อ' }).click({ timeout: 10000 });
    await expect(page.locator('div[class="modal-content "]', { hasText: 'ยืนยันการซื้อประกัน' })).toBeVisible({ timeout: 30000 });


    await page.getByRole('button', { name: 'ขอรหัส' }).click({ timeout: 10000 });



});