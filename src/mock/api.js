const STORAGE_PREFIX = 'dynamic_table_config_'

const mockTableData = [
  { id: 1, username: '张三', age: 28, status: 1, birthday: '1996-05-12', email: 'zhangsan@test.com', role: 'admin', createTime: '2024-01-15 10:30:00', department: '技术部', phone: '13800001111' },
  { id: 2, username: '李四', age: 34, status: 1, birthday: '1990-08-22', email: 'lisi@test.com', role: 'user', createTime: '2024-02-20 14:15:00', department: '市场部', phone: '13800002222' },
  { id: 3, username: '王五', age: 25, status: 0, birthday: '1999-03-10', email: 'wangwu@test.com', role: 'user', createTime: '2024-03-05 09:00:00', department: '人事部', phone: '13800003333' },
  { id: 4, username: '赵六', age: 41, status: 1, birthday: '1983-11-30', email: 'zhaoliu@test.com', role: 'admin', createTime: '2024-01-28 16:45:00', department: '财务部', phone: '13800004444' },
  { id: 5, username: '孙七', age: 29, status: 1, birthday: '1995-07-18', email: 'sunqi@test.com', role: 'user', createTime: '2024-04-10 11:20:00', department: '技术部', phone: '13800005555' },
  { id: 6, username: '周八', age: 36, status: 0, birthday: '1988-01-25', email: 'zhouba@test.com', role: 'user', createTime: '2024-05-12 08:30:00', department: '运营部', phone: '13800006666' },
  { id: 7, username: '吴九', age: 22, status: 1, birthday: '2002-09-08', email: 'wujiu@test.com', role: 'user', createTime: '2024-06-01 13:00:00', department: '技术部', phone: '13800007777' },
  { id: 8, username: '郑十', age: 45, status: 1, birthday: '1979-12-05', email: 'zhengshi@test.com', role: 'admin', createTime: '2024-02-14 17:30:00', department: '管理层', phone: '13800008888' },
  { id: 9, username: '陈一一', age: 31, status: 0, birthday: '1993-04-20', email: 'chenyiyi@test.com', role: 'user', createTime: '2024-07-22 10:10:00', department: '市场部', phone: '13800009999' },
  { id: 10, username: '林二二', age: 27, status: 1, birthday: '1997-06-15', email: 'linerer@test.com', role: 'user', createTime: '2024-08-03 15:45:00', department: '技术部', phone: '13800010000' },
  { id: 11, username: '黄三三', age: 38, status: 1, birthday: '1986-02-28', email: 'huangsansan@test.com', role: 'admin', createTime: '2024-03-18 09:30:00', department: '财务部', phone: '13800011111' },
  { id: 12, username: '何四四', age: 24, status: 0, birthday: '2000-10-10', email: 'hesisi@test.com', role: 'user', createTime: '2024-09-05 14:00:00', department: '人事部', phone: '13800012222' },
]

