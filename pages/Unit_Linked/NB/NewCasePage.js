const { search_NewCase, table_NewCase, popup_NewCase_CustomerInfo, form_AddNewCase_Tab1, form_AddNewCase_Tab2, form_AddNewCase_Tab3, form_AddNewCase_SaveDraft } = require('../../../locators/Unit_Linked/NB/NewCase.locators.js');

class NewCasePage {
    constructor(page, expect) {
        this.page = page;
        this.expect = expect;
        this.searchnewcase = search_NewCase(page);
        this.tablenewcase = table_NewCase(page);
        this.popupnewcase_customerinfo = popup_NewCase_CustomerInfo(page);
        this.formaddnewcase_tab1 = form_AddNewCase_Tab1(page);
        this.formaddnewcase_tab2 = form_AddNewCase_Tab2(page);
        this.formaddnewcase_tab3 = form_AddNewCase_Tab3(page);
        this.formaddnewcase_savedraft = form_AddNewCase_SaveDraft(page);
    }

    async searchNewCase(data) {
        // กรอกข้อมูล สาขาต้นสังกัด
        await this.searchnewcase.newcase_inputBranchCode.fill('');
        await this.searchnewcase.newcase_inputBranchCode.type(data.branchcode);
        await this.expect(this.searchnewcase.newcase_listBranchCode(data.branchcode)).toBeVisible({ timeout: 60000 });
        await this.searchnewcase.newcase_listBranchCode(data.branchcode).click({ timeout: 10000 });

        // กรอกข้อมูล รหัสตัวแทน
        await this.searchnewcase.newcase_inputAgentCode.fill('');
        await this.searchnewcase.newcase_inputAgentCode.type(data.agentcode);
        await this.expect(this.searchnewcase.newcase_listAgentCode(data.agentcode)).toBeVisible({ timeout: 60000 });
        await this.searchnewcase.newcase_listAgentCode(data.agentcode).click({ timeout: 10000 });

        // รอ API โหลดข้อมูล เคสใหม่ เสร็จ
        if (data.env === 'SIT') {
            await this.page.waitForResponse(response =>
                response.url().includes(`https://sitnbs.thaisamut.co.th/nbsweb/secure/remoteaction/ulnbapp/newcase/submit/application/v2/list.html`) &&
                response.status() === 200, { timeout: 60000 }
            );
        } else if (data.env === 'UAT') {
            await this.page.waitForResponse(response =>
                response.url().includes(`https://uatnbs.thaisamut.co.th/nbsweb/secure/remoteaction/ulnbapp/newcase/submit/application/v2/list.html`) &&
                response.status() === 200, { timeout: 60000 }
            );
        }
    }

    async checkRequestCodeInTable(data) {
        // ตรวจสอบว่ามีข้อมูล รหัสคำขอ ในตารางหรือไม่
        return await this.tablenewcase.newcase_tblCaseRow(data.requestcode).isVisible({ timeout: 60000 });
    }

    async clickAddNewCase() {
        // กดปุ่ม เพิ่มเคสใหม่
        await this.searchnewcase.newcase_btnAddNewCase.click({ timeout: 10000 });
        // รอ popup เลือกข้อมูลลูกค้า ปรากฏ
        await this.expect(this.page.locator('#show-cis-customer-select-content')).toBeVisible({ timeout: 60000 });
    }

    async clickEditNewCase(requestcode) {
        // กดปุ่ม แก้ไข ข้อมูลเคสใหม่
        await this.tablenewcase.newcase_tbl_btnEditCase(requestcode).click({ timeout: 10000 });
    }

    async clickAddNewCustomerPopupCustomerInfo(data) {
        // กดปุ่ม เพิ่มลูกค้า ใน popup
        await this.popupnewcase_customerinfo.newcase_popupCustomerInfo_btnAddCustomer.click({ timeout: 10000 });
        // รอ popup เพิ่มข้อมูลลูกค้า ปรากฏ
        await this.expect(this.page.locator('#show-cis-confirm-content')).toBeVisible({ timeout: 60000 });
        // เลือก ประเภทบัตร
        await this.popupnewcase_customerinfo.newcase_popupCustomerInfo_optionCustomerType(data.typecard);
        // กรอก หมายเลขบัตร
        await this.popupnewcase_customerinfo.newcase_popupCustomerInfo_txtCardNo.type(data.cardno);
        // กรอก คำนำหน้า
        await this.popupnewcase_customerinfo.newcase_popupCustomerInfo_txtTitle.type(data.title);
        await this.expect(this.popupnewcase_customerinfo.newcase_popupCustomerInfo_listTitle(data.title)).toBeVisible({ timeout: 60000 });
        await this.popupnewcase_customerinfo.newcase_popupCustomerInfo_listTitle(data.title).click({ timeout: 10000 });
        // กรอก ชื่อ
        await this.popupnewcase_customerinfo.newcase_popupCustomerInfo_txtName.type(data.name);
        // กรอก นามสกุล
        await this.popupnewcase_customerinfo.newcase_popupCustomerInfo_txtSurname.type(data.surname);
        // กรอก วันเกิด
        await this.popupnewcase_customerinfo.newcase_popupCustomerInfo_txtBirthday.type(data.birthday);
        await this.page.waitForTimeout(300); // เพิ่ม delay 300 มิลลิวินาที เพื่อรอข้อมูลโหลด
        // กดปุ่ม ยืนยัน ใน popup เพิ่มข้อมูลลูกค้า
        await this.popupnewcase_customerinfo.newcase_popupCustomerInfo_btnConfirmAddCustomer.click({ timeout: 10000 });

        // รอ popup ไม่พบข้อมูลลูกค้า ปรากฏ
        await this.expect(this.page.locator('div[class="confirm-dialog yui3-panel-content yui3-widget-stdmod"]', { hasText: 'ไม่พบลูกค้าอยู่ในระบบ CIS ยืนยันการใช้ข้อมูลใช่หรือไม่' })).toBeVisible({ timeout: 60000 });
        // กดปุ่ม ใช่ ใน popup ไม่พบข้อมูลลูกค้า
        await this.page.locator('div[class="confirm-dialog yui3-panel-content yui3-widget-stdmod"]', { hasText: 'ไม่พบลูกค้าอยู่ในระบบ CIS ยืนยันการใช้ข้อมูลใช่หรือไม่' }).getByText('ใช่', { exact: true }).click({ timeout: 10000 });
        // รอ popup ไม่พบข้อมูลลูกค้า ปิด
        await this.expect(this.page.locator('div[class="confirm-dialog yui3-panel-content yui3-widget-stdmod"]', { hasText: 'ไม่พบลูกค้าอยู่ในระบบ CIS ยืนยันการใช้ข้อมูลใช่หรือไม่' })).not.toBeVisible({ timeout: 60000 });

        // รอ popup เพิ่มข้อมูลลูกค้า ปิด
        await this.expect(this.page.locator('#show-cis-confirm-content')).not.toBeVisible({ timeout: 60000 });
        // รอ popup บันทึกข้อมูลเคสใหม่ ปรากฏ
        await this.expect(this.page.locator('#dialog-content')).toBeVisible({ timeout: 60000 });
    }

