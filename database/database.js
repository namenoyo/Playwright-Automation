const { Pool } = require('pg');
import { configdb } from './database.env';

const pool = new Pool ({
    user: configdb.DB_USER,
    host: configdb.DB_HOST,
    database: configdb.DB_NAME,
    password: configdb.DB_PASSWORD,
    port: configdb.DB_PORT,
})

module.exports = {
    query: (text, parameter) => pool.query(text, parameter),
}