const mockAccountingData = [
  { id: 1, voucherNo: 'PZ-2024-0001', accountDate: '2024-01-05', period: '2024-01', subjectCode: '1001', subjectName: '库存现金', summary: '提取备用金', debitAmount: 50000, creditAmount: 0, balanceDirection: '借', balance: 50000, accountingEntity: '总公司', currency: 'CNY', auxiliaryItem: '行政部', maker: '张会计', reviewer: '李主管', bookkeeper: '王财务' },
  { id: 2, voucherNo: 'PZ-2024-0001', accountDate: '2024-01-05', period: '2024-01', subjectCode: '1002', subjectName: '银行存款', summary: '提取备用金', debitAmount: 0, creditAmount: 50000, balanceDirection: '贷', balance: 1250000, accountingEntity: '总公司', currency: 'CNY', auxiliaryItem: '工商银行', maker: '张会计', reviewer: '李主管', bookkeeper: '王财务' },
  { id: 3, voucherNo: 'PZ-2024-0002', accountDate: '2024-01-08', period: '2024-01', subjectCode: '1122', subjectName: '应收账款', summary: '销售商品未收款', debitAmount: 113000, creditAmount: 0, balanceDirection: '借', balance: 563000, accountingEntity: '总公司', currency: 'CNY', auxiliaryItem: '深圳A公司', maker: '张会计', reviewer: '李主管', bookkeeper: '王财务' },
  { id: 4, voucherNo: 'PZ-2024-0002', accountDate: '2024-01-08', period: '2024-01', subjectCode: '6001', subjectName: '主营业务收入', summary: '销售商品未收款', debitAmount: 0, creditAmount: 100000, balanceDirection: '贷', balance: 100000, accountingEntity: '总公司', currency: 'CNY', auxiliaryItem: '', maker: '张会计', reviewer: '李主管', bookkeeper: '王财务' },
  { id: 5, voucherNo: 'PZ-2024-0002', accountDate: '2024-01-08', period: '2024-01', subjectCode: '2221', subjectName: '应交税费', summary: '销售商品未收款', debitAmount: 0, creditAmount: 13000, balanceDirection: '贷', balance: 13000, accountingEntity: '总公司', currency: 'CNY', auxiliaryItem: '应交增值税', maker: '张会计', reviewer: '李主管', bookkeeper: '王财务' },
  { id: 6, voucherNo: 'PZ-2024-0003', accountDate: '2024-01-10', period: '2024-01', subjectCode: '6601', subjectName: '管理费用', summary: '支付办公费', debitAmount: 8500, creditAmount: 0, balanceDirection: '借', balance: 8500, accountingEntity: '总公司', currency: 'CNY', auxiliaryItem: '办公费', maker: '张会计', reviewer: '李主管', bookkeeper: '王财务' },
  { id: 7, voucherNo: 'PZ-2024-0003', accountDate: '2024-01-10', period: '2024-01', subjectCode: '1001', subjectName: '库存现金', summary: '支付办公费', debitAmount: 0, creditAmount: 8500, balanceDirection: '借', balance: 41500, accountingEntity: '总公司', currency: 'CNY', auxiliaryItem: '行政部', maker: '张会计', reviewer: '李主管', bookkeeper: '王财务' },
  { id: 8, voucherNo: 'PZ-2024-0004', accountDate: '2024-01-15', period: '2024-01', subjectCode: '2211', subjectName: '应付职工薪酬', summary: '计提本月工资', debitAmount: 0, creditAmount: 280000, balanceDirection: '贷', balance: 280000, accountingEntity: '总公司', currency: 'CNY', auxiliaryItem: '工资', maker: '张会计', reviewer: '李主管', bookkeeper: '王财务' },
  { id: 9, voucherNo: 'PZ-2024-0004', accountDate: '2024-01-15', period: '2024-01', subjectCode: '6601', subjectName: '管理费用', summary: '计提本月工资', debitAmount: 180000, creditAmount: 0, balanceDirection: '借', balance: 188500, accountingEntity: '总公司', currency: 'CNY', auxiliaryItem: '工资', maker: '张会计', reviewer: '李主管', bookkeeper: '王财务' },
  { id: 10, voucherNo: 'PZ-2024-0004', accountDate: '2024-01-15', period: '2024-01', subjectCode: '6602', subjectName: '销售费用', summary: '计提本月工资', debitAmount: 100000, creditAmount: 0, balanceDirection: '借', balance: 100000, accountingEntity: '总公司', currency: 'CNY', auxiliaryItem: '工资', maker: '张会计', reviewer: '李主管', bookkeeper: '王财务' },
  { id: 11, voucherNo: 'PZ-2024-0005', accountDate: '2024-01-20', period: '2024-01', subjectCode: '1002', subjectName: '银行存款', summary: '收到客户货款', debitAmount: 200000, creditAmount: 0, balanceDirection: '贷', balance: 1050000, accountingEntity: '总公司', currency: 'CNY', auxiliaryItem: '工商银行', maker: '张会计', reviewer: '李主管', bookkeeper: '王财务' },
  { id: 12, voucherNo: 'PZ-2024-0005', accountDate: '2024-01-20', period: '2024-01', subjectCode: '1122', subjectName: '应收账款', summary: '收到客户货款', debitAmount: 0, creditAmount: 200000, balanceDirection: '借', balance: 363000, accountingEntity: '总公司', currency: 'CNY', auxiliaryItem: '深圳A公司', maker: '张会计', reviewer: '李主管', bookkeeper: '王财务' },
  { id: 13, voucherNo: 'PZ-2024-0006', accountDate: '2024-02-03', period: '2024-02', subjectCode: '1403', subjectName: '原材料', summary: '采购原材料入库', debitAmount: 75000, creditAmount: 0, balanceDirection: '借', balance: 375000, accountingEntity: '分公司一', currency: 'CNY', auxiliaryItem: '甲材料', maker: '刘会计', reviewer: '李主管', bookkeeper: '王财务' },
  { id: 14, voucherNo: 'PZ-2024-0006', accountDate: '2024-02-03', period: '2024-02', subjectCode: '2202', subjectName: '应付账款', summary: '采购原材料入库', debitAmount: 0, creditAmount: 75000, balanceDirection: '贷', balance: 175000, accountingEntity: '分公司一', currency: 'CNY', auxiliaryItem: '上海B公司', maker: '刘会计', reviewer: '李主管', bookkeeper: '王财务' },
  { id: 15, voucherNo: 'PZ-2024-0007', accountDate: '2024-02-10', period: '2024-02', subjectCode: '6602', subjectName: '销售费用', summary: '支付广告费', debitAmount: 30000, creditAmount: 0, balanceDirection: '借', balance: 130000, accountingEntity: '分公司一', currency: 'CNY', auxiliaryItem: '广告费', maker: '刘会计', reviewer: '李主管', bookkeeper: '王财务' },
  { id: 16, voucherNo: 'PZ-2024-0007', accountDate: '2024-02-10', period: '2024-02', subjectCode: '1002', subjectName: '银行存款', summary: '支付广告费', debitAmount: 0, creditAmount: 30000, balanceDirection: '贷', balance: 1020000, accountingEntity: '分公司一', currency: 'CNY', auxiliaryItem: '建设银行', maker: '刘会计', reviewer: '李主管', bookkeeper: '王财务' },
  { id: 17, voucherNo: 'PZ-2024-0008', accountDate: '2024-02-15', period: '2024-02', subjectCode: '6001', subjectName: '主营业务收入', summary: '出口销售', debitAmount: 0, creditAmount: 50000, balanceDirection: '贷', balance: 150000, accountingEntity: '分公司一', currency: 'USD', auxiliaryItem: '', maker: '刘会计', reviewer: '李主管', bookkeeper: '王财务' },
  { id: 18, voucherNo: 'PZ-2024-0008', accountDate: '2024-02-15', period: '2024-02', subjectCode: '1122', subjectName: '应收账款', summary: '出口销售', debitAmount: 355000, creditAmount: 0, balanceDirection: '借', balance: 718000, accountingEntity: '分公司一', currency: 'USD', auxiliaryItem: '美国C公司', maker: '刘会计', reviewer: '李主管', bookkeeper: '王财务' },
]

