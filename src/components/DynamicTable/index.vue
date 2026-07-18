<template>
  <div class="dynamic-table" v-loading="configLoading">

    <filter-panel
      v-if="activeFilterMetaList.length > 0"
      :filter-meta-list="activeFilterMetaList"
      :filter-values="filterValues"
      :expanded="filterExpanded"
      :filter-schemes="filterSchemes"
      :active-scheme-index="activeSchemeIndex"
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

    <el-table
      ref="elTable"
      :data="tableData"
      :border="border"
      :stripe="stripe"
      :row-key="rowKey"
      :height="computedTableHeight"
      v-loading="tableLoading"

      @selection-change="handleSelectionChange"
      style="width: 100%"
    >
      <el-table-column
        v-if="showSelection"
        type="selection"
        width="50"
        :fixed="getFrozenFixed('__selection')"
        :header-align="headerAlign"
        align="center"
      />

      <el-table-column
        v-if="showIndex"
        type="index"
        label="#"
        width="50"
        :fixed="getFrozenFixed('__index')"
        :header-align="headerAlign"
        align="center"
      />

      <template v-for="fieldKey in frozenLeftColumns">
        <el-table-column
          :key="'frozen-left-' + fieldKey"
          :prop="fieldKey"
          :width="fieldMetaMap[fieldKey] ? fieldMetaMap[fieldKey].width : undefined"
          :min-width="fieldMetaMap[fieldKey] ? fieldMetaMap[fieldKey].minWidth : undefined"
          :align="fieldMetaMap[fieldKey] ? fieldMetaMap[fieldKey].align : 'left'"
          :header-align="headerAlign"
          fixed="left"
          show-overflow-tooltip
        >
          <template slot="header">
            <column-header
              :field-key="fieldKey"
              :field-meta="fieldMetaMap[fieldKey]"
              :column-search-value="columnSearchValues[fieldKey]"
              :current-sort-order="currentSortBy === fieldKey ? currentSortOrder : ''"
              @sort-change="handleColumnSortChange"
              @search-change="handleColumnSearchChange"
              @search-confirm="handleColumnSearchConfirm"
              @search-clear="handleColumnSearchClear"
            />
          </template>
          <template slot-scope="scope">
            <slot
              :name="'column-' + fieldKey"
              :row="scope.row"
              :value="scope.row[fieldKey]"
            >
              {{ formatCellValue(scope.row[fieldKey], fieldMetaMap[fieldKey]) }}
            </slot>
          </template>
        </el-table-column>
      </template>

      <template v-for="fieldKey in normalColumns">
        <el-table-column
          :key="'normal-' + fieldKey"
          :prop="fieldKey"
          :width="fieldMetaMap[fieldKey] ? fieldMetaMap[fieldKey].width : undefined"
          :min-width="fieldMetaMap[fieldKey] ? fieldMetaMap[fieldKey].minWidth : undefined"
          :align="fieldMetaMap[fieldKey] ? fieldMetaMap[fieldKey].align : 'left'"
          :header-align="headerAlign"
          show-overflow-tooltip
        >
          <template slot="header">
            <column-header
              :field-key="fieldKey"
              :field-meta="fieldMetaMap[fieldKey]"
              :column-search-value="columnSearchValues[fieldKey]"
              :current-sort-order="currentSortBy === fieldKey ? currentSortOrder : ''"
              @sort-change="handleColumnSortChange"
              @search-change="handleColumnSearchChange"
              @search-confirm="handleColumnSearchConfirm"
              @search-clear="handleColumnSearchClear"
            />
          </template>
          <template slot-scope="scope">
            <slot
              :name="'column-' + fieldKey"
              :row="scope.row"
              :value="scope.row[fieldKey]"
            >
              {{ formatCellValue(scope.row[fieldKey], fieldMetaMap[fieldKey]) }}
            </slot>
          </template>
        </el-table-column>
      </template>

      <template v-for="fieldKey in frozenRightColumns">
        <el-table-column
          :key="'frozen-right-' + fieldKey"
          :prop="fieldKey"
          :width="fieldMetaMap[fieldKey] ? fieldMetaMap[fieldKey].width : undefined"
          :min-width="fieldMetaMap[fieldKey] ? fieldMetaMap[fieldKey].minWidth : undefined"
          :align="fieldMetaMap[fieldKey] ? fieldMetaMap[fieldKey].align : 'left'"
          :header-align="headerAlign"
          fixed="right"
          show-overflow-tooltip
        >
          <template slot="header">
            <column-header
              :field-key="fieldKey"
              :field-meta="fieldMetaMap[fieldKey]"
              :column-search-value="columnSearchValues[fieldKey]"
              :current-sort-order="currentSortBy === fieldKey ? currentSortOrder : ''"
              @sort-change="handleColumnSortChange"
              @search-change="handleColumnSearchChange"
              @search-confirm="handleColumnSearchConfirm"
              @search-clear="handleColumnSearchClear"
            />
          </template>
          <template slot-scope="scope">
            <slot
              :name="'column-' + fieldKey"
              :row="scope.row"
              :value="scope.row[fieldKey]"
            >
              {{ formatCellValue(scope.row[fieldKey], fieldMetaMap[fieldKey]) }}
            </slot>
          </template>
        </el-table-column>
      </template>

      <el-table-column
        v-if="hasRowActions"
        label="操作"
        :width="actionColumnWidth"
        :fixed="getActionColumnFixed"
        :header-align="headerAlign"
        align="center"
      >
        <template slot-scope="scope">
          <template v-for="(action, idx) in rowActions">
            <el-button
              :key="idx"
              type="text"
              size="mini"
              :style="action.style || {}"
              @click="handleRowAction(action, scope.row)"
            >{{ action.label }}</el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <div class="table-pagination" v-if="showPagination">
      <el-pagination
        :current-page="currentPage"
        :page-sizes="pageSizes"
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
      :filter-fields="filterFields"
      :column-order="columnOrder"
      :filter-schemes="filterSchemes"
      :current-filter-values="filterValues"
      :show-selection="showSelection"
      :show-index="showIndex"
      :show-actions="hasRowActions"
      @confirm="handleConfigChange"
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
    userId: { type: String, required: true },
    fieldMetaList: { type: Array, required: true },
    fetchDataFn: { type: Function, required: true },
    loadConfigFn: { type: Function, default: null },
    saveConfigFn: { type: Function, default: null },
    rowKey: { type: String, default: 'id' },
    border: { type: Boolean, default: true },
    stripe: { type: Boolean, default: true },
    tableHeight: { type: [String, Number], default: undefined },
    maxHeight: { type: [String, Number], default: undefined },
    showSelection: { type: Boolean, default: false },
    showIndex: { type: Boolean, default: false },
    showPagination: { type: Boolean, default: true },
    pageSizes: { type: Array, default: () => [10, 20, 50, 100] },
    headerAlign: { type: String, default: 'center' },
    rowActions: { type: Array, default: () => [] },
    actionColumnWidth: { type: [String, Number], default: 150 }
  },

  data() {
    return {
      showConfigDrawer: false,
      tableData: [],
      tableLoading: false,
      total: 0,
      currentPage: 1,
      pageSize: 10,
      currentSortBy: '',
      currentSortOrder: '',
      selfAdaptiveHeight: 500,
      columnSearchValues: {},
      activeSchemeIndex: -1
    }
  },

  computed: {
    computedTableHeight() {
      if (this.tableHeight) return this.tableHeight
      return this.selfAdaptiveHeight
    },

    hasRowActions() {
      return this.rowActions && this.rowActions.length > 0
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
    }
  },

  created() {
    this.loadConfig().then(() => {
      this.fetchData()
    })
  },

  mounted() {
    this.calcTableHeight()
    this._resizeHandler = () => this.calcTableHeight()
    window.addEventListener('resize', this._resizeHandler)
  },

  beforeDestroy() {
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler)
    }
  },

  methods: {
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
        const params = {
          page: this.currentPage,
          pageSize: this.pageSize,
          filters: mergedFilters,
          sortBy: this.currentSortBy,
          sortOrder: this.currentSortOrder
        }
        const result = await this.fetchDataFn(params)
        this.tableData = result.list || []
        this.total = result.total || 0
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
      this.$emit('selection-change', selection)
    },

    applyFilters() {
      this.currentPage = 1
      this.fetchData()
    },

    resetFilters() {
      this.initFilterValues()
      this.columnSearchValues = {}
      this.currentSortBy = ''
      this.currentSortOrder = ''
      this.activeSchemeIndex = -1
      this.currentPage = 1
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
                if (Object.values(val).some(v => v !== null && v !== undefined && v !== '')) {
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
            if (Object.values(val).some(v => v !== null && v !== undefined && v !== '')) {
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
            if (Object.values(val).some(v => v !== null && v !== undefined && v !== '')) {
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

    calcTableHeight() {
      if (this.tableHeight) return
      this.$nextTick(() => {
        const el = this.$el
        if (!el) return
        const rect = el.getBoundingClientRect()
        const toolbar = el.querySelector('.table-toolbar')
        const pagination = el.querySelector('.table-pagination')
        const filterPanel = el.querySelector('.filter-panel')
        const toolbarH = toolbar ? toolbar.offsetHeight + 12 : 0
        const paginationH = pagination ? pagination.offsetHeight + 12 : 0
        const filterH = filterPanel ? filterPanel.offsetHeight + 12 : 0
        const totalH = rect.height - toolbarH - paginationH - filterH - 32
        this.selfAdaptiveHeight = Math.max(totalH, 200)
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
.table-pagination {
  display: flex;
  justify-content: flex-end;
  padding-top: 12px;
  flex-shrink: 0;
}
</style>
