<template>
  <el-drawer
    title="表格配置"
    :visible.sync="drawerVisible"
    direction="rtl"
    size="480px"
    :before-close="handleClose"
    append-to-body
    custom-class="config-drawer"
  >
    <el-tabs v-model="activeTab" class="config-tabs">
      <el-tab-pane label="表头配置" name="column">
        <div class="tab-tip">
          <i class="el-icon-info"></i>
          勾选展示列，锁定图标设置冻结列，拖拽调整顺序
        </div>
        <div class="select-all-row">
          <el-checkbox
            v-model="columnAllChecked"
            :indeterminate="columnIndeterminate"
            @change="handleColumnAllChange"
          >全选</el-checkbox>
          <el-checkbox
            v-model="freezeAllChecked"
            :indeterminate="freezeIndeterminate"
            @change="handleFreezeAllChange"
          >全部冻结</el-checkbox>
        </div>
        <draggable
          v-model="editColumnList"
          handle=".drag-handle"
          animation="200"
          ghost-class="ghost"
        >
          <div
            v-for="item in editColumnList"
            :key="item.fieldKey"
            class="config-item"
          >
            <el-checkbox v-model="item.visible" class="column-visible-check" @change="handleVisibleChange(item)">{{ item.fieldLabel }}</el-checkbox>
            <div class="config-item-right">
              <el-input-number

                v-model="item.width"
                size="mini"
                :min="50"
                :step="10"
                controls-position="right"
                class="width-input"
                @change="handleWidthChange(item)"
              />
              <el-tooltip content="冻结到左侧" placement="top" :open-delay="300">
                <i
                  class="freeze-icon freeze-left"
                  :class="{ 'is-active': item.frozenPosition === 'left' }"
                  @click="item.visible && handleFreezeLeft(item)"
                >◀</i>
              </el-tooltip>
              <el-tooltip content="冻结到右侧" placement="top" :open-delay="300">
                <i
                  class="freeze-icon freeze-right"
                  :class="{ 'is-active': item.frozenPosition === 'right' }"
                  @click="item.visible && handleFreezeRight(item)"
                >▶</i>
              </el-tooltip>
              <el-tooltip content="拖拽排序" placement="top" :open-delay="300">
                <i class="el-icon-rank drag-handle"></i>
              </el-tooltip>
            </div>
          </div>
        </draggable>
      </el-tab-pane>

      <el-tab-pane label="筛选配置" name="filter">
        <div class="tab-tip">
          <i class="el-icon-info"></i>
          勾选需要作为筛选项的字段，拖拽调整顺序
        </div>
        <div class="select-all-row">
          <el-checkbox
            v-model="filterAllChecked"
            :indeterminate="filterIndeterminate"
            @change="handleFilterAllChange"
          >全选</el-checkbox>
        </div>
        <draggable
          v-model="editFilterList"
          handle=".drag-handle"
          animation="200"
          ghost-class="ghost"
        >
          <div
            v-for="item in editFilterList"
            :key="item.fieldKey"
            class="config-item"
          >
            <el-checkbox v-model="item.checked" class="column-visible-check" @change="handleFilterCheckChange(item)">
              <span class="field-label">{{ item.fieldLabel }}</span>
              <span class="field-type-tag">{{ fieldTypeLabel(item.fieldType) }}</span>
            </el-checkbox>
            <div class="config-item-right">
              <el-tooltip content="拖拽排序" placement="top" :open-delay="300">
                <i class="el-icon-rank drag-handle"></i>
              </el-tooltip>
            </div>
          </div>
        </draggable>
      </el-tab-pane>

      <el-tab-pane label="筛选方案" name="scheme">

        <div class="scheme-list">
          <div
            v-for="(scheme, index) in editSchemes"
            :key="index"
            class="scheme-item"
          >
            <div class="scheme-header">
              <template v-if="editingSchemeIndex === index">
                <el-input
                  v-model="editingSchemeName"
                  size="mini"
                  class="scheme-name-input"
                  @blur="confirmRenameScheme(index)"
                  @keyup.enter.native="confirmRenameScheme(index)"
                />
              </template>
              <template v-else>
                <span class="scheme-name-text" @click="startRenameScheme(index)" title="点击修改名称">{{ scheme.name || '方案' + (index + 1) }}</span>
              </template>
              <div class="scheme-header-actions">
                <el-button
                  v-if="editingSchemeIndex !== index"
                  type="text"
                  icon="el-icon-edit"
                  size="mini"
                  class="scheme-rename-btn"
                  @click="startRenameScheme(index)"
                />
                <el-button
                  type="text"
                  icon="el-icon-delete"
                  size="mini"
                  class="scheme-delete-btn"
                  @click="removeScheme(index)"
                />
              </div>
            </div>
            <div class="scheme-desc" v-if="scheme.filterValues && hasActiveFilter(scheme.filterValues)">
              <span class="scheme-desc-label">筛选条件:</span>
              <span class="scheme-desc-value">{{ describeFilters(scheme.filterValues) }}</span>
            </div>
            <div class="scheme-desc" v-else>
              <span class="scheme-desc-value empty">暂无筛选条件</span>
            </div>
          </div>

          <div v-if="editSchemes.length === 0" class="scheme-empty-tip">
            暂无保存的筛选方案
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <div class="drawer-footer">
      <el-button size="small" @click="handleResetDefault">还原默认</el-button>
      <div class="footer-right">
        <el-button @click="handleClose" size="small">取 消</el-button>
        <el-button type="primary" @click="handleConfirm" size="small">保 存</el-button>
      </div>
    </div>
  </el-drawer>
