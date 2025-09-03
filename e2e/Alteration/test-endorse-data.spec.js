const { test, expect } = require('@playwright/test');
const { raw_data_alteration } = require('../../data/Alteration/raw_data_alteration');

test('Alteration - raw data', async ({ page }) => {
    
    // ข้อมูลตั้งต้นที่คุณมี
    const channel_code = 'BRN';
    const policy_type = 'I';
    const policy_status = 'All';
    const contact_code = 'AGT';

    const result = raw_data_alteration[channel_code][policy_type][policy_status][contact_code];
    for(const endorse_data of result) {
        console.log('------------------------------------------------');
        console.log('code: ' + endorse_data.endorse_code);
        console.log('name: ' + endorse_data.endorse_name);
        console.log('checkbox: ' + endorse_data.endorse_checkbox);
    }

    const endorse_checkbox_locator = page.locator('div.MuiGrid-root.MuiGrid-item',{ hasText: 'ประเภทสลักหลัง' }).locator('label#ECF01').locator('input#ECF01');
    const endorse_label_locator = page.locator('div.MuiGrid-root.MuiGrid-item',{ hasText: 'ประเภทสลักหลัง' }).locator('label#ECF01').locator('span').nth(2);
});