const { searchVerifyAssessor, popupAddReceiptVerifyAssessor, informationVerifyAssessor } = require('../../locators/CoPayment/verify_assessor.locator');


export class VerifyAssessor {
    constructor(page, expect) {
        this.page = page;
        this.expect = expect;
    }

    async searchVerifyAssessor(data) {
        const searchLocator = searchVerifyAssessor(this.page);

        // เคลียร์ค่า วันที่รับเรื่องจาก
        await searchLocator.dateofreceiptform.fill('', { timeout: 10000 });
        // เคลียร์ค่า วันที่รับเรื่องถึง
        await searchLocator.dateofreceiptto.fill('', { timeout: 10000 });
        // กรอก เลขที่กรมธรรม์
        if (data.policyno) {
            await searchLocator.policyno.type(data.policyno, { delay: 200, timeout: 10000 });
        }
        // กดปุ่ม ค้นหา
        await searchLocator.searchbutton.click({ timeout: 10000 });
        // รอ popup กรุณารอสักครู่... หายไป
        await this.expect(this.page.getByText('กรุณารอสักครู่...')).toBeVisible({ timeout: 60000 });
        await this.expect(this.page.getByText('กรุณารอสักครู่...')).not.toBeVisible({ timeout: 60000 });
        // ตรวจสอบผลลัพธ์การค้นหา เลขที่กรมธรรม์
        if (searchLocator.checkpolicyno(data.policyno).isVisible()) {
            return true;
        } else {
            return false;
        }
    }

    async addReceiptVerifyAssessor() {
        const searchLocator = searchVerifyAssessor(this.page);
        const popupaddreciptLocator = popupAddReceiptVerifyAssessor(this.page);

        // กดปุ่ม เพิ่มรายการรับเรื่อง
        await searchLocator.addreciptbutton.click({ timeout: 10000 });
        // รอหน้าจอ popup เพิ่มรายการรับเรื่อง แสดง
        await this.expect(popupaddreciptLocator.popup_addreceipt).toBeVisible({ timeout: 60000 });
    }

    async searchaddReceiptVerifyAssessor(data) {
        const popupaddreciptLocator = popupAddReceiptVerifyAssessor(this.page);

        // กรอกเลขที่กรมธรรม์
        if (data.policyno) {
            await popupaddreciptLocator.policyno.type(data.policyno, { delay: 200, timeout: 10000 });
        }
        // กดปุ่ม ค้นหา
        await popupaddreciptLocator.searchbutton.click({ timeout: 10000 });
        // รอ popup กรุณารอสักครู่... หายไป
        await this.expect(this.page.getByText('กรุณารอสักครู่...')).toBeVisible({ timeout: 60000 });
        await this.expect(this.page.getByText('กรุณารอสักครู่...')).not.toBeVisible({ timeout: 60000 });
        // เลือกรายการแรกจากผลลัพธ์การค้นหา
        await popupaddreciptLocator.selectlistbutton.click({ timeout: 10000 });

        // รอ API โหลดข้อมูล claim history เสร็จ และ timeout ไม่เกิน 60 วินาที
        if (data.env === 'SIT') {
            await this.page.waitForResponse(response =>
                response.url().includes(`https://intranet-api.ochi.link/thaisamut/rs/claimtx/v2/fax/common/getCopaymentData/list`) &&
                response.status() === 200, { timeout: 60000 }
            );
        } else if (data.env === 'UAT') {
            await this.page.waitForResponse(response =>
                response.url().includes(`https://uat-intranet-api.ochi.link/thaisamut/rs/claimtx/v2/fax/common/getCopaymentData/list`) &&
                response.status() === 200, { timeout: 60000 }
            );
        }

        await this.page.waitForTimeout(1000); // เพิ่ม delay เล็กน้อยเพื่อรอการประมวลผล
    }

