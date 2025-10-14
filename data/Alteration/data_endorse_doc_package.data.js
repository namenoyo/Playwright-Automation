// นำเข้าใช้ข้อมูลจากไฟล์ data_endorse_doc_package.data.js  
// อ้างอิงชีท Google Sheet : https://docs.google.com/spreadsheets/d/1HTN4nBwcEt2Uff4Al2vaa49db-kbc_LTe0G_99lB3FY/edit?gid=1952019565#gid=1952019565
//========================================
//
// -- คิวรี่แบบแยก IND เป็น IND และ GOV และแยก ORD ที่เป็น ALL ให้แสดงใน sub_policy_type เป็น ORD , MRTA ,MLTA,ANN
// DB : Alter
// -- ========= Package : ตัด cf_endorse_pack ออก =========
// WITH RECURSIVE
// base AS (
//   SELECT
//       doc.channel_code,
//       doc.contact_code,
//       doc.endorse_code,
//       cec.policy_type,
//       cec.policy_line,
//       cec.policy_status
//   FROM cf_endorse_service_contact_document doc
//   JOIN ms_document md
//     ON md.document_code = doc.document_code
//   LEFT JOIN public.cf_endorse_condition cec
//     ON cec.endorse_code = doc.endorse_code
// ),
// expand_status AS (
//   SELECT b.*,
//          sub.sub_policy_status
//   FROM base b
//   CROSS JOIN LATERAL (
//     SELECT UNNEST(
//       CASE
//         WHEN UPPER(COALESCE(b.policy_status,''))='ALL' AND b.policy_type='O'
//           THEN ARRAY['T','C','S','Z','A','E','F','I','L','O','P','R','W','D','M']
//         WHEN UPPER(COALESCE(b.policy_status,''))='ALL' AND b.policy_type='I'
//           THEN ARRAY['0','1','2','6','7','8','A','C','D','S','R','M','T']
//         WHEN UPPER(COALESCE(b.policy_status,''))='ALL' AND b.policy_type='P'
//           THEN ARRAY['I','B','C','D','L','M','Z']
//         ELSE ARRAY[COALESCE(b.policy_status,'')]
//       END
//     ) AS sub_policy_status
//   ) sub
// ),
// expand_type AS (
//   SELECT e.*,
//          dup.out_policy_type
//   FROM expand_status e
//   CROSS JOIN LATERAL (
//     SELECT UNNEST(
//       CASE
//         WHEN e.policy_type='I' THEN ARRAY['I','G']
//         ELSE ARRAY[COALESCE(e.policy_type,'')]
//       END
//     ) AS out_policy_type
//   ) dup
// ),
// expand_line AS (
//   SELECT e.*,
//          spt.sub_policy_type
//   FROM expand_type e
//   CROSS JOIN LATERAL (
//     SELECT UNNEST(
//       CASE
//         WHEN e.out_policy_type='O'
//          AND UPPER(COALESCE(e.policy_line,''))='ALL'
//           THEN ARRAY['ORD','MRTA','MLTA','ANN']
//         ELSE ARRAY[COALESCE(e.policy_line,'')]
//       END
//     ) AS sub_policy_type
//   ) spt
// ),

// /* โค้ดที่มีจริงในกลุ่ม (หลังขยายครบ) — ปรับ WHERE ให้ตรงกรณีของคุณได้ */
// dedup AS (
//   SELECT DISTINCT
//     el.channel_code,
//     el.contact_code,
//     el.out_policy_type,
//     el.sub_policy_type,
//     el.sub_policy_status,
//     el.endorse_code
//   FROM expand_line el
//   WHERE
//     el.channel_code       = 'SVC'   -- << แก้ได้
//     AND el.contact_code   = 'INS'
//     AND el.out_policy_type = 'I'
//     AND el.sub_policy_type = 'ALL'
//     AND el.sub_policy_status = '0'
// ),

// /* โค้ดต้นทาง (หนึ่งแถวต่อ origin) */
// origins AS (
//   SELECT
//     d.channel_code,
//     d.contact_code,
//     d.out_policy_type,
//     d.sub_policy_type,
//     d.sub_policy_status,
//     d.endorse_code AS origin
//   FROM dedup d
// ),

