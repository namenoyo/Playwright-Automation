import { sendBatchTestResultToGoogleSheetGSAppScript } from "./google-sheet-gsappscript.helper"

export class uploadGoogleSheet {
    constructor(page, expect) {
        this.page = page,
            this.expect = expect
    }

    // ส่งข้อมูลผลลัพธ์การทดสอบขึ้น Google Sheet แบบแยกแต่ละ label
    async uploadresulttestdatatoGoogleSheet(status, assertion, info) {
        let assertion_result_format = ''
        let status_result_format = ''
        let status_result_array_check = []

        console.log('เริ่ม loop สถานะ')
        // loop เพื่อเก็บสถานะของแต่ละ label
        for (const split_status_log of status) {
            if (split_status_log == '') {
                if (status_result_format.includes('Failed') === true) {
                    status_result_array_check.push('Failed')
                } else {
                    status_result_array_check.push('Passed')
                }
                status_result_format = ''
            } else {
                status_result_format += split_status_log
            }
        }
        console.log('สิ้นสุด loop สถานะ\n')

        let googledatabatch = []
        console.log('เริ่ม loop เก็บค่า parameter ของ google')
        // loop เพื่อลงผลใน google sheet แต่ละ label
        let number_loop = 0
        for (const split_assertion_log of assertion) {
            if (split_assertion_log == '') {
                // เก็บผลลัพธ์ที่ google sheet
                googledatabatch.push([
                    'Test Automate',
                    info.title,
                    assertion_result_format,
                    status_result_array_check[number_loop],
                    'Toppy',
                    'Test duration',
                    'Test Error'
                ])
                assertion_result_format = ''
                number_loop = number_loop + 1
            } else {
                assertion_result_format += split_assertion_log + '\n'
            }
        }
        console.log('สิ้นสุด loop เก็บค่า parameter ของ google\n')

        console.log('เริ่ม การส่งข้อมูลไปที่ google sheet')
        console.log(googledatabatch)
        if (googledatabatch.length > 0) {
            await sendBatchTestResultToGoogleSheetGSAppScript(googledatabatch)
        }
        console.log('สิ้นสุด การส่งข้อมูลไปที่ google sheet\n')
    }

    // ส่งข้อมูลผลลัพธ์การทดสอบขึ้น Google Sheet แบบรวมทั้งหมดใน 1 row
    async uploadResultTestDataToGoogleSheet_all(status, assertion, info) {
    // สร้างค่าผลลัพธ์สำหรับ Google Sheet
    const statusResult = status.includes('Failed') ? 'Failed' : 'Passed';

    const assertionResult = assertion.join('\n'); // รวมทุกค่า assertion เป็น string เดียว

    const googleDataBatch = [
        [
            'Test Automate',
            info.title,
            assertionResult,
            statusResult,
            'Toppy',
            'Test duration',
            'Test Error'
        ]
    ];

    console.log('ข้อมูลที่จะส่งไป Google Sheet:');
    console.log(googleDataBatch);

    if (googleDataBatch.length > 0) {
        await sendBatchTestResultToGoogleSheetGSAppScript(googleDataBatch);
    }

    console.log('ส่งข้อมูลไป Google Sheet เรียบร้อย');
}

}