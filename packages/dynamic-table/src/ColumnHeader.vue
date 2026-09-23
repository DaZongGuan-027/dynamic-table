<template>
  <div class="column-header">
      <el-popover
        v-model="popoverVisible"
        placement="bottom-start"
        :width="popoverWidth"
        trigger="click"
        popper-class="column-header-popover"
        @show="handlePopoverShow"
      >
      <div class="header-menu">
        <div
          v-if="fieldMeta.sortable"
          class="menu-item"
          :class="{ 'is-active': currentSort }"
          @click="handleSortClick"
        >
          <i :class="sortIcon"></i>
          <span>{{ sortLabel }}</span>
        </div>
        <div class="menu-item" :class="{ 'is-active': hasSearchValue }" @click="toggleSearch">
          <i class="el-icon-search"></i>
          <span>搜索</span>
        </div>
        <div
          v-if="hasSearchValue || currentSort"
          class="menu-item"
          @click="handleReset"
        >
          <i class="el-icon-refresh-left"></i>
          <span>重置</span>
        </div>
      </div>

      <div v-if="showSearch" class="search-area" @click.stop>
        <div v-if="hasEnumOptions" class="enum-search">
          <el-input
            v-model="enumFilterText"
            size="mini"
            placeholder="过滤"
            clearable
            style="width: 100px; min-width: 100px; max-width: 100px; flex-shrink: 0"
            @input="handleEnumFilterInput"
          />
          <div class="enum-select-wrapper" style="flex: 1; min-width: 0; position: relative">
            <el-select
              v-model="searchValue"
              size="mini"
              :placeholder="'选择' + fieldMeta.fieldLabel"
              :multiple="enumMultiple"
              clearable
              class="enum-count-select"
              :loading="enumLoading"
              loading-text="正在加载选项..."
              :popper-append-to-body="popperAppendToBody"
              style="width: 100%"
              @visible-change="handleEnumVisibleChange"
            >
            <el-option
              v-if="enumMultiple && filteredEnumOptions.length > 1"
              label="全选"
              value="__all__"
              @click.native="handleEnumSelectAll($event)"
            />
            <el-option
              v-for="opt in filteredEnumOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
            <el-option
              v-if="enumLoadError && !enumLoading"
              label="加载失败，请重新打开重试"
              value="__enum_load_error__"
              disabled
            />
            </el-select>
            <span
              v-if="enumMultiple && searchValue && searchValue.length"
              class="enum-selected-count"
            >已选{{ searchValue.length }}项</span>
          </div>
          <el-button size="mini" icon="el-icon-search" type="primary" @click="handleSearchConfirm"></el-button>
        </div>
        <div v-else-if="fieldMeta.fieldType === 'string' || !fieldMeta.fieldType || (fieldMeta.fieldType === 'enum' && !hasEnumOptions)" class="compare-search">
          <el-select
            v-model="searchValue.operator"
            size="mini"
            placeholder="条件"
            :popper-append-to-body="popperAppendToBody"
            style="width: 100px; flex-shrink: 0"
          >
            <el-option label="等于" value="eq" />
            <el-option label="不等于" value="neq" />
            <el-option label="包含" value="contains" />
            <el-option label="多个" value="in" />
            <el-option label="不包含" value="notContains" />
            <el-option label="开头是" value="startsWith" />
            <el-option label="结尾是" value="endsWith" />
          </el-select>
          <el-input
            v-model="searchValue.value"
            size="mini"
            :placeholder="'输入' + fieldMeta.fieldLabel"
            clearable
            @keyup.enter.native="handleSearchConfirm"
          />
          <el-button size="mini" icon="el-icon-search" type="primary" @click="handleSearchConfirm"></el-button>
        </div>
        <div v-else-if="fieldMeta.fieldType === 'number' || fieldMeta.fieldType === 'currency'" class="compare-search">
          <el-select
            v-model="searchValue.operator"
            size="mini"
            placeholder="条件"
            :popper-append-to-body="popperAppendToBody"
            style="width: 100px; flex-shrink: 0"
          >
            <el-option label="等于" value="eq" />
            <el-option label="不等于" value="neq" />
            <el-option label="大于" value="gt" />
            <el-option label="小于" value="lt" />
            <el-option label="大于等于" value="gte" />
            <el-option label="小于等于" value="lte" />
          </el-select>
          <el-input
            v-model="searchValue.value"
            size="mini"
            :placeholder="'输入' + fieldMeta.fieldLabel"
            clearable
            @input="searchValue.value = searchValue.value.replace(/[^\d.-]/g, '').replace(/(\..*)\./g, '$1')"
            @keyup.enter.native="handleSearchConfirm"
          />
          <el-button size="mini" icon="el-icon-search" type="primary" @click="handleSearchConfirm"></el-button>
        </div>
         <div v-else-if="fieldMeta.fieldType === 'date'" class="date-search">
          <el-date-picker
            v-if="dateFilterType === 'daterange'"
            v-model="searchValue.range"
            type="daterange"
            size="mini"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="yyyy-MM-dd"
            clearable
            :picker-options="datePickerOptions"
            :append-to-body="popperAppendToBody"
            style="width: 100%"
          />
          <el-date-picker
            v-else-if="dateFilterType === 'monthrange'"
            v-model="searchValue.range"
            type="monthrange"
            size="mini"
            range-separator="至"
            start-placeholder="开始月份"
            end-placeholder="结束月份"
            value-format="yyyy-MM"
            clearable
            :picker-options="monthPickerOptions"
            :append-to-body="popperAppendToBody"
            style="width: 100%"
          />
          <el-date-picker
            v-else-if="dateFilterType === 'month'"
            :value="singleMonthValue"
            type="month"
            size="mini"
            placeholder="选择月份"
            value-format="yyyy-MM"
            clearable
            :append-to-body="popperAppendToBody"
            style="width: 100%"
            @input="handleSingleMonthInput"
          />
          <el-date-picker
            v-else-if="dateFilterType === 'date'"
            v-model="searchValue.value"
            type="date"
            size="mini"
            placeholder="选择日期"
            value-format="yyyy-MM-dd"
            clearable
            :append-to-body="popperAppendToBody"
            style="width: 100%"
          />
          <el-button size="mini" icon="el-icon-search" type="primary" @click="handleSearchConfirm"></el-button>
        </div>
        <div v-else-if="fieldMeta.fieldType === 'boolean'" class="bool-search">
          <el-select
            v-model="searchValue"
            size="mini"
            :placeholder="'选择' + fieldMeta.fieldLabel"
            clearable
            :popper-append-to-body="popperAppendToBody"
            style="width: 100%"
            @change="handleSearchConfirm"
          >
            <el-option label="是" :value="true" />
            <el-option label="否" :value="false" />
          </el-select>
        </div>
      </div>

      <span slot="reference" class="header-label">
        <span class="label-text">{{ fieldMeta.fieldLabel }}</span>
        <i v-if="currentSort === 'ascending'" class="el-icon-caret-top sort-icon active"></i>
        <i v-else-if="currentSort === 'descending'" class="el-icon-caret-bottom sort-icon active"></i>
        <i v-if="hasSearchValue && !currentSort" class="el-icon-search search-indicator"></i>
      </span>
    </el-popover>
  </div>
