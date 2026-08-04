<template>
  <div class="dynamic-table" v-loading="configLoading">

    <filter-panel
      v-if="activeFilterMetaList.length > 0 || (computedShowUniversalFilter && allDataFields.length > 0)"
      ref="filterPanel"
      :filter-meta-list="activeFilterMetaList"
      :all-field-meta-list="fieldMetaList"
      :filter-values="filterValues"
      :expanded="filterExpanded"
      :filter-schemes="filterSchemes"
      :active-scheme-index="activeSchemeIndex"
      :popper-append-to-body="filterPopperAppendToBody"
      :show-universal-filter="computedShowUniversalFilter"
      @toggle-expand="toggleFilterExpand"
      @apply="applyFilters"
      @reset="resetFilters"
      @apply-scheme="handleApplyScheme"
      @save-scheme="handleSaveScheme"
    />

    <div class="table-toolbar">
      <div class="toolbar-left">
        <slot name="toolbar-left"></slot>
      </div>
      <div class="toolbar-right">
        <el-button
          type="text"
          icon="el-icon-setting"
          @click="showConfigDrawer = true"
        >
          表格配置
        </el-button>

      </div>
    </div>

    <div class="table-main">
      <el-table
        ref="elTable"
        :key="tableKey"
        :data="displayData"
        :border="border"
        :stripe="stripe"
        :row-key="getRowKey"
        :row-class-name="getRowClassName"
        :height="computedTableHeight"
        v-loading="tableLoading"

        @selection-change="handleSelectionChange"
        style="width: 100%"
      >
      <template v-for="fieldKey in allColumnOrder">
        <el-table-column
          v-if="fieldKey === '__selection' && hasSelection && isSpecialVisible('__selection')"
          :key="fieldKey"
          type="selection"
          :width="columnWidths['__selection'] || 50"
          :fixed="getFrozenFixed('__selection')"
          :header-align="headerAlign"
          align="center"
          :selectable="isRowSelectable"
        />
        <el-table-column
          v-else-if="fieldKey === '__index' && hasIndex && isSpecialVisible('__index')"
          :key="fieldKey"
          type="index"
          label="#"
          :width="columnWidths['__index'] || 50"
          :fixed="getFrozenFixed('__index')"
          :header-align="headerAlign"
          align="center"
        >
          <template slot-scope="scope">
            <span v-if="scope.row.__isSummaryRow" class="summary-toggle" @click="toggleSummaryMode">{{ summaryLabel }}</span>
            <span v-else>{{ scope.$index }}</span>
          </template>
        </el-table-column>
        <el-table-column
          v-else-if="fieldKey === '__actions' && hasRowActions && isSpecialVisible('__actions')"
          :key="fieldKey"
          label="操作"
          :width="columnWidths['__actions'] || actionColumnWidth"
          :fixed="getActionColumnFixed"
          :header-align="headerAlign"
          align="center"
        >
          <template slot-scope="scope">
            <template v-if="!scope.row.__isSummaryRow">
              <slot name="actions" :row="scope.row">
                <template v-for="(action, idx) in getRowActions">
                  <el-button
                    v-if="isActionVisible(action, scope.row)"
                    :key="idx"
                    :type="resolveActionProp(action.type, scope.row) || 'text'"
                    :icon="action.icon"
                    :disabled="resolveActionProp(action.disabled, scope.row)"
                    size="mini"
                    :style="action.style || {}"
                    @click="handleRowAction(action, scope.row)"
                  >{{ action.label }}</el-button>
                </template>
              </slot>
            </template>
          </template>
        </el-table-column>
        <el-table-column
          v-else-if="isDataField(fieldKey) && orderedVisibleFields.includes(fieldKey)"
          :key="fieldKey"
          :prop="fieldKey"
          :width="columnWidths[fieldKey] || (fieldMetaMap[fieldKey] ? fieldMetaMap[fieldKey].width : undefined)"
          :min-width="fieldMetaMap[fieldKey] ? fieldMetaMap[fieldKey].minWidth : undefined"
          :align="fieldMetaMap[fieldKey] ? fieldMetaMap[fieldKey].align : 'left'"
          :header-align="headerAlign"
          :fixed="getFrozenFixed(fieldKey)"
          show-overflow-tooltip
        >
          <template slot="header">
            <column-header
              :field-key="fieldKey"
              :field-meta="fieldMetaMap[fieldKey]"
              :column-search-value="columnSearchValues[fieldKey]"
              :current-sort-order="currentSortBy === fieldKey ? currentSortOrder : ''"
              :popper-append-to-body="filterPopperAppendToBody"
              @sort-change="handleColumnSortChange"
              @search-change="handleColumnSearchChange"
              @search-confirm="handleColumnSearchConfirm"
              @search-clear="handleColumnSearchClear"
            />
          </template>
          <template slot-scope="scope">
            <template v-if="scope.row.__isSummaryRow">
              <span v-if="!hasIndex && isFirstVisibleDataField(fieldKey)" class="summary-toggle" @click="toggleSummaryMode">{{ summaryLabel }}</span>
              <span v-else-if="summableFieldKeys.includes(fieldKey)">{{ _formatCurrency(scope.row[fieldKey]) }}</span>
            </template>
            <slot
              v-else
              :name="'column-' + fieldKey"
              :row="scope.row"
              :value="scope.row[fieldKey]"
            >
              {{ formatCellValue(scope.row[fieldKey], fieldMetaMap[fieldKey]) }}
            </slot>
          </template>
        </el-table-column>
      </template>
    </el-table>
    </div>

    <div class="table-pagination" v-if="showPagination">
      <el-pagination
        :current-page="currentPage"
        :page-sizes="computedPageSizes"
        :page-size="pageSize"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>

    <config-drawer
      :visible.sync="showConfigDrawer"
      :field-meta-list="fieldMetaList"
      :visible-fields="visibleFields"
      :frozen-fields="frozenFields"
      :frozen-positions="frozenPositions"
      :column-widths="columnWidths"
      :filter-fields="filterFields"
      :column-order="columnOrder"
      :filter-schemes="filterSchemes"
      :current-filter-values="filterValues"
      :page-sizes="computedPageSizes"
      :default-page-size="computedDefaultPageSize"
      :show-summary="computedShowSummary"
      :show-universal-filter="computedShowUniversalFilter"

      @confirm="handleConfigChange"
      @reset-default="handleResetDefault"
    />
  </div>