function getStorageKey(menuId, userId) {
  return STORAGE_PREFIX + menuId + '_' + userId
}

export function getTableConfig(menuId, userId) {
  return new Promise(resolve => {
    setTimeout(() => {
      const key = getStorageKey(menuId, userId)
      const raw = localStorage.getItem(key)
      if (raw) {
        resolve(JSON.parse(raw))
      } else {
        resolve(null)
      }
    }, 200)
  })
}

export function saveTableConfig(config) {
  return new Promise(resolve => {
    setTimeout(() => {
      const key = getStorageKey(config.menuId, config.userId)
      localStorage.setItem(key, JSON.stringify(config))
      resolve({ success: true })
    }, 200)
  })
}

export function getTableData(params = {}) {
  return _queryData(mockTableData, params)
}

export function getAccountingData(params = {}) {
  return _queryData(mockAccountingData, params)
}

function _queryData(dataSource, params = {}) {
  return new Promise(resolve => {
    setTimeout(() => {
      let filtered = [...dataSource]

      if (params.filters) {
        Object.keys(params.filters).forEach(fieldKey => {
          const val = params.filters[fieldKey]
          if (val === null || val === undefined || val === '') return

          if (typeof val === 'object') {
            if (val.min !== null && val.min !== undefined && val.min !== '') {
              filtered = filtered.filter(row => Number(row[fieldKey]) >= Number(val.min))
            }
            if (val.max !== null && val.max !== undefined && val.max !== '') {
              filtered = filtered.filter(row => Number(row[fieldKey]) <= Number(val.max))
            }
            if (val.start) {
              filtered = filtered.filter(row => row[fieldKey] >= val.start)
            }
            if (val.end) {
              filtered = filtered.filter(row => row[fieldKey] <= val.end + ' 23:59:59')
            }
          } else if (Array.isArray(val)) {
            if (val.length > 0) {
              filtered = filtered.filter(row => val.includes(row[fieldKey]))
            }
          } else {
            filtered = filtered.filter(row => {
              const cellVal = String(row[fieldKey] || '')
              return cellVal.toLowerCase().includes(String(val).toLowerCase())
            })
          }
        })
      }

      if (params.sortBy && params.sortOrder) {
        filtered.sort((a, b) => {
          const va = a[params.sortBy]
          const vb = b[params.sortBy]
          let result = 0
          if (typeof va === 'number' && typeof vb === 'number') {
            result = va - vb
          } else {
            result = String(va || '').localeCompare(String(vb || ''))
          }
          return params.sortOrder === 'descending' ? -result : result
        })
      }

      const page = params.page || 1
      const pageSize = params.pageSize || 10
      const start = (page - 1) * pageSize
      const end = start + pageSize
      const list = filtered.slice(start, end)

      resolve({
        list,
        total: filtered.length,
        page,
        pageSize
      })
    }, 300)
  })
}