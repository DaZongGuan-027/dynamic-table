import axios from 'axios'

/**
 * 模拟后端接口层
 * ------------------------------------------------------------
 * 通过 axios 自定义 adapter 在浏览器内模拟真实 HTTP 接口调用，
 * 供测试页面使用。接入真实后端时，仅需删除 adapter 并指向真实
 * baseURL，页面侧接口函数无需改动。
 *
 * 模拟的接口：
 *   GET    /api/table/data    查询列表数据（筛选/排序/分页）
 *   GET    /api/table/config  查询表格配置
 *   POST   /api/table/config  保存表格配置
 *   DELETE /api/table/config  删除表格配置
 *   GET    /api/table/export  导出数据（返回 Blob + 文件名）
 *
 * 统一响应结构（与常见后端约定一致）：
 *   { code: 200, message: '操作成功', data: ... }
 * ------------------------------------------------------------
 */

// 模拟当前登录用户（真实场景由后端从会话中识别）
const CURRENT_USER = { userId: 'U001', userName: '测试管理员' }

// 模拟网络延迟 200 ~ 600ms
const NETWORK_LATENCY = () => 200 + Math.floor(Math.random() * 400)

// 模拟服务端日志输出
function serverLog(method, url, status, cost) {
  // eslint-disable-next-line no-console
  console.log(`[mock-server] ${method.toUpperCase()} ${url} ${status} ${cost}ms`)
}

// ============================================================
// 模拟数据库：表格配置（localStorage 持久化，按用户隔离）
// ============================================================
const CONFIG_STORAGE_PREFIX = 'dynamic_table_config_'

function configStorageKey(menuId) {
  return CONFIG_STORAGE_PREFIX + menuId + '_' + CURRENT_USER.userId
}

function dbGetConfig(menuId) {
  const raw = localStorage.getItem(configStorageKey(menuId))
  return raw ? JSON.parse(raw) : null
}

function dbSaveConfig(menuId, config) {
  localStorage.setItem(configStorageKey(menuId), JSON.stringify(config))
}

function dbDeleteConfig(menuId) {
  localStorage.removeItem(configStorageKey(menuId))
}

// ============================================================
// 模拟数据库：业务列表数据
// ============================================================
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

function resolveDataset(menuId) {
  return menuId === 'M001' ? mockTableData : mockAccountingData
}

// ============================================================
// 服务端处理逻辑：筛选 / 排序 / 分页
// ============================================================
function toTimestamp(value) {
  if (value === null || value === undefined || value === '') return NaN
  const text = String(value)
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(text)
    ? text + 'T00:00:00'
    : text.replace(' ', 'T')
  return Date.parse(normalized)
}

function toCellText(value) {
  return value === null || value === undefined ? '' : String(value)
}

