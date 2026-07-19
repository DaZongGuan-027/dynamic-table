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
              class="filter-grid-item filter-grid-item--wide"
            >
              <div class="filter-label">{{ meta.fieldLabel }}</div>
              <div class="filter-control">
                <template v-if="hasEnumOptions(meta)">
                  <el-select
                    v-model="filterValues[meta.fieldKey]"
                    :placeholder="'请选择' + meta.fieldLabel"
                    multiple
                    clearable
                    collapse-tags
                  >
                    <el-option
                      v-for="opt in normalizeEnumValues(meta.enumValues)"
                      :key="opt.value"
                      :label="opt.label"
                      :value="opt.value"
                    />
                  </el-select>
                </template>

                <template v-else-if="meta.fieldType === 'string'">
                  <div class="compare-input">
                    <el-select
                      v-model="filterValues[meta.fieldKey].operator"
                      placeholder="条件"
                      style="width: 90px; flex-shrink: 0"
                      @change="$emit('apply')"
                    >
                      <el-option label="等于" value="eq" />
                      <el-option label="不等于" value="neq" />
                      <el-option label="包含" value="contains" />
                      <el-option label="不包含" value="notContains" />
                      <el-option label="开头是" value="startsWith" />
                      <el-option label="结尾是" value="endsWith" />
                    </el-select>
                    <el-input
                      v-model="filterValues[meta.fieldKey].value"
                      :placeholder="'输入' + meta.fieldLabel"
                      clearable
                      @keyup.enter.native="$emit('apply')"
                    />
                  </div>
                </template>

                <template v-else-if="meta.fieldType === 'number' || meta.fieldType === 'currency'">
                  <div class="compare-input">
                    <el-select
                      v-model="filterValues[meta.fieldKey].operator"
                      placeholder="条件"
                      style="width: 90px; flex-shrink: 0"
                      @change="$emit('apply')"
                    >
                      <el-option label="等于" value="eq" />
                      <el-option label="大于" value="gt" />
                      <el-option label="小于" value="lt" />
                      <el-option label="大于等于" value="gte" />
                      <el-option label="小于等于" value="lte" />
                      <el-option label="包含" value="contains" />
                      <el-option label="不包含" value="notContains" />
                    </el-select>
                    <el-input
                      v-model="filterValues[meta.fieldKey].value"
                      :placeholder="'输入' + meta.fieldLabel"
                      clearable
                      @keyup.enter.native="$emit('apply')"
                    />
                  </div>
                </template>

                <template v-else-if="meta.fieldType === 'date'">
                  <el-date-picker
                    v-model="filterValues[meta.fieldKey].range"
                    type="daterange"
                    range-separator="至"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期"
                    value-format="yyyy-MM-dd"
                    clearable
                    :picker-options="datePickerOptions"
                    style="width: 100%"
                  />
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
        </div>
        <div class="filter-actions-right">
          <el-button
            size="small"
            :disabled="!hasActiveFilter"
            @click="handleSaveScheme"
          >
            保存筛选
          </el-button>
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

  data() {
    return {
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

  computed: {
    activeFilterCount() {
      let count = 0
      Object.keys(this.filterValues).forEach(key => {
        const val = this.filterValues[key]
        if (val === null || val === undefined || val === '') return
        if (typeof val === 'object' && !Array.isArray(val)) {
          if (val.operator !== undefined) {
            if (val.value !== '' && val.value !== null && val.value !== undefined) count++
          } else if (val.range !== undefined) {
            if (Array.isArray(val.range) && val.range.length === 2) count++
          } else if (Object.keys(val).some(k => val[k] !== null && val[k] !== undefined && val[k] !== '')) {
            count++
          }
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
      return fieldType === 'date' || fieldType === 'number' || fieldType === 'currency' || fieldType === 'string'
    },
    hasEnumOptions(meta) {
      return meta.enumValues && (Array.isArray(meta.enumValues) ? meta.enumValues.length > 0 : Object.keys(meta.enumValues).length > 0)
    },
    normalizeEnumValues(enumValues) {
      if (!enumValues) return []
      if (Array.isArray(enumValues)) return enumValues
      if (typeof enumValues === 'object') {
        return Object.keys(enumValues).map(key => ({ label: enumValues[key], value: key }))
      }
      return []
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
  padding: 10px;
  padding-right: 4px;
}
.filter-form-scroll {
  max-height: 120px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 2px;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 8px 16px;
}
.filter-grid-item {
  display: flex;
  align-items: center;
  min-width: 0;
  margin-bottom: 4px;
}
.filter-label {
  flex-shrink: 0;
  font-size: 13px;
  color: #606266;
  margin-right: 8px;
  white-space: nowrap;
  width: 60px;
  text-align: right;
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
.compare-input {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
}
.compare-input .el-input {
  flex: 1;
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