// /* ผู้สมัคร (candidate) จาก cf_endorse_combine + รวมตัวเอง + ต้องมีอยู่จริงใน dedup */
// candidates AS (
//   SELECT DISTINCT
//     o.channel_code, o.contact_code, o.out_policy_type, o.sub_policy_type, o.sub_policy_status,
//     o.origin,
//     d2.endorse_code AS node
//   FROM origins o
//   LEFT JOIN cf_endorse_combine c
//     ON c.endorse_code = o.origin
//    AND c.active_flag = TRUE
//    AND c.endorse_group_code   = 'N'
//    AND c.relate_endorse_group = 'N'
//   JOIN dedup d2
//     ON d2.channel_code      = o.channel_code
//    AND d2.contact_code      = o.contact_code
//    AND d2.out_policy_type   = o.out_policy_type
//    AND d2.sub_policy_type   = o.sub_policy_type
//    AND d2.sub_policy_status = o.sub_policy_status
//    AND d2.endorse_code      = COALESCE(c.relate_endorse_code, o.origin)

//   UNION ALL
//   SELECT
//     o.channel_code, o.contact_code, o.out_policy_type, o.sub_policy_type, o.sub_policy_status,
//     o.origin, o.origin
//   FROM origins o
// ),

// /* ความสัมพันธ์แบบ mutual (ต้องมีทั้ง A->B และ B->A) ไม่ผูก group ที่นี่ */
// mutual AS (
//   SELECT DISTINCT
//     LEAST(c1.endorse_code, c1.relate_endorse_code)  AS a,
//     GREATEST(c1.endorse_code, c1.relate_endorse_code) AS b
//   FROM cf_endorse_combine c1
//   JOIN cf_endorse_combine c2
//     ON c2.endorse_code = c1.relate_endorse_code
//    AND c2.relate_endorse_code = c1.endorse_code
//   WHERE c1.active_flag = TRUE AND c2.active_flag = TRUE
//     AND c1.endorse_group_code   = 'N' AND c1.relate_endorse_group = 'N'
//     AND c2.endorse_group_code   = 'N' AND c2.relate_endorse_group = 'N'
// ),

// /* seed: รายชื่อ node เริ่มต้นต่อ origin */
// seed AS (
//   SELECT
//     channel_code, contact_code, out_policy_type, sub_policy_type, sub_policy_status, origin,
//     ARRAY_AGG(DISTINCT node ORDER BY node) AS nodes
//   FROM candidates
//   GROUP BY channel_code, contact_code, out_policy_type, sub_policy_type, sub_policy_status, origin
// ),

// /* prune recursive: ตัด node ที่ไม่ได้เชื่อมกับสมาชิกทุกตัวในชุด */
// prune AS (
//   SELECT
//     0 AS iter,
//     s.channel_code, s.contact_code, s.out_policy_type, s.sub_policy_type, s.sub_policy_status, s.origin,
//     s.nodes
//   FROM seed s

//   UNION ALL

