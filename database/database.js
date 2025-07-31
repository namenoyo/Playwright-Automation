const { Pool } = require('pg');
// import { configdb } from './database.env';

// const pool = new Pool({
//     user: configdb.DB_USER,
//     host: configdb.DB_HOST,
//     database: configdb.DB_NAME,
//     password: configdb.DB_PASSWORD,
//     port: configdb.DB_PORT,
// })

// module.exports = {
//     query: (text, parameter) => pool.query(text, parameter),
// }

class Database {
  constructor({ user, host, database, password, port }) {
    this.pool = new Pool({ user, host, database, password, port });
  }

  async query(text, params) {
    try {
      const res = await this.pool.query(text, params);
      return res;
    } catch (err) {
      console.error('Database query error:', err);
      throw err;
    }
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = { Database };


