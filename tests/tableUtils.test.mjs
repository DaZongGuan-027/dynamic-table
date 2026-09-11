import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildDateRangeFilter,
  buildExportFields,
  getMinimumPageSize,
  hasActiveFilterValue,
  isTextOverflowing,
  isAbortError,
  isCachedFilterValueValid,
  normalizeTableResponse,
  normalizeInFilterValue,
  parseJsonArray,
  parseJsonObject,
  reconcileReservedSelection,
  readTableSettings,
  unwrapResponseData
} from '../packages/dynamic-table/src/utils/tableUtils.mjs'

test('unwraps direct, Axios and common API response data', () => {
  const payload = { list: [{ id: 1 }], total: 1 }
  assert.deepEqual(unwrapResponseData(payload), payload)
  assert.deepEqual(normalizeTableResponse({ data: payload }), payload)
  assert.deepEqual(normalizeTableResponse({ data: { code: 200, data: payload } }), payload)
})

test('normalizes invalid table responses safely', () => {
  assert.deepEqual(normalizeTableResponse(null), { list: [], total: 0 })
  assert.deepEqual(normalizeTableResponse({ list: 'bad', total: '3' }), { list: [], total: 3 })
})

test('uses the smallest valid page size', () => {
  assert.equal(getMinimumPageSize([50, 10, 500]), 10)
  assert.equal(getMinimumPageSize([], 20), 20)
})

test('reads version 2 settings and migrates legacy column width settings', () => {
  assert.deepEqual(readTableSettings({ settings: '{"pageSizes":[20,50],"showSummary":true}' }), {
    pageSizes: [20, 50], showSummary: true, showUniversalFilter: undefined
  })
  assert.deepEqual(readTableSettings({}, {
    __pageSizes: [10, 100], __showSummary: false, __showUniversalFilter: true
  }), { pageSizes: [10, 100], showSummary: false, showUniversalFilter: true })
})

test('migrates legacy top-level pageSizes (v1.1.x) when settings are missing', () => {
  assert.deepEqual(readTableSettings({ pageSizes: '[100,500,1000]' }), {
    pageSizes: [100, 500, 1000], showSummary: undefined, showUniversalFilter: undefined
  })
  assert.deepEqual(readTableSettings({ pageSizes: [100, 500, 1000] }), {
    pageSizes: [100, 500, 1000], showSummary: undefined, showUniversalFilter: undefined
  })
})

test('settings.pageSizes takes precedence over legacy pageSizes fields', () => {
  assert.deepEqual(readTableSettings(
    { settings: '{"pageSizes":[100,500]}', pageSizes: '[10,20]' },
    { __pageSizes: [1, 2] }
  ), { pageSizes: [100, 500], showSummary: undefined, showUniversalFilter: undefined })
})

test('rejects malformed configuration field types', () => {
  assert.deepEqual(parseJsonArray('["name"]'), ['name'])
  assert.equal(parseJsonArray('{"name":true}'), null)
  assert.deepEqual(parseJsonObject('{"name":120}'), { name: 120 })
  assert.equal(parseJsonObject('["name"]'), null)
  assert.deepEqual(readTableSettings({ settings: '{"pageSizes":"10,50","showSummary":"true"}' }), {
    pageSizes: null, showSummary: undefined, showUniversalFilter: undefined
  })
})

test('converts a single month and month range to full date range', () => {
  assert.deepEqual(buildDateRangeFilter({ dateFilterType: 'month' }, ['2024-02', '2024-02']), {
    range: ['2024-02-01', '2024-02-29']
  })
  assert.deepEqual(buildDateRangeFilter({ dateFilterType: 'monthrange' }, ['2024-01', '2024-03']), {
    range: ['2024-01-01', '2024-03-31']
  })
})

test('rejects incompatible cached filter structures', () => {
  assert.equal(isCachedFilterValueValid({ fieldType: 'date', dateFilterType: 'month', monthToDateRange: true }, { range: null }), true)
  assert.equal(isCachedFilterValueValid({ fieldType: 'date', dateFilterType: 'month', monthToDateRange: true }, { value: '2024-01' }), false)
  assert.equal(isCachedFilterValueValid({ fieldType: 'enum', enumValues: [1], filterMultiple: false }, [1]), false)
})

test('recognizes browser and Axios cancellation errors', () => {
  assert.equal(isAbortError({ name: 'AbortError' }), true)
  assert.equal(isAbortError({ code: 'ERR_CANCELED' }), true)
  assert.equal(isAbortError(new Error('failed')), false)
})

test('detects text overflow from the rendered element dimensions', () => {
  assert.equal(isTextOverflowing({ scrollWidth: 81, clientWidth: 80 }), true)
  assert.equal(isTextOverflowing({ scrollWidth: 80, clientWidth: 80 }), false)
  assert.equal(isTextOverflowing(null), false)
})

test('normalizes the in operator consistently for every filter entry point', () => {
  assert.deepEqual(normalizeInFilterValue({ operator: 'in', value: 'A，B、C/D' }), ['A', 'B', 'C', 'D'])
  const regular = { operator: 'contains', value: 'A,B' }
  assert.equal(normalizeInFilterValue(regular), regular)
  assert.equal(hasActiveFilterValue(normalizeInFilterValue({ operator: 'in', value: '' })), false)
  assert.equal(hasActiveFilterValue({ range: null }), false)
})

test('builds export fields from visible columns in current order', () => {
  const meta = {
    name: { fieldKey: 'name', fieldLabel: '名称', fieldType: 'string' },
    secret: { fieldKey: 'secret', fieldLabel: '密钥', fieldType: 'string', exportable: false },
    amount: { fieldKey: 'amount', fieldLabel: '金额', fieldType: 'currency', exportFieldKey: 'total_amount' }
  }
  assert.deepEqual(buildExportFields(['amount', 'secret', 'name'], ['name', 'amount', 'secret'], meta), [
    { fieldKey: 'amount', exportFieldKey: 'total_amount', fieldLabel: '金额', fieldType: 'currency', exportFormat: '' },
    { fieldKey: 'name', exportFieldKey: 'name', fieldLabel: '名称', fieldType: 'string', exportFormat: '' }
  ])
})

test('preserves off-page selections and updates the current page', () => {
  const previous = { 'number:1': { id: 1 }, 'number:3': { id: 3 } }
  const next = reconcileReservedSelection(previous, [{ id: 1 }, { id: 2 }], [{ id: 2 }], 'id')
  assert.deepEqual(next, { 'number:2': { id: 2 }, 'number:3': { id: 3 } })
})