</template>

<script>
import FilterPanel from './FilterPanel.vue'
import ConfigDrawer from './ConfigDrawer.vue'
import ColumnHeader from './ColumnHeader.vue'
import useTableConfig from './composables/useTableConfig'
import useFilter from './composables/useFilter'

export default {
  name: 'DynamicTable',

  components: {
    FilterPanel,
    ConfigDrawer,
    ColumnHeader
  },

  mixins: [useTableConfig, useFilter],

  props: {
    menuId: { type: String, required: true },

    fieldMetaList: { type: Array, required: true },
    fetchDataFn: { type: Function, required: true },
    loadConfigFn: { type: Function, default: null },
    saveConfigFn: { type: Function, default: null },
    rowKey: { type: String, default: 'id' },
    border: { type: Boolean, default: true },
    stripe: { type: Boolean, default: true },
    tableHeight: { type: [String, Number], default: undefined },
    maxHeight: { type: [String, Number], default: undefined },

    showPagination: { type: Boolean, default: true },
    pageSizes: { type: Array, default: () => [10, 20, 50, 100] },
    headerAlign: { type: String, default: 'center' },

    actionColumnWidth: { type: [String, Number], default: 150 },

    defaultVisibleFields: { type: Array, default: () => [] },

    filterPopperAppendToBody: { type: Boolean, default: true },
    pageParamName: { type: String, default: 'page' },
    pageSizeParamName: { type: String, default: 'pageSize' },
    defaultFilterValues: { type: Object, default: () => ({}) },
    filterCacheKey: { type: String, default: '' },
    cacheFilters: { type: Boolean, default: false },

    showSummary: { type: Boolean, default: false },
    fetchSummaryFn: { type: Function, default: null },
    showUniversalFilter: { type: Boolean, default: true }
  },

  data() {
    return {
      showConfigDrawer: false,
      tableData: [],
      tableLoading: false,
      tableKey: 0,
      total: 0,
      currentPage: 1,
      pageSize: 10,
      currentSortBy: '',
      currentSortOrder: '',

      columnSearchValues: {},
      activeSchemeIndex: -1,
      _lastCustomFilterValues: {},
      summaryMode: 'page',
      allSummaryData: null,
      summaryLoading: false
    }
  },

  computed: {
    computedTableHeight() {
      if (this.tableHeight) return this.tableHeight
      return '100%'
    },

    computedShowSummary() {
      const saved = this.columnWidths && this.columnWidths['__showSummary']
      return saved !== undefined ? saved : this.showSummary
    },

    computedShowUniversalFilter() {
      const saved = this.columnWidths && this.columnWidths['__showUniversalFilter']
      return saved !== undefined ? saved : this.showUniversalFilter
    },

    computedPageSizes() {
      const saved = this.columnWidths && this.columnWidths['__pageSizes']
      return saved && saved.length > 0 ? saved : this.pageSizes
    },

    computedDefaultPageSize() {
      return this.columnWidths && this.columnWidths['__defaultPageSize'] || 0
    },

    computedPageSize() {
      const dps = this.computedDefaultPageSize
      if (dps && dps >= 10 && dps <= 2000) return dps
      const ps = this.computedPageSizes
      if (ps && ps.length > 0) return Math.min(...ps)
      return this.pageSize
    },

    hasRowActions() {
      return this.fieldMetaList.some(f => f.fieldType === 'actions')
    },

    allDataFields() {
      return this.fieldMetaList.filter(f => {
        return f.fieldType !== 'selection' && f.fieldType !== 'index' && f.fieldType !== 'actions'
      })
    },

    hasSelection() {
      return this.fieldMetaList.some(f => f.fieldType === 'selection')
    },

    hasIndex() {
      return this.fieldMetaList.some(f => f.fieldType === 'index')
    },

    getRowActions() {
      const actionsMeta = this.fieldMetaList.find(f => f.fieldType === 'actions')
      return actionsMeta && actionsMeta.actions ? actionsMeta.actions : []
    },

    specialKeys() {
      const keys = []
      if (this.fieldMetaList.some(f => f.fieldType === 'selection')) keys.push('__selection')
      if (this.fieldMetaList.some(f => f.fieldType === 'index')) keys.push('__index')
      if (this.hasRowActions) keys.push('__actions')
      return keys
    },

    allColumnOrder() {
      const specialInOrder = this.columnOrder.filter(k => k.startsWith('__'))
      const specialNotInOrder = this.specialKeys.filter(k => !specialInOrder.includes(k))
      const prefixSpecials = specialNotInOrder.filter(k => k !== '__actions')
      const suffixSpecials = specialNotInOrder.filter(k => k === '__actions')
      const hasLeftFrozen = this.frozenLeftColumns.length > 0
      const unfrozenPrefix = prefixSpecials.filter(k => !this.frozenFields.includes(k))
      const frozenPrefix = prefixSpecials.filter(k => this.frozenFields.includes(k))
      if (hasLeftFrozen) {
        return [...frozenPrefix, ...this.columnOrder, ...unfrozenPrefix, ...suffixSpecials]
      }
      return [...prefixSpecials, ...this.columnOrder, ...suffixSpecials]
    },

    getActionColumnFixed() {
      const pos = this.frozenPositions['__actions']
      if (pos === 'left') return 'left'
      if (pos === 'right') return 'right'
      return false
    },

    frozenLeftColumns() {
      return this.orderedVisibleFields.filter(key => {
        if (!this.frozenFields.includes(key)) return false
        const pos = this.frozenPositions[key]
        if (pos) return pos === 'left'
        const meta = this.fieldMetaMap[key]
        return !meta || meta.frozenPosition !== 'right'
      })
    },

    frozenRightColumns() {
      return this.orderedVisibleFields.filter(key => {
        if (!this.frozenFields.includes(key)) return false
        const pos = this.frozenPositions[key]
        if (pos) return pos === 'right'
        const meta = this.fieldMetaMap[key]
        return meta && meta.frozenPosition === 'right'
      })
    },

    normalColumns() {
      return this.orderedVisibleFields.filter(key => !this.frozenFields.includes(key))
    },

    summableFields() {
      return this.fieldMetaList.filter(f => f.fieldType === 'currency' || f.fieldType === 'number')
    },

    summableFieldKeys() {
      return this.summableFields.map(f => f.fieldKey)
    },

    pageSummaryData() {
      const sums = {}
      this.summableFieldKeys.forEach(key => {
        let total = 0
        this.tableData.forEach(row => {
          const v = Number(row[key])
          if (!isNaN(v)) total += v
        })
        sums[key] = total
      })
      return sums
    },

    currentSummaryData() {
      if (this.summaryMode === 'all' && this.allSummaryData) return this.allSummaryData
      return this.pageSummaryData
    },

    summaryLabel() {
      return this.summaryMode === 'all' ? '合计：所有页' : '合计：当前页'
    },

    displayData() {
      if (!this.computedShowSummary || this.tableData.length === 0) return this.tableData
      const summaryRow = { __isSummaryRow: true }
      this.summableFieldKeys.forEach(key => {
        summaryRow[key] = this.currentSummaryData[key] || 0
      })
      return [summaryRow, ...this.tableData]
    }
  },

  created() {
    this.loadConfig().then(() => {
      this.fetchData()
    })
  },

  mounted() {
    this.$nextTick(() => {
      if (this.$refs.elTable) this.$refs.elTable.doLayout()
    })
  },

  activated() {
    this.$nextTick(() => {
      if (this.$refs.elTable) this.$refs.elTable.doLayout()
    })
  },

  beforeDestroy() {
  },

  methods: {
    getRowKey(row) {
      if (row.__isSummaryRow) return '__summary_row__'
      return row[this.rowKey]
    },

    getRowClassName({ row }) {
      if (row.__isSummaryRow) return 'summary-row'
      return ''
    },

    isRowSelectable(row) {
      return !row.__isSummaryRow
    },

    isFirstVisibleDataField(fieldKey) {
      const firstKey = this.orderedVisibleFields.find(k => this.isDataField(k))
      return fieldKey === firstKey
    },

    async toggleSummaryMode() {
      if (this.summaryMode === 'page') {
        if (this.fetchSummaryFn) {
          this.summaryLoading = true
          try {
            const mergedFilters = { ...this.activeFilters }
            Object.keys(this.columnSearchValues).forEach(key => {
              const val = this.columnSearchValues[key]
              if (val !== null && val !== undefined && val !== '') {
                mergedFilters[key] = val
              }
            })
            if (this._lastCustomFilterValues) {
              Object.keys(this._lastCustomFilterValues).forEach(key => {
                mergedFilters[key] = this._lastCustomFilterValues[key]
              })
            }
            const params = {
              filters: mergedFilters,
              sortBy: this.currentSortBy,
              sortOrder: this.currentSortOrder
            }
            const result = await this.fetchSummaryFn(params)
            this.allSummaryData = result || {}
            this.summaryMode = 'all'
          } catch (e) {
            console.error('获取合计数据失败:', e)
          } finally {
            this.summaryLoading = false
          }
        } else {
          this.summaryMode = 'all'
        }
      } else {
        this.summaryMode = 'page'
      }
    },

    async fetchData() {
      this.tableLoading = true
      try {
        const mergedFilters = { ...this.activeFilters }
        Object.keys(this.columnSearchValues).forEach(key => {
          const val = this.columnSearchValues[key]
          if (val !== null && val !== undefined && val !== '') {
            mergedFilters[key] = val
          }
        })
        if (this._lastCustomFilterValues) {
          Object.keys(this._lastCustomFilterValues).forEach(key => {
            mergedFilters[key] = this._lastCustomFilterValues[key]
          })
        }
        const params = {
          [this.pageParamName]: this.currentPage,
          [this.pageSizeParamName]: this.pageSize,
          filters: mergedFilters,
          sortBy: this.currentSortBy,
          sortOrder: this.currentSortOrder
        }
        const result = await this.fetchDataFn(params)
        this.tableData = result.list || []
        this.total = result.total || 0
        this.summaryMode = 'page'
        this.allSummaryData = null
        this.$nextTick(() => {
          this.$nextTick(() => {
            if (this.$refs.elTable) this.$refs.elTable.doLayout()
          })
        })
      } catch (e) {
        console.error('获取表格数据失败:', e)
        this.tableData = []
        this.total = 0
      } finally {
        this.tableLoading = false
      }
    },

    formatCellValue(value, meta) {
      if (!meta) return value
      if (value === null || value === undefined || value === '') return ''
      const enumList = this._normalizeEnumValues(meta.enumValues)
      if (enumList.length > 0) {
        const found = enumList.find(v => v.value === value)
        if (found) return found.label
      }
      if (meta.fieldType === 'currency') {
        return this._formatCurrency(value)
      }
      if (meta.formatter && typeof meta.formatter === 'function') {
        return meta.formatter(value)
      }
      return value
    },

    isSpecialVisible(key) {
      if (this.visibleFields.includes(key)) return true
      if (!this.columnOrder.includes(key) && !this.visibleFields.includes(key)) return true
      return false
    },

    isDataField(key) {
      return !key.startsWith('__')
    },

    _formatCurrency(value) {
      const num = Number(value)
      if (isNaN(num)) return value
      return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },

    _normalizeEnumValues(enumValues) {
      if (!enumValues) return []
      if (Array.isArray(enumValues)) return enumValues
      if (typeof enumValues === 'object') {
        return Object.keys(enumValues).map(key => ({ label: enumValues[key], value: key }))
      }
      return []
    },

    getFrozenFixed(fieldKey) {
      if (!this.frozenFields.includes(fieldKey)) return false
      const pos = this.frozenPositions[fieldKey]
      if (pos === 'right') return 'right'
      const meta = this.fieldMetaMap[fieldKey]
      if (meta && meta.frozenPosition === 'right') return 'right'
      return 'left'
    },

    handleRowAction(action, row) {
      this.$emit('row-action', { action: action.action, row })
    },

    resolveActionProp(prop, row) {
      if (typeof prop === 'function') return prop(row)
      return prop
    },

    isActionVisible(action, row) {
      if (typeof action.visible === 'function') return action.visible(row)
      if (action.visible === false) return false
      return true
    },


    handleSizeChange(size) {
      this.pageSize = size
      this.currentPage = 1
      this.fetchData()
    },

    handlePageChange(page) {
      this.currentPage = page
      this.fetchData()
    },

    handleSelectionChange(selection) {
      const filtered = selection.filter(row => !row.__isSummaryRow)
      this.$emit('selection-change', filtered)
    },

    handleResetDefault() {
      this.resetToDefault()
      this.clearStorageConfig()
      this.initFilterValues(false)
      this._clearCachedFilters()
      this.columnSearchValues = {}
      this.currentSortBy = ''
      this.currentSortOrder = ''
      this.activeSchemeIndex = -1
      this.currentPage = 1
      this._lastCustomFilterValues = {}
      if (this.$refs.filterPanel) this.$refs.filterPanel.resetCustomFilters()
      this.scrollFilterToTop()
      this.tableKey++
      this.$nextTick(() => {
        this.doLayout()
        this.fetchData()
      })
      this.$message.success('已还原为默认配置')
    },

    applyFilters(customFilterValues) {
      this._saveCachedFilters()
      this._lastCustomFilterValues = customFilterValues || {}
      this.currentPage = 1
      this.fetchData()
    },

    resetFilters() {
      this.initFilterValues(false)
      this._clearCachedFilters()
      this.columnSearchValues = {}
      this.currentSortBy = ''
      this.currentSortOrder = ''
      this.activeSchemeIndex = -1
      this.currentPage = 1
      this._lastCustomFilterValues = {}
      if (this.$refs.filterPanel) this.$refs.filterPanel.resetCustomFilters()
      this.scrollFilterToTop()
      this.fetchData()
    },

    handleApplyScheme({ filterValues, index }) {
      this.activeSchemeIndex = index
      this.applySchemeValues(filterValues)
      this.applyColumnSearchFromScheme(filterValues)
      this.currentPage = 1
      this.fetchData()
    },

    applyColumnSearchFromScheme(schemeFilterValues) {
      const newColumnSearch = {}
      const filterFieldSet = new Set(this.activeFilterMetaList.map(m => m.fieldKey))
      if (schemeFilterValues) {
        Object.keys(schemeFilterValues).forEach(key => {
          if (!filterFieldSet.has(key)) {
            const val = schemeFilterValues[key]
            if (val !== null && val !== undefined && val !== '') {
              if (typeof val === 'object' && !Array.isArray(val)) {
                if (Object.keys(val).some(function(k) { return val[k] !== null && val[k] !== undefined && val[k] !== '' })) {
                  newColumnSearch[key] = JSON.parse(JSON.stringify(val))
                }
              } else if (Array.isArray(val)) {
                if (val.length > 0) newColumnSearch[key] = JSON.parse(JSON.stringify(val))
              } else {
                newColumnSearch[key] = val
              }
            }
          }
        })
      }
      this.columnSearchValues = newColumnSearch
    },

    handleSaveScheme(scheme) {
      const mergedFilterValues = this.getMergedFilterValues()
      if (scheme.overwriteIndex !== undefined && scheme.overwriteIndex >= 0) {
        this.$set(this.filterSchemes, scheme.overwriteIndex, {
          name: scheme.name,
          filterValues: mergedFilterValues
        })
      } else {
        this.filterSchemes.push({
          name: scheme.name,
          filterValues: mergedFilterValues
        })
        this.activeSchemeIndex = this.filterSchemes.length - 1
      }
      this.saveConfig()
    },

    getMergedFilterValues() {
      const merged = {}
      Object.keys(this.filterValues).forEach(key => {
        const val = this.filterValues[key]
        if (val !== null && val !== undefined && val !== '') {
          if (typeof val === 'object' && !Array.isArray(val)) {
            if (Object.keys(val).some(function(k) { return val[k] !== null && val[k] !== undefined && val[k] !== '' })) {
              merged[key] = JSON.parse(JSON.stringify(val))
            }
          } else if (Array.isArray(val)) {
            if (val.length > 0) merged[key] = JSON.parse(JSON.stringify(val))
          } else {
            merged[key] = val
          }
        }
      })
      Object.keys(this.columnSearchValues).forEach(key => {
        const val = this.columnSearchValues[key]
        if (val !== null && val !== undefined && val !== '') {
          if (typeof val === 'object' && !Array.isArray(val)) {
            if (Object.keys(val).some(function(k) { return val[k] !== null && val[k] !== undefined && val[k] !== '' })) {
              merged[key] = JSON.parse(JSON.stringify(val))
            }
          } else if (Array.isArray(val)) {
            if (val.length > 0) merged[key] = JSON.parse(JSON.stringify(val))
          } else {
            merged[key] = val
          }
        }
      })
      return merged
    },

    applySchemeValues(schemeFilterValues) {
      const newValues = {}
      this.activeFilterMetaList.forEach(meta => {
        const hasEnum = meta.enumValues && (Array.isArray(meta.enumValues) ? meta.enumValues.length > 0 : Object.keys(meta.enumValues).length > 0)
        if (schemeFilterValues && schemeFilterValues[meta.fieldKey] !== undefined) {
          newValues[meta.fieldKey] = JSON.parse(JSON.stringify(schemeFilterValues[meta.fieldKey]))
        } else if (hasEnum) {
          newValues[meta.fieldKey] = []
        } else {
          switch (meta.fieldType) {
            case 'number':
            case 'currency':
              newValues[meta.fieldKey] = { min: '', max: '' }
              break
            case 'date':
              newValues[meta.fieldKey] = { start: '', end: '' }
              break
            case 'boolean':
              newValues[meta.fieldKey] = ''
              break
            default:
              newValues[meta.fieldKey] = ''
          }
        }
      })
      this.filterValues = newValues
    },

    getElTable() {
      return this.$refs.elTable
    },

    doLayout() {
      this.$nextTick(() => {
        if (this.$refs.elTable) this.$refs.elTable.doLayout()
      })
    },

    handleColumnSortChange(fieldKey, order) {
      this.currentSortBy = order ? fieldKey : ''
      this.currentSortOrder = order
      this.currentPage = 1
      this.fetchData()
    },

    handleColumnSearchChange(fieldKey, value) {
      this.$set(this.columnSearchValues, fieldKey, value)
    },

    handleColumnSearchConfirm() {
      this.currentPage = 1
      this.fetchData()
    },

    handleColumnSearchClear(fieldKey) {
      this.$set(this.columnSearchValues, fieldKey, '')
      this.currentPage = 1
      this.fetchData()
    }
  }
}
</script>

<style scoped>
.dynamic-table {
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: #fff;
  border-radius: 4px;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
}
.dynamic-table >>> .el-table th {
  background: #ecf5ff;
}


.table-toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 0;
  margin-bottom: 0;
  flex-shrink: 0;
}
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.toolbar-left .el-button {
  margin-left: 0;
}
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 4px;
}
.table-main {
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
}
.table-pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
  flex-shrink: 0;
}
.dynamic-table >>> .el-table .summary-row {
  background: #fafafa;
  font-weight: bold;
}
.dynamic-table >>> .el-table .summary-row td {
  background: #fafafa !important;
}
.summary-toggle {
  cursor: pointer;
  color: #409eff;
  font-size: 12px;
  white-space: nowrap;
}
.summary-toggle:hover {
  color: #66b1ff;
}
</style>
