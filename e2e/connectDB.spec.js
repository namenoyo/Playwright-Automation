import { test, expect } from '@playwright/test'
const db = require('../database/database')

test('test show data on query database', async ({ page }) => {
    // ใช้ query และ parameter where ตรงๆ
    const result = await db.query('SELECT * FROM bk_grid_label_expected g WHERE g.label = $1 AND g.id = $2', ['Payment History', '1'])
    console.log(result.rows[0].label)

    // ใช้ query และ parameter where ผ่านตัวแปร
    const query = 'SELECT * FROM bk_grid_label_expected g'
    const wherefield = ['Payment History']
    const resultvariable = await db.query(query)
    console.log(resultvariable.rows[0].label)

    // แปลง object เป็น array
    const resultchangeobj = resultvariable.rows.map(obj => Object.values(obj));
    console.log(resultchangeobj);

    // กำหนด keys ที่ต้องการ
    const fields = ['label'];
    // ดึงข้อมูลเฉพาะ keys ที่ต้องการ ผ่าน object
    const resultdatabasekeys = resultvariable.rows.map(obj => fields.map(key => obj[key]));
    // ดึง key ของ object
    console.log(resultdatabasekeys);


    const query_test = 'SELECT r.col1, r.col2, r.col3, r.col4, r.col5, r.col6, r.col7, r.col8, r.col9, r.col10, r.col11, r.col12, r.col13 FROM bk_grid_label_expected g JOIN bk_grid_data_expected r ON g.id = r.grid_id WHERE g.label = $1 ORDER BY r.row_index'
    const wherefield_test = ['Payment History']
    const resultquery_test = await db.query(query_test, wherefield_test)
    console.log(resultquery_test.rows[0]);
    

})