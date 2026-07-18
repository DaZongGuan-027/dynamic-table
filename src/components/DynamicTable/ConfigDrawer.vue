<template>
  <el-drawer
    title="表格配置"
    :visible.sync="drawerVisible"
    direction="rtl"
    size="420px"
    :before-close="handleClose"
    append-to-body
    custom-class="config-drawer"
  >
    <el-tabs v-model="activeTab" class="config-tabs">
      <el-tab-pane label="列配置" name="column">
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
              <el-tooltip :content="item.frozen ? '取消冻结' : '冻结该列'" placement="top" :open-delay="300">
                <i
                  class="freeze-icon"
                  :class="item.frozen ? 'el-icon-lock is-frozen' : 'el-icon-unlock'"
                  @click="item.visible && (item.frozen = !item.frozen)"
                ></i>
              </el-tooltip>
              <i class="el-icon-rank drag-handle"></i>
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
              <i class="el-icon-rank drag-handle"></i>
            </div>
          </div>
        </draggable>
      </el-tab-pane>

      <el-tab-pane label="筛选方案" name="scheme">
        <div class="tab-tip">
          <i class="el-icon-info"></i>
          管理已保存的筛选方案。新增方案请在筛选面板中点击"保存为方案"按钮。
        </div>
        <div class="scheme-list">
          <div
            v-for="(scheme, index) in editSchemes"
            :key="index"
            class="scheme-item"
          >
            <div class="scheme-header">
              <span class="scheme-name-text">{{ scheme.name || '方案' + (index + 1) }}</span>
              <el-button
                type="text"
                icon="el-icon-delete"
                size="mini"
                class="scheme-delete-btn"
                @click="removeScheme(index)"
              />
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
      <el-button @click="handleClose" size="small">取 消</el-button>
      <el-button type="primary" @click="handleConfirm" size="small">保 存</el-button>
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
    filterFields: { type: Array, default: () => [] },
    columnOrder: { type: Array, default: () => [] },
    filterSchemes: { type: Array, default: () => [] },
    currentFilterValues: { type: Object, default: () => ({}) },
    showSelection: { type: Boolean, default: false },
    showIndex: { type: Boolean, default: false }
  },

  data() {
    return {
      activeTab: 'column',
      editColumnList: [],

      editFilterList: [],
      editSchemes: []
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
        return visible.length > 0 && visible.every(i => i.frozen)
      },
      set() {}
    },

    freezeIndeterminate() {
      const visible = this.editColumnList.filter(i => i.visible)
      const checked = visible.filter(i => i.frozen).length
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
      if (this.showSelection) {
        columnList.unshift({
          fieldKey: '__selection',
          fieldLabel: '选择框',
          visible: true,
          frozen: this.frozenFields.includes('__selection'),
          isSpecial: true
        })
      }
      if (this.showIndex) {
        columnList.unshift({
          fieldKey: '__index',
          fieldLabel: '序号',
          visible: true,
          frozen: this.frozenFields.includes('__index'),
          isSpecial: true
        })
      }
      allKeys.forEach(key => {
        const meta = this.fieldMetaList.find(f => f.fieldKey === key)
        columnList.push({
          fieldKey: key,
          fieldLabel: meta ? meta.fieldLabel : key,
          visible: this.visibleFields.includes(key),
          frozen: this.frozenFields.includes(key),
          isSpecial: false
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
        boolean: '布尔'
      }
      return map[type] || type
    },

    handleColumnAllChange(val) {
      this.editColumnList.forEach(item => {
        item.visible = val
        if (!val) item.frozen = false
      })
    },

    handleFreezeAllChange(val) {
      this.editColumnList.filter(i => i.visible).forEach(item => { item.frozen = val })
    },

    handleVisibleChange(item) {
      if (!item.visible) item.frozen = false
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
    },

    hasActiveFilter(filterValues) {
      if (!filterValues) return false
      return Object.keys(filterValues).some(key => {
        const val = filterValues[key]
        if (val === null || val === undefined || val === '') return false
        if (typeof val === 'object' && !Array.isArray(val)) {
          return Object.values(val).some(v => v !== null && v !== undefined && v !== '')
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
          if (val.min !== '' && val.min !== null && val.min !== undefined) subParts.push('≥' + val.min)
          if (val.max !== '' && val.max !== null && val.max !== undefined) subParts.push('≤' + val.max)
          if (val.start) subParts.push('从' + val.start)
          if (val.end) subParts.push('至' + val.end)
          if (subParts.length > 0) parts.push(meta.fieldLabel + subParts.join(' '))
        } else if (Array.isArray(val)) {
          if (val.length > 0) {
            const labels = val.map(v => {
              const found = (meta.enumValues || []).find(e => e.value === v)
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
      const visibleFields = this.editColumnList.filter(i => i.visible && !i.isSpecial).map(i => i.fieldKey)
      const columnOrder = this.editColumnList.filter(i => !i.isSpecial).map(i => i.fieldKey)
      const frozenFields = this.editColumnList.filter(i => i.visible && i.frozen).map(i => i.fieldKey)
      const filterFields = this.editFilterList.filter(i => i.checked).map(i => i.fieldKey)
      const filterSchemes = this.editSchemes.map(s => ({
        name: s.name,
        filterValues: s.filterValues
      }))

      this.$emit('confirm', {
        visibleFields,
        columnOrder,
        frozenFields,
        filterFields,
        filterSchemes
      })
      this.drawerVisible = false
    },

    handleClose() {
      this.drawerVisible = false
    }
  }
}
</script>

<style scoped>
.config-drawer .el-drawer__body {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.config-tabs {
  flex: 1;
  overflow: auto;
  padding: 0 16px;
}
.config-tabs .el-tabs__content {
  padding-bottom: 80px;
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
.freeze-icon {
  font-size: 14px;
  color: #c0c4cc;
  cursor: pointer;
  transition: color 0.2s;
}
.freeze-icon:hover {
  color: #409eff;
}
.freeze-icon.is-frozen {
  color: #409eff;
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
  text-align: right;
  z-index: 10;
}
</style>