    async informationVerifyAssessor(data) {
        const informationLocator = informationVerifyAssessor(this.page);

        // Section ข้อมูลสถานพยาบาล
        // เลือก ชื่อสถานพยาบาล
        if (data.namehospital) {
            await informationLocator.namehospital.fill(data.namehospital, { timeout: 10000 });
            await this.page.getByText(data.namehospital, { exact: true }).nth(1).click({ timeout: 10000 });
            await this.page.waitForTimeout(500); // เพิ่ม delay เล็กน้อยเพื่อรอการประมวลผล
        }
        // ถ้าเคยืนยันประเภทรับเรื่อง มีค่าอยู่แล้ว ให้ล้างค่าก่อน
        if (informationLocator.receipttypeclearbutton.isVisible()) {
            // กดปุ่ม ล้างค่า
            await informationLocator.receipttypeclearbutton.click({ timeout: 10000 });
            // รอ popup กรุณายืนยัน แสดง
            await this.expect(this.page.locator('div[role="dialog"]', { hasText: 'กรุณายืนยัน' })).toBeVisible({ timeout: 60000 });
            // กดปุ่ม ยืนยัน
            await this.page.locator('div[role="dialog"]', { hasText: 'กรุณายืนยัน' }).getByRole('button', { name: 'ยืนยัน', exact: true }).click({ timeout: 10000 });
            // รอ popup กรุณายืนยัน หายไป
            await this.expect(this.page.locator('div[role="dialog"]', { hasText: 'กรุณายืนยัน' })).not.toBeVisible({ timeout: 60000 });
        }

        // Section ข้อมูลเรียกร้องสินไหม
        // เลือก ประเภทรับเรื่อง เป็น ตรวจสอบสิทธิ์และบันทึกค่าใช้จ่าย
        await informationLocator.receipttype.click({ timeout: 10000 });
        await this.page.getByText('ตรวจสอบสิทธิ์และบันทึกค่าใช้จ่าย', { exact: true }).click({ timeout: 10000 });
        // รอ popup กรุณายืนยัน แสดง
        await this.expect(this.page.locator('div[role="dialog"]', { hasText: 'กรุณายืนยัน' })).toBeVisible({ timeout: 60000 });
        // กดปุ่ม ยืนยัน
        await this.page.locator('div[role="dialog"]', { hasText: 'กรุณายืนยัน' }).getByRole('button', { name: 'ยืนยัน', exact: true }).click({ timeout: 10000 });
        // รอ popup กรุณายืนยัน หายไป
        await this.expect(this.page.locator('div[role="dialog"]', { hasText: 'กรุณายืนยัน' })).not.toBeVisible({ timeout: 60000 });
        // เลือก คุณภาพสถานพยาบาล เป็น ตามมาตรฐาน
        await informationLocator.qualityhospital.fill('ดีมาก', { timeout: 10000 });
        await this.page.getByText('ดีมาก', { exact: true }).nth(1).click({ timeout: 10000 });
        await this.page.waitForTimeout(500); // เพิ่ม delay เล็กน้อยเพื่อรอการประมวลผล

        // กรอก วันและเวลาที่สถานพยาบาลส่งเอกสาร
        if (data.datetimesentdocumenthospital) {
            await informationLocator.datetimesentdocumenthospital.fill(data.datetimesentdocumenthospital, { timeout: 10000 });
            await this.page.waitForTimeout(500); // เพิ่ม delay เล็กน้อยเพื่อรอการประมวลผล
        }
        // กรอก วันและเวลาที่เกิดเหตุ เฉพาะถ้ามีค่า
        if (data.datetimeincident) {
            await informationLocator.datetimeincident.fill(data.datetimeincident, { timeout: 10000 });
            await this.page.waitForTimeout(500); // เพิ่ม delay เล็กน้อยเพื่อรอการประมวลผล
        }
        // กรอก วันและเวลาที่เข้ารักษา เฉพาะถ้ามีค่า
        if (data.datetimetreatmentstart) {
            await informationLocator.datetimetreatmentstart.fill(data.datetimetreatmentstart, { timeout: 10000 });
            await this.page.waitForTimeout(500); // เพิ่ม delay เล็กน้อยเพื่อรอการประมวลผล
        }
        // กรอก วันและเวลาที่ออกจากสถานพยาบาล เฉพาะถ้ามีค่า
        if (data.datetimedischargehospital) {
            await informationLocator.datetimedischargehospital.fill(data.datetimedischargehospital, { timeout: 10000 });
            await this.page.waitForTimeout(500); // เพิ่ม delay เล็กน้อยเพื่อรอการประมวลผล
        }
        // กรอก จำนวนเงินที่เรียกร้องทั้งหมด เฉพาะถ้ามีค่า
        if (data.totalamountclaim) {
            // เคลียร์ค่าก่อนกรอกใหม่
            await informationLocator.totalamountclaim.fill('', { timeout: 10000 });
            await this.page.waitForTimeout(500); // เพิ่ม delay เล็กน้อยเพื่อรอการประมวลผล
            await informationLocator.totalamountclaim.fill(data.totalamountclaim, { timeout: 10000 });
            await this.page.waitForTimeout(500); // เพิ่ม delay เล็กน้อยเพื่อรอการประมวลผล
        }
        // กรอก จำนวนวันที่เรียกร้องห้อง ICU เฉพาะถ้ามีค่า
        if (data.daysicuroom || data.daysicuroom === 0 || data.daysicuroom === '0') {
            await informationLocator.daysicuroom.fill(data.daysicuroom, { timeout: 10000 });
            await this.page.waitForTimeout(500); // เพิ่ม delay เล็กน้อยเพื่อรอการประมวลผล
        }
        // กรอก Blood Pressure (BP) เฉพาะถ้ามีค่า
        if (data.bloodpressure) {
            await informationLocator.bloodpressure.fill(data.bloodpressure, { timeout: 10000 });
            await this.page.waitForTimeout(500); // เพิ่ม delay เล็กน้อยเพื่อรอการประมวลผล
        }
        // กรอก Heart Rate / Pulse Rate (HR / PR) เฉพาะถ้ามีค่า
        if (data.heartrate) {
            await informationLocator.heartrate.fill(data.heartrate, { timeout: 10000 });
            await this.page.waitForTimeout(500); // เพิ่ม delay เล็กน้อยเพื่อรอการประมวลผล
        }
        // กรอก Temperature (T) เฉพาะถ้ามีค่า
        if (data.temperature) {
            await informationLocator.temperature.fill(data.temperature, { timeout: 10000 });
            await this.page.waitForTimeout(500); // เพิ่ม delay เล็กน้อยเพื่อรอการประมวลผล
        }
        // กรอก Respiration Rate (RR) เฉพาะถ้ามีค่า
        if (data.respirationrate) {
            await informationLocator.respirationrate.fill(data.respirationrate, { timeout: 10000 });
            await this.page.waitForTimeout(500); // เพิ่ม delay เล็กน้อยเพื่อรอการประมวลผล
        }
        // เลือก Claim Type เฉพาะถ้ามีค่า
        if (data.claimtype) {
            await informationLocator.claimtype.fill(data.claimtype, { timeout: 10000 });
            await this.page.getByText(data.claimtype, { exact: true }).nth(1).click({ timeout: 10000 });
            await this.page.waitForTimeout(500); // เพิ่ม delay เล็กน้อยเพื่อรอการประมวลผล
        }
        // เลือก Cause of Claim เฉพาะถ้ามีค่า
        if (data.causeofclaim) {
            await informationLocator.causeofclaim.fill(data.causeofclaim, { timeout: 10000 });
            await this.page.getByText(data.causeofclaim, { exact: true }).nth(1).click({ timeout: 10000 });
            await this.page.waitForTimeout(500); // เพิ่ม delay เล็กน้อยเพื่อรอการประมวลผล
        }
        // เลือก ผลการรักษา เฉพาะถ้ามีค่า
        if (data.treatmentresult) {
            await informationLocator.treatmentresult.fill(data.treatmentresult, { timeout: 10000 });
            await this.page.getByText(data.treatmentresult, { exact: true }).nth(1).click({ timeout: 10000 });
            await this.page.waitForTimeout(500); // เพิ่ม delay เล็กน้อยเพื่อรอการประมวลผล
        }
        // เลือก Treatment Plan เฉพาะถ้ามีค่า
        if (data.treatmentplan) {
            await informationLocator.treatmentplan.fill(data.treatmentplan, { timeout: 10000 });
            await this.page.getByText(data.treatmentplan, { exact: true }).nth(1).click({ timeout: 10000 });
            await this.page.waitForTimeout(500); // เพิ่ม delay เล็กน้อยเพื่อรอการประมวลผล
        }
        // กรอก Incident Cause (สาเหตุการเคลม) เฉพาะถ้ามีค่า
        if (data.incidentcause) {
            await informationLocator.incidentcause.fill(data.incidentcause, { timeout: 10000 });
            await this.page.waitForTimeout(500); // เพิ่ม delay เล็กน้อยเพื่อรอการประมวลผล
        }

        // Section ICD10
        // กดเพิ่ม ICD10
        await informationLocator.addidc10button.click({ timeout: 10000 });
        // รอ popup ICD10 แสดง
        await this.expect(informationLocator.popupform).toBeVisible({ timeout: 60000 });
        // กรอก ICD10 code
        await informationLocator.icd10code.fill(data.icd10, { timeout: 10000 });
        // เลือก ICD10 code
        await this.page.getByText(data.icd10).click({ timeout: 10000 });
        await this.page.waitForTimeout(500); // เพิ่ม delay เล็กน้อยเพื่อรอการประมวลผล
        // กดปุ่ม ยืนยัน
        await informationLocator.icd10confirmbutton.click({ timeout: 10000 });
        // รอ popup ICD10 หายไป
        await this.expect(informationLocator.popupform).not.toBeVisible({ timeout: 60000 });

        // Section ข้อมูลการเรียกร้องสินไหมสัญญาเพิ่มเติม
        // กดปุ่ม service type ของ rider ที่ระบุ (รอทำ loop เพื่อกรองหลายๆ rider ในอนาคต)
        if (data.rider) {
            // กดปุ่ม service type ของ rider ที่ระบุ
            await informationLocator.servicetypebutton(data.rider).click({ timeout: 10000 });
            // ตรวจสอบว่ามี popup แจ้งเตือนกรุณาระบุข้อมูลสถานพยาบาลให้ครบถ้วนก่อนทำรายการ หรือไม่
            const popupText = await informationLocator.popupform.textContent();
            if (popupText.includes('กรุณาระบุข้อมูลสถานพยาบาลให้ครบถ้วนก่อนทำรายการ')) {
                // กดปุ่ม ปิด เพื่อปิด popup
                await informationLocator.popupform.getByRole('button', { name: 'ปิด', exact: true }).click({ timeout: 10000 });
                // เลือก ชื่อสถานพยาบาล อีกครั้ง
                await informationLocator.namehospital.fill(data.namehospital, { timeout: 10000 });
                await this.page.getByText(data.namehospital, { exact: true }).nth(1).click({ timeout: 10000 });
                await this.page.waitForTimeout(500); // เพิ่ม delay เล็กน้อยเพื่อรอการประมวลผล
                // กดปุ่ม service type ของ rider ที่ระบุ อีกครั้ง
                await informationLocator.servicetypebutton(data.rider).click({ timeout: 10000 });
            }
            // รอหน้าจอ popup แสดง
            await this.expect(informationLocator.popupform).toBeVisible({ timeout: 60000 });
            // กรอก service type code
            await informationLocator.servicetypecode.fill(data.servicetypecode, { timeout: 10000 });
            await this.page.getByText(data.servicetypecode, { exact: true }).nth(1).click({ timeout: 10000 });
            await this.page.waitForTimeout(500); // เพิ่ม delay เล็กน้อยเพื่อรอการประมวลผล
            // กดปุ่ม บันทึก
            await informationLocator.servicetypesavebutton.click({ timeout: 10000 });
            // รอหน้าจอ popup หายไป
            await this.expect(informationLocator.popupform).not.toBeVisible({ timeout: 60000 });
        }

        // Section ข้อมูลบันทึกค่าใช้จ่าย
        // กดปุ่ม เพิ่มรายการค่าใช้จ่าย
        await informationLocator.addexpensebutton.click({ timeout: 10000 });
        // รอ popup เพิ่มรายการค่าใช้จ่าย แสดง
        await this.expect(informationLocator.popupform).toBeVisible({ timeout: 60000 });
        // กรอก เลขที่กรมธรรม์
        await informationLocator.addexpensepolicyno.fill(data.policyno, { timeout: 10000 });
        // เลือก เลขที่กรมธรรม์
        await this.page.locator('div[role="dialog"]').getByText(data.policyno, { exact: true }).nth(1).click({ timeout: 10000 });
        await this.page.waitForTimeout(500); // เพิ่ม delay เล็กน้อยเพื่อรอการประมวลผล
        // กรอก สัญญาเพิ่มเติม
        await informationLocator.addexpenseridercode.fill(data.rider, { timeout: 10000 });
        // เลือก สัญญาเพิ่มเติม
        await this.page.locator('div[role="dialog"]').getByText(data.rider, { exact: true }).nth(1).click({ timeout: 10000 });
        await this.page.waitForTimeout(500); // เพิ่ม delay เล็กน้อยเพื่อรอการประมวลผล
        // กรอก Standard Billing
        await informationLocator.addexpensestandardbilling.fill(data.standardbilling, { timeout: 10000 });
        // เลือก Standard Billing
        await this.page.locator('div[role="dialog"]').getByText(data.standardbilling).nth(2).click({ timeout: 10000 });
        await this.page.waitForTimeout(500); // เพิ่ม delay เล็กน้อยเพื่อรอการประมวลผล
        // กรอก หมวดความคุ้มครอง
        await informationLocator.addexpenseprotectioncategory.fill(data.protectioncategory, { timeout: 10000 });
        // เลือก หมวดความคุ้มครอง
        await this.page.locator('div[role="dialog"]').getByText(data.protectioncategory).nth(2).click({ timeout: 10000 });
        await this.page.waitForTimeout(500); // เพิ่ม delay เล็กน้อยเพื่อรอการประมวลผล
        // กรอก Charge
        await informationLocator.addexpensechargeamount.fill('', { timeout: 10000 }); // เคลียร์ค่าก่อนกรอกใหม่
        await this.page.waitForTimeout(500); // เพิ่ม delay เล็กน้อยเพื่อรอการประมวลผล
        await informationLocator.addexpensechargeamount.fill(data.chargeamount, { timeout: 10000 });
        await this.page.waitForTimeout(500); // เพิ่ม delay เล็กน้อยเพื่อรอการประมวลผล
        // กดปุ่ม ยืนยัน
        await informationLocator.addexpensebuttonsavebutton.click({ timeout: 10000 });
        // รอ popup เพิ่มรายการค่าใช้จ่าย หายไป
        await this.expect(informationLocator.popupform).not.toBeVisible({ timeout: 60000 });

        // Section ข้อมูลเอกสารแนบประกอบการพิจารณา
        // กดปุ่ม เพิ่มเอกสาร
        await informationLocator.addattachmentbutton.click({ timeout: 10000 });
        // รอ popup เพิ่มเอกสาร แสดง
        await this.expect(informationLocator.popupform).toBeVisible({ timeout: 60000 });
        // เลือก ประเภทเอกสาร
        await informationLocator.attachmenttypedocument.fill('เอกสารประกอบการพิจารณา', { timeout: 10000 });
        await this.page.getByText('เอกสารประกอบการพิจารณา', { exact: true }).nth(1).click({ timeout: 10000 });
        await this.page.waitForTimeout(500); // เพิ่ม delay เล็กน้อยเพื่อรอการประมวลผล
        // กดปุ่ม ตกลง
        await informationLocator.attachmenttypedocumentconfirmbutton.click({ timeout: 10000 });
        // รอ popup อัปโหลดเอกสาร แสดง
        await this.expect(informationLocator.popupform.getByText('อัปโหลดเอกสาร')).toBeVisible({ timeout: 60000 });
        // อัปโหลดไฟล์แนบ
        const fileInput_document = informationLocator.attachmentuploadfile;
        await fileInput_document.setInputFiles(data.path_file);
        // กดปุ่ม ยืนยัน
        await this.expect(informationLocator.attachmentbuttonsavebutton).toBeEnabled({ timeout: 60000 });
        await informationLocator.attachmentbuttonsavebutton.click({ timeout: 10000 });
        // รอ popup เพิ่มเอกสาร หายไป
        await this.expect(informationLocator.popupform).not.toBeVisible({ timeout: 60000 });

        // Section เอกสารจำเป็น
        await informationLocator.necessarydocumenttab(data.documentname).check({ timeout: 10000 });

        // Section เอกสารเพิ่มเติม
        await informationLocator.additionaldocumenttab(data.documentothername).check({ timeout: 10000 });
    }

