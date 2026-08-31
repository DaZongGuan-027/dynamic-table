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
      :external-filter-values="columnSearchValues"
      :active-scheme-index="activeSchemeIndex"
      :popper-append-to-body="filterPopperAppendToBody"
      :show-universal-filter="computedShowUniversalFilter"
      @toggle-expand="toggleFilterExpand"
      @apply="applyFilters"
      @reset="resetFilters"
      @apply-scheme="handleApplyScheme"
      @save-scheme="handleSaveScheme"
      @save-enum-filter-text="handleSaveEnumFilterText"
    />

    <div class="table-toolbar">
      <div class="toolbar-left">
        <slot name="toolbar-left"></slot>
      </div>
      <div class="toolbar-right">
        <el-tooltip
          v-if="exportDataFn"
          content="导出"
          placement="top"
          :open-delay="300"
        >
          <el-button
            type="text"
            icon="el-icon-download"
            :loading="exportLoading"
            :disabled="exportConfirming"
            aria-label="导出"
            @click="handleExport"
          />
        </el-tooltip>
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
      <div v-if="dataError" class="table-state table-error-state">
        <slot name="error" :error="dataError" :retry="retry">
          <span>数据加载失败</span>
          <el-button type="text" @click="retry">重试</el-button>
        </slot>
      </div>
      <el-table
        v-else
        ref="elTable"
        :key="tableKey"
        :data="displayData"
        :border="border"
        :stripe="stripe"
        :row-key="getRowKey"
        :row-class-name="getRowClassName"
        :height="computedTableHeight"
        :max-height="computedMaxTableHeight"
        v-loading="tableLoading && !$scopedSlots.loading"

        @selection-change="handleSelectionChange"
        style="width: 100%"
      >
      <template v-for="fieldKey in allColumnOrder">
        <el-table-column
          v-if="fieldKey === selectionFieldKey && hasSelection && isSpecialVisible(fieldKey)"
          :key="fieldKey"
          type="selection"
          :width="columnWidths[fieldKey] || 50"
          :fixed="getFrozenFixed(fieldKey)"
          :header-align="headerAlign"
          align="center"
          :selectable="isRowSelectable"
          :reserve-selection="reserveSelection"
        />
        <el-table-column
          v-else-if="fieldKey === indexFieldKey && hasIndex && isSpecialVisible(fieldKey)"
          :key="fieldKey"
          type="index"
          label="#"
          :width="columnWidths[fieldKey] || 50"
          :fixed="getFrozenFixed(fieldKey)"
          :header-align="headerAlign"
          align="center"
        >
          <template slot-scope="scope">
            <span v-if="scope.row.__isSummaryRow"></span>
            <span v-else>{{ scope.$index + (computedShowSummary ? 0 : 1) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          v-else-if="fieldKey === actionsFieldKey && hasRowActions && isSpecialVisible(fieldKey)"
          :key="fieldKey"
          label="操作"
          :width="columnWidths[fieldKey] || actionColumnWidth"
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
          :width="columnWidths[fieldKey] || undefined"
          :min-width="(fieldMetaMap[fieldKey] ? fieldMetaMap[fieldKey].width : undefined) || (fieldMetaMap[fieldKey] ? fieldMetaMap[fieldKey].minWidth : undefined)"
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
              <span v-if="isSummaryLabelField(fieldKey)" class="summary-label">当前页合计</span>
              <span v-if="summableFieldKeys.includes(fieldKey)" class="summary-value">{{ _formatCurrency(scope.row[fieldKey]) }}</span>
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
      <template slot="empty">
        <slot name="empty">暂无数据</slot>
      </template>
    </el-table>
      <div v-if="tableLoading && $scopedSlots.loading" class="table-state table-loading-state">
        <slot name="loading"></slot>
      </div>
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
import {
  buildExportFields,
  getMinimumPageSize,
  getSelectionKey,
  hasActiveFilterValue,
  isAbortError,
  normalizeInFilterValue,
  normalizeTableResponse,
  reconcileReservedSelection
} from './utils/tableUtils.mjs'

export default {
  name: 'DynamicTable',

  components: {
    FilterPanel,
    ConfigDrawer,
    ColumnHeader
  },

  mixins: [useTableConfig, useFilter],

  props: {
    fetchDataFn: { type: Function, required: true },
    dataResponseAdapter: { type: Function, default: null },
    exportDataFn: { type: Function, default: null },
    dataErrorHandler: { type: Function, default: null },
    exportFileName: { type: String, default: '表格数据' },
    rowKey: { type: String, default: 'id' },
    reserveSelection: { type: Boolean, default: false },
    border: { type: Boolean, default: true },
    stripe: { type: Boolean, default: true },
    tableHeight: { type: [String, Number], default: undefined },
    maxHeight: { type: [String, Number], default: undefined },

    showPagination: { type: Boolean, default: true },
    pageSizes: { type: Array, default: () => [10, 50, 100, 500] },
    headerAlign: { type: String, default: 'center' },

    actionColumnWidth: { type: [String, Number], default: 150 },

    defaultVisibleFields: { type: Array, default: () => [] },

    filterPopperAppendToBody: { type: Boolean, default: true },
    pageParamName: { type: String, default: 'page' },
    pageSizeParamName: { type: String, default: 'pageSize' },
    showSummary: { type: Boolean, default: false },

    showUniversalFilter: { type: Boolean, default: true }
  },

  data() {
    return {
      showConfigDrawer: false,
      tableData: [],
      tableLoading: false,
      exportLoading: false,
      exportConfirming: false,
      dataError: null,
      selectedRows: [],
      reservedSelectionMap: {},
      restoringSelection: false,
      requestController: null,
      componentReady: false,
      reloadSequence: 0,
      tableKey: 0,
      total: 0,
      currentPage: 1,
      pageSize: 10,
      currentSortBy: '',
      currentSortOrder: '',

      columnSearchValues: {},
      activeSchemeIndex: -1,
      lastCustomFilterValues: {},
      fetchSequence: 0
    }
  },

  computed: {
    computedTableHeight() {
      if (this.tableHeight) return this.tableHeight
      return '100%'
    },

    computedMaxTableHeight() {
      return this.maxHeight || undefined
    },

    computedShowSummary() {
      const saved = this.configuredShowSummary
      return saved !== undefined ? saved : this.showSummary
    },

    computedShowUniversalFilter() {
      const saved = this.configuredShowUniversalFilter
      return saved !== undefined ? saved : this.showUniversalFilter
    },

    computedPageSizes() {
      const saved = this.configuredPageSizes
      return saved && saved.length > 0 ? saved : this.pageSizes
    },

    computedPageSize() {
      const ps = this.computedPageSizes
      if (ps && ps.length > 0) return getMinimumPageSize(ps, this.pageSize)
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

    selectionFieldKey() {
      const meta = this.fieldMetaList.find(f => f.fieldType === 'selection')
      return meta ? meta.fieldKey : ''
    },

    hasIndex() {
      return this.fieldMetaList.some(f => f.fieldType === 'index')
    },

    indexFieldKey() {
      const meta = this.fieldMetaList.find(f => f.fieldType === 'index')
      return meta ? meta.fieldKey : ''
    },

    actionsFieldKey() {
      const meta = this.fieldMetaList.find(f => f.fieldType === 'actions')
      return meta ? meta.fieldKey : ''
    },

    getRowActions() {
      const actionsMeta = this.fieldMetaList.find(f => f.fieldType === 'actions')
      return actionsMeta && actionsMeta.actions ? actionsMeta.actions : []
    },

    specialKeys() {
      return this.fieldMetaList
        .filter(f => ['selection', 'index', 'actions'].includes(f.fieldType))
        .map(f => f.fieldKey)
    },

    allColumnOrder() {
      const specialInOrder = this.columnOrder.filter(k => this.specialKeys.includes(k))
      const specialNotInOrder = this.specialKeys.filter(k => !specialInOrder.includes(k))
      const prefixSpecials = specialNotInOrder.filter(k => k !== this.actionsFieldKey)
      const suffixSpecials = specialNotInOrder.filter(k => k === this.actionsFieldKey)
      const hasLeftFrozen = this.frozenLeftColumns.length > 0
      const unfrozenPrefix = prefixSpecials.filter(k => !this.frozenFields.includes(k))
      const frozenPrefix = prefixSpecials.filter(k => this.frozenFields.includes(k))
      if (hasLeftFrozen) {
        return [...frozenPrefix, ...this.columnOrder, ...unfrozenPrefix, ...suffixSpecials]
      }
      return [...prefixSpecials, ...this.columnOrder, ...suffixSpecials]
    },

    getActionColumnFixed() {
      const actionKey = this.actionsFieldKey
      if (!actionKey || !this.frozenFields.includes(actionKey)) return false
      const pos = this.frozenPositions[actionKey]
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

    displayData() {
      if (!this.computedShowSummary || this.tableData.length === 0) return this.tableData
      const summaryRow = { __isSummaryRow: true, __summaryType: 'page' }
      this.summableFieldKeys.forEach(key => {
        summaryRow[key] = this.pageSummaryData[key] || 0
      })
      return [summaryRow, ...this.tableData]
    }
  },

  watch: {
    menuId() {
      this.reload()
    },
    fieldMetaList: {
      deep: true,
      handler() {
        if (!this.componentReady) return
        this.reconcileConfigWithFields()
        this.$nextTick(() => { this.doLayout(); this.fetchData() })
      }
    },
    pageSizes() {
      if (!this.componentReady || this.configuredPageSizes) return
      this.pageSize = this.computedPageSize
      this.currentPage = 1
      this.fetchData()
    },
    defaultFilterFields() {
      if (!this.componentReady || this.config) return
      this.filterFields = this._getDefaultFilterFields()
      this.initFilterValues(true)
      this.fetchData()
    },
    defaultVisibleFields() {
      if (!this.componentReady || this.config) return
      this.visibleFields = this._getDefaultVisibleFields()
      this.doLayout()
    },
    reserveSelection(value) {
      if (!value) {
        this.clearSelection()
      } else {
        const map = {}
        this.selectedRows.forEach(row => { map[this.getSelectionKey(row)] = row })
        this.reservedSelectionMap = map
        this.restoreReservedSelection()
      }
    },
    rowKey() {
      this.clearSelection()
    }
  },

  created() {
    this.pageSize = this.computedPageSize
    this.reload()
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
    if (this.requestController) this.requestController.abort()
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

    isSummaryLabelField(fieldKey) {
      const visibleDataFields = this.orderedVisibleFields.filter(k => this.isDataField(k))
      const firstKey = visibleDataFields.find(k => {
        return !this.summableFieldKeys.includes(k)
      }) || visibleDataFields[0]
      return fieldKey === firstKey
    },

    async fetchData() {
      const requestId = ++this.fetchSequence
      if (this.requestController) this.requestController.abort()
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
      this.requestController = controller
      this.tableLoading = true
      this.dataError = null
      try {
        const params = {
          [this.pageParamName]: this.currentPage,
          [this.pageSizeParamName]: this.pageSize,
          filters: this.buildRequestFilters(),
          sortBy: this.currentSortBy,
          sortOrder: this.currentSortOrder
        }
        const response = await this.fetchDataFn(params, { signal: controller ? controller.signal : undefined })
        if (requestId !== this.fetchSequence) return
        const adaptedResult = this.dataResponseAdapter
          ? this.dataResponseAdapter(response)
          : normalizeTableResponse(response)
        const result = adaptedResult || {}
        this.tableData = Array.isArray(result.list) ? result.list : []
        this.total = Number.isFinite(Number(result.total)) ? Number(result.total) : 0

        this.$nextTick(() => {
          this.$nextTick(() => {
            if (this.$refs.elTable) this.$refs.elTable.doLayout()
            this.restoreReservedSelection()
          })
        })
      } catch (e) {
        if (requestId !== this.fetchSequence) return
        if (isAbortError(e)) return
        console.error('获取表格数据失败:', e)
        this.tableData = []
        this.total = 0
        this.dataError = e
        this.$emit('data-error', e)
        if (this.dataErrorHandler) {
          try { this.dataErrorHandler(e) } catch (handlerError) { console.error('dataErrorHandler 执行失败:', handlerError) }
        }
      } finally {
        if (requestId === this.fetchSequence) {
          this.tableLoading = false
          if (this.requestController === controller) this.requestController = null
        }
      }
    },

    buildRequestFilters() {
      const mergedFilters = { ...this.activeFilters }
      Object.keys(this.columnSearchValues).forEach(key => {
        const val = this.columnSearchValues[key]
        if (val !== null && val !== undefined && val !== '') mergedFilters[key] = val
      })
      if (this.lastCustomFilterValues) {
        Object.keys(this.lastCustomFilterValues).forEach(key => {
          mergedFilters[key] = this.lastCustomFilterValues[key]
        })
      }
      const requestFilters = {}
      Object.keys(mergedFilters).forEach(key => {
        const value = this.normalizeFilterValueForRequest(key, mergedFilters[key])
        if (hasActiveFilterValue(value)) requestFilters[key] = value
      })
      return requestFilters
    },

    getExportFields() {
      return buildExportFields(this.allColumnOrder, this.orderedVisibleFields, this.fieldMetaMap)
    },

    async handleExport() {
      if (!this.exportDataFn || this.exportLoading || this.exportConfirming) return
      const fields = this.getExportFields()
      if (fields.length === 0) {
        this.$message.warning('当前没有可导出的字段')
        return
      }
      this.exportConfirming = true
      try {
        await this.$confirm('将根据表头配置进行导出，是否确认？', '提示', {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning'
        })
      } catch (e) {
        return
      } finally {
        this.exportConfirming = false
      }
      this.exportLoading = true
      try {
        const result = await this.exportDataFn({
          menuId: this.menuId,
          fields,
          filters: this.buildRequestFilters(),
          sortBy: this.currentSortBy,
          sortOrder: this.currentSortOrder
        })
        this.downloadExportResult(result)
        this.$emit('export-success', result)
      } catch (e) {
        console.error('导出表格数据失败:', e)
        this.$message.error('导出失败')
        this.$emit('export-error', e)
      } finally {
        this.exportLoading = false
      }
    },

    downloadExportResult(result) {
      const response = result && result.data instanceof Blob ? result : null
      const payload = response ? response.data : result
      if (payload && payload.downloadUrl) {
        this.triggerDownload(payload.downloadUrl, payload.fileName || this.exportFileName)
        return
      }
      const blob = payload && payload.blob instanceof Blob ? payload.blob : payload
      if (!(blob instanceof Blob)) throw new Error('exportDataFn 必须返回 Blob、{ blob } 或 { downloadUrl }')
      const headerName = response ? this.getFileNameFromHeaders(response.headers) : ''
      const fileName = payload && payload.fileName ? payload.fileName : (headerName || this.resolveExportFileName(blob))
      const objectUrl = URL.createObjectURL(blob)
      this.triggerDownload(objectUrl, fileName)
      setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
    },

    getFileNameFromHeaders(headers) {
      if (!headers) return ''
      const disposition = headers['content-disposition'] || headers['Content-Disposition'] || ''
      const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i)
      if (utf8Match) {
        try { return decodeURIComponent(utf8Match[1]) } catch (e) { return utf8Match[1] }
      }
      const match = disposition.match(/filename="?([^";]+)"?/i)
      return match ? match[1] : ''
    },

    resolveExportFileName(blob) {
      if (/\.[a-z0-9]+$/i.test(this.exportFileName)) return this.exportFileName
      const type = blob.type || ''
      if (type.includes('csv')) return this.exportFileName + '.csv'
      if (type.includes('spreadsheetml')) return this.exportFileName + '.xlsx'
      return this.exportFileName
    },

    triggerDownload(url, fileName) {
      const link = document.createElement('a')
      link.href = url
      if (fileName) link.download = fileName
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },

    formatCellValue(value, meta) {
      if (!meta) return value
      if (value === null || value === undefined || value === '') return ''
      let formattedValue = value
      const enumList = this._normalizeEnumValues(meta.enumValues)
      if (enumList.length > 0) {
        const found = enumList.find(v => String(v.value) === String(value))
        if (found) formattedValue = found.label
      }
      if (meta.fieldType === 'currency' && formattedValue === value) {
        formattedValue = this._formatCurrency(value)
      }
      if (meta.fieldType === 'date') {
        formattedValue = this._formatDate(value, meta.dateFormat)
      }
      if (meta.formatter && typeof meta.formatter === 'function') {
        return meta.formatter(formattedValue)
      }
      return formattedValue
    },

    isSpecialVisible(key) {
      if (this.visibleFields.includes(key)) return true
      if (!this.columnOrder.includes(key) && !this.visibleFields.includes(key)) return true
      return false
    },

    isDataField(key) {
      const meta = this.fieldMetaMap[key]
      return !!meta && !['selection', 'index', 'actions'].includes(meta.fieldType)
    },

    _formatCurrency(value) {
      const num = Number(value)
      if (isNaN(num)) return value
      return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    },

    _formatDate(value, dateFormat) {
      if (!value) return ''
      const fmt = dateFormat || 'yyyy-MM-dd'
      const literalMatch = String(value).match(/^(\d{4})-(\d{2})(?:-(\d{2}))?(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/)
      let parts
      if (literalMatch) {
        parts = literalMatch.slice(1)
        if (!parts[2]) parts[2] = '01'
      } else {
        const d = new Date(value)
        if (isNaN(d.getTime())) return value
        const pad = n => n < 10 ? '0' + n : String(n)
        parts = [String(d.getFullYear()), pad(d.getMonth() + 1), pad(d.getDate()), pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())]
      }
      return fmt
        .replace('yyyy', parts[0])
        .replace('MM', parts[1])
        .replace('dd', parts[2])
        .replace('HH', parts[3] || '00')
        .replace('mm', parts[4] || '00')
        .replace('ss', parts[5] || '00')
    },

    _normalizeEnumValues(enumValues) {
      if (!enumValues) return []
      if (Array.isArray(enumValues)) return enumValues
      if (typeof enumValues === 'object') {
        return Object.keys(enumValues).map(key => ({ label: enumValues[key], value: key }))
      }
      return []
    },

    normalizeFilterValueForRequest(fieldKey, value) {
      const normalizedInValue = normalizeInFilterValue(value)
      if (normalizedInValue !== value) return normalizedInValue
      const meta = this.fieldMetaMap[fieldKey]
      if (
        meta &&
        meta.fieldType === 'date' &&
        meta.dateFilterType === 'month' &&
        meta.monthToDateRange === true &&
        value && typeof value === 'object' && !Array.isArray(value)
      ) {
        if (Array.isArray(value.range) && value.range.length === 2) {
          return this._buildDateRangeFilter(meta, value.range)
        }
        if (/^\d{4}-\d{2}$/.test(String(value.value || ''))) {
          return this._buildDateRangeFilter(meta, [value.value, value.value])
        }
      }
      return value
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
      if (this.restoringSelection) return
      if (!this.reserveSelection) {
        this.selectedRows = filtered
        this.$emit('selection-change', filtered)
        return
      }
      this.reservedSelectionMap = reconcileReservedSelection(
        this.reservedSelectionMap,
        this.tableData,
        filtered,
        this.rowKey
      )
      this.selectedRows = Object.keys(this.reservedSelectionMap).map(key => this.reservedSelectionMap[key])
      this.$emit('selection-change', [...this.selectedRows])
    },

    getSelectionKey(row) {
      return getSelectionKey(row, this.rowKey)
    },

    restoreReservedSelection() {
      if (!this.reserveSelection || !this.$refs.elTable) return
      this.restoringSelection = true
      this.tableData.forEach(row => {
        if (this.reservedSelectionMap[this.getSelectionKey(row)]) {
          this.$refs.elTable.toggleRowSelection(row, true)
        }
      })
      this.$nextTick(() => { this.restoringSelection = false })
    },

    getSelection() {
      return [...this.selectedRows]
    },

    clearSelection() {
      this.selectedRows = []
      this.reservedSelectionMap = {}
      if (this.$refs.elTable) this.$refs.elTable.clearSelection()
    },

    toggleRowSelection(row, selected) {
      if (this.$refs.elTable) this.$refs.elTable.toggleRowSelection(row, selected)
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
      this.lastCustomFilterValues = {}
      if (this.$refs.filterPanel) this.$refs.filterPanel.resetCustomFilters()
      this.scrollFilterToTop()
      if (this.deleteConfigFn) {
        this.deleteConfigFn(this.menuId).catch(() => {})
      }
      this.config = null
      this.tableKey++
      this.$nextTick(() => {
        this.doLayout()
        this.fetchData()
      })
      this.$message.success('已还原为默认配置')
    },

    applyFilters(customFilterValues) {
      this._saveCachedFilters()
      this.lastCustomFilterValues = customFilterValues || {}
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
      this.lastCustomFilterValues = {}
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
      const mergedFilterValues = this.getMergedFilterValues(scheme.filterValues)
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

    handleSaveEnumFilterText(textMap) {
      this._saveCachedEnumFilterText(textMap)
    },

    getMergedFilterValues(currentPanelValues) {
      const merged = {}
      const mergeValues = values => Object.keys(values || {}).forEach(key => {
        const val = values[key]
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
      mergeValues(this.filterValues)
      mergeValues(this.columnSearchValues)
      mergeValues(this.lastCustomFilterValues)
      if (currentPanelValues) mergeValues(currentPanelValues)
      return merged
    },

    applySchemeValues(schemeFilterValues) {
      const newValues = {}
      this.activeFilterMetaList.forEach(meta => {
        const hasEnum = meta.enumValues && (Array.isArray(meta.enumValues) ? meta.enumValues.length > 0 : Object.keys(meta.enumValues).length > 0)
        if (schemeFilterValues && schemeFilterValues[meta.fieldKey] !== undefined && this._isCachedValueValid(meta, schemeFilterValues[meta.fieldKey])) {
          newValues[meta.fieldKey] = JSON.parse(JSON.stringify(schemeFilterValues[meta.fieldKey]))
        } else if (hasEnum) {
          newValues[meta.fieldKey] = meta.filterMultiple === false ? '' : []
        } else {
          switch (meta.fieldType) {
            case 'number':
            case 'currency':
              newValues[meta.fieldKey] = { min: '', max: '' }
              break
            case 'date':
              const dft = meta.dateFilterType || 'daterange'
              if (dft === 'daterange' || dft === 'monthrange' || (dft === 'month' && meta.monthToDateRange === true)) {
                newValues[meta.fieldKey] = { range: null }
              } else {
                newValues[meta.fieldKey] = { value: null }
              }
              break
            case 'boolean':
              newValues[meta.fieldKey] = ''
              break
            default:
              newValues[meta.fieldKey] = { operator: 'contains', value: '' }
          }
        }
      })
      this.filterValues = newValues
    },

    getElTable() {
      return this.$refs.elTable
    },

    refresh() {
      return this.fetchData()
    },

    retry() {
      return this.fetchData()
    },

    getFilters() {
      return JSON.parse(JSON.stringify(this.buildRequestFilters()))
    },

    getTableConfig() {
      return this._buildConfig()
    },

    async reload() {
      const reloadId = ++this.reloadSequence
      this.fetchSequence++
      if (this.requestController) {
        this.requestController.abort()
        this.requestController = null
      }
      this.dataError = null
      this.currentPage = 1
      this.currentSortBy = ''
      this.currentSortOrder = ''
      this.columnSearchValues = {}
      this.lastCustomFilterValues = {}
      this.activeSchemeIndex = -1
      this.clearSelection()
      this.config = null
      await this.loadConfig()
      if (reloadId !== this.reloadSequence) return
      this.initFilterValues(true)
      this.componentReady = true
      return this.fetchData()
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
  position: relative;
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
}
.table-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 160px;
  color: #909399;
}
.table-loading-state {
  position: absolute;
  inset: 0;
  z-index: 2;
  background: rgba(255, 255, 255, 0.82);
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
.summary-label {
  font-size: 12px;
  color: #606266;
  white-space: nowrap;
}
.summary-label + .summary-value {
  margin-left: 6px;
}
</style>
