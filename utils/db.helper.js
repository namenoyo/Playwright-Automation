// utils/db.helper.js
// ฟังก์ชันเชื่อมต่อและ query กับ PostgreSQL
const { Client } = require('pg');

/**
 * สร้าง client สำหรับเชื่อมต่อ PostgreSQL
 * @param {Object} config - { host, port, user, password, database }
 * @returns {Client}
 */
function createPgClient(config) {
  return new Client(config);
}

/**
 * ตัวอย่างการ query ข้อมูล (async/await)
 * @param {Object} config - config สำหรับเชื่อมต่อ
 * @param {string} sql - SQL query
 * @param {Array} [params] - พารามิเตอร์สำหรับ query
 * @returns {Promise<Array>} - ผลลัพธ์ rows
 */
async function queryPg(config, sql, params = []) {
  const client = createPgClient(config);
  await client.connect();
  try {
    const res = await client.query(sql, params);
    return res.rows;
  } finally {
    await client.end();
  }
}

// คืนค่า config สำหรับเชื่อมต่อ PostgreSQL (ควรใช้ env จริงใน production)
function getDbConfig() {
  return {
    host: process.env.PG_HOST || '11.100.8.42',
    port: process.env.PG_PORT ? Number(process.env.PG_PORT) : 5432,
    user: process.env.PG_USER || 'letterreturn',
    password: process.env.PG_PASSWORD || 'nopass',
    database: process.env.PG_DATABASE || 'letterreturn',
  };
}

// -------------------- ตัวอย่างการใช้งาน --------------------
// (ลบ comment ออกเมื่อจะใช้งานจริง)
/*
const config = {
  host: 'localhost',
  port: 5432,
  user: 'your_user',
  password: 'your_password',
  database: 'your_db',
};

(async () => {
  try {
    const rows = await queryPg(config, 'SELECT * FROM your_table WHERE id = $1', [1]);
    console.log('Query result:', rows);
  } catch (err) {
    console.error('DB error:', err);
  }
})();
*/


/**
 * ดึง expectedTable จาก payment_history_expected
 * @param {object} dbConfig
 * @param {string} [label] - ถ้าระบุจะ filter label, ถ้าไม่ระบุจะดึงทั้งหมด
 * @returns {Promise<Array<Array<string>>>}
 */
async function getExpectedTable(dbConfig, label) {
  let rows;
  if (typeof label === 'string') {
    rows = await queryPg(
      dbConfig,
      `SELECT * FROM payment_history_expected WHERE label = $1 ORDER BY row_index`,
      [label]
    );
  } else {
    rows = await queryPg(
      dbConfig,
      `SELECT * FROM payment_history_expected ORDER BY row_index`
    );
  }
  return rows.map(row => [
    row.date, row.policy_no, row.col3, row.col4, row.date_start, row.date_end,
    row.amount1, row.amount2, row.amount3, row.amount4, row.amount5, row.total, row.branch
  ]);
}

/**
 * ดึง expectedTable จากโครงสร้างแบบ normalized (grid_expected, grid_expected_row)
 * @param {object} dbConfig
 * @param {string} label - label ของ grid ที่ต้องการ
 * @returns {Promise<Array<Array<string>>>}
 */
async function getExpectedTableNormalized(dbConfig, label) {
  let sql, rows;
  if (Array.isArray(label) && label.length > 0) {
    sql = `
      SELECT g.label, r.row_index, r.col1, r.col2, r.col3, r.col4, r.col5, r.col6, r.col7, r.col8, r.col9, r.col10, r.col11, r.col12, r.col13, r.col14, r.col15, r.col16, r.col17, r.col18, r.col19, r.col20, r.col21
      FROM bk_grid_label_expected g
      JOIN bk_grid_data_expected r ON g.id = r.grid_id
      WHERE g.label = ANY($1)
      ORDER BY r.row_index
    `;
    rows = await queryPg(dbConfig, sql, [label]);
  } else if (typeof label === 'string' && label.trim() !== '') {
    sql = `
      SELECT g.label, r.row_index, r.col1, r.col2, r.col3, r.col4, r.col5, r.col6, r.col7, r.col8, r.col9, r.col10, r.col11, r.col12, r.col13, r.col14, r.col15, r.col16, r.col17, r.col18, r.col19, r.col20, r.col21
      FROM bk_grid_label_expected g
      JOIN bk_grid_data_expected r ON g.id = r.grid_id
      WHERE g.label = $1
      ORDER BY r.row_index
    `;
    rows = await queryPg(dbConfig, sql, [label]);
  } else {
    sql = `
      SELECT g.label, r.row_index, r.col1, r.col2, r.col3, r.col4, r.col5, r.col6, r.col7, r.col8, r.col9, r.col10, r.col11, r.col12, r.col13, r.col14, r.col15, r.col16, r.col17, r.col18, r.col19, r.col20, r.col21
      FROM bk_grid_label_expected g
      JOIN bk_grid_data_expected r ON g.id = r.grid_id
      ORDER BY r.row_index
    `;
    rows = await queryPg(dbConfig, sql);
  }
  // คืนค่าเป็น object พร้อม label
  return rows.map(row => {
    return {
      label: row.label,
      row: [
        row.col1, row.col2, row.col3, row.col4, row.col5, row.col6, row.col7, row.col8, row.col9, row.col10, row.col11, row.col12, row.col13, row.col14, row.col15, row.col16, row.col17, row.col18, row.col19, row.col20, row.col21
      ].filter(v => v !== null && v !== undefined)
    };
  });
}

module.exports = {
  createPgClient,
  queryPg,
  getDbConfig,
  getExpectedTable,
  getExpectedTableNormalized,
};