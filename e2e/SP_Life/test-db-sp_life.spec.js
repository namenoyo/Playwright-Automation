const { test, expect } = require('@playwright/test');
const { formatQuery } = require('../../utils/common');
const { configdb } = require('../../database/database_env');
const { Database } = require('../../database/database');

test('DB test query SP Life', async ({ page }) => {
    const db_name = 'splife';
    const db_env = 'SIT';

    const db = new Database({
        user: configdb[db_name][db_env].DB_USER,
        host: configdb[db_name][db_env].DB_HOST,
        database: configdb[db_name][db_env].DB_NAME,
        password: configdb[db_name][db_env].DB_PASSWORD,
        port: configdb[db_name][db_env].DB_PORT,
    });

    const suminsure = 50000;
    const planid = 2;

    const query = "select csp.plan_group || '-' || ROW_NUMBER() OVER (ORDER BY csppr.insure_sex ,csppr.insure_age, csppr.cover_period) AS row_unique, csp.plan_group , csp.plan_name, case csppr.insure_sex when 1 then 'ชาย' when 2 then 'หญิง' end as sex_name, csppr.insure_age, csppr.cover_period, csppr.total_premium_rate, csppr.life_premium_rate, csppr.rider_premium_rate, to_char( ((now() AT TIME ZONE 'Asia/Bangkok')::date - make_interval(years => insure_age))::date, 'DD/MM/' ) || (extract(year from ((now() AT TIME ZONE 'Asia/Bangkok')::date - make_interval(years => insure_age)))::int + 543)::text AS approx_dob_be, case csppr.insure_sex when 1 then 'นาย' when 2 then 'นาง' end as title, 'เทส' as name, 'นามสกุล' as lastname, '1445533518848' as idcard, $1::int as sumInsure, TO_CHAR(ROUND(((csppr.total_premium_rate * $1::int)/1000)::numeric,0), 'FM999999999.00') as Expected from cf_sp_plan_premium_rate csppr join cf_sp_plan csp on csppr.cf_sp_plan_id = csp.id where cf_sp_plan_id = $2 and insure_age >= (select min_insure_age from cf_sp_plan_detail cspd where cf_sp_plan_id = $2 limit 1) and insure_age <= (select max(max_insure_age) from cf_sp_plan_detail cspd2 where cf_sp_plan_id = $2) and insure_age + cover_period <= (select max(cover_period+max_insure_age) from cf_sp_plan_detail cspd2 where cf_sp_plan_id = $2) order by csppr.insure_sex ,csppr.insure_age, csppr.cover_period";
    const params = [suminsure, planid];

    const result_query = await db.query(query, params);
    console.log(result_query.rows);
    console.log(result_query.rows.length);

    // for (const rowdb of result_query.rows) {
        
    //     let id = rowdb.id;
    //     let planname = rowdb.plan_name;
    //     let plantype = rowdb.plan_type;
    //     let plangroup = rowdb.plan_group;

    //     console.log(`id: ${id} | plan name: ${planname} | plan type: ${plantype} | plan group: ${plangroup}`);
    // }
    
    await db.close();
})