//   SELECT
//     p.iter + 1,
//     p.channel_code, p.contact_code, p.out_policy_type, p.sub_policy_type, p.sub_policy_status, p.origin,
//     ARRAY(
//       SELECT n
//       FROM UNNEST(p.nodes) AS n
//       WHERE (
//         SELECT COUNT(*) FROM UNNEST(p.nodes) AS m
//         WHERE m <> n
//           AND EXISTS (
//             SELECT 1
//             FROM mutual mu
//             WHERE (mu.a, mu.b) = (LEAST(n,m), GREATEST(n,m))
//           )
//       ) = GREATEST(COALESCE(array_length(p.nodes,1),0)-1, 0)
//     ) AS nodes
//   FROM prune p
//   WHERE EXISTS (
//     SELECT 1
//     FROM UNNEST(p.nodes) AS n
//     WHERE (
//       SELECT COUNT(*) FROM UNNEST(p.nodes) AS m
//       WHERE m <> n
//         AND EXISTS (
//           SELECT 1
//           FROM mutual mu
//           WHERE (mu.a, mu.b) = (LEAST(n,m), GREATEST(n,m))
//         )
//     ) < GREATEST(COALESCE(array_length(p.nodes,1),0)-1, 0)
//   )
// ),
// final_nodes AS (
//   SELECT DISTINCT ON (channel_code, contact_code, out_policy_type, sub_policy_type, sub_policy_status, origin)
//     channel_code, contact_code, out_policy_type, sub_policy_type, sub_policy_status, origin, nodes
//   FROM prune
//   ORDER BY channel_code, contact_code, out_policy_type, sub_policy_type, sub_policy_status, origin, iter DESC
// )
// , final_rows AS (
//   -- เหมือน SELECT ท้ายสุดเดิม แต่ยังไม่ dedupe
//   SELECT
//     f.channel_code,
//     f.contact_code,
//     f.out_policy_type  AS policy_type,
//     f.sub_policy_type,
//     f.sub_policy_status,
//     ARRAY_AGG(n.endorse_code ORDER BY n.endorse_code) AS endorse_codes
//   FROM final_nodes f
//   JOIN LATERAL UNNEST(f.nodes) AS n(endorse_code) ON TRUE
//   GROUP BY
//     f.channel_code, f.contact_code, f.out_policy_type, f.sub_policy_type, f.sub_policy_status, f.origin
// )

// -- ✅ ชั้น dedupe: รวมแถวที่มี endorse_codes เหมือนกันให้เหลือแถวเดียว
// SELECT
//   channel_code,
//   contact_code,
//   policy_type,
//   sub_policy_type,
//   sub_policy_status,
//   endorse_codes
// FROM final_rows
// GROUP BY
//   channel_code,
//   contact_code,
//   policy_type,
//   sub_policy_type,
//   sub_policy_status,
//   endorse_codes
// ORDER BY
//   channel_code, contact_code, policy_type, sub_policy_type NULLS LAST, sub_policy_status;

//===============================================
// 
// set 1  ทดสอบเฉพาะสลักหลังเหล่านี้
// ECN01 ✅
// ECN02 ✅
// ECN03 ✅
// ECN05 ✅ TBFGTR ='Y'
// ECN07 ✅ TBFGCH ='Y'
// ECN08 ✅
// ECN12 ✅
// ECN14 ✅ 

export const data_matrix_save_endorse = [
  { policy_no: 'ข0239472', channel_code: 'BRN', policy_type: 'G', policy_status: '0', contact_code: 'AGT', policy_line: 'ALL', username: '6600', password: '123', endorse_code: ['ECN01'],
    expecteddata: {
      'SELECTOR_Alteration_MENU_SUB_7_In_Page_1_Detail_Panel_Data': [{label: 'รายการเอกสาร',  data: [['1. คำขอเปลี่ยนแปลงแก้ไขกรมธรรม์ (Code 02135)*...'],['2. สำเนาบัตรประชาชน หรือ สูติบัตร (ผู้เอาประกันภัย)*...'],['3. สำเนาทะเบียนบ้าน (ผู้เอาประกันภัย)*...'],['4. สำเนาหนังสือสำคัญแสดงการจดทะเบียนเปลี่ยนชื่อ (ผู้เอาประกันภัย)*...'],['5. ใบคำขอเอาประกันภัย*'],['6. สำเนาหน้าตารางกรมธรรม์*'],['7. เอกสารอื่นๆ...']]}],
      'SELECTOR_Alteration_MENU_SUB_7_In_Page_2_Detail_Panel_Data': [{label: 'หมายเหตุเอกสารแนบ Header',  data: [['1. คำขอเปลี่ยนแปลงแก้ไขกรมธรรม์ (Code 02135)*...'],['2. สำเนาบัตรประชาชน หรือ สูติบัตร (ผู้เอาประกันภัย)*...'],['3. สำเนาทะเบียนบ้าน (ผู้เอาประกันภัย)*...'],['4. สำเนาหนังสือสำคัญแสดงการจดทะเบียนเปลี่ยนชื่อ (ผู้เอาประกันภัย)*...'],['5. ใบคำขอเอาประกันภัย*'],['6. สำเนาหน้าตารางกรมธรรม์*'],['7. เอกสารอื่นๆ...']], type: 'detail_document'},
]}},
  
];