    async formAddNewCase_Tab1(data) {
        // Tab 1: ผู้เอาประกัน/ตัวแทน/แบบประกัน
        // Section: 1. ชื่อและนามสกุลของผู้เอาประกันภัย
        await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_txtRequestCode.type(data.requestcode, { delay: 100, timeout: 10000 });
        // คลิ๊กนอกช่องกรอกข้อมูล เพื่อให้ข้อมูลถูกบันทึก
        await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_txtDateRequestCode.click({ timeout: 10000 });
        await this.page.waitForTimeout(300); // เพิ่ม delay 300 มิลลิวินาที เพื่อรอข้อมูลโหลด
        // เช็คข้อความบน popup แจ้งเตือน
        const alertText = await this.page.locator('#alert-dialog-model-id .yui3-widget-bd').textContent();
        if (alertText.includes('เนื่องจากไม่พบข้อมูลแบบประเมินความเสี่ยง กรุณาระบุข้อมูล')) {
            // รอ popup แจ้งเตือน ไม่พบข้อมูลแบบประเมินความเสี่ยง ปรากฏ
            await this.expect(this.page.locator('#alert-dialog-model-id', { hasText: 'เนื่องจากไม่พบข้อมูลแบบประเมินความเสี่ยง กรุณาระบุข้อมูล' })).toBeVisible({ timeout: 60000 });
            // กดปุ่ม ตกลง ใน popup แจ้งเตือน ไม่พบข้อมูลแบบประเมินความเสี่ยง
            await this.page.locator('#alert-dialog-model-id', { hasText: 'เนื่องจากไม่พบข้อมูลแบบประเมินความเสี่ยง กรุณาระบุข้อมูล' }).getByText('ตกลง', { exact: true }).click({ timeout: 10000 });
            // รอ popup แจ้งเตือน ไม่พบข้อมูลแบบประเมินความเสี่ยง ปิด
            await this.expect(this.page.locator('#alert-dialog-model-id', { hasText: 'เนื่องจากไม่พบข้อมูลแบบประเมินความเสี่ยง กรุณาระบุข้อมูล' })).not.toBeVisible({ timeout: 60000 });
        } else if (alertText.includes('กรุณาระบุ "เลขที่ใบคำขอ" ให้ตรงกับแบบประเมินความเสี่ยง')) {
            // รอ popup แจ้งเตือน เลขที่ใบคำขอไม่ตรงกับแบบประเมินความเสี่ยง ปรากฏ
            await this.expect(this.page.locator('#alert-dialog-model-id', { hasText: 'กรุณาระบุ "เลขที่ใบคำขอ" ให้ตรงกับแบบประเมินความเสี่ยง' })).toBeVisible({ timeout: 60000 });
            // กดปุ่ม ตกลง ใน popup แจ้งเตือน ไม่พบข้อมูลแบบประเมินความเสี่ยง
            await this.page.locator('#alert-dialog-model-id', { hasText: 'กรุณาระบุ "เลขที่ใบคำขอ" ให้ตรงกับแบบประเมินความเสี่ยง' }).getByText('ตกลง', { exact: true }).click({ timeout: 10000 });
            // รอ popup แจ้งเตือน ไม่พบข้อมูลแบบประเมินความเสี่ยง ปิด
            await this.expect(this.page.locator('#alert-dialog-model-id', { hasText: 'กรุณาระบุ "เลขที่ใบคำขอ" ให้ตรงกับแบบประเมินความเสี่ยง' })).not.toBeVisible({ timeout: 60000 });
        }
        // กรอก วันที่เขียนใบคำขอ โดยใช้วันที่ปัจจุบัน
        await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_txtDateRequestCode.type(data.todaydate, { delay: 100, timeout: 10000 });
        // กรอก วันที่รับเงิน โดยใช้วันที่ปัจจุบัน
        await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_txtPaymentDate.type(data.todaydate, { delay: 100, timeout: 10000 });
        // เลือก สถานภาพ
        await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_selMalitality.selectOption({ label: 'โสด' }, { timeout: 10000 });
        // กรอก วันที่บัตรประชาชนหมดอายุ โดยใช้วันที่ปัจจุบัน +1 ปี
        await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_txtDateCardExpire.type(data.nexttodaydate, { delay: 100, timeout: 10000 });
        // เลือก เอกสารที่ใช้
        await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_selDocumentUsed.selectOption({ label: 'บัตรประจำตัวประชาชน' }, { timeout: 10000 });

        // Section: 2. ที่อยู่และที่ทำงาน
        // กรอก บ้านเลขที่
        await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_Register_txtHouseNo.type('123/45', { delay: 100, timeout: 10000 });
        // เลือก จังหวัด
        await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_Register_selProvince.selectOption({ label: 'กรุงเทพมหานคร' }, { timeout: 10000 });
        // เลือก อำเภอ/เขต
        await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_Register_selDistrict.selectOption({ label: 'บางรัก' }, { timeout: 10000 });
        // เลือก ตำบล/แขวง
        const target = await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_Register_selSubDistrict
            .locator('option', { hasText: 'สี่พระยา' });
        const value = await target.getAttribute('value');
        await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_Register_selSubDistrict
            .selectOption(value, { timeout: 10000 });
        await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_Register_selSubDistrict.click({ timeout: 10000 });
        await this.page.locator('#locationCriteria_presentHouseSameType-label').click({ timeout: 10000 }); // คลิ๊กนอกช่องกรอกข้อมูล เพื่อให้ข้อมูลรีเฟรช
        await this.page.waitForTimeout(1000); // เพิ่ม delay 1 วินาที เพื่อรอข้อมูลโหลด
        // เลือก ที่อยู่ปัจจุบันเดียวกับที่อยู่ตามทะเบียนบ้าน
        await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_Current_selSameAddress.selectOption({ label: 'ที่อยู่เดียวกันกับ ทะเบียนบ้านผู้เอาประกัน' }, { timeout: 10000 });
        await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_Current_selSameAddress.dispatchEvent('change');
        await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_Current_selSameAddress.dispatchEvent('input');
        await this.page.waitForTimeout(1000); // เพิ่ม delay 1 วินาที เพื่อรอข้อมูลโหลด
        // เลือก ส่งเอกสารไปที่ ที่อยู่ตามทะเบียนบ้าน
        await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_radioSendDocumentTo.check({ timeout: 10000 });
        // กรอก เบอร์มือถือ
        await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_txtMobilePhone.type('0987654321', { delay: 100, timeout: 10000 });
        // เลือก ประเภทการส่งเอกสาร เป็น จดหมายแบบกระดาษ
        await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_radioSendDocumentTypePaper1.check({ timeout: 10000 });
        await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_radioSendDocumentTypePaper2.check({ timeout: 10000 });

        // Section: 3. อาชีพ
        // กรอก อาชีพ
        await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_txtOccupation.type(data.occupation, { delay: 100, timeout: 10000 });
        await this.expect(this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_txtOccupationlist(data.occupation)).toBeVisible({ timeout: 60000 });
        await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_txtOccupationlist(data.occupation).click({ timeout: 10000 });
        // กรอก รายได้ต่อปี
        await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_txtAnnualIncome.type(data.annualIncome, { delay: 100, timeout: 10000 });
        // เลือก รถจักรยานยนต์ในการประกอบอาชีพ
        if (data.motorcycle === 'ใช้') {
            await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_radioUsedMotorcycle.check({ timeout: 10000 });
        } else {
            await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_radioNotUsedMotorcycle.check({ timeout: 10000 });
        }

        // Section: 4. แบบประกัน
        // เลือก ผลิตภัณฑ์
        await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_selProduct.selectOption(data.product, { timeout: 10000 });
        // รอ popup โหลดข้อมูลไม่แสดง
        await this.expect(this.page.locator('div[class="yui3-widget-bd"]', { hasText: 'กำลังโหลดข้อมูล' })).not.toBeVisible({ timeout: 60000 });
        // เลือก ระยะเวลาชำระเบี้ย
        await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_selPaymentPeriod.selectOption(data.paymentperiod, { timeout: 10000 });
        // กรอก เบี้ยประกันภัยรายปี
        await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_txtRegularPremium.type(data.regularpremium, { delay: 100, timeout: 10000 });
        // คลิ๊กนอกช่องกรอกข้อมูล เพื่อให้ข้อมูลรีเฟรช
        await this.page.locator('#planCriteria_mainPremiumAmount-label').click({ timeout: 10000 });
        // ดึงจำนวนเงินจากหน้าจอ
        await this.page.locator('#planCriteria_insureAmountMin').waitFor({ state: 'visible', timeout: 60000 });
        const mininsureamount = await this.page.locator('#planCriteria_insureAmountMin').textContent();
        // นำจำนวนเงินที่ดึงมา ลบเครื่องหมาย คอมม่า (,) ออก
        const mininsureamountclean = mininsureamount.replace(/,/g, '').replace('.00', '');
        // console.log(`จำนวนเงินเอาประกันขั้นต่ำ: ${mininsureamountclean} บาท`);
        // กรอก จำนวนเงินเอาประกัน เป็นจำนวนเงินเอาประกันขั้นต่ำ
        await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_txtInsureAmount.type(mininsureamountclean, { delay: 100, timeout: 10000 });
        // กรอก เบี้ยประกันภัยเพิ่มเติม
        await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_txtTopUpPremium.type(data.topuppremium, { delay: 100, timeout: 10000 });
        // คลิ๊กนอกช่องกรอกข้อมูล เพื่อให้ข้อมูลรีเฟรช
        await this.page.locator('#planCriteria_mainPremiumAmount-label').click({ timeout: 10000 });

        // Section: 5. การจัดสรรสัดส่วนการลงทุน
        // เช็คว่าช่อง คะแนนประเมินความเสี่ยง enabled หรือไม่
        const isCriteriaSuitabilityEnabled = await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_txtCriteriaSuitability.isEnabled();
        if (isCriteriaSuitabilityEnabled) {
            // กรอก คะแนนประเมินความเสี่ยง
            await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_txtCriteriaSuitability.type(data.criteriasuitability, { delay: 100, timeout: 10000 });
        }
        // เช็คว่า ช่อง วันที่ประเมินความเสี่ยง enabled หรือไม่
        const isCriteriaEvaluateDateEnabled = await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_txtCriteriaEvaluateDate.isEnabled();
        if (isCriteriaEvaluateDateEnabled) {
            // กรอก วันที่ประเมินความเสี่ยง
            await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_txtCriteriaEvaluateDate.type(data.criteriaevaluatedate, { delay: 100, timeout: 10000 });
        }
        // เช็คว่า ปุ่ม ยอมรับความเสี่ยงการลงทุน แบบไทย enabled หรือไม่
        const isBtnInvestmentThaiEnabled = await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_btnInvestmentthai.isEnabled();
        if (isBtnInvestmentThaiEnabled) {
            // เลือก ยอมรับความเสี่ยงการลงทุน แบบไทย
            await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_btnInvestmentthai.click({ timeout: 10000 });
        }
        // เช็คว่า ปุ่ม ยอมรับความเสี่ยงการลงทุน แบบต่างประเทศ enabled หรือไม่
        const isBtnInvestmentOtherEnabled = await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_btnInvestmentother.isEnabled();
        if (isBtnInvestmentOtherEnabled) {
            // เลือก ยอมรับความเสี่ยงการลงทุน แบบต่างประเทศ
            await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_btnInvestmentother.click({ timeout: 10000 });
        }

        // Section: 5.1 การจัดสรรสัดส่วนการลงทุน เบี้ยประกันภัยหลัก (Regular Premium) หรือ เบี้ยประกันภัยชำระครั้งเดียว (Single Premium)
        // เช็คว่า ปุ่ม การจัดสรรสัดส่วนการลงทุน enabled หรือไม่
        const isBtnInvestmentEnabled = await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_btnInvestmentRegularPremium.isEnabled();
        if (isBtnInvestmentEnabled) {
            // เลือกกองทุน สำหรับ Regular Premium
            await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_btnInvestmentRegularPremium.click({ timeout: 10000 });
            // รอ popup เลือกกองทุน ปรากฏ
            await this.expect(this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_popupInvestment).toBeVisible({ timeout: 60000 });
            // แบ่งคอลัมน์ fundname ออกเป็น array โดยใช้ ',' เป็นตัวคั่น
            const fundname_array = data.fundname.split(',').map(r => r.trim());
            // console.log(fundname_array);
            // แบ่งคอลัมน์ insureamountfund ออกเป็น array โดยใช้ ',' เป็นตัวคั่น
            const fundpercent_array = data.insureamountfund.split(',').map(r => r.trim());
            // console.log(fundpercent_array);
            // วนลูปเลือกกองทุนและกรอกจำนวนเงินเอาประกันกองทุน
            for (let i = 0; i < fundname_array.length; i++) {
                const fundname = fundname_array[i];
                const fundpercent = fundpercent_array[i];

                // เลือก กองทุน
                const fundname_target = await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_popupInvestment_selFund
                    .locator('option', { hasText: fundname });
                const value = await fundname_target.getAttribute('value');
                await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_popupInvestment_selFund
                    .selectOption(value, { timeout: 10000 });
                // กรอก จำนวนเงินเอาประกันกองทุน
                await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_popupInvestment_txtFundPercent.type(fundpercent, { timeout: 10000 });
                // กดปุ่ม เพิ่มกองทุน
                await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_popupInvestment_btnAddFund.click({ timeout: 10000 });
                // รอ popup ยืนยันการบันทึกข้อมูลแสดง
                await this.expect(this.page.locator('div[class="confirm-dialog yui3-panel-content yui3-widget-stdmod"]', { hasText: 'ยืนยันการบันทึกข้อมูล' })).toBeVisible({ timeout: 60000 });
                // กดปุ่ม ใช่ ใน popup ยืนยันการบันทึกข้อมูล
                await this.page.locator('div[class="confirm-dialog yui3-panel-content yui3-widget-stdmod"]', { hasText: 'ยืนยันการบันทึกข้อมูล' }).getByText('ใช่', { exact: true }).click({ timeout: 10000 });
                // รอ popup ยืนยันการบันทึกข้อมูล ปิด
                await this.expect(this.page.locator('div[class="confirm-dialog yui3-panel-content yui3-widget-stdmod"]', { hasText: 'ยืนยันการบันทึกข้อมูล' })).not.toBeVisible({ timeout: 60000 });
            }
            // กดปุ่ม ยืนยัน popup เลือกกองทุน
            await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_popupInvestment.getByRole('button', { name: 'ยืนยัน' }).click({ timeout: 10000 });
            // รอ popup เลือกกองทุน ปิด
            await this.expect(this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_popupInvestment).not.toBeVisible({ timeout: 60000 });
        }

        // Section: 5.2 การจัดสรรสัดส่วนการลงทุน เบี้ยประกันภัยเพิ่มเติม (Top-Up Premium)
        // เช็คว่า ปุ่ม การจัดสรรสัดส่วนการลงทุน enabled หรือไม่
        const isBtnInvestmentTopUpEnabled = await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_btnInvestmentTopUpPremium.isEnabled();
        if (isBtnInvestmentTopUpEnabled) {
            // เลือกกองทุน สำหรับ Top-Up Premium
            await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_btnInvestmentTopUpPremium.click({ timeout: 10000 });
            // รอ popup เลือกกองทุน ปรากฏ
            await this.expect(this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_popupInvestment).toBeVisible({ timeout: 60000 });
            // แบ่งคอลัมน์ fundname ออกเป็น array โดยใช้ ',' เป็นตัวคั่น
            const fundname_topup_array = data.fundname_topup.split(',').map(r => r.trim());
            // console.log(fundname_topup_array);
            // แบ่งคอลัมน์ insureamountfund ออกเป็น array โดยใช้ ',' เป็นตัวคั่น
            const fundpercent_topup_array = data.fundpercent_topup.split(',').map(r => r.trim());
            // console.log(fundpercent_topup_array);
            // วนลูปเลือกกองทุนและกรอกจำนวนเงินเอาประกันกองทุน
            for (let i = 0; i < fundname_topup_array.length; i++) {
                const fundname_topup = fundname_topup_array[i];
                const fundpercent_topup = fundpercent_topup_array[i];
                // เลือก กองทุน
                const fundname_target = await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_popupInvestment_selFund
                    .locator('option', { hasText: fundname_topup });
                const value = await fundname_target.getAttribute('value');
                await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_popupInvestment_selFund
                    .selectOption(value, { timeout: 10000 });
                // กรอก จำนวนเงินเอาประกันกองทุน
                await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_popupInvestment_txtFundPercent.type(fundpercent_topup, { timeout: 10000 });
                // กดปุ่ม เพิ่มกองทุน
                await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_popupInvestment_btnAddFund.click({ timeout: 10000 });
                // รอ popup ยืนยันการบันทึกข้อมูลแสดง
                await this.expect(this.page.locator('div[class="confirm-dialog yui3-panel-content yui3-widget-stdmod"]', { hasText: 'ยืนยันการบันทึกข้อมูล' })).toBeVisible({ timeout: 60000 });
                // กดปุ่ม ใช่ ใน popup ยืนยันการบันทึกข้อมูล
                await this.page.locator('div[class="confirm-dialog yui3-panel-content yui3-widget-stdmod"]', { hasText: 'ยืนยันการบันทึกข้อมูล' }).getByText('ใช่', { exact: true }).click({ timeout: 10000 });
                // รอ popup ยืนยันการบันทึกข้อมูล ปิด
                await this.expect(this.page.locator('div[class="confirm-dialog yui3-panel-content yui3-widget-stdmod"]', { hasText: 'ยืนยันการบันทึกข้อมูล' })).not.toBeVisible({ timeout: 60000 });
            }
            // กดปุ่ม ยืนยัน popup เลือกกองทุน
            await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_popupInvestment.getByRole('button', { name: 'ยืนยัน' }).click({ timeout: 10000 });
            // รอ popup เลือกกองทุน ปิด
            await this.expect(this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_popupInvestment).not.toBeVisible({ timeout: 60000 });
        }

        // Section: 6. วิธีการชำระเบี้ยประกันภัยและรับผลประโยชน์
        // เลือก วิธีการชำระเบี้ยประกันภัย เป็น ชำระเอง
        await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_radioPaymentTypeSelf.check({ timeout: 10000 });
        // กรอก เลขที่ใบรับเงินชั่วคราว
        await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_txtFirstPaymentTempReceiptNo.type(data.firstpaymenttempreceiptno, { delay: 100, timeout: 10000 });
        // คลิ๊กนอกช่องกรอกข้อมูล เพื่อให้ข้อมูลรีเฟรช
        await this.page.locator('#paymentCriteria_firstPaymentTempReceiptNo-label').click({ timeout: 10000 });
        // เก็บจำนวนเงินรวมทั้งหมด
        await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_txtTotalAmount.waitFor({ state: 'visible', timeout: 60000 });
        const totalamount = await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_txtTotalAmount.textContent();
        // นำจำนวนเงินที่ดึงมา ลบเครื่องหมาย คอมม่า (,) และ .00 ออก
        const totalamountclean = totalamount.replace(/,/g, '').replace('.00', '');
        if (Number(totalamountclean) > 50000) {
            // เลือก Credit Card
            await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_chkPayByCreditCard.check({ timeout: 10000 });
            // เลือก ธนาคาร
            const banktarget = await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_selPayByCreditCardBank
                .locator('option', { hasText: `ธนาคาร${data.bankname_creditcard}` });
            const value = await banktarget.getAttribute('value');
            await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_selPayByCreditCardBank
                .selectOption(value, { timeout: 10000 });
            // นับจำนวนช่องใส่เลขบัตรเครดิต input
            const creditcardnumber_inputs = this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_txtPayByCreditCardNo.locator('input');
            const count = await creditcardnumber_inputs.count();
            // กรอก เลขที่บัตรเครดิต โดยเริ่มที่ 1-9 และวนกลับไปเลข 1 ใหม่ จนครบ 16 หลัก
            for (let i = 0; i < count; i++) {
                const digit = ((i % 9) + 1).toString();
                await creditcardnumber_inputs.nth(i).type(digit, { delay: 100, timeout: 10000 });
            }
            // เลือก เดือนหมดอายุ เดือนสุดท้าย
            await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_selEndMonthCreditCard.selectOption('12', { timeout: 10000 });
            // เลือก ปีหมดอายุ ปีถัดไป
            const currentYear = new Date().getFullYear();
            const nextYear = (currentYear + 1).toString();
            await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_selEndYearCreditCard.selectOption(nextYear, { timeout: 10000 });
            // กรอก จำนวนเงินบัตรเครดิต
            await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_txtCreditAmount.type(totalamountclean, { delay: 100, timeout: 10000 });
            // คลิ๊กนอกช่องกรอกข้อมูล เพื่อให้ข้อมูลรีเฟรช
            await this.page.locator('#paymentCriteria_creditAmount-label').click({ timeout: 10000 });
        } else {
            // เลือก เงินสด
            await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_chkPayByCash.check({ timeout: 10000 });
            // กรอก จำนวนเงินสด
            await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_txtPayByCashAmount.type(totalamountclean, { delay: 100, timeout: 10000 });
            // คลิ๊กนอกช่องกรอกข้อมูล เพื่อให้ข้อมูลรีเฟรช
            await this.page.locator('#paymentCriteria_cashAmount-label').click({ timeout: 10000 });
        }
        // เลือกช่องทางชำระเงินงวดถัดไป เป็น ช่องทางชำระอื่นๆ
        await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_radioNextPaymentTypeOther.check({ timeout: 10000 });
        await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_selNextPaymentTypeOther.selectOption('ชำระผ่านธนาคารหรือผู้ให้บริการอื่น', { timeout: 10000 });
        // เลือก วิธีการรับผลประโยชน์
        if (data.receivetype === "1") {
            // เลือก รับผลประโยชน์เป็นพร้อมเพย์
            await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_chkReceiveTypePromptPay.check({ timeout: 10000 });
        } else if (data.receivetype === "2") {
            // เลือก รับผลประโยชน์เป็นโอนเงิน
            await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_chkReceiveTypeBankAccount.check({ timeout: 10000 });
            // เลือก ธนาคาร
            const bank_receive_target = await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_selReceiveBank
                .locator('option', { hasText: `ธนาคาร${data.bankname_creditcard}` });
            const value = await bank_receive_target.getAttribute('value');
            await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_selReceiveBank
                .selectOption(value, { timeout: 10000 });
            // เลือก ชื่อบัญชี
            await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_selNameAccountBank.selectOption('ผู้เอาประกัน', { timeout: 10000 });
            // กรอก เลขที่บัญชี
            await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_txtAccountNo.type(data.accountno, { delay: 100, timeout: 10000 });
            // กรอก สาขา
            await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_txtBranchBank.type(data.bankbranch, { delay: 100, timeout: 10000 });
        } else if (data.receivetype === "3") {
            // เลือก รับผลประโยชน์เป็นเช็ค
            await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_chkReceiveTypeCheque.check({ timeout: 10000 });
        }

        // Tab 2: ผู้รับผลประโยชน์/คำแถลองสุขภาพ


        // Tab 3: เอกสารประกอบการเอาประกัน
    }

