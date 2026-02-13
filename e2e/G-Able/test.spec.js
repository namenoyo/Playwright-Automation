const { test, expect } = require('@playwright/test');
const odbc = require('odbc');

test('test example', async ({ page }) => {
    const connection = await odbc.connect(
        'DSN=Oracle10g;UID=RECEIPT;PWD=rec16146491'
    );

    // Query
    const result = await connection.execute(
        `SELECT RCPT_RECEIPT_NO,RCPT_CONTROL_NO
        FROM (
            SELECT t.RCPT_RECEIPT_NO,t.RCPT_CONTROL_NO FROM RECEIPT_PRINTED_TRAN t 
            WHERE RCPT_POLICY_NO ='1695853' 
            --AND ROWNUM <= 1
            ORDER BY t.RCPT_CREATE_DATE DESC
        )
        WHERE ROWNUM = 1;`
    );

    console.log('DB Result:', result.rows);

    await connection.close();
});