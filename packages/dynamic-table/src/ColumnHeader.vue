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
        <el-select
          v-if="hasEnumOptions"
          v-model="searchValue"
          size="mini"
          :placeholder="'选择' + fieldMeta.fieldLabel"
          multiple
          clearable
          collapse-tags
          filterable
          style="width: 100%"
          @change="handleSearchConfirm"
        >
          <el-option
            v-for="opt in normalizedEnumValues"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <div v-else-if="fieldMeta.fieldType === 'string' || !fieldMeta.fieldType" class="compare-search">
          <el-select
            v-model="searchValue.operator"
            size="mini"
            placeholder="条件"
            style="width: 90px; flex-shrink: 0"
          >
            <el-option label="等于" value="eq" />
            <el-option label="不等于" value="neq" />
            <el-option label="包含" value="contains" />
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
            style="width: 90px; flex-shrink: 0"
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
            v-model="searchValue.range"
            type="daterange"
            size="mini"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="yyyy-MM-dd"
            clearable
            :picker-options="datePickerOptions"
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
export default {
  name: 'ColumnHeader',

  props: {
    fieldKey: { type: String, required: true },
    fieldMeta: { type: Object, required: true },
    columnSearchValue: { type: [String, Object, Array], default: '' },
    currentSortOrder: { type: String, default: '' }
  },

  data() {
    return {
      popoverVisible: false,
      showSearch: false,
      searchValue: '',
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
      return this._normalizeEnumValues(this.fieldMeta.enumValues)
    },

    hasEnumOptions() {
      return this.normalizedEnumValues.length > 0

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
    handlePopoverShow() {
      this.showSearch = this.hasSearchValue
      this.initSearchValue()
    },

    initSearchValue() {
      const meta = this.fieldMeta
      const saved = this.columnSearchValue
      if (this.hasEnumOptions) {
        this.searchValue = Array.isArray(saved) ? [...saved] : []
      } else if (meta.fieldType === 'string' || !meta.fieldType) {
        this.searchValue = (saved && typeof saved === 'object' && !Array.isArray(saved))
          ? { operator: saved.operator || 'contains', value: saved.value != null ? saved.value : '' }
          : { operator: 'contains', value: '' }
      } else if (meta.fieldType === 'number' || meta.fieldType === 'currency') {
        this.searchValue = (saved && typeof saved === 'object' && !Array.isArray(saved))
          ? { operator: saved.operator || 'eq', value: saved.value != null ? saved.value : '' }
          : { operator: 'eq', value: '' }
      } else if (meta.fieldType === 'date') {
        this.searchValue = (saved && typeof saved === 'object' && !Array.isArray(saved))
          ? { range: saved.range || null }
          : { range: null }
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
      this.$emit('search-clear', this.fieldKey)
      if (this.currentSort) {
        this.$emit('sort-change', this.fieldKey, '')
      }
      this.$emit('search-confirm')
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
