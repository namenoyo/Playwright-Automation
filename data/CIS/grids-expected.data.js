// รวม expected data และ locator ของแต่ละ grid
const cisLocators = require('../../locators/CIS/cis.locator');

module.exports = [
    {
        label: 'Payment History',
        locator: cisLocators.gridpaymentHistory,
        expectedTable: [
            ['17/01/2568', '10000004994267', '3', '1', '10/01/2568', '09/02/2568', '922.80', '262.00', '0.00', '0.00', '0.00', '1,184.80', 'สาขา'],
            ['19/12/2567', '10000004993517', '2', '10', '10/12/2567', '09/01/2568', '922.80', '262.00', '0.00', '0.00', '0.00', '1,184.80', 'สาขา'],
        ],
        options: { onlyEvenTd: true }
    },
    // สามารถเพิ่ม grid อื่นๆ ได้ใน array นี้
    {
        label: 'Payment History 1',
        locator: cisLocators.gridpaymentHistory,
        expectedTable: [
            ['17/01/2568', '10000004994267', '2', '11', '10/01/2568', '09/02/2568', '922.80', '262.00', '0.00', '0.00', '0.00', '1,184.80', 'สาขา'],
            ['19/12/2567', '10000004993517', '2', '10', '10/12/2567', '09/01/2568', '922.80', '262.00', '0.00', '0.00', '0.00', '1,184.80', 'สาขา'],
        ],
        options: { onlyEvenTd: true }
    },
];