    async formEditNewCase_Tab1_Investment(data) {
        // ตรวจสอบ คะแนนความเสี่ยงว่ามีการกรอกไปแล้ว หรือไม่
        const criteriaSuitabilityValue = await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_txtCriteriaSuitability.inputValue();
        if (criteriaSuitabilityValue === '') {
            // Section: 5. การจัดสรรสัดส่วนการลงทุน
            // เช็คว่าช่อง คะแนนประเมินความเสี่ยง enabled หรือไม่
            const isCriteriaSuitabilityEnabled = await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_txtCriteriaSuitability.isEnabled();
            if (isCriteriaSuitabilityEnabled) {
                // กรอก คะแนนประเมินความเสี่ยง
                await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_txtCriteriaSuitability.type(data.criteriasuitability, { delay: 100, timeout: 10000 });
            }
            // เช็คว่า ช่อง วันที่ประเมินความเสี่ยง enabled หรือไม่
            const isCriteriaEvaluateDateEnabled = await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_txtCriteriaEvaluateDate.isEnabled();
            if (isCriteriaEvaluateDateEnabled) {
                // กรอก วันที่ประเมินความเสี่ยง
                await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_txtCriteriaEvaluateDate.type(data.criteriaevaluatedate, { delay: 100, timeout: 10000 });
            }
            // เช็คว่า ปุ่ม ยอมรับความเสี่ยงการลงทุน แบบไทย enabled หรือไม่
            const isBtnInvestmentThaiEnabled = await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_btnInvestmentthai.isEnabled();
            if (isBtnInvestmentThaiEnabled) {
                // เลือก ยอมรับความเสี่ยงการลงทุน แบบไทย
                await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_btnInvestmentthai.click({ timeout: 10000 });
            }
            // เช็คว่า ปุ่ม ยอมรับความเสี่ยงการลงทุน แบบต่างประเทศ enabled หรือไม่
            const isBtnInvestmentOtherEnabled = await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_btnInvestmentother.isEnabled();
            if (isBtnInvestmentOtherEnabled) {
                // เลือก ยอมรับความเสี่ยงการลงทุน แบบต่างประเทศ
                await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_btnInvestmentother.click({ timeout: 10000 });
            }

            // Section: 5.1 การจัดสรรสัดส่วนการลงทุน เบี้ยประกันภัยหลัก (Regular Premium) หรือ เบี้ยประกันภัยชำระครั้งเดียว (Single Premium)
            // เช็คว่า ปุ่ม การจัดสรรสัดส่วนการลงทุน enabled หรือไม่
            const isBtnInvestmentEnabled = await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_btnInvestmentRegularPremium.isEnabled();
            if (isBtnInvestmentEnabled) {
                // เลือกกองทุน สำหรับ Regular Premium
                await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_btnInvestmentRegularPremium.click({ timeout: 10000 });
                // รอ popup เลือกกองทุน ปรากฏ
                await this.expect(this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_popupInvestment).toBeVisible({ timeout: 60000 });
                // แบ่งคอลัมน์ fundname ออกเป็น array โดยใช้ ',' เป็นตัวคั่น
                const fundname_array = data.fundname.split(',').map(r => r.trim());
                // console.log(fundname_array);
                // แบ่งคอลัมน์ insureamountfund ออกเป็น array โดยใช้ ',' เป็นตัวคั่น
                const fundpercent_array = data.insureamountfund.split(',').map(r => r.trim());
                // console.log(fundpercent_array);
                // วนลูปเลือกกองทุนและกรอกจำนวนเงินเอาประกันกองทุน
                for (let i = 0; i < fundname_array.length; i++) {
                    const fundname = fundname_array[i];
                    const fundpercent = fundpercent_array[i];

                    // เลือก กองทุน
                    const fundname_target = await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_popupInvestment_selFund
                        .locator('option', { hasText: fundname });
                    const value = await fundname_target.getAttribute('value');
                    await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_popupInvestment_selFund
                        .selectOption(value, { timeout: 10000 });
                    // กรอก จำนวนเงินเอาประกันกองทุน
                    await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_popupInvestment_txtFundPercent.type(fundpercent, { timeout: 10000 });
                    // กดปุ่ม เพิ่มกองทุน
                    await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_popupInvestment_btnAddFund.click({ timeout: 10000 });
                    // รอ popup ยืนยันการบันทึกข้อมูลแสดง
                    await this.expect(this.page.locator('div[class="confirm-dialog yui3-panel-content yui3-widget-stdmod"]', { hasText: 'ยืนยันการบันทึกข้อมูล' })).toBeVisible({ timeout: 60000 });
                    // กดปุ่ม ใช่ ใน popup ยืนยันการบันทึกข้อมูล
                    await this.page.locator('div[class="confirm-dialog yui3-panel-content yui3-widget-stdmod"]', { hasText: 'ยืนยันการบันทึกข้อมูล' }).getByText('ใช่', { exact: true }).click({ timeout: 10000 });
                    // รอ popup ยืนยันการบันทึกข้อมูล ปิด
                    await this.expect(this.page.locator('div[class="confirm-dialog yui3-panel-content yui3-widget-stdmod"]', { hasText: 'ยืนยันการบันทึกข้อมูล' })).not.toBeVisible({ timeout: 60000 });
                }
                // กดปุ่ม ยืนยัน popup เลือกกองทุน
                await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_popupInvestment.getByRole('button', { name: 'ยืนยัน' }).click({ timeout: 10000 });
                // รอ popup เลือกกองทุน ปิด
                await this.expect(this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_popupInvestment).not.toBeVisible({ timeout: 60000 });
            }

            // Section: 5.2 การจัดสรรสัดส่วนการลงทุน เบี้ยประกันภัยเพิ่มเติม (Top-Up Premium)
            // เช็คว่า ปุ่ม การจัดสรรสัดส่วนการลงทุน enabled หรือไม่
            const isBtnInvestmentTopUpEnabled = await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_btnInvestmentTopUpPremium.isEnabled();
            if (isBtnInvestmentTopUpEnabled) {
                // เลือกกองทุน สำหรับ Top-Up Premium
                await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_btnInvestmentTopUpPremium.click({ timeout: 10000 });
                // รอ popup เลือกกองทุน ปรากฏ
                await this.expect(this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_popupInvestment).toBeVisible({ timeout: 60000 });
                // แบ่งคอลัมน์ fundname ออกเป็น array โดยใช้ ',' เป็นตัวคั่น
                const fundname_topup_array = data.fundname_topup.split(',').map(r => r.trim());
                // console.log(fundname_topup_array);
                // แบ่งคอลัมน์ insureamountfund ออกเป็น array โดยใช้ ',' เป็นตัวคั่น
                const fundpercent_topup_array = data.fundpercent_topup.split(',').map(r => r.trim());
                // console.log(fundpercent_topup_array);
                // วนลูปเลือกกองทุนและกรอกจำนวนเงินเอาประกันกองทุน
                for (let i = 0; i < fundname_topup_array.length; i++) {
                    const fundname_topup = fundname_topup_array[i];
                    const fundpercent_topup = fundpercent_topup_array[i];
                    // เลือก กองทุน
                    const fundname_target = await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_popupInvestment_selFund
                        .locator('option', { hasText: fundname_topup });
                    const value = await fundname_target.getAttribute('value');
                    await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_popupInvestment_selFund
                        .selectOption(value, { timeout: 10000 });
                    // กรอก จำนวนเงินเอาประกันกองทุน
                    await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_popupInvestment_txtFundPercent.type(fundpercent_topup, { timeout: 10000 });
                    // กดปุ่ม เพิ่มกองทุน
                    await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_popupInvestment_btnAddFund.click({ timeout: 10000 });
                    // รอ popup ยืนยันการบันทึกข้อมูลแสดง
                    await this.expect(this.page.locator('div[class="confirm-dialog yui3-panel-content yui3-widget-stdmod"]', { hasText: 'ยืนยันการบันทึกข้อมูล' })).toBeVisible({ timeout: 60000 });
                    // กดปุ่ม ใช่ ใน popup ยืนยันการบันทึกข้อมูล
                    await this.page.locator('div[class="confirm-dialog yui3-panel-content yui3-widget-stdmod"]', { hasText: 'ยืนยันการบันทึกข้อมูล' }).getByText('ใช่', { exact: true }).click({ timeout: 10000 });
                    // รอ popup ยืนยันการบันทึกข้อมูล ปิด
                    await this.expect(this.page.locator('div[class="confirm-dialog yui3-panel-content yui3-widget-stdmod"]', { hasText: 'ยืนยันการบันทึกข้อมูล' })).not.toBeVisible({ timeout: 60000 });
                }
                // กดปุ่ม ยืนยัน popup เลือกกองทุน
                await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_popupInvestment.getByRole('button', { name: 'ยืนยัน' }).click({ timeout: 10000 });
                // รอ popup เลือกกองทุน ปิด
                await this.expect(this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_popupInvestment).not.toBeVisible({ timeout: 60000 });
            }
        } else {
            console.log('คะแนนความเสี่ยงมีการกรอกไปแล้ว ไม่ต้องกรอกซ้ำ');
        }
    }

