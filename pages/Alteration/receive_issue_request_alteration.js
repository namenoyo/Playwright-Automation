const { time } = require('console');
const { requestissueformLocator } = require('../../locators/Alteration/alteration.locators.js');
const { hasSubscribers } = require('diagnostics_channel');

class ReceiveIssueRequestAlteration {
    constructor(page, expect) {
        this.page = page;
        this.expect = expect;
        this.requestissueformlocators = requestissueformLocator(page);
    }

    async inputdataendorse_alteration(data) {
        // กรอกข้อมูลสลักหลัง
        // แบ่งเงื่อนไขตาม endorse_code
        const endorse_code = data.endorse_code;
        for (const code of endorse_code) {
            if (code === 'ECN01') {
                // กรอกข้อมูลสลักหลัง ECN01
                // เลือก คำนำหน้า
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_Title(code).click({ timeout: 10000 });
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_Sel_All.getByText(data.ecn01_title, { exact: true }).click({ timeout: 10000 });
                // กรอก ชื่อ
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_Name(code).fill(data.ecn01_firstname);
                // กรอก นามสกุล
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_Surname(code).fill(data.ecn01_lastname);
            } else if (code === 'ECN02') {
                // กรอกข้อมูลสลักหลัง ECN02
                // กรอก บ้านเลขที่
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_House_Number(code).fill(data.ecn02_housenumber);
                // กรอก หมู่
                // ถ้าไม่มีข้อมูลข้ามไปเลย
                if (data.ecn02_moo !== undefined && data.ecn02_moo !== null && data.ecn02_moo !== '') {
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_Moo(code).fill(data.ecn02_moo);
                }
                // กรอก หมู่บ้าน
                // ถ้าไม่มีข้อมูลข้ามไปเลย
                if (data.ecn02_village !== undefined && data.ecn02_village !== null && data.ecn02_village !== '') {
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_Village_Tower(code).fill(data.ecn02_village);
                }
                // กรอก ซอย
                // ถ้าไม่มีข้อมูลข้ามไปเลย
                if (data.ecn02_soi !== undefined && data.ecn02_soi !== null && data.ecn02_soi !== '') {
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_Soi(code).fill(data.ecn02_soi);
                }
                // กรอก ถนน
                // ถ้าไม่มีข้อมูลข้ามไปเลย
                if (data.ecn02_road !== undefined && data.ecn02_road !== null && data.ecn02_road !== '') {
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_Road(code).fill(data.ecn02_road);
                }
                // เลือก จังหวัด
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_Provice(code).click({ timeout: 10000 });
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_Sel_All.getByText(data.ecn02_province, { exact: true }).click({ timeout: 10000 });
                // เลือก อำเภอ/เขต
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_District(code).click({ timeout: 10000 });
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_Sel_All.getByText(data.ecn02_district, { exact: true }).click({ timeout: 10000 });
                // เลือก ตำบล/แขวง
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_Subdistrict(code).click({ timeout: 10000 });
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_Sel_All.locator('label', { hasText: data.ecn02_subdistrict }).click({ timeout: 10000 });
                // เช็คว่าช่่องไปรษณีย์มีค่าอัพเดทหรือยัง
                await this.expect(this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_Postal_Code(code)).not.toBeEmpty({ timeout: 10000 });
            } else if (code === 'ECN03') {
                // กรอกข้อมูลสลักหลัง ECN03
                if (data.ecn03_mode === 'Edit') {
                    // กดปุ่ม แก้ไขผู้รับประโยชน์
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_btn_edit_Benefit(code).click({ timeout: 10000 });
                } else if (data.ecn03_mode === 'New') {
                    // กดปุ่ม จัดการข้อมูลผู้รับผลประโยชน์
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_btn_ManageBenefit(code).click({ timeout: 10000 });
                }
                // รอ popup จัดการข้อมูลผู้รับผลประโยชน์ ขึ้นมา
                await this.expect(this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_ManageBenefit).toBeVisible({ timeout: 10000 });
                
                // ข้อมูลผู้รับผลประโยชน์
                // เลือก ความสัมพันธ์
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Relationship.click({ timeout: 10000 });
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_Sel_All.getByText(data.ecn03_relationship, { exact: true }).click({ timeout: 10000 });
                if (data.ecn03_relationship === 'อื่นๆ') {
                    // กรอก ความสัมพันธ์อื่นๆ
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Relationship_Other.fill('', { timeout: 10000 });
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Relationship_Other.fill(data.ecn03_relationship_other, { timeout: 10000 });
                }
                // เลือก คำนำหน้า
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Title.click({ timeout: 10000 });
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_Sel_All.getByText(data.ecn03_title, { exact: true }).click({ timeout: 10000 });
                // กรอก ชื่อ
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Name.fill('', { timeout: 10000 });
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Name.fill(data.ecn03_firstname, { timeout: 10000 });
                // กรอก นามสกุล
                // ถ้าไม่มีข้อมูลข้ามไปเลย
                if (data.ecn03_mode === 'Edit') {
                    if (data.ecn03_lastname !== undefined && data.ecn03_lastname !== null && data.ecn03_lastname !== '') {
                        await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_edit_Surname.fill('', { timeout: 10000 });
                        await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_edit_Surname.fill(data.ecn03_lastname, { timeout: 10000 });
                    }
                } else if (data.ecn03_mode === 'New') {
                    if (data.ecn03_lastname !== undefined && data.ecn03_lastname !== null && data.ecn03_lastname !== '') {
                        await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_add_Surname.fill('', { timeout: 10000 });
                        await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_add_Surname.fill(data.ecn03_lastname, { timeout: 10000 });
                    }
                }
                // เลือก คำนำหน้า (ภาษาอังกฤษ)
                // ถ้าไม่มีข้อมูลข้ามไปเลย
                if (data.ecn03_title_eng !== undefined && data.ecn03_title_eng !== null && data.ecn03_title_eng !== '') {
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Title_Eng.click({ timeout: 10000 });
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_Sel_All.getByText(data.ecn03_title_eng, { exact: true }).click({ timeout: 10000 });
                }
                // กรอก ชื่อ (ภาษาอังกฤษ)
                // ถ้าไม่มีข้อมูลข้ามไปเลย
                if (data.ecn03_firstname_eng !== undefined && data.ecn03_firstname_eng !== null && data.ecn03_firstname_eng !== '') {
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Name_Eng.fill('', { timeout: 10000 });
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Name_Eng.fill(data.ecn03_firstname_eng, { timeout: 10000 });
                }
                // กรอก นามสกุล (ภาษาอังกฤษ)
                // ถ้าไม่มีข้อมูลข้ามไปเลย
                if (data.ecn03_lastname_eng !== undefined && data.ecn03_lastname_eng !== null && data.ecn03_lastname_eng !== '') {
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Surname_Eng.fill('', { timeout: 10000 });
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Surname_Eng.fill(data.ecn03_lastname_eng, { timeout: 10000 });
                }
                // เลือก เพศ
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Sex.click({ timeout: 10000 });
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_Sel_All.getByText(data.ecn03_sex, { exact: true }).click({ timeout: 10000 });
                // กรอก วันเดือนปีเกิด
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Birthdate.fill('', { timeout: 10000 });
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Birthdate.fill(data.ecn03_birthdate, { timeout: 10000 });
                // เช็คว่า อายุ อัพเดทหรือยัง
                await this.expect(this.page.locator('#beneficiaryCurrentAge')).not.toBeEmpty({ timeout: 10000 });
                // เลือก ประเภทบัตร
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_TypeCard.click({ timeout: 10000 });
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_Sel_All.locator('label', { hasText: data.ecn03_idcardtype, exact: true }).click({ timeout: 10000 });
                // กรอก หมายเลขบัตร
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_IDCard.fill('', { timeout: 10000 });
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_IDCard.fill(data.ecn03_idcardnumber, { timeout: 10000 });
                // กรอก สัดส่วนผลประโยชน์
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Percentage.fill('', { timeout: 10000 });
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Percentage.fill(data.ecn03_percentage, { timeout: 10000 });

                // ที่อยู่ติดต่อ
                // กรอก บ้านเลขที่
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Address_HouseNumber.fill('', { timeout: 10000 });
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Address_HouseNumber.fill(data.ecn03_housenumber, { timeout: 10000 });
                // กรอก หมู่
                // ถ้าไม่มีข้อมูลข้ามไปเลย
                if (data.ecn03_moo !== undefined && data.ecn03_moo !== null && data.ecn03_moo !== '') {
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Address_Moo.fill('', { timeout: 10000 });
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Address_Moo.fill(data.ecn03_moo, { timeout: 10000 });
                }
                // กรอก หมู่บ้าน
                // ถ้าไม่มีข้อมูลข้ามไปเลย
                if (data.ecn03_village !== undefined && data.ecn03_village !== null && data.ecn03_village !== '') {
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Address_VillageBuilding.fill('', { timeout: 10000 });
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Address_VillageBuilding.fill(data.ecn03_village, { timeout: 10000 });
                }
                // กรอก ซอย
                // ถ้าไม่มีข้อมูลข้ามไปเลย
                if (data.ecn03_soi !== undefined && data.ecn03_soi !== null && data.ecn03_soi !== '') {
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Address_Soi.fill('', { timeout: 10000 });
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Address_Soi.fill(data.ecn03_soi, { timeout: 10000 });
                }
                // กรอก ถนน
                // ถ้าไม่มีข้อมูลข้ามไปเลย
                if (data.ecn03_road !== undefined && data.ecn03_road !== null && data.ecn03_road !== '') {
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Address_Road.fill('', { timeout: 10000 });
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Address_Road.fill(data.ecn03_road, { timeout: 10000 });
                }
                // เลือก จังหวัด
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Address_Province.click({ timeout: 10000 });
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_Sel_All.getByText(data.ecn03_province, { exact: true }).click({ timeout: 10000 });
                // เลือก อำเภอ/เขต
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Address_District.click({ timeout: 10000 });
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_Sel_All.getByText(data.ecn03_district, { exact: true }).click({ timeout: 10000 });
                // เลือก ตำบล/แขวง
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Address_Subdistrict.click({ timeout: 10000 });
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_Sel_All.locator('label', { hasText: data.ecn03_subdistrict }).click({ timeout: 10000 });
                // เช็คว่าช่่องไปรษณีย์มีค่าอัพเดทหรือยัง
                await this.expect(this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Address_PostalCode).not.toBeEmpty({ timeout: 10000 });
                // กรอก เบอร์โทรศัพท์
                // ถ้าไม่มีข้อมูลข้ามไปเลย
                if (data.ecn03_mobilephone !== undefined && data.ecn03_mobilephone !== null && data.ecn03_mobilephone !== '') {
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Address_PhoneNumber.fill('', { timeout: 10000 });
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Address_PhoneNumber.fill(data.ecn03_mobilephone, { timeout: 10000 });
                }
                // กรอก โทรศัพท์บ้าน
                // ถ้าไม่มีข้อมูลข้ามไปเลย
                if (data.ecn03_housetelephone !== undefined && data.ecn03_housetelephone !== null && data.ecn03_housetelephone !== '') {
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Address_PhoneNumber_Home.fill('', { timeout: 10000 });
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Address_PhoneNumber_Home.fill(data.ecn03_housetelephone, { timeout: 10000 });
                }
                // กรอก อีเมล
                // ถ้าไม่มีข้อมูลข้ามไปเลย
                if (data.ecn03_email !== undefined && data.ecn03_email !== null && data.ecn03_email !== '') {
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Address_Email.fill('', { timeout: 10000 });
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_Address_Email.fill(data.ecn03_email, { timeout: 10000 });
                }
                // กดปุ่ม บันทึก ใน popup ผู้รับผลประโยชน์
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_btn_Save.click({ timeout: 10000 });
                // รอ popup ยืนยันการบันทึกผู้รับผลประโยชน์ ขึ้นมา
                await this.expect(this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_btn_Cancel_popup_Confirm).toBeVisible({ timeout: 10000 });
                // กดปุ่ม ยืนยัน ใน popup ยืนยันการบันทึกผู้รับผลประโยชน์
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_btn_Cancel_popup_Confirm.click({ timeout: 10000 });
                // รอ popup จัดการข้อมูลผู้รับผลประโยชน์ หายไป
                await this.expect(this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_ManageBenefit).not.toBeVisible({ timeout: 10000 });
            } else if (code === 'ECN04') {
                // กรอกข้อมูลสลักหลัง ECN04
                if (data.ecn04_mode === 'Edit') {
                    // กดปุ่ม แก้ไขผู้รับประโยชน์
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_1_In_Page_Request_ECN04_1_1_Button.click({ timeout: 10000 });
                } else if (data.ecn04_mode === 'New') {
                    // กดปุ่ม จัดการข้อมูลผู้รับผลประโยชน์
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_1_In_Page_Request_ECN04_1_Button.click({ timeout: 10000 });
                }
                // รอ popup จัดการข้อมูลผู้รับผลประโยชน์ ขึ้นมา
                await this.expect(this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_ManageBenefit).toBeVisible({ timeout: 10000 });
                
                // ข้อมูลผู้รับผลประโยชน์
                // เลือก ความสัมพันธ์
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_3_Input_Text.click({ timeout: 10000 });
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_Sel_All.getByText(data.ecn04_relationship, { exact: true }).click({ timeout: 10000 });
                if (data.ecn04_relationship === 'อื่นๆ') {
                    // กรอก ความสัมพันธ์อื่นๆ
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_4_Input_Text.fill('', { timeout: 10000 });
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_4_Input_Text.fill(data.ecn04_relationship_other, { timeout: 10000 });
                }
                // เลือก คำนำหน้า
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_5_Input_Text.click({ timeout: 10000 });
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_Sel_All.getByText(data.ecn04_title, { exact: true }).click({ timeout: 10000 });
                // กรอก ชื่อ
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_6_Input_Text.fill('', { timeout: 10000 });
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_6_Input_Text.fill(data.ecn04_firstname, { timeout: 10000 });
                // กรอก นามสกุล
                // ถ้าไม่มีข้อมูลข้ามไปเลย
                if (data.ecn04_mode === 'Edit') {
                    if (data.ecn04_lastname !== undefined && data.ecn04_lastname !== null && data.ecn04_lastname !== '') {
                        await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_edit_Surname.fill('', { timeout: 10000 });
                        await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_edit_Surname.fill(data.ecn04_lastname, { timeout: 10000 });
                    }
                } else if (data.ecn04_mode === 'New') {
                    if (data.ecn04_lastname !== undefined && data.ecn04_lastname !== null && data.ecn04_lastname !== '') {
                        await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_7_Input_Text.fill('', { timeout: 10000 });
                        await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_7_Input_Text.fill(data.ecn04_lastname, { timeout: 10000 });
                    }
                }
                // เลือก คำนำหน้า (ภาษาอังกฤษ)
                // ถ้าไม่มีข้อมูลข้ามไปเลย
                if (data.ecn04_title_eng !== undefined && data.ecn04_title_eng !== null && data.ecn04_title_eng !== '') {
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_8_Input_Text.click({ timeout: 10000 });
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_Sel_All.getByText(data.ecn04_title_eng, { exact: true }).click({ timeout: 10000 });
                }
                // กรอก ชื่อ (ภาษาอังกฤษ)
                // ถ้าไม่มีข้อมูลข้ามไปเลย
                if (data.ecn04_firstname_eng !== undefined && data.ecn04_firstname_eng !== null && data.ecn04_firstname_eng !== '') {
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_9_Input_Text.fill('', { timeout: 10000 });
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_9_Input_Text.fill(data.ecn04_firstname_eng, { timeout: 10000 });
                }
                // กรอก นามสกุล (ภาษาอังกฤษ)
                // ถ้าไม่มีข้อมูลข้ามไปเลย
                if (data.ecn04_lastname_eng !== undefined && data.ecn04_lastname_eng !== null && data.ecn04_lastname_eng !== '') {
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_10_Input_Text.fill('', { timeout: 10000 });
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_10_Input_Text.fill(data.ecn04_lastname_eng, { timeout: 10000 });
                }
                // เลือก เพศ
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_11_Input_Text.click({ timeout: 10000 });
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_Sel_All.getByText(data.ecn04_sex, { exact: true }).click({ timeout: 10000 });
                // กรอก วันเดือนปีเกิด
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_12_Input_Text.fill('', { timeout: 10000 });
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_12_Input_Text.fill(data.ecn04_birthdate, { timeout: 10000 });
                // เช็คว่า อายุ อัพเดทหรือยัง
                await this.expect(this.page.locator('#beneficiaryCurrentAge')).not.toBeEmpty({ timeout: 10000 });
                // เลือก ประเภทบัตร
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_14_Input_Text.click({ timeout: 10000 });
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_Sel_All.locator('label', { hasText: data.ecn04_idcardtype, exact: true }).click({ timeout: 10000 });
                // กรอก หมายเลขบัตร
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_15_Input_Text.fill('', { timeout: 10000 });
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_15_Input_Text.fill(data.ecn04_idcardnumber, { timeout: 10000 });
                // กรอก สัดส่วนผลประโยชน์
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_16_Input_Text.fill('', { timeout: 10000 });
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_16_Input_Text.fill(data.ecn04_percentage, { timeout: 10000 });

                // ที่อยู่ติดต่อ
                // กรอก บ้านเลขที่
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_17_Input_Text.fill('', { timeout: 10000 });
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_17_Input_Text.fill(data.ecn04_housenumber, { timeout: 10000 });
                // กรอก หมู่
                // ถ้าไม่มีข้อมูลข้ามไปเลย
                if (data.ecn04_moo !== undefined && data.ecn04_moo !== null && data.ecn04_moo !== '') {
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_18_Input_Text.fill('', { timeout: 10000 });
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_18_Input_Text.fill(data.ecn04_moo, { timeout: 10000 });
                }
                // กรอก หมู่บ้าน
                // ถ้าไม่มีข้อมูลข้ามไปเลย
                if (data.ecn04_village !== undefined && data.ecn04_village !== null && data.ecn04_village !== '') {
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_19_Input_Text.fill('', { timeout: 10000 });
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_19_Input_Text.fill(data.ecn04_village, { timeout: 10000 });
                }
                // กรอก ซอย
                // ถ้าไม่มีข้อมูลข้ามไปเลย
                if (data.ecn04_soi !== undefined && data.ecn04_soi !== null && data.ecn04_soi !== '') {
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_20_Input_Text.fill('', { timeout: 10000 });
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_20_Input_Text.fill(data.ecn04_soi, { timeout: 10000 });
                }
                // กรอก ถนน
                // ถ้าไม่มีข้อมูลข้ามไปเลย
                if (data.ecn04_road !== undefined && data.ecn04_road !== null && data.ecn04_road !== '') {
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_21_Input_Text.fill('', { timeout: 10000 });
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_21_Input_Text.fill(data.ecn04_road, { timeout: 10000 });
                }
                // เลือก จังหวัด
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_22_Input_Text.click({ timeout: 10000 });
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_Sel_All.getByText(data.ecn04_province, { exact: true }).click({ timeout: 10000 });
                // เลือก อำเภอ/เขต
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_23_Input_Text.click({ timeout: 10000 });
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_Sel_All.getByText(data.ecn04_district, { exact: true }).click({ timeout: 10000 });
                // เลือก ตำบล/แขวง
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_24_Input_Text.click({ timeout: 10000 });
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_Sel_All.locator('label', { hasText: data.ecn04_subdistrict }).click({ timeout: 10000 });
                // เช็คว่าช่่องไปรษณีย์มีค่าอัพเดทหรือยัง
                await this.expect(this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_25_Input_Text).not.toBeEmpty({ timeout: 10000 });
                // กรอก เบอร์โทรศัพท์
                // ถ้าไม่มีข้อมูลข้ามไปเลย
                if (data.ecn04_mobilephone !== undefined && data.ecn04_mobilephone !== null && data.ecn04_mobilephone !== '') {
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_26_Input_Text.fill('', { timeout: 10000 });
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_26_Input_Text.fill(data.ecn04_mobilephone, { timeout: 10000 });
                }
                // กรอก โทรศัพท์บ้าน
                // ถ้าไม่มีข้อมูลข้ามไปเลย
                if (data.ecn04_housetelephone !== undefined && data.ecn04_housetelephone !== null && data.ecn04_housetelephone !== '') {
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_27_Input_Text.fill('', { timeout: 10000 });
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_27_Input_Text.fill(data.ecn04_housetelephone, { timeout: 10000 });
                }
                // กรอก อีเมล
                // ถ้าไม่มีข้อมูลข้ามไปเลย
                if (data.ecn04_email !== undefined && data.ecn04_email !== null && data.ecn04_email !== '') {
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_28_Input_Text.fill('', { timeout: 10000 });
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_28_Input_Text.fill(data.ecn04_email, { timeout: 10000 });
                }
                // กดปุ่ม บันทึก ใน popup ผู้รับผลประโยชน์
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_btn_Save.click({ timeout: 10000 });
                // รอ popup ยืนยันการบันทึกผู้รับผลประโยชน์ ขึ้นมา
                await this.expect(this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_btn_Cancel_popup_Confirm).toBeVisible({ timeout: 10000 });
                // กดปุ่ม ยืนยัน ใน popup ยืนยันการบันทึกผู้รับผลประโยชน์
                await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_Beneficiary_btn_Cancel_popup_Confirm.click({ timeout: 10000 });
                // รอ popup จัดการข้อมูลผู้รับผลประโยชน์ หายไป
                await this.expect(this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_popup_ManageBenefit).not.toBeVisible({ timeout: 10000 });

                // ประสงค์ที่จะรับเงินตามเงื่อนไขกรมธรรม์ด้วยวิธีหนึ่ง ดังนี้ *
                if (data.ecn04_channelpayment === 'พร้อมเพย์') {
                    // เลือก ช่องทางพร้อมเพย์
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_29_Radio.check({ timeout: 10000 });
                } else if (data.ecn04_channelpayment === 'บัญชีธนาคาร') {
                    // เลือก ช่องทางบัญชีธนาคาร
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_30_Radio.check({ timeout: 10000 });
                    // เลือก ธนาคาร
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_31_Select_BankAccount.click({ timeout: 10000 });
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_Sel_All.locator('label', { hasText: data.ecn04_bankname_bankaccount }).click({ timeout: 10000 });
                    // กรอก หมายเลขบัญชี
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_32_Input_Text_BankAccount.fill('', { timeout: 10000 });
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_32_Input_Text_BankAccount.fill(data.ecn04_bankno_bankaccount, { timeout: 10000 });
                    // กรอก สาขา
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_33_Input_Text_BankAccount.fill('', { timeout: 10000 });
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_33_Input_Text_BankAccount.fill(data.ecn04_bankbranch_bankaccount, { timeout: 10000 });
                    // เลือก หมายเหตุ
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_34_Select_BankAccount.click({ timeout: 10000 });
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_SUB_4_In_Page_4_Detail_Panel_Data_Sel_All.locator('label', { hasText: data.ecn04_remark_bankaccount }).click({ timeout: 10000 });
                    if (data.ecn04_remark_bankaccount === 'อื่น ๆ') {
                        // รอช่องหมายเหตุ enable
                        await this.expect(this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_35_Input_Text_BankAccount).toBeEnabled({ timeout: 10000 });
                        // กรอก หมายเหตุอื่นๆ
                        await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_35_Input_Text_BankAccount.fill('', { timeout: 10000 });
                        await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_35_Input_Text_BankAccount.fill(data.ecn04_other_bankaccount, { timeout: 10000 });
                    }
                    // กรอก คำนำหน้าชื่อ
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_36_Input_Text_BankAccount.fill('', { timeout: 10000 });
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_36_Input_Text_BankAccount.fill(data.ecn04_title_bankaccount, { timeout: 10000 });
                    // กรอก ชื่อ
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_37_Input_Text_BankAccount.fill('', { timeout: 10000 });
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_37_Input_Text_BankAccount.fill(data.ecn04_firstname_bankaccount, { timeout: 10000 });
                    // กรอก นามสกุล
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_38_Input_Text_BankAccount.fill('', { timeout: 10000 });
                    await this.requestissueformlocators.SELECTOR_Alteration_MENU_Save_Request_ECN04_2_In_Page_Request_ECN04_38_Input_Text_BankAccount.fill(data.ecn04_lastname_bankaccount, { timeout: 10000 });
                }
            }
        }
    }

