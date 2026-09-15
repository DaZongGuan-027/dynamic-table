export function unwrapResponseData(response) {
  let value = response
  let depth = 0
  while (
    value && typeof value === 'object' && !Array.isArray(value) &&
    Object.prototype.hasOwnProperty.call(value, 'data') &&
    !Object.prototype.hasOwnProperty.call(value, 'list') &&
    !Object.prototype.hasOwnProperty.call(value, 'visibleFields') &&
    depth < 3
  ) {
    value = value.data
    depth++
  }
  return value
}

export function normalizeTableResponse(response) {
  const value = unwrapResponseData(response) || {}
  return {
    list: Array.isArray(value.list) ? value.list : [],
    total: Number.isFinite(Number(value.total)) ? Number(value.total) : 0
  }
}

export function getMinimumPageSize(pageSizes, fallback = 10) {
  const values = Array.isArray(pageSizes)
    ? pageSizes.map(Number).filter(value => Number.isFinite(value) && value > 0)
    : []
  return values.length > 0 ? Math.min(...values) : fallback
}

export function readTableSettings(config, columnWidths = {}) {
  let settings = config && config.settings
  if (typeof settings === 'string') {
    try { settings = JSON.parse(settings) } catch (e) { settings = {} }
  }
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) settings = {}
  // 兼容旧版配置：优先 settings.pageSizes，其次 columnWidths.__pageSizes，最后顶层 pageSizes（v1.1.x 格式）
  const pageSizes = settings.pageSizes || columnWidths.__pageSizes || parseJsonArray(config && config.pageSizes)
  const showSummary = settings.showSummary !== undefined ? settings.showSummary : columnWidths.__showSummary
  const showUniversalFilter = settings.showUniversalFilter !== undefined
    ? settings.showUniversalFilter
    : columnWidths.__showUniversalFilter
  const parameterValues = parseJsonObject(settings.parameterValues)
  return {
    pageSizes: Array.isArray(pageSizes) ? pageSizes : null,
    showSummary: typeof showSummary === 'boolean' ? showSummary : undefined,
    showUniversalFilter: typeof showUniversalFilter === 'boolean' ? showUniversalFilter : undefined,
    parameterValues
  }
}

export function parseJsonArray(value) {
  if (Array.isArray(value)) return value
  if (typeof value !== 'string') return null
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : null
  } catch (e) { return null }
}

export function parseJsonObject(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value
  if (typeof value !== 'string') return null
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null
  } catch (e) { return null }
}

export function buildDateRangeFilter(meta, range) {
  if (meta && (meta.dateFilterType === 'monthrange' || meta.dateFilterType === 'month')) {
    const startParts = String(range[0]).slice(0, 7).split('-').map(Number)
    const endParts = String(range[1]).slice(0, 7).split('-').map(Number)
    const lastDay = new Date(endParts[0], endParts[1], 0).getDate()
    const pad = value => value < 10 ? '0' + value : String(value)
    return { range: [
      startParts[0] + '-' + pad(startParts[1]) + '-01',
      endParts[0] + '-' + pad(endParts[1]) + '-' + pad(lastDay)
    ] }
  }
  return { range: [...range] }
}

export function isCachedFilterValueValid(meta, cachedValue) {
  if (!meta) return false
  const hasEnum = meta.enumValues && (Array.isArray(meta.enumValues)
    ? meta.enumValues.length > 0
    : Object.keys(meta.enumValues).length > 0)
  if (hasEnum) {
    return meta.filterMultiple === false
      ? !Array.isArray(cachedValue) && (cachedValue === '' || cachedValue !== null && cachedValue !== undefined && typeof cachedValue !== 'object')
      : Array.isArray(cachedValue)
  }
  switch (meta.fieldType) {
    case 'string':
    case 'number':
    case 'currency':
      return !!cachedValue && typeof cachedValue === 'object' && !Array.isArray(cachedValue) &&
        cachedValue.operator !== undefined && cachedValue.value !== undefined
    case 'date': {
      if (!cachedValue || typeof cachedValue !== 'object' || Array.isArray(cachedValue)) return false
      const type = meta.dateFilterType || 'daterange'
      if (type === 'daterange' || type === 'monthrange' || (type === 'month' && meta.monthToDateRange === true)) {
        return cachedValue.range !== undefined && cachedValue.value === undefined
      }
      return cachedValue.value !== undefined && cachedValue.range === undefined
    }
    case 'boolean':
      return typeof cachedValue === 'boolean' || cachedValue === ''
    default:
      return !!cachedValue && typeof cachedValue === 'object' && !Array.isArray(cachedValue)
  }
}

export function isAbortError(error) {
  return !!error && (error.name === 'AbortError' || error.code === 'ERR_CANCELED')
}

export function normalizeInFilterValue(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.operator !== 'in') return value
  return String(value.value === undefined || value.value === null ? '' : value.value)
    .split(/[,，、/]/)
    .map(item => item.trim())
    .filter(Boolean)
}

export function hasActiveFilterValue(value) {
  if (value === null || value === undefined || value === '') return false
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') {
    if (value.range !== undefined) return Array.isArray(value.range) && value.range.length === 2
    if (value.value !== undefined) return value.value !== '' && value.value !== null && value.value !== undefined
    return Object.keys(value).some(key => value[key] !== null && value[key] !== undefined && value[key] !== '')
  }
  return true
}

export function isTextOverflowing(element) {
  return Boolean(element && element.scrollWidth > element.clientWidth)
}

export function getSelectionKey(row, rowKey) {
  const value = row && row[rowKey]
  return typeof value + ':' + String(value)
}

export function reconcileReservedSelection(selectionMap, currentRows, selectedRows, rowKey) {
  const next = { ...(selectionMap || {}) }
  const selectedKeys = new Set(selectedRows.map(row => getSelectionKey(row, rowKey)))
  currentRows.forEach(row => {
    const key = getSelectionKey(row, rowKey)
    if (!selectedKeys.has(key)) delete next[key]
  })
  selectedRows.forEach(row => { next[getSelectionKey(row, rowKey)] = row })
  return next
}

export function buildExportFields(columnOrder, visibleFields, fieldMetaMap) {
  return columnOrder
    .filter(key => visibleFields.includes(key))
    .map(key => fieldMetaMap[key])
    .filter(meta => meta && !['selection', 'index', 'actions'].includes(meta.fieldType) && meta.exportable !== false)
    .map(meta => ({
      fieldKey: meta.fieldKey,
      exportFieldKey: meta.exportFieldKey || meta.fieldKey,
      fieldLabel: meta.exportFieldLabel || meta.fieldLabel || meta.fieldKey,
      fieldType: meta.fieldType || 'string',
      exportFormat: meta.exportFormat || ''
    }))
}