    async formAddNewCase_Tab2(data) {
        // Tab 2: ผู้รับผลประโยชน์/คำแถลองสุขภาพ
        // คลิ๊กที่ Tab ผู้รับผลประโยชน์/คำแถลงสุขภาพ
        await this.formaddnewcase_tab2.newcase_formAddNewCase_tab2_btnSubMenu2.click({ timeout: 10000 });
        // รอ Tab ผู้รับผลประโยชน์/คำแถลงสุขภาพ แสดง
        await this.expect(this.page.locator('#beneficiaryCriteriaHeader')).toBeVisible({ timeout: 60000 });

        // Section: 7. ผู้รับผลประโยชน์
        // กดปุ่มใช่ ของผู้รับผลประโยชน์
        await this.formaddnewcase_tab2.newcase_formAddNewCase_tab2_btnYesAddBeneficiary.click({ timeout: 10000 });
        // กดปุ่ม เพิ่มผู้รับผลประโยชน์
        await this.formaddnewcase_tab2.newcase_formAddNewCase_tab2_btnManageBeneficiary.click({ timeout: 10000 });
        // รอ popup ผู้รับผลประโยชน์ ปรากฏ
        await this.expect(this.formaddnewcase_tab2.newcase_formAddNewCase_tab2_popupManageBeneficiary).toBeVisible({ timeout: 60000 });
        // เลือก คำนำหน้า
        await this.formaddnewcase_tab2.newcase_formAddNewCase_tab2_popupManageBeneficiary_selTitle.selectOption('นาย (นาย)', { timeout: 10000 });
        // กรอก ชื่อ
        await this.formaddnewcase_tab2.newcase_formAddNewCase_tab2_popupManageBeneficiary_txtName.type('บิดาทดสอบ', { delay: 100, timeout: 10000 });
        // กดปุ่ม นามสกุลเดียวกัน
        await this.formaddnewcase_tab2.newcase_formAddNewCase_tab2_popupManageBeneficiary_btnSameSurname.click({ timeout: 10000 });
        // เลือก ความสัมพันธ์
        await this.formaddnewcase_tab2.newcase_formAddNewCase_tab2_popupManageBeneficiary_selRelationship.selectOption('บิดา', { timeout: 10000 });
        // กรอก อายุ
        await this.formaddnewcase_tab2.newcase_formAddNewCase_tab2_popupManageBeneficiary_txtAge.type('60', { delay: 100, timeout: 10000 });
        // เลือก เฉลี่ยสัดส่วนผลประโยชน์
        await this.formaddnewcase_tab2.newcase_formAddNewCase_tab2_popupManageBeneficiary_chkShareBenefitPercent.check({ timeout: 10000 });
        // เลือก ที่อยู่เดียวกับผู้เอาประกัน
        await this.formaddnewcase_tab2.newcase_formAddNewCase_tab2_popupManageBeneficiary_selSameAddress.selectOption({ label: 'ที่อยู่เดียวกันกับ ทะเบียนบ้านผู้เอาประกัน' }, { timeout: 10000 });
        await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_Current_selSameAddress.dispatchEvent('change');
        await this.formaddnewcase_tab1.newcase_formAddNewCase_tab1_Current_selSameAddress.dispatchEvent('input');
        await this.page.waitForTimeout(1000); // เพิ่ม delay 1 วินาที เพื่อรอข้อมูลโหลด
        // กดปุ่ม เพิ่ม ใน popup ผู้รับผลประโยชน์
        await this.formaddnewcase_tab2.newcase_formAddNewCase_tab2_popupManageBeneficiary_btnAddBeneficiary.click({ timeout: 10000 });
        // เช็คว่าข้อมูลเข้าในตารางผู้รับผลประโยชน์หรือไม่
        await this.expect(this.formaddnewcase_tab2.newcase_formAddNewCase_tab2_popupManageBeneficiary.locator('text=No data to display')).not.toBeVisible({ timeout: 60000 });
        // กดปุ่ม ยืนยัน ใน popup ผู้รับผลประโยชน์
        await this.formaddnewcase_tab2.newcase_formAddNewCase_tab2_popupManageBeneficiary.getByRole('button', { name: 'ยืนยัน' }).click({ timeout: 10000 });
        // รอ popup ผู้รับผลประโยชน์ ปิด
        await this.expect(this.formaddnewcase_tab2.newcase_formAddNewCase_tab2_popupManageBeneficiary).not.toBeVisible({ timeout: 60000 });

        // Section: 8. ท่านมีหรือเคยมีประกันชีวิตหรือประกันสุขภาพ หรือประกันอุบัติเหตุ หรือกำลังขอเอาประกันภัยดังกล่าวไว้กับบริษัทนี้หรือบริษัทอื่นหรือไม่
        // เลือก ไม่มีประกันภัยกับบริษัทนี้หรือบริษัทอื่น
        await this.formaddnewcase_tab2.newcase_formAddNewCase_tab2_radioHaveInsuranceNo.check({ timeout: 10000 });

        // Section: 9. ท่านเคยถูกปฏิเสธ เลื่อนการรับประกัน ยกเลิกสัญญาเพิ่มเติม เพิ่มอัตราเบี้ยประกันภัย เปลี่ยนแปลงเงื่อนไข สำหรับการขอเอาประกันภัย หรือการขอกลับคืนสู่สถานะเดิม หรือการต่ออายุของกรมธรรม์จากบริษัทนี้ หรือบริษัทอื่นหรือไม่
        // เลือก ไม่เคยถูกปฏิเสธฯ
        await this.formaddnewcase_tab2.newcase_formAddNewCase_tab2_radioDeniedInsuranceNo.check({ timeout: 10000 });

        // Section: 10. ส่วนสูง / น้ำหนัก
        // กรอก ส่วนสูง
        await this.formaddnewcase_tab2.newcase_formAddNewCase_tab2_txtHeight.type(data.height, { delay: 100, timeout: 10000 });
        // กรอก น้ำหนัก
        await this.formaddnewcase_tab2.newcase_formAddNewCase_tab2_txtWeight.type(data.weight, { delay: 100, timeout: 10000 });
        // เลือก น้ำหนักไม่เปลี่ยนแปลงในรอบ 6 เดือนที่ผ่านมา
        await this.formaddnewcase_tab2.newcase_formAddNewCase_tab2_radioNoChangeWeight6Month.check({ timeout: 10000 });

        // Section: 11. ท่านสูบบุหรี่หรือเคยสูบบุหรี่ หรือยาสูบชนิดอื่นหรือไม่
        // เลือก ไม่เคยสูบบุหรี่หรือยาสูบชนิดอื่น
        await this.formaddnewcase_tab2.newcase_formAddNewCase_tab2_radioSmokerNo.check({ timeout: 10000 });

        // Section: 12. ท่านดื่มหรือเคยดื่มเครื่องดื่มที่มีแอลกอฮอล์เป็นประจำหรือไม่
        // เลือก ไม่เคยดื่มเครื่องดื่มที่มีแอลกอฮอล์เป็นประจำ
        await this.formaddnewcase_tab2.newcase_formAddNewCase_tab2_radioAlcoholNo.check({ timeout: 10000 });

        // Section: 13. ท่านเสพ หรือเคยเสพยาเสพติด หรือสารเสพติดหรือไม่
        // เลือก ไม่เคยเสพยาเสพติดหรือสารเสพติด
        await this.formaddnewcase_tab2.newcase_formAddNewCase_tab2_radioDrugNo.check({ timeout: 10000 });

        // Section: 14. ท่านเคยมีส่วนเกี่ยวข้องกับการค้ายาเสพติดหรือเคยต้องโทษเกี่ยวกับคดียาเสพติดหรือไม่
        // เลือก ไม่เคยมีส่วนเกี่ยวข้องกับการค้ายาเสพติดหรือเคยต้องโทษเกี่ยวกับคดียาเสพติด
        await this.formaddnewcase_tab2.newcase_formAddNewCase_tab2_radioDrugTradeNo.check({ timeout: 10000 });

        // Section: 15. ประวัติสุขภาพในช่วงเวลาที่ผ่านมา
        // เลือก ไม่มีประวัติสุขภาพตามข้อคำถาม
        await this.formaddnewcase_tab2.newcase_formAddNewCase_tab2_radioHealthHistoryNo.check({ timeout: 10000 });

        // Section: 16. ท่านเคยได้รับการวินิจฉัย หรือรับการรักษา หรือตั้งข้อสังเกตโดยแพทย์ว่า ป่วยเป็นโรคตามรายการหรือไม่
        // เลือก ไม่เคยได้รับการวินิจฉัยฯ
        await this.formaddnewcase_tab2.newcase_formAddNewCase_tab2_radioDiagnosedDiseaseNo.check({ timeout: 10000 });

        // Section: 17. ท่านเคยมี หรือกำลังมีอาการ ตามรายการหรือไม่
        // เลือก ไม่มีอาการตามรายการ
        await this.formaddnewcase_tab2.newcase_formAddNewCase_tab2_radioHaveSymptomsNo.check({ timeout: 10000 });

        // Section: 18. เฉพาะสตรี
        // ถ้าปุ่มให้เลือกเปิด ให้เลือก ไม่เคยตั้งครรภ์
        const isEnabled = await this.formaddnewcase_tab2.newcase_formAddNewCase_tab2_radioPregnantNo.isEnabled({ timeout: 10000 });
        if (isEnabled) {
            await this.formaddnewcase_tab2.newcase_formAddNewCase_tab2_radioPregnantNo.check({ timeout: 10000 });
        }
        // ถ้าปุ่มให้เลือกเปิด ให้เลือก โรคแทรกซ้อนในการตั้งครรภ์และคลอดบุตร เลือดออกผิดปกติทางช่องคลอด
        const isEnabled2 = await this.formaddnewcase_tab2.newcase_formAddNewCase_tab2_radioPregnantComplicationsNo.isEnabled({ timeout: 10000 });
        if (isEnabled2) {
            await this.formaddnewcase_tab2.newcase_formAddNewCase_tab2_radioPregnantComplicationsNo.check({ timeout: 10000 });
        }
        // ถ้าปุ่มให้เลือกเปิด ให้เลือก อาการปวดท้องมากขณะมีประจําเดือน ประจําเดือนมามากผิดปกติ
        const isEnabled3 = await this.formaddnewcase_tab2.newcase_formAddNewCase_tab2_radioPregnantMenstruationNo.isEnabled({ timeout: 10000 });
        if (isEnabled3) {
            await this.formaddnewcase_tab2.newcase_formAddNewCase_tab2_radioPregnantMenstruationNo.check({ timeout: 10000 });
        }

        // Section: 19. ท่านเคยได้รับการวินิจฉัย หรือรับการรักษา หรือตั้งข้อสังเกตจากแพทย์ว่าเป็นโรคตามรายการท้ายคำถามนี้หรือไม่ (คำถามใช้สำหรับการขอเอาประกันภัยสัญญาเพิ่มเติมเกี่ยวกับสุขภาพหรือโรคร้ายแรง)
        // เลือก ไม่เคยได้รับการวินิจฉัยฯ
        await this.formaddnewcase_tab2.newcase_formAddNewCase_tab2_radioSeriousIllnessNo.check({ timeout: 10000 });

        // Section: 22. ผู้ขอเอาประกันภัยประสงค์จะใช้สิทธิขอยกเว้นภาษีเงินได้ตามกฎหมายว่าด้วยภาษีอากรหรือไม่
        // เลือก ไม่ประสงค์จะใช้สิทธิขอยกเว้นภาษีเงินได้
        await this.formaddnewcase_tab2.newcase_formAddNewCase_tab2_radioTaxExemptionNo.check({ timeout: 10000 });

        // Section: 23. การรับรองสถานะและคำยินยอมและตกลงเพื่อปฏิบัติตามกฎหมาย Foreign Account Tax Compliance Act ของสหรัฐอเมริกา (กฎหมาย FATCA)
        // เลือก ท่านมีสัญชาติ ประเทศที่เกิด ที่เกี่ยวข้องกับประเทศสหรัฐอเมริกาหรือไม่
        await this.formaddnewcase_tab2.newcase_formAddNewCase_tab2_radioAmericanNo.check({ timeout: 10000 });
        // เลือก ท่านเป็นหรือเคยเป็นผู้ถือบัตรประจำตัวผู้มีถิ่นที่อยู่ถาวรอย่างถูกกฎหมายในประเทศสหรัฐอเมริกา (Green Card) หรือไม่
        await this.formaddnewcase_tab2.newcase_formAddNewCase_tab2_radioGreenCardNo.check({ timeout: 10000 });
        // เลือก ท่านมีหน้าที่เสียภาษีให้แก่กรมสรรพากรสหรัฐอเมริกาหรือไม่
        await this.formaddnewcase_tab2.newcase_formAddNewCase_tab2_radioAmericanTaxNo.check({ timeout: 10000 });
        // เลือก ท่านมีสถานะเป็นผู้มีถิ่นที่อยู่ในประเทศสหรัฐอเมริกาเพื่อวัตถุประสงค์ในการเก็บภาษีอากาของประเทศสหรัฐอเมริกาใช่หรือไม่ (เช่น มีถิ่นที่อยู่ในประเทศสหรัฐอเมริกาอย่างน้อย 183 วันในปีปฏิทินที่ผ่านมา)
        await this.formaddnewcase_tab2.newcase_formAddNewCase_tab2_radioLiveInAmericanNo.check({ timeout: 10000 });

        // การยินยอมเพื่อวัตถุประสงค์ทางการตลาด
        // เลือก ไม่ยินยอมให้บริษัทฯ ใช้ข้อมูลส่วนบุคคลเพื่อวัตถุประสงค์ทางการตลาด
        await this.formaddnewcase_tab2.newcase_formAddNewCase_tab2_radioMarketingConsentNo.check({ timeout: 10000 });

        // ข้อมูลถิ่นที่อยู่ภาษี
        // เลือก ประเทศถิ่นที่อยู่ภาษี เป็น ไทย
        await this.formaddnewcase_tab2.newcase_formAddNewCase_tab2_radioTaxResidenceInfo.check({ timeout: 10000 });
    }