</template>

<script>
import { orderEnumOptionsWithSelected } from './utils/tableUtils.mjs'

export default {
  name: 'ColumnHeader',

  props: {
    fieldKey: { type: String, required: true },
    fieldMeta: { type: Object, required: true },
    columnSearchValue: { type: [String, Number, Boolean, Object, Array], default: '' },
    currentSortOrder: { type: String, default: '' },
    popperAppendToBody: { type: Boolean, default: true },
    enumOptions: { type: Array, default: null },
    enumLoading: { type: Boolean, default: false },
    enumLoadError: { type: [Error, Object], default: null }
  },

  data() {
    return {
      popoverVisible: false,
      showSearch: false,
      searchValue: '',
      enumFilterText: '',
      enumOpenSelection: null,
      selectedEnumOptionCache: [],
      datePickerOptions: {
        shortcuts: [
          {
            text: '本月',
            onClick(picker) {
              const start = new Date()
              start.setDate(1)
              const end = new Date()
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '上月',
            onClick(picker) {
              const start = new Date()
              start.setMonth(start.getMonth() - 1)
              start.setDate(1)
              const end = new Date()
              end.setDate(0)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '近三个月',
            onClick(picker) {
              const end = new Date()
              const start = new Date()
              start.setMonth(start.getMonth() - 3)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '本年',
            onClick(picker) {
              const start = new Date()
              start.setMonth(0)
              start.setDate(1)
              const end = new Date()
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '重置',
            onClick(picker) {
              picker.$emit('pick', [])
            }
          }
        ]
      },
      monthPickerOptions: {
        shortcuts: [
          {
            text: '本月',
            onClick(picker) {
              const start = new Date()
              start.setDate(1)
              const end = new Date()
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '上月',
            onClick(picker) {
              const start = new Date()
              start.setMonth(start.getMonth() - 1)
              start.setDate(1)
              const end = new Date()
              end.setDate(0)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '本季度',
            onClick(picker) {
              const now = new Date()
              const quarter = Math.floor(now.getMonth() / 3)
              const start = new Date(now.getFullYear(), quarter * 3, 1)
              const end = new Date(now.getFullYear(), quarter * 3 + 3, 0)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '本年',
            onClick(picker) {
              const start = new Date()
              start.setMonth(0)
              start.setDate(1)
              const end = new Date()
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '重置',
            onClick(picker) {
              picker.$emit('pick', [])
            }
          }
        ]
      }
    }
  },

  watch: {
    popoverVisible(val) {
      if (val) {
        this.$nextTick(() => {
          this.showSearch = this.hasSearchValue
          this.initSearchValue()
        })
      }
    }
  },

  computed: {
    dateFilterType() {
      if (this.fieldMeta && this.fieldMeta.dateFilterType) return this.fieldMeta.dateFilterType
      return 'daterange'
    },

    monthToDateRange() {
      return this.fieldMeta && this.fieldMeta.monthToDateRange === true
    },

    singleMonthValue() {
      if (this.monthToDateRange) {
        const range = this.searchValue && this.searchValue.range
        return Array.isArray(range) && range.length === 2 ? String(range[0]).slice(0, 7) : null
      }
      return this.searchValue && this.searchValue.value || null
    },

    filteredEnumOptions() {
      const all = this.normalizedEnumValues
      const q = (this.enumFilterText || '').toLowerCase()
      if (!q) return orderEnumOptionsWithSelected(all, this.enumOpenSelection)
      return all.filter(o => (o.label + '').toLowerCase().includes(q) || (o.value + '').toLowerCase().includes(q))
    },

    currentSort() {
      return this.currentSortOrder || ''
    },

    sortIcon() {
      if (this.currentSort === 'ascending') return 'el-icon-sort-up'
      if (this.currentSort === 'descending') return 'el-icon-sort-down'
      return 'el-icon-sort'
    },

    sortLabel() {
      if (this.currentSort === 'ascending') return '升序排列'
      if (this.currentSort === 'descending') return '降序排列'
      return '排序'
    },

    hasSearchValue() {
      if (this.columnSearchValue === null || this.columnSearchValue === undefined) return false
      if (typeof this.columnSearchValue === 'object' && !Array.isArray(this.columnSearchValue)) {
        if (this.columnSearchValue.value !== undefined) {
          return this.columnSearchValue.value !== null && this.columnSearchValue.value !== undefined && this.columnSearchValue.value !== ''
        }
        if (this.columnSearchValue.range !== undefined) {
          return Array.isArray(this.columnSearchValue.range) && this.columnSearchValue.range.length > 0
        }
        return Object.keys(this.columnSearchValue).some(
          k => this.columnSearchValue[k] !== null && this.columnSearchValue[k] !== undefined && this.columnSearchValue[k] !== ''
        )
      }
      if (Array.isArray(this.columnSearchValue)) return this.columnSearchValue.length > 0
      return this.columnSearchValue !== ''
    },

    popoverWidth() {
      return Math.max(280, Math.floor(window.innerWidth * 0.3))
    },

    normalizedEnumValues() {
      const raw = this.enumOptions !== null
        ? this.enumOptions
        : this._normalizeEnumValues(this.fieldMeta.enumValues)
      const selected = Array.isArray(this.searchValue)
        ? this.searchValue
        : (this.searchValue !== '' && this.searchValue !== null && this.searchValue !== undefined ? [this.searchValue] : [])
      const selectedSet = new Set(selected)
      const cached = this.selectedEnumOptionCache.filter(option => selectedSet.has(option.value))
      const cachedValues = new Set(cached.map(option => option.value))
      return cached.concat(raw.filter(option => !cachedValues.has(option.value)))
    },

    enumMultiple() {
      return !this.fieldMeta || this.fieldMeta.filterMultiple !== false
    },

    hasEnumOptions() {
      return typeof this.fieldMeta.loadEnumOptions === 'function' || this.normalizedEnumValues.length > 0


    }
  },

  methods: {
    _normalizeEnumValues(enumValues) {
      if (!enumValues) return []
      if (Array.isArray(enumValues)) return enumValues
      if (typeof enumValues === 'object') {
        return Object.keys(enumValues).map(key => ({ label: enumValues[key], value: key }))
      }
      return []
    },

    buildSingleMonthRange(month) {
      if (!/^\d{4}-\d{2}$/.test(String(month || ''))) return null
      const parts = String(month).split('-').map(Number)
      const lastDay = new Date(parts[0], parts[1], 0).getDate()
      const pad = n => n < 10 ? '0' + n : String(n)
      return [month + '-01', month + '-' + pad(lastDay)]
    },

    handleSingleMonthInput(month) {
      this.searchValue = this.monthToDateRange
        ? { range: month ? this.buildSingleMonthRange(month) : null }
        : { value: month || null }
    },

    handleEnumSelectAll(e) {
      e.stopPropagation()
      const filtered = this.filteredEnumOptions
      const filteredValues = filtered.map(o => o.value)
      const current = this.searchValue || []
      const isAllSelected = filteredValues.length > 0 && filteredValues.every(v => current.includes(v))
      this.searchValue = isAllSelected ? [] : [...filteredValues]
    },
    handleEnumVisibleChange(visible) {
      if (visible) {
        if (this.enumMultiple) {
          this.enumOpenSelection = Array.isArray(this.searchValue) ? [...this.searchValue] : []
        }
        this.rememberSelectedEnumOptions()
      } else {
        this.enumOpenSelection = null
      }
      if (visible && typeof this.fieldMeta.loadEnumOptions === 'function') {
        this.$emit('request-enum-options', { meta: this.fieldMeta, keyword: this.enumFilterText || '', selectedValues: this.searchValue })
      }
    },
    handleEnumFilterInput() {
      if (this.fieldMeta.enumRemote === true && typeof this.fieldMeta.loadEnumOptions === 'function') {
        this.rememberSelectedEnumOptions()
        this.$emit('search-enum-options', { meta: this.fieldMeta, keyword: this.enumFilterText || '', selectedValues: this.searchValue })
      }
    },
    rememberSelectedEnumOptions() {
      const selected = Array.isArray(this.searchValue)
        ? this.searchValue
        : (this.searchValue !== '' && this.searchValue !== null && this.searchValue !== undefined ? [this.searchValue] : [])
      if (selected.length === 0) return
      const selectedSet = new Set(selected)
      const raw = this.enumOptions !== null
        ? this.enumOptions
        : this._normalizeEnumValues(this.fieldMeta.enumValues)
      const merged = this.selectedEnumOptionCache.concat(raw)
      const seen = new Set()
      this.selectedEnumOptionCache = merged.filter(option => {
        if (!selectedSet.has(option.value) || seen.has(option.value)) return false
        seen.add(option.value)
        return true
      })
    },
    handlePopoverShow() {
      this.showSearch = this.hasSearchValue
      this.initSearchValue()
    },

    initSearchValue() {
      const meta = this.fieldMeta
      const saved = this.columnSearchValue
      if (this.hasEnumOptions) {
        if (this.enumMultiple) {
          this.searchValue = Array.isArray(saved)
            ? [...saved]
            : (saved !== '' && saved !== null && saved !== undefined ? [saved] : [])
        } else {
          this.searchValue = Array.isArray(saved)
            ? (saved.length > 0 ? saved[0] : '')
            : (saved !== null && saved !== undefined ? saved : '')
        }
      } else if (meta.fieldType === 'string' || !meta.fieldType || (meta.fieldType === 'enum' && !this.hasEnumOptions)) {
        this.searchValue = (saved && typeof saved === 'object' && !Array.isArray(saved))
          ? { operator: saved.operator || 'contains', value: saved.value != null ? saved.value : '' }
          : { operator: 'contains', value: '' }
      } else if (meta.fieldType === 'number' || meta.fieldType === 'currency') {
        this.searchValue = (saved && typeof saved === 'object' && !Array.isArray(saved))
          ? { operator: saved.operator || 'eq', value: saved.value != null ? saved.value : '' }
          : { operator: 'eq', value: '' }
      } else if (meta.fieldType === 'date') {
        const dft = this.dateFilterType
        if (dft === 'daterange' || dft === 'monthrange' || (dft === 'month' && this.monthToDateRange)) {
          this.searchValue = (saved && typeof saved === 'object' && !Array.isArray(saved))
            ? { range: saved.range || null }
            : { range: null }
        } else {
          this.searchValue = (saved && typeof saved === 'object' && !Array.isArray(saved))
            ? { value: saved.value || null }
            : { value: null }
        }
      } else {
        this.searchValue = saved || ''
      }
    },

    handleSortClick() {
      let newOrder = ''
      if (!this.currentSort || this.currentSort === '') {
        newOrder = 'ascending'
      } else if (this.currentSort === 'ascending') {
        newOrder = 'descending'
      } else {
        newOrder = ''
      }
      this.$emit('sort-change', this.fieldKey, newOrder)
      this.popoverVisible = false
    },

    toggleSearch() {
      this.showSearch = !this.showSearch
      if (this.showSearch) {
        this.$nextTick(() => {
          if (this.$refs.searchInput) {
            this.$refs.searchInput.focus()
          }
        })
      }
    },

    handleSearchConfirm() {
      this.$emit('search-change', this.fieldKey, JSON.parse(JSON.stringify(this.searchValue)))
      this.$emit('search-confirm')
      this.popoverVisible = false
    },


    handleReset() {
      this.$emit('reset', this.fieldKey)
      this.popoverVisible = false
    }
  }
}
</script>

<style scoped>
.column-header {
  display: inline-flex;
  align-items: center;
}
.header-label {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  user-select: none;
}
.header-label:hover .label-text {
  color: #409eff;
}
.label-text {
  line-height: 1;
  transition: color 0.2s;
}
.sort-icon {
  font-size: 14px;
  color: #c0c4cc;
}
.sort-icon.active {
  color: #409eff;
}
.search-indicator {
  font-size: 12px;
  color: #409eff;
}
.header-menu {
  padding: 0;
}
.menu-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  cursor: pointer;
  font-size: 12px;
  color: #606266;
  transition: all 0.2s;
  border-bottom: 1px solid #f2f3f5;
}
.menu-item:last-child {
  border-bottom: none;
}
.menu-item:hover {
  background: #ecf5ff;
  color: #409eff;
}
.menu-item.is-active {
  color: #409eff;
  font-weight: 500;
}
.menu-item i {
  font-size: 13px;
  width: 14px;
  text-align: center;
}
.search-area {
  padding: 8px 10px;
  border-top: 1px solid #dcdfe6;
}
.enum-search {
  display: flex;
  align-items: center;
  gap: 4px;
}
.enum-search .el-select {
  flex: 1;
  min-width: 0;
}
.enum-count-select >>> .el-select__tags .el-tag {
  display: none;
}
.enum-count-select >>> .el-select__tags .el-select__input {
  padding-left: 0;
}
.enum-select-wrapper .enum-selected-count {
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #409EFF;
  white-space: nowrap;
  pointer-events: none;
  z-index: 1;
}

.compare-search {
  display: flex;
  align-items: center;
  gap: 4px;
}
.compare-search .el-input {
  flex: 1;
  min-width: 0;
}
.date-search {
  display: flex;
  align-items: center;
  gap: 4px;
}
.bool-search {
  width: 100%;
}
</style>
