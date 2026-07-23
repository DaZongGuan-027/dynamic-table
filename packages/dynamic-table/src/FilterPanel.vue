<template>
  <div class="filter-panel" v-if="filterMetaList.length > 0 || allDataFields.length > 0">
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
        <div class="filter-grid" v-if="filterMetaList.length > 0">
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
                    filterable
                    :popper-append-to-body="popperAppendToBody"
                  >
                    <el-option
                      label="全选"
                      value="__all__"
                      @click.native="handleSelectAll(meta, $event)"
                    />
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
                      :popper-append-to-body="popperAppendToBody"
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
                      :popper-append-to-body="popperAppendToBody"
                      style="width: 90px; flex-shrink: 0"
                      @change="$emit('apply')"
                    >
                      <el-option label="等于" value="eq" />
                      <el-option label="不等于" value="neq" />
                      <el-option label="大于" value="gt" />
                      <el-option label="小于" value="lt" />
                      <el-option label="大于等于" value="gte" />
                      <el-option label="小于等于" value="lte" />
                    </el-select>
                    <el-input
                      v-model="filterValues[meta.fieldKey].value"
                      :placeholder="'输入' + meta.fieldLabel"
                      clearable
                      @input="filterValues[meta.fieldKey].value = filterValues[meta.fieldKey].value.replace(/[^\d.-]/g, '').replace(/(\..*)\./g, '$1')"
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
                    :append-to-body="popperAppendToBody"
                    style="width: 100%"
                  />
                </template>


                <template v-else-if="meta.fieldType === 'boolean'">
                  <el-select
                    v-model="filterValues[meta.fieldKey]"
                    :placeholder="'请选择' + meta.fieldLabel"
                    clearable
                    filterable
                    :popper-append-to-body="popperAppendToBody"
                  >
                    <el-option label="是" :value="true" />
                    <el-option label="否" :value="false" />
                  </el-select>
                </template>
              </div>
            </div>
          </template>
        </div>

        <div class="custom-filter-section" v-if="allDataFields.length > 0">
          <div class="custom-filter-row">
            <el-select
              v-model="customFilter.fieldKey"
              placeholder="选择字段"
              size="small"
              filterable
              clearable
              :popper-append-to-body="popperAppendToBody"
              style="width: 130px; flex-shrink: 0"
              @change="handleCustomFieldChange"
            >
              <el-option
                v-for="f in allDataFields"
                :key="f.fieldKey"
                :label="f.fieldLabel"
                :value="f.fieldKey"
              />
            </el-select>
            <div class="custom-filter-control" v-if="customFilter.fieldKey">
              <template v-if="customFilter.hasEnum">
                <el-select
                  v-model="customFilter.value"
                  placeholder="请选择"
                  multiple
                  clearable
                  collapse-tags
                  filterable
                  size="small"
                  :popper-append-to-body="popperAppendToBody"
                  style="flex: 1; min-width: 0"
                >
                  <el-option
                    label="全选"
                    value="__all__"
                    @click.native="handleCustomSelectAll($event)"
                  />
                  <el-option
                    v-for="opt in customFilter.enumOptions"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                  />
                </el-select>
              </template>
              <template v-else-if="customFilter.fieldType === 'date'">
                <el-date-picker
                  v-model="customFilter.value.range"
                  type="daterange"
                  size="small"
                  range-separator="至"
                  start-placeholder="开始"
                  end-placeholder="结束"
                  value-format="yyyy-MM-dd"
                  clearable
                  :picker-options="datePickerOptions"
                  :append-to-body="popperAppendToBody"
                  style="flex: 1; min-width: 0"
                />
              </template>
              <template v-else-if="customFilter.fieldType === 'boolean'">
                <el-select
                  v-model="customFilter.value"
                  placeholder="请选择"
                  clearable
                  size="small"
                  :popper-append-to-body="popperAppendToBody"
                  style="flex: 1; min-width: 0"
                >
                  <el-option label="是" :value="true" />
                  <el-option label="否" :value="false" />
                </el-select>
              </template>
              <template v-else>
                <div class="compare-input">
                  <el-select
                    v-model="customFilter.value.operator"
                    placeholder="条件"
                    size="small"
                    :popper-append-to-body="popperAppendToBody"
                    style="width: 90px; flex-shrink: 0"
                  >
                    <template v-if="customFilter.fieldType === 'number' || customFilter.fieldType === 'currency'">
                      <el-option label="等于" value="eq" />
                      <el-option label="不等于" value="neq" />
                      <el-option label="大于" value="gt" />
                      <el-option label="小于" value="lt" />
                      <el-option label="大于等于" value="gte" />
                      <el-option label="小于等于" value="lte" />
                    </template>
                    <template v-else>
                      <el-option label="等于" value="eq" />
                      <el-option label="不等于" value="neq" />
                      <el-option label="包含" value="contains" />
                      <el-option label="不包含" value="notContains" />
                      <el-option label="开头是" value="startsWith" />
                      <el-option label="结尾是" value="endsWith" />
                    </template>
                  </el-select>
                  <el-input
                    v-model="customFilter.value.value"
                    placeholder="输入值"
                    clearable
                    size="small"
                    @input="handleCustomNumberInput"
                    @keyup.enter.native="$emit('apply')"
                    style="flex: 1; min-width: 0"
                  />
                </div>
              </template>
            </div>
          </div>
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
          <el-button type="primary" icon="el-icon-search" size="small" @click="handleApply">
            查询
          </el-button>
          <el-button icon="el-icon-refresh-left" size="small" @click="handleReset">
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
    allFieldMetaList: { type: Array, default: () => [] },
    filterValues: { type: Object, default: () => ({}) },
    expanded: { type: Boolean, default: true },
    filterSchemes: { type: Array, default: () => [] },
    activeSchemeIndex: { type: Number, default: -1 },
    popperAppendToBody: { type: Boolean, default: true }
  },

  data() {
    return {
      customFilter: {
        fieldKey: '',
        fieldType: '',
        hasEnum: false,
        enumOptions: [],
        value: null
      },
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
    allDataFields() {
      return this.allFieldMetaList.filter(f => {
        return f.fieldType !== 'selection' && f.fieldType !== 'index' && f.fieldType !== 'actions'
      })
    },

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
    handleSelectAll(meta, e) {
      e.stopPropagation()
      const allValues = this.normalizeEnumValues(meta.enumValues).map(o => o.value)
      const current = this.filterValues[meta.fieldKey] || []
      const isAllSelected = allValues.length > 0 && allValues.every(v => current.includes(v))
      this.$set(this.filterValues, meta.fieldKey, isAllSelected ? [] : [...allValues])
    },
    handleCustomFieldChange() {
      const cf = this.customFilter
      const meta = this.allDataFields.find(f => f.fieldKey === cf.fieldKey)
      if (!meta) {
        cf.fieldType = ''
        cf.hasEnum = false
        cf.enumOptions = []
        cf.value = null
        return
      }
      cf.fieldType = meta.fieldType || 'string'
      const enumOpts = this.normalizeEnumValues(meta.enumValues)
      cf.hasEnum = enumOpts.length > 0
      cf.enumOptions = enumOpts
      if (cf.hasEnum) {
        cf.value = []
      } else if (cf.fieldType === 'date') {
        cf.value = { range: null }
      } else if (cf.fieldType === 'boolean') {
        cf.value = ''
      } else if (cf.fieldType === 'number' || cf.fieldType === 'currency') {
        cf.value = { operator: 'eq', value: '' }
      } else {
        cf.value = { operator: 'contains', value: '' }
      }
    },
    handleCustomSelectAll(e) {
      e.stopPropagation()
      const cf = this.customFilter
      const allValues = cf.enumOptions.map(o => o.value)
      const current = cf.value || []
      const isAllSelected = allValues.length > 0 && allValues.every(v => current.includes(v))
      cf.value = isAllSelected ? [] : [...allValues]
    },
    handleCustomNumberInput() {
      const cf = this.customFilter
      if ((cf.fieldType === 'number' || cf.fieldType === 'currency') && cf.value && cf.value.value !== undefined) {
        cf.value.value = cf.value.value.replace(/[^\d.-]/g, '').replace(/(\..*)\./g, '$1')
      }
    },
    getCustomFilterValues() {
      const cf = this.customFilter
      if (!cf.fieldKey || cf.value === null || cf.value === undefined) return {}
      const values = {}
      if (typeof cf.value === 'object' && !Array.isArray(cf.value)) {
        if (cf.value.range !== undefined) {
          if (Array.isArray(cf.value.range) && cf.value.range.length === 2) {
            values[cf.fieldKey] = JSON.parse(JSON.stringify(cf.value))
          }
        } else if (cf.value.operator !== undefined) {
          if (cf.value.value !== '' && cf.value.value !== null && cf.value.value !== undefined) {
            values[cf.fieldKey] = JSON.parse(JSON.stringify(cf.value))
          }
        }
      } else if (Array.isArray(cf.value)) {
        if (cf.value.length > 0) values[cf.fieldKey] = [...cf.value]
      } else if (cf.value !== '') {
        values[cf.fieldKey] = cf.value
      }
      return values
    },
    resetCustomFilters() {
      this.customFilter = {
        fieldKey: '',
        fieldType: '',
        hasEnum: false,
        enumOptions: [],
        value: null
      }
    },
    handleApply() {
      this.$emit('apply', this.getCustomFilterValues())
    },
    handleReset() {
      this.resetCustomFilters()
      this.$emit('reset')
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
.custom-filter-section {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #e4e7ed;
}
.custom-filter-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.custom-filter-control {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}
.custom-filter-control .compare-input {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
}
.custom-filter-control .compare-input .el-input {
  flex: 1;
  min-width: 0;
}
</style>
