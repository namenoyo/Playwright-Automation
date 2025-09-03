const { test, expect } = require('@playwright/test');
const { datadict_endorse_checkbox } = require('../../data/Alteration/inquiryform_datadict_endorse_checkbox.data');
const { raw_data_alteration } = require('../../data/Alteration/raw_data_alteration.data');
const { data_matrix_endorse } = require('../../data/Alteration/data_endorse.data');

test('Alteration - endorse check', async ({ page }) => {

    for (const data_endorse of data_matrix_endorse) {
        console.log(data_endorse.channel_code + ' | ' + data_endorse.policy_type + ' | ' + data_endorse.policy_status + ' | ' + data_endorse.policy_line + ' | ' + data_endorse.contact_code);

        const result = datadict_endorse_checkbox[data_endorse.channel_code][data_endorse.policy_type][data_endorse.policy_status][data_endorse.policy_line][data_endorse.contact_code];
        for (const endorse_data of result) {
            console.log('------------------------------------------------');
            console.log('code: ' + endorse_data.endorse_code);
            console.log('name: ' + endorse_data.endorse_name);
            console.log('checkbox: ' + endorse_data.endorse_checkbox);
        }

        const endorse_checkbox_locator = page.locator('div.MuiGrid-root.MuiGrid-item', { hasText: 'ประเภทสลักหลัง' }).locator('label#ECF01').locator('input#ECF01');
        const endorse_label_locator = page.locator('div.MuiGrid-root.MuiGrid-item', { hasText: 'ประเภทสลักหลัง' }).locator('label#ECF01').locator('span').nth(2);
    }
});