    async checkbox_document_required_alteration() {
        // เลือก checkbox เอกสารที่ต้องการ
        const count_document = this.page.locator('div[class="MuiGrid-root MuiGrid-item"]', { hasText: 'เอกสารประกอบการรับเรื่อง' }).locator('tbody[class="MuiTableBody-root"] > tr').count();
        for (let i = 0; i < await count_document; i++) {
            const get_text_document_require = await this.page.locator('div[class="MuiGrid-root MuiGrid-item"]', { hasText: 'เอกสารประกอบการรับเรื่อง' }).locator('tbody[class="MuiTableBody-root"] > tr').nth(i).locator('td').nth(2).textContent();
            if (get_text_document_require && get_text_document_require.includes('*')) {
                // กดปุ่ม checkbox
                await this.page.locator('div[class="MuiGrid-root MuiGrid-item"]', { hasText: 'เอกสารประกอบการรับเรื่อง' }).locator('tbody[class="MuiTableBody-root"] > tr').nth(i).locator('td').nth(0).locator('input[type="checkbox"]').check();
            }
        }
    }

    async save_receive_issue_request_alteration() {
        // กดปุ่ม บันทึก
        await this.requestissueformlocators.SELECTOR_Alteration_MENU_BTN_SAVE.click({ timeout: 10000 });
    }
}

module.exports = { ReceiveIssueRequestAlteration };