    async saveinformationVerifyAssessor() {
        const informationLocator = informationVerifyAssessor(this.page);

        // กดปุ่ม บันทึกและส่งพิจารณา
        await informationLocator.savebutton.click({ timeout: 10000 });
        // ตรวจสอบว่ามี popup ผลรวมค่าใช้จ่ายที่ทำรายการ ไม่ตรงกับจำนวนเงินเรียกร้อง(ตั้งต้น) หรือไม่
        const popupText = await informationLocator.popupform.textContent();
        if (popupText.includes('ผลรวมค่าใช้จ่ายที่ทำรายการ ไม่ตรงกับจำนวนเงินเรียกร้อง(ตั้งต้น)')) {
            // กดปุ่ม ปิด เพื่อปิด popup
            await informationLocator.popupform.getByRole('button', { name: 'ปิด', exact: true }).click({ timeout: 10000 });
        }
        // รอหน้าจอ popup บันทึกผลการพิจารณา แสดง
        await this.expect(informationLocator.popupform.getByText('บันทึกผลการพิจารณา')).toBeVisible({ timeout: 60000 });
        // พิมพ์ เสนอการพิจารณา
        await informationLocator.consideration.fill('เสนอความเห็น', { timeout: 10000 });
        // เลือก ผลการพิจารณา
        await this.page.getByText('เสนอความเห็น', { exact: true }).nth(1).click({ timeout: 10000 });
        await this.page.waitForTimeout(500); // เพิ่ม delay เล็กน้อยเพื่อรอการประมวลผล
        // พิมพ์ เหตุผลที่เสนอพิจารณา
        await informationLocator.reasonsconsideration.fill('เสนออนุมัติ', { timeout: 10000 });
        // เลือก เหตุผลที่เสนอพิจารณา
        await this.page.getByText('เสนออนุมัติ', { exact: true }).nth(1).click({ timeout: 10000 });
        await this.page.waitForTimeout(500); // เพิ่ม delay เล็กน้อยเพื่อรอการประมวลผล
        // พิมพ์ Auditor ที่ต้องการมอบหมาย
        await informationLocator.assigntoauditor.click({ timeout: 10000 });
        // เลือก Auditor ที่ต้องการมอบหมาย
        await informationLocator.assigntoauditorfirst.click({ timeout: 10000 });
        await this.page.waitForTimeout(500); // เพิ่ม delay เล็กน้อยเพื่อรอการประมวลผล

        // เก็บข้อความชื่อ Auditor ที่ต้องการมอบหมาย
        const auditorname = await informationLocator.assigntoauditortext.textContent({ timeout: 10000 });
        const auditornamevalue = auditorname.split(',').pop().trim();
        // กดปุ่ม ตกลง
        await informationLocator.saveconfirmbutton.click({ timeout: 10000 });
        // รอ popup ยืนยันการทำรายการ แสดง
        await this.expect(informationLocator.popupformconfirm).toBeVisible({ timeout: 60000 });
        // กดปุ่ม ตกลง
        await informationLocator.saveconfirmbutton.click({ timeout: 10000 });
        // รอหน้าจอ popup บันทึกข้อมูลสำเร็จ แสดง
        await this.expect(informationLocator.savesuccessdialog).toBeVisible({ timeout: 60000 });
        // ดึงค่า เลขที่รับเรื่องตรวจสอบสิทธิ์ และ เลขที่รับเรื่องบันทึกค่าใช้จ่าย
        const aboutauthenticationNo = await informationLocator.savesuccessdialog.locator('p', { hasText: 'เลขที่รับเรื่องตรวจสอบสิทธิ์' }).textContent();
        const expenseNo = await informationLocator.savesuccessdialog.locator('p', { hasText: 'เลขที่รับเรื่องบันทึกค่าใช้จ่าย' }).textContent();
        const aboutauthenticationNovalue = aboutauthenticationNo.split(': ')[1].trim();
        const expenseNovalue = expenseNo.split(': ')[1].trim();
        // กดปุ่ม ปิด
        await informationLocator.closesavesuccessbutton.click({ timeout: 10000 });
        // รอให้ popup บันทึกข้อมูลสำเร็จ หายไป
        await this.expect(informationLocator.savesuccessdialog).not.toBeVisible({ timeout: 60000 });
        // // รอ popup กรุณารอสักครู่... หายไป
        // await this.expect(this.page.getByText('กรุณารอสักครู่...')).toBeVisible({ timeout: 60000 });
        // await this.expect(this.page.getByText('กรุณารอสักครู่...')).not.toBeVisible({ timeout: 60000 });

        return {
            aboutauthenticationNo: aboutauthenticationNovalue,
            expenseNo: expenseNovalue,
            auditorname: auditornamevalue
        };
    }
}

module.exports = { VerifyAssessor };