</template>

<script>
import draggable from 'vuedraggable'

export default {
  name: 'ConfigDrawer',

  components: { draggable },

  props: {
    visible: { type: Boolean, default: false },
    fieldMetaList: { type: Array, default: () => [] },
    visibleFields: { type: Array, default: () => [] },
    frozenFields: { type: Array, default: () => [] },
    frozenPositions: { type: Object, default: () => ({}) },
    columnWidths: { type: Object, default: () => ({}) },
    filterFields: { type: Array, default: () => [] },
    columnOrder: { type: Array, default: () => [] },
    filterSchemes: { type: Array, default: () => [] },
    currentFilterValues: { type: Object, default: () => ({}) }
  },

  computed: {
    showSelection() {
      return this.fieldMetaList.some(f => f.fieldType === 'selection')
    },
    showIndex() {
      return this.fieldMetaList.some(f => f.fieldType === 'index')
    },
    showActions() {
      return this.fieldMetaList.some(f => f.fieldType === 'actions')
    }
  },

  data() {
    return {
      activeTab: 'column',
      editColumnList: [],

      editFilterList: [],
      editSchemes: [],
      editingSchemeIndex: -1,
      editingSchemeName: ''
    }
  },

  computed: {
    drawerVisible: {
      get() { return this.visible },
      set(val) { this.$emit('update:visible', val) }
    },

    filterableFieldList() {
      return this.fieldMetaList.filter(
        f => f.filterable && this.editColumnList.some(c => c.fieldKey === f.fieldKey && c.visible)
      )
    },

    fieldMetaMap() {
      const map = {}
      this.fieldMetaList.forEach(f => { map[f.fieldKey] = f })
      return map
    },

    columnAllChecked: {
      get() {
        return this.editColumnList.length > 0 && this.editColumnList.every(i => i.visible)
      },
      set() {}
    },

    columnIndeterminate() {
      const checked = this.editColumnList.filter(i => i.visible).length
      return checked > 0 && checked < this.editColumnList.length
    },

    freezeAllChecked: {
      get() {
        const visible = this.editColumnList.filter(i => i.visible)
        return visible.length > 0 && visible.every(i => i.frozenPosition)
      },
      set() {}
    },

    freezeIndeterminate() {
      const visible = this.editColumnList.filter(i => i.visible)
      const checked = visible.filter(i => i.frozenPosition).length
      return checked > 0 && checked < visible.length
    },

    filterAllChecked: {
      get() {
        return this.editFilterList.length > 0 && this.editFilterList.every(i => i.checked)
      },
      set() {}
    },

    filterIndeterminate() {
      const checked = this.editFilterList.filter(i => i.checked).length
      return checked > 0 && checked < this.editFilterList.length
    }
  },

  watch: {
    visible(val) {
      if (val) {
        this.initEditData()
      }
    }
  },

  methods: {
    initEditData() {
      const orderedKeys = this.columnOrder.length > 0
        ? this.columnOrder
        : this.fieldMetaList.map(f => f.fieldKey)

      const extraKeys = this.fieldMetaList
        .map(f => f.fieldKey)
        .filter(k => !orderedKeys.includes(k))
      const allKeys = [...orderedKeys, ...extraKeys]

      const columnList = []
      allKeys.forEach(key => {
        const meta = this.fieldMetaList.find(f => f.fieldKey === key)
        if (!meta) return
        const isSpecial = ['selection', 'index', 'actions'].includes(meta.fieldType)
        let frozenPosition = ''
        if (isSpecial) {
          if (this.frozenFields.includes(key)) {
            frozenPosition = key === '__actions' ? (this.frozenPositions[key] || 'right') : 'left'
          } else if (meta.frozenPosition) {
            frozenPosition = meta.frozenPosition
          }
        } else if (this.frozenFields.includes(key)) {
          frozenPosition = (meta && meta.frozenPosition === 'right') ? 'right' : 'left'
        }
        columnList.push({
          fieldKey: key,
          fieldLabel: meta.fieldLabel,
          visible: this.visibleFields.length > 0 ? this.visibleFields.includes(key) : true,
          frozenPosition,
          isSpecial,
          width: this.columnWidths[key] || meta.width || (isSpecial ? (key === '__actions' ? 150 : 50) : 120)
        })
      })
      this.editColumnList = columnList

      this.editFilterFields = [...this.filterFields]

      const filterableList = this.fieldMetaList.filter(
        f => f.filterable && columnList.some(c => c.fieldKey === f.fieldKey && c.visible)
      )
      const filterFieldSet = new Set(this.filterFields)
      const orderedFilterKeys = this.filterFields.filter(k => filterableList.some(f => f.fieldKey === k))
      const extraFilterKeys = filterableList.filter(f => !filterFieldSet.has(f.fieldKey)).map(f => f.fieldKey)
      const allFilterKeys = [...orderedFilterKeys, ...extraFilterKeys]
      this.editFilterList = allFilterKeys.map(key => {
        const meta = filterableList.find(f => f.fieldKey === key)
        return {
          fieldKey: key,
          fieldLabel: meta ? meta.fieldLabel : key,
          fieldType: meta ? meta.fieldType : 'string',
          checked: filterFieldSet.has(key)
        }
      })

      this.editSchemes = (this.filterSchemes || []).map(s => ({
        name: s.name || '',
        filterValues: JSON.parse(JSON.stringify(s.filterValues || {}))
      }))

      this.activeTab = 'column'
    },

    fieldTypeLabel(type) {
      const map = {
        string: '文本',
        number: '数值',
        enum: '枚举',
        date: '日期',
        boolean: '布尔',
        currency: '金额'
      }
      return map[type] || type
    },

    _normalizeEnumValues(enumValues) {
      if (!enumValues) return []
      if (Array.isArray(enumValues)) return enumValues
      if (typeof enumValues === 'object') {
        return Object.keys(enumValues).map(key => ({ label: enumValues[key], value: key }))
      }
      return []
    },

    handleColumnAllChange(val) {
      this.editColumnList.forEach(item => {
        item.visible = val
        if (!val) item.frozenPosition = ''
      })
    },

    handleWidthChange(item) {
      if (item.width < 50) item.width = 50
    },

    handleFreezeLeft(item) {
      item.frozenPosition = item.frozenPosition === 'left' ? '' : 'left'
    },

    handleFreezeRight(item) {
      item.frozenPosition = item.frozenPosition === 'right' ? '' : 'right'
    },

    handleFreezeAllChange(val) {
      this.editColumnList.filter(i => i.visible).forEach(item => { item.frozenPosition = val ? 'left' : '' })
    },

    handleVisibleChange(item) {
      if (!item.visible) item.frozenPosition = ''
    },

    handleFilterAllChange(val) {
      this.editFilterList.forEach(item => { item.checked = val })
    },

    handleFilterCheckChange(item) {
    },

    addScheme() {
      const currentValues = JSON.parse(JSON.stringify(this.currentFilterValues || {}))
      this.editSchemes.push({
        name: '方案' + (this.editSchemes.length + 1),
        filterValues: currentValues
      })
    },

    removeScheme(index) {
      this.editSchemes.splice(index, 1)
      if (this.editingSchemeIndex === index) {
        this.editingSchemeIndex = -1
        this.editingSchemeName = ''
      } else if (this.editingSchemeIndex > index) {
        this.editingSchemeIndex--
      }
    },

    startRenameScheme(index) {
      this.editingSchemeIndex = index
      this.editingSchemeName = this.editSchemes[index].name || '方案' + (index + 1)
      this.$nextTick(() => {
        const input = this.$el.querySelector('.scheme-name-input .el-input__inner')
        if (input) input.focus()
      })
    },

    confirmRenameScheme(index) {
      if (this.editingSchemeName.trim()) {
        this.editSchemes[index].name = this.editingSchemeName.trim()
      }
      this.editingSchemeIndex = -1
      this.editingSchemeName = ''
    },

    hasActiveFilter(filterValues) {
      if (!filterValues) return false
      return Object.keys(filterValues).some(key => {
        const val = filterValues[key]
        if (val === null || val === undefined || val === '') return false
        if (typeof val === 'object' && !Array.isArray(val)) {
          return Object.keys(val).some(k => val[k] !== null && val[k] !== undefined && val[k] !== '')
        }
        if (Array.isArray(val)) return val.length > 0
        return true
      })
    },

    describeFilters(filterValues) {
      if (!filterValues) return ''
      const parts = []
      Object.keys(filterValues).forEach(key => {
        const meta = this.fieldMetaMap[key]
        if (!meta) return
        const val = filterValues[key]
        if (val === null || val === undefined || val === '') return

        if (typeof val === 'object' && !Array.isArray(val)) {
          const subParts = []
          if (val.operator !== undefined && val.value !== '' && val.value !== null && val.value !== undefined) {
            const opMap = { eq: '=', gt: '>', lt: '<', gte: '≥', lte: '≤', contains: '包含', notContains: '不包含' }
            subParts.push((opMap[val.operator] || val.operator) + val.value)
          }
          if (val.range && Array.isArray(val.range) && val.range.length === 2) {
            subParts.push(val.range[0] + '至' + val.range[1])
          }
          if (val.min !== '' && val.min !== null && val.min !== undefined) subParts.push('≥' + val.min)
          if (val.max !== '' && val.max !== null && val.max !== undefined) subParts.push('≤' + val.max)
          if (val.start) subParts.push('从' + val.start)
          if (val.end) subParts.push('至' + val.end)
          if (subParts.length > 0) parts.push(meta.fieldLabel + subParts.join(' '))
        } else if (Array.isArray(val)) {
          if (val.length > 0) {
            const enumList = this._normalizeEnumValues(meta.enumValues)
            const labels = val.map(v => {
              const found = enumList.find(e => e.value === v)
              return found ? found.label : v
            })

            parts.push(meta.fieldLabel + ':' + labels.join(','))
          }
        } else {
          parts.push(meta.fieldLabel + ':' + val)
        }
      })
      return parts.join('；')
    },

    handleConfirm() {
      const visibleFields = this.editColumnList.filter(i => i.visible).map(i => i.fieldKey)
      const columnOrder = this.editColumnList.map(i => i.fieldKey)
      const frozenFields = this.editColumnList.filter(i => i.visible && i.frozenPosition).map(i => i.fieldKey)
      const frozenPositions = {}
      this.editColumnList.filter(i => i.visible && i.frozenPosition).forEach(i => {
        frozenPositions[i.fieldKey] = i.frozenPosition
      })
      const filterFields = this.editFilterList.filter(i => i.checked).map(i => i.fieldKey)
      const filterSchemes = this.editSchemes.map(s => ({
        name: s.name,
        filterValues: s.filterValues
      }))

      const columnWidths = {}
      this.editColumnList.forEach(i => {
        if (i.width) columnWidths[i.fieldKey] = i.width
      })

      this.$emit('confirm', {
        visibleFields,
        columnOrder,
        frozenFields,
        frozenPositions,
        columnWidths,
        filterFields,
        filterSchemes
      })
      this.drawerVisible = false
    },

    handleClose() {
      this.drawerVisible = false
    },

    handleResetDefault() {
      this.$confirm('确定还原为默认配置？所有自定义配置（表头配置、筛选配置、筛选方案）将被清除，且不可恢复。', '还原默认配置', {
        confirmButtonText: '确定还原',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$emit('reset-default')
        this.drawerVisible = false
      }).catch(() => {})
    }
  }
}
</script>