function queryList(dataSource, params = {}) {
  let filtered = [...dataSource]

  if (params.filters) {
    Object.keys(params.filters).forEach(fieldKey => {
      const val = params.filters[fieldKey]
      if (val === null || val === undefined || val === '') return

      if (typeof val === 'object' && !Array.isArray(val)) {
        if (val.range !== undefined && Array.isArray(val.range) && val.range.length === 2) {
          filtered = filtered.filter(row => row[fieldKey] >= val.range[0] && row[fieldKey] <= val.range[1])
        } else if (val.operator !== undefined && val.value !== '' && val.value !== null && val.value !== undefined) {
          const op = val.operator
          const fv = val.value
          switch (op) {
            case 'eq':
              filtered = filtered.filter(row => String(row[fieldKey]) === String(fv)); break
            case 'neq':
              filtered = filtered.filter(row => String(row[fieldKey]) !== String(fv)); break
            case 'contains':
              filtered = filtered.filter(row => toCellText(row[fieldKey]).toLowerCase().includes(String(fv).toLowerCase())); break
            case 'notContains':
              filtered = filtered.filter(row => !toCellText(row[fieldKey]).toLowerCase().includes(String(fv).toLowerCase())); break
            case 'startsWith':
              filtered = filtered.filter(row => toCellText(row[fieldKey]).toLowerCase().startsWith(String(fv).toLowerCase())); break
            case 'endsWith':
              filtered = filtered.filter(row => toCellText(row[fieldKey]).toLowerCase().endsWith(String(fv).toLowerCase())); break
            case 'gt':
              filtered = filtered.filter(row => Number(row[fieldKey]) > Number(fv)); break
            case 'lt':
              filtered = filtered.filter(row => Number(row[fieldKey]) < Number(fv)); break
            case 'gte':
              filtered = filtered.filter(row => Number(row[fieldKey]) >= Number(fv)); break
            case 'lte':
              filtered = filtered.filter(row => Number(row[fieldKey]) <= Number(fv)); break
            default:
              filtered = filtered.filter(row => toCellText(row[fieldKey]).toLowerCase().includes(String(fv).toLowerCase()))
          }
        } else if (val.min !== null && val.min !== undefined && val.min !== '') {
          filtered = filtered.filter(row => Number(row[fieldKey]) >= Number(val.min))
        } else if (val.max !== null && val.max !== undefined && val.max !== '') {
          filtered = filtered.filter(row => Number(row[fieldKey]) <= Number(val.max))
        } else if (val.start || val.end) {
          const startTime = val.start ? toTimestamp(val.start) : -Infinity
          const endTime = val.end ? toTimestamp(val.end) : Infinity
          filtered = filtered.filter(row => {
            const rowTime = toTimestamp(row[fieldKey])
            return !isNaN(rowTime) && rowTime >= startTime && rowTime <= endTime
          })
        } else if (val.value !== '' && val.value !== null && val.value !== undefined) {
          filtered = filtered.filter(row => toCellText(row[fieldKey]).startsWith(String(val.value)))
        }
      } else if (Array.isArray(val)) {
        if (val.length > 0) {
          filtered = filtered.filter(row => val.includes(row[fieldKey]))
        }
      } else {
        filtered = filtered.filter(row => {
          const cellVal = toCellText(row[fieldKey])
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

  const page = Number(params.page) || 1
  const pageSize = Number(params.pageSize) || 10
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const list = filtered.slice(start, end)

  return { list, total: filtered.length, page, pageSize }
}

// ============================================================
// 服务端处理逻辑：导出 CSV
// ============================================================
function buildCsvBlob(list, fields) {
  const escapeCsvValue = value => {
    let text = value === null || value === undefined ? '' : String(value)
    if (/^[=+\-@]/.test(text)) text = "'" + text
    return '"' + text.replace(/"/g, '""') + '"'
  }
  const rows = [
    fields.map(field => escapeCsvValue(field.fieldLabel)).join(','),
    ...list.map(row => fields.map(field => escapeCsvValue(row[field.fieldKey])).join(','))
  ]
  return new Blob(['\ufeff' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' })
}

function resolveExportFileName(menuId) {
  return menuId === 'M001' ? '用户数据.csv' : '核算数据.csv'
}

// ============================================================
// 统一响应包装（模拟后端返回结构）
// ============================================================
function ok(data, message = '操作成功') {
  return { code: 200, message, data: data === undefined ? null : data }
}

// ============================================================
// 路由处理：模拟服务端 Controller
// 返回 { data, headers? }
// ============================================================
function handleApi(config) {
  const method = (config.method || 'get').toLowerCase()
  const url = config.url || ''
  const params = config.params || {}
  let body = config.data
  if (typeof body === 'string') {
    try { body = JSON.parse(body) } catch (e) { body = {} }
  }
  body = body || {}

  if (url === '/table/data') {
    if (method === 'get') {
      const dataset = resolveDataset(params.menuId)
      return { data: ok(queryList(dataset, params), '查询成功') }
    }
  }

  if (url === '/table/config') {
    if (method === 'get') {
      return { data: ok(dbGetConfig(params.menuId), '查询成功') }
    }
    if (method === 'post') {
      if (!body.menuId) return { data: ok(null, '保存失败：缺少 menuId'), status: 400 }
      dbSaveConfig(body.menuId, body)
      return { data: ok(null, '保存成功') }
    }
    if (method === 'delete') {
      dbDeleteConfig(params.menuId)
      return { data: ok(null, '删除成功') }
    }
  }

  if (url === '/table/export') {
    if (method === 'get') {
      const dataset = resolveDataset(params.menuId)
      const { list } = queryList(dataset, {
        filters: params.filters,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
        page: 1,
        pageSize: dataset.length
      })
      const blob = buildCsvBlob(list, params.fields || [])
      const fileName = resolveExportFileName(params.menuId)
      return {
        data: blob,
        headers: { 'content-disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}` }
      }
    }
  }

  const error = new Error(`接口不存在: ${method.toUpperCase()} ${url}`)
  error.status = 404
  throw error
}

// ============================================================
// axios 实例：自定义 adapter 拦截请求，模拟真实 HTTP 调用
// ============================================================
const mockHttp = axios.create({ baseURL: '/api' })

mockHttp.defaults.adapter = async config => {
  const start = Date.now()
  await new Promise(resolve => setTimeout(resolve, NETWORK_LATENCY()))
  let response
  try {
    response = handleApi(config)
    serverLog(config.method || 'get', config.url, response.status || 200, Date.now() - start)
    return {
      data: response.data,
      status: response.status || 200,
      statusText: 'OK',
      headers: response.headers || {},
      config,
      request: {}
    }
  } catch (e) {
    serverLog(config.method || 'get', config.url, e.status || 500, Date.now() - start)
    throw e
  }
}

// ============================================================
// 提供给页面的接口函数（与真实后端接入方式一致）
// ============================================================

/** 查询列表数据：GET /api/table/data */
export function fetchTableData(params) {
  return mockHttp.get('/table/data', { params })
}

/** 查询表格配置：GET /api/table/config */
export function fetchTableConfig(menuId) {
  return mockHttp.get('/table/config', { params: { menuId } })
}

/** 保存表格配置：POST /api/table/config */
export function saveTableConfig(config) {
  return mockHttp.post('/table/config', config)
}

/** 删除表格配置：DELETE /api/table/config */
export function deleteTableConfig(menuId) {
  return mockHttp.delete('/table/config', { params: { menuId } })
}

/** 导出数据：GET /api/table/export（Blob 响应） */
export function exportTableData(params) {
  return mockHttp.get('/table/export', { params, responseType: 'blob' })
}
