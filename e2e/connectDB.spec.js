import { test, expect } from '@playwright/test'
const db = require('../database/database')

test('', async ({ page }) => {
    const result = await db.query('SELECT * FROM bk_grid_label_expected g WHERE g.label = $1 AND g.id = $2', ['Payment History', '1'])
    console.log(result.rows[0].label)
})