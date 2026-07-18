<template>
  <div class="filter-panel" v-if="filterMetaList.length > 0">
    <div class="filter-header" @click="$emit('toggle-expand')">
      <span class="filter-title">
        <i :class="expanded ? 'el-icon-arrow-down' : 'el-icon-arrow-right'"></i>
        筛选条件
      </span>
      <div class="filter-header-right">
        <span class="filter-count" v-if="activeFilterCount > 0">
          已选 {{ activeFilterCount }} 项
        </span>

      </div>
    </div>
    <div class="filter-body" v-show="expanded">
      <div class="filter-form-scroll">
        <div class="filter-grid">
          <template v-for="meta in filterMetaList">
            <div
              :key="meta.fieldKey"
              class="filter-grid-item"
              :class="{ 'filter-grid-item--wide': isRangeType(meta.fieldType) }"
            >
              <div class="filter-label">{{ meta.fieldLabel }}</div>
              <div class="filter-control">
                <template v-if="meta.fieldType === 'string'">
                  <el-input
                    v-model="filterValues[meta.fieldKey]"
                    :placeholder="'请输入' + meta.fieldLabel"
                    clearable
                    @keyup.enter.native="$emit('apply')"
                  />
                </template>

                <template v-else-if="meta.fieldType === 'number'">
                  <div class="range-input">
                    <el-input
                      v-model="filterValues[meta.fieldKey].min"
                      placeholder="最小值"
                      clearable
                      @keyup.enter.native="$emit('apply')"
                    />
                    <span class="range-separator">-</span>
                    <el-input
                      v-model="filterValues[meta.fieldKey].max"
                      placeholder="最大值"
                      clearable
                      @keyup.enter.native="$emit('apply')"
                    />
                  </div>
                </template>

                <template v-else-if="meta.fieldType === 'enum'">
                  <el-select
                    v-model="filterValues[meta.fieldKey]"
                    :placeholder="'请选择' + meta.fieldLabel"
                    multiple
                    clearable
                    collapse-tags
                  >
                    <el-option
                      v-for="opt in meta.enumValues"
                      :key="opt.value"
                      :label="opt.label"
                      :value="opt.value"
                    />
                  </el-select>
                </template>

                <template v-else-if="meta.fieldType === 'date'">
                  <div class="range-input">
                    <el-date-picker
                      v-model="filterValues[meta.fieldKey].start"
                      type="date"
                      placeholder="开始日期"
                      value-format="yyyy-MM-dd"
                      clearable
                      style="flex: 1"
                    />
                    <span class="range-separator">-</span>
                    <el-date-picker
                      v-model="filterValues[meta.fieldKey].end"
                      type="date"
                      placeholder="结束日期"
                      value-format="yyyy-MM-dd"
                      clearable
                      style="flex: 1"
                    />
                  </div>
                </template>

                <template v-else-if="meta.fieldType === 'boolean'">
                  <el-select
                    v-model="filterValues[meta.fieldKey]"
                    :placeholder="'请选择' + meta.fieldLabel"
                    clearable
                  >
                    <el-option label="是" :value="true" />
                    <el-option label="否" :value="false" />
                  </el-select>
                </template>
              </div>
            </div>
          </template>
        </div>
      </div>
      <div class="filter-actions">
        <div class="filter-actions-left">
          <el-dropdown
            v-if="filterSchemes && filterSchemes.length > 0"
            trigger="click"
            @command="handleSchemeCommand"
            size="small"
          >
            <el-button size="small">

              常用方案
              <i class="el-icon-arrow-down el-icon--right"></i>
            </el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item
                v-for="(scheme, index) in filterSchemes"
                :key="index"
                :command="index"
              >

                {{ scheme.name || '方案' + (index + 1) }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
          <el-button
            size="small"
            :disabled="!hasActiveFilter"
            @click="handleSaveScheme"
          >
            保存筛选
          </el-button>
        </div>
        <div class="filter-actions-right">
          <el-button type="primary" icon="el-icon-search" size="small" @click="$emit('apply')">
            查询
          </el-button>
          <el-button icon="el-icon-refresh-left" size="small" @click="$emit('reset')">
            重置
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FilterPanel',

  props: {
    filterMetaList: { type: Array, default: () => [] },
    filterValues: { type: Object, default: () => ({}) },
    expanded: { type: Boolean, default: true },
    filterSchemes: { type: Array, default: () => [] },
    activeSchemeIndex: { type: Number, default: -1 }
  },

  computed: {
    activeFilterCount() {
      let count = 0
      Object.keys(this.filterValues).forEach(key => {
        const val = this.filterValues[key]
        if (val === null || val === undefined || val === '') return
        if (typeof val === 'object' && !Array.isArray(val)) {
          if (Object.values(val).some(v => v !== null && v !== undefined && v !== '')) count++
        } else if (Array.isArray(val)) {
          if (val.length > 0) count++
        } else {
          count++
        }
      })
      return count
    },

    hasActiveFilter() {
      return this.activeFilterCount > 0
    },

    isFilterChanged() {
      if (this.activeSchemeIndex < 0 || !this.filterSchemes[this.activeSchemeIndex]) return false
      const original = this.filterSchemes[this.activeSchemeIndex].filterValues
      return JSON.stringify(this.filterValues) !== JSON.stringify(original)
    }
  },

  methods: {
    isRangeType(fieldType) {
      return fieldType === 'date' || fieldType === 'number'
    },
    handleSchemeCommand(index) {
      const scheme = this.filterSchemes[index]
      if (scheme && scheme.filterValues) {
        this.$emit('apply-scheme', { filterValues: scheme.filterValues, index })
      }
    },

    handleSaveScheme() {
      if (this.activeSchemeIndex >= 0 && this.filterSchemes[this.activeSchemeIndex] && this.isFilterChanged) {
        this.showOverwriteDialog()
      } else {
        this.showNewSchemeDialog()
      }
    },

    showOverwriteDialog() {
      const schemeName = this.filterSchemes[this.activeSchemeIndex].name || '方案' + (this.activeSchemeIndex + 1)
      this.$confirm(
        `当前使用的是「${schemeName}」，筛选条件已变更。请选择操作：`,
        '保存筛选方案',
        {
          distinguishCancelAndClose: true,
          confirmButtonText: '覆盖当前方案',
          cancelButtonText: '保存为新方案',
          type: 'warning'
        }
      ).then(() => {
        const filterValues = JSON.parse(JSON.stringify(this.filterValues))
        this.$emit('save-scheme', {
          name: schemeName,
          filterValues,
          overwriteIndex: this.activeSchemeIndex
        })
      }).catch(action => {
        if (action === 'cancel') {
          this.showNewSchemeDialog()
        }
      })
    },

    showNewSchemeDialog() {
      if (this.filterSchemes && this.filterSchemes.length >= 5) {
        this.$message.warning('最多只能保存5个筛选方案，请先删除旧方案')
        return
      }
      this.$prompt('请输入方案名称', '保存筛选方案', {
        confirmButtonText: '保存',
        cancelButtonText: '取消',
        inputValue: '方案' + ((this.filterSchemes ? this.filterSchemes.length : 0) + 1),
        inputPattern: /\S+/,
        inputErrorMessage: '方案名称不能为空'
      }).then(({ value }) => {
        const filterValues = JSON.parse(JSON.stringify(this.filterValues))
        this.$emit('save-scheme', { name: value, filterValues })
      }).catch(() => {})
    }
  }
}
</script>

