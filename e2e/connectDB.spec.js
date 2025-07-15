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
    console.log(resultchangeobj.length);
})