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
        <el-input
          v-if="fieldMeta.fieldType === 'string' || !fieldMeta.fieldType"
          ref="searchInput"
          v-model="searchValue"
          size="mini"
          :placeholder="'输入' + fieldMeta.fieldLabel"
          clearable
          @keyup.enter.native="handleSearchConfirm"
        >
          <el-button slot="append" icon="el-icon-search" @click="handleSearchConfirm"></el-button>
        </el-input>
        <el-select
          v-else-if="fieldMeta.fieldType === 'enum'"
          v-model="searchValue"
          size="mini"
          :placeholder="'选择' + fieldMeta.fieldLabel"
          multiple
          clearable
          collapse-tags
          style="width: 100%"
          @change="handleSearchConfirm"
        >
          <el-option
            v-for="opt in fieldMeta.enumValues"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <div v-else-if="fieldMeta.fieldType === 'number'" class="range-search">
          <el-input
            v-model="searchValue.min"
            size="mini"
            placeholder="最小值"
            clearable
            @keyup.enter.native="handleSearchConfirm"
          />
          <span class="range-sep">~</span>
          <el-input
            v-model="searchValue.max"
            size="mini"
            placeholder="最大值"
            clearable
            @keyup.enter.native="handleSearchConfirm"
          />
          <el-button size="mini" icon="el-icon-search" type="primary" @click="handleSearchConfirm"></el-button>
        </div>
        <div v-else-if="fieldMeta.fieldType === 'date'" class="range-search date-range">
          <el-date-picker
            v-model="searchValue.start"
            type="date"
            size="mini"
            placeholder="开始日期"
            value-format="yyyy-MM-dd"
            clearable
            style="width: 100%"
            @change="handleDateChange"
          />
          <span class="range-sep">~</span>
          <el-date-picker
            v-model="searchValue.end"
            type="date"
            size="mini"
            placeholder="结束日期"
            value-format="yyyy-MM-dd"
            clearable
            style="width: 100%"
            @change="handleDateChange"
          />
          <el-button size="mini" icon="el-icon-search" type="primary" class="date-search-btn" @click="handleSearchConfirm"></el-button>
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
      searchValue: ''
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
        return Object.values(this.columnSearchValue).some(
          v => v !== null && v !== undefined && v !== ''
        )
      }
      if (Array.isArray(this.columnSearchValue)) return this.columnSearchValue.length > 0
      return this.columnSearchValue !== ''
    },

    popoverWidth() {
      if (this.fieldMeta.fieldType === 'date') return 320
      if (this.fieldMeta.fieldType === 'number') return 280
      if (this.fieldMeta.fieldType === 'enum') return 220
      return 200
    }
  },

  methods: {
    handlePopoverShow() {
      this.showSearch = this.hasSearchValue
      this.initSearchValue()
    },

    initSearchValue() {
      const meta = this.fieldMeta
      const saved = this.columnSearchValue
      if (meta.fieldType === 'number') {
        this.searchValue = (saved && typeof saved === 'object' && !Array.isArray(saved))
          ? { min: saved.min || '', max: saved.max || '' }
          : { min: '', max: '' }
      } else if (meta.fieldType === 'date') {
        this.searchValue = (saved && typeof saved === 'object' && !Array.isArray(saved))
          ? { start: saved.start || '', end: saved.end || '' }
          : { start: '', end: '' }
      } else if (meta.fieldType === 'enum') {
        this.searchValue = Array.isArray(saved) ? [...saved] : []
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

    handleDateChange() {
      if (this.searchValue.start && this.searchValue.end) {
        this.handleSearchConfirm()
      }
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
.range-search {
  display: flex;
  align-items: center;
  gap: 4px;
}
.range-search .el-input {
  flex: 1;
}
.date-range {
  flex-wrap: wrap;
}
.date-range .range-sep {
  display: none;
}
.date-search-btn {
  margin-top: 6px;
  width: 100%;
}
.range-sep {
  color: #c0c4cc;
  flex-shrink: 0;
  font-size: 12px;
}
.bool-search {
  width: 100%;
}
</style>
