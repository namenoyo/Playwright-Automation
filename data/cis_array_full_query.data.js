export const customerCISDataArraykey_label = [
  {
    policy_no: '1652002',
    SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_1_In_Page_2_Detail_Panel: [{
      label: 'Panel ข้อมูลส่วนตัว > เลขข้อมูลลูกค้า',
      data: [['25662157384']],
      query: 'SELECT label FROM bk_grid_label_expected g WHERE g.label = $1',
      wherefield: ['Payment History']
    }],
    SELECTOR_CIS_MENU_SUB_1_SEARCH_1_Detail_1_panel_14_In_Page_29_Detail_Panel_Data: [{
      label: 'Panel_Policy_Detail > ประวัติชำระเบี้ย',
      data: [
        [
          '17/01/2568',
          '1000004994267',
          '2',
          '11',
          '10/01/2568',
          '09/02/2568',
          '922.80',
          '262.00',
          '0.00',
          '0.00',
          '0.00',
          '1,184.80',
          'สาขา'
        ],
        [
          '19/12/2567',
          '1000004993517',
          '2',
          '10',
          '10/12/2567',
          '09/01/2568',
          '922.80',
          '262.00',
          '0.00',
          '0.00',
          '0.00',
          '1,184.80',
          'สาขา'
        ],
        [
          '18/11/2567',
          '1000004992615',
          '2',
          '9',
          '10/11/2567',
          '09/12/2567',
          '922.80',
          '262.00',
          '0.00',
          '0.00',
          '0.00',
          '1,184.80',
          'สาขา'
        ],
        [
          '17/10/2567',
          '1000004991881',
          '2',
          '8',
          '10/10/2567',
          '09/11/2567',
          '922.80',
          '262.00',
          '0.00',
          '0.00',
          '0.00',
          '1,184.80',
          'สาขา'
        ],
        [
          '16/09/2567',
          '1000004991135',
          '2',
          '7',
          '10/09/2567',
          '09/10/2567',
          '922.80',
          '262.00',
          '0.00',
          '0.00',
          '0.00',
          '1,184.80',
          'สาขา'
        ]
      ],
      query: 'SELECT r.col1, r.col2, r.col3, r.col4, r.col5, r.col6, r.col7, r.col8, r.col9, r.col10, r.col11, r.col12, r.col13 FROM bk_grid_label_expected g JOIN bk_grid_data_expected r ON g.id = r.grid_id WHERE g.label = $1 ORDER BY r.row_index',
      wherefield: ['Payment History']
    }]
  },
]