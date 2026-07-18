<template>
  <dynamic-table
    menu-id="M001"
    :user-id="userId"
    :field-meta-list="fieldMetaList"
    :fetch-data-fn="fetchDataFn"
    :load-config-fn="loadConfigFn"
    :save-config-fn="saveConfigFn"
    row-key="id"
    :show-selection="true"
    :show-index="true"
    :row-actions="actions"
    @selection-change="handleSelectionChange"
    @row-action="handleRowAction"
  >
    <template #toolbar-left>
      <el-button type="primary" icon="el-icon-plus" size="small">新增</el-button>
      <el-button type="danger" icon="el-icon-delete" size="small" :disabled="!selectedRows.length">批量删除</el-button>
    </template>

    <template #column-status="{ row }">
      <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="mini">
        {{ row.status === 1 ? '启用' : '禁用' }}
      </el-tag>
    </template>

    <template #column-role="{ row }">
      <el-tag :type="row.role === 'admin' ? 'warning' : 'info'" size="mini">
        {{ row.role === 'admin' ? '管理员' : '普通用户' }}
      </el-tag>
    </template>
  </dynamic-table>
</template>

<script>
import DynamicTable from '../components/DynamicTable/index.vue'
import { getTableData, getTableConfig, saveTableConfig } from '../mock/api'

export default {
  name: 'UserManagement',

  components: { DynamicTable },

  data() {
    return {
      userId: 'U10001',
      selectedRows: [],
      actions: [
        { label: '查看', action: 'view' },
        { label: '编辑', action: 'edit' },
        { label: '删除', action: 'delete', style: { color: '#f56c6c' } }
      ],

      fieldMetaList: [
        { fieldKey: 'username', fieldLabel: '用户名', fieldType: 'string', filterable: true, sortable: true, width: 120, align: 'left' },
        { fieldKey: 'age', fieldLabel: '年龄', fieldType: 'number', filterable: true, sortable: true, width: 80, align: 'center' },
        { fieldKey: 'status', fieldLabel: '状态', fieldType: 'enum', filterable: true, sortable: true, width: 100, align: 'center', enumValues: [{ label: '启用', value: 1 }, { label: '禁用', value: 0 }] },
        { fieldKey: 'birthday', fieldLabel: '生日', fieldType: 'date', filterable: true, sortable: true, width: 120, align: 'center' },
        { fieldKey: 'email', fieldLabel: '邮箱', fieldType: 'string', filterable: true, sortable: false, width: 200, align: 'left' },
        { fieldKey: 'role', fieldLabel: '角色', fieldType: 'enum', filterable: true, sortable: true, width: 120, align: 'center', enumValues: [{ label: '管理员', value: 'admin' }, { label: '普通用户', value: 'user' }] },
        { fieldKey: 'department', fieldLabel: '部门', fieldType: 'enum', filterable: true, sortable: true, width: 120, align: 'center', enumValues: [{ label: '技术部', value: '技术部' }, { label: '市场部', value: '市场部' }, { label: '人事部', value: '人事部' }, { label: '财务部', value: '财务部' }, { label: '运营部', value: '运营部' }, { label: '管理层', value: '管理层' }] },
        { fieldKey: 'phone', fieldLabel: '手机号', fieldType: 'string', filterable: true, sortable: false, width: 130, align: 'center' },
        { fieldKey: 'createTime', fieldLabel: '创建时间', fieldType: 'date', filterable: true, sortable: true, width: 170, align: 'center' }
      ]
    }
  },

  methods: {
    fetchDataFn(params) {
      return getTableData(params)
    },

    loadConfigFn(menuId, userId) {
      return getTableConfig(menuId, userId)
    },

    saveConfigFn(config) {
      return saveTableConfig(config)
    },

    handleSelectionChange(selection) {
      this.selectedRows = selection
    },

    handleRowAction({ action, row }) {
      if (action === 'view') {
        this.$message.info('查看: ' + row.username)
      } else if (action === 'edit') {
        this.$message.info('编辑: ' + row.username)
      } else if (action === 'delete') {
        this.$confirm('确认删除用户 ' + row.username + '？', '提示', { type: 'warning' })
          .then(() => { this.$message.success('已删除') })
          .catch(() => {})
      }
    }
  }
}
</script>