    async formAddNewCase_Tab3(data) {
        // Tab 3: เอกสารประกอบการเอาประกัน
        // คลิ๊กที่ Tab เอกสารประกอบการเอาประกัน
        await this.formaddnewcase_tab3.newcase_formAddNewCase_tab3_btnSubMenu3.click({ timeout: 10000 });
        // รอ Tab เอกสารประกอบการเอาประกัน แสดง
        await this.expect(this.page.locator('text=กรุณาทำเครื่องหมาย ในรายการที่มีเอกสารประกอบมาพร้อมกับใบคำขอฯ')).toBeVisible({ timeout: 60000 });

        // checkbox สำเนาบัตรประชาชน
        await this.formaddnewcase_tab3.newcase_formAddNewCase_tab3_chkIDCard.check({ timeout: 30000 });
        // checkbox เอกสารสรุปสาระสำคัญความคุ้มครองฯ (Fact Sheet)
        await this.formaddnewcase_tab3.newcase_formAddNewCase_tab3_chkFactSheet.check({ timeout: 10000 });
        // checkbox ตรวจดูการลงลายมือชื่อ หรือการพิมพ์ลายนิ้วมือ (พยาน 2 คน) ของผู้เอาประกันในใบคำขอฯ และรายงานการตรวจสุขภาพของแพทย์ (หากมี) เรียบร้อยแล้ว
        await this.formaddnewcase_tab3.newcase_formAddNewCase_tab3_chkSignatureWitness.check({ timeout: 10000 });
        // checkbox ตรวจดูการลงลายมือชื่อรับรองสำเนาถูกต้องของเอกสารแล้ว
        await this.formaddnewcase_tab3.newcase_formAddNewCase_tab3_chkCertifiedTrueCopy.check({ timeout: 10000 });
        // checkbox ตรวจดูวันหมดอายุของเอกสารทุกฉบับ เป็นที่เรียบร้อยแล้ว
        await this.formaddnewcase_tab3.newcase_formAddNewCase_tab3_chkDocumentExpiryDate.check({ timeout: 10000 });
        // เลือก สาขาที่รับเอกสาร
        await this.formaddnewcase_tab3.newcase_formAddNewCase_tab3_selDocumentBranch.selectOption(data.branchcode, { timeout: 10000 });
    }

    async formAddNewCase_SaveDraft() {
        // กดปุ่ม บันทึกแบบร่าง
        await this.formaddnewcase_savedraft.newcase_formAddNewCase_btnSaveDraft.click({ timeout: 10000 });
        // รอ popup บันทึกแบบร่าง แสดง
        await this.expect(this.formaddnewcase_savedraft.newcase_formAddNewCase_popupSaveDraftSuccess).toBeVisible({ timeout: 60000 });
        // กดปุ่ม ตกลง ใน popup บันทึกแบบร่าง
        await this.formaddnewcase_savedraft.newcase_formAddNewCase_popupSaveDraftSuccess.getByRole('button', { name: 'ตกลง' }).click({ timeout: 10000 });
        // รอ popup บันทึกแบบร่าง ปิด
        await this.expect(this.formaddnewcase_savedraft.newcase_formAddNewCase_popupSaveDraftSuccess).not.toBeVisible({ timeout: 60000 });
        // รอ popup บันทึกเคสใหม่ ปิด
        await this.expect(this.page.locator('#mainDialogId')).not.toBeVisible({ timeout: 60000 });
    }

}

module.exports = { NewCasePage };