<style scoped>
.config-drawer .el-drawer__body {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
}
.config-tabs {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 16px;
}
.config-tabs .el-tabs__content {
  padding-bottom: 60px;
}
.config-tabs .el-tab-pane {
  padding-bottom: 60px;
}
.tab-tip {
  font-size: 12px;
  color: #909399;
  margin-bottom: 12px;
  line-height: 1.6;
}
.tab-tip i {
  margin-right: 4px;
}
.select-all-row {
  margin-bottom: 10px;
  padding: 6px 12px;
  border-bottom: 1px solid #ebeef5;
}
.config-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  margin-bottom: 6px;
  background: #fff;
  transition: box-shadow 0.2s;
}
.config-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.column-visible-check {
  flex: 1;
}
.config-item-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.width-input {
  width: 100px;
}
.width-input .el-input__inner {
  padding-left: 8px;
  padding-right: 28px;
}
.freeze-icon {
  font-size: 12px;
  color: #c0c4cc;
  cursor: pointer;
  transition: color 0.2s;
  font-style: normal;
  user-select: none;
}
.freeze-icon:hover {
  color: #409eff;
}
.freeze-icon.is-active {
  color: #409eff;
}
.freeze-right.is-active {
  color: #e6a23c;
}
.drag-handle {
  cursor: grab;
  color: #c0c4cc;
  font-size: 16px;
}
.drag-handle:active {
  cursor: grabbing;
}
.ghost {
  opacity: 0.5;
  background: #ecf5ff;
}
.field-label {
  flex: 1;
}
.field-type-tag {
  font-size: 12px;
  color: #909399;
  background: #f4f4f5;
  padding: 2px 8px;
  border-radius: 3px;
  margin-left: 8px;
}
.scheme-list {
  padding-top: 4px;
}
.scheme-item {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 10px;
  background: #fafafa;
}
.scheme-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.scheme-name-text {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  cursor: pointer;
}
.scheme-name-text:hover {
  color: #409eff;
}
.scheme-name-input {
  flex: 1;
  margin-right: 8px;
}
.scheme-header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}
.scheme-rename-btn {
  color: #909399 !important;
}
.scheme-rename-btn:hover {
  color: #409eff !important;
}
.scheme-delete-btn {
  color: #f56c6c !important;
  margin-left: 8px;
}
.scheme-desc {
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.5;
}
.scheme-desc-label {
  color: #909399;
  margin-right: 4px;
}
.scheme-desc-value {
  color: #606266;
}
.scheme-desc-value.empty {
  color: #c0c4cc;
  font-style: italic;
}
.scheme-empty-tip {
  text-align: center;
  color: #c0c4cc;
  font-size: 13px;
  padding: 24px 0;
}
.drawer-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  background: #fff;
  border-top: 1px solid #ebeef5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 10;
}
.footer-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>