<style scoped>
.filter-panel {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  margin-bottom: 12px;
}
.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid #ebeef5;
}
.filter-header:hover {
  background: #f5f7fa;
}
.filter-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}
.filter-title i {
  margin-right: 4px;
  font-size: 12px;
}
.filter-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.filter-count {
  font-size: 12px;
  color: #409eff;
}

.filter-body {
  padding: 16px;
}
.filter-form-scroll {
  max-height: 120px;
  overflow-y: auto;
  overflow-x: hidden;
}
.filter-form-scroll::-webkit-scrollbar {
  width: 6px;
}
.filter-form-scroll::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;
}
.filter-form-scroll::-webkit-scrollbar-thumb:hover {
  background: #c0c4cc;
}
.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 8px 16px;
}
.filter-grid-item {
  display: flex;
  align-items: center;
  min-width: 0;
  margin-bottom: 4px;
}
.filter-grid-item--wide {
  grid-column: span 2;
}
.filter-label {
  flex-shrink: 0;
  font-size: 13px;
  color: #606266;
  margin-right: 8px;
  white-space: nowrap;
}
.filter-control {
  flex: 1;
  min-width: 0;
}
.filter-control .el-input,
.filter-control .el-select,
.filter-control .el-date-editor {
  width: 100%;
}
.range-input {
  display: flex;
  align-items: center;
  width: 100%;
}
.range-input .el-input {
  flex: 1;
}
.range-separator {
  margin: 0 4px;
  color: #c0c4cc;
  flex-shrink: 0;
}
.filter-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 4px;
}
.filter-actions-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.filter-actions-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
