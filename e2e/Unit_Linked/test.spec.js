// Data Dictionary
const { fund_code_dictionary } = require('../../data/Unit_Linked/fund_code_dict.data.js');

const { test, expect } = require('@playwright/test');

test('test investment order check', async ({ page }) => {
    const fund_name_ordercheck = fund_code_dictionary['9'] || 'Unknown Fund';

    console.log(fund_name_ordercheck.code, fund_name_ordercheck.NetAssetValue, fund_name_ordercheck.NAVValue, fund_name_ordercheck.BidPriceValue, fund_name_ordercheck.OfferPriceValue);
});

