<template>
  <dynamic-table
    menu-id="M002"
    :user-id="userId"
    :field-meta-list="fieldMetaList"
    :fetch-data-fn="fetchDataFn"
    :load-config-fn="loadConfigFn"
    :save-config-fn="saveConfigFn"
    row-key="id"
    :show-selection="true"
    :show-index="true"
    :row-actions="actions"
    action-column-fixed="right"
    @selection-change="handleSelectionChange"
    @row-action="handleRowAction"
  >
    <template #toolbar-left>
      <el-button type="primary" icon="el-icon-download" size="small">导出</el-button>
    </template>

  </dynamic-table>
</template>

<script>
import DynamicTable from '../components/DynamicTable/index.vue'
import { getAccountingData, getTableConfig, saveTableConfig } from '../mock/api'

export default {
  name: 'AccountingQuery',

  components: { DynamicTable },

  data() {
    return {
      userId: 'U10001',
      selectedRows: [],
      actions: [
        { label: '查看凭证', action: 'view' },
        { label: '修改', action: 'edit' },
        { label: '删除', action: 'delete', style: { color: '#f56c6c' } }
      ],

      fieldMetaList: [
        {
          fieldKey: 'voucherNo',
          fieldLabel: '凭证字号',
          fieldType: 'string',
          filterable: true,
          sortable: true,
          width: 140,
          align: 'left'
        },
        {
          fieldKey: 'accountDate',
          fieldLabel: '记账日期',
          fieldType: 'date',
          filterable: true,
          sortable: true,
          width: 110,
          align: 'center'
        },
        {
          fieldKey: 'period',
          fieldLabel: '会计期间',
          fieldType: 'string',
          filterable: true,
          sortable: true,
          width: 100,
          align: 'center'
        },
        {
          fieldKey: 'subjectCode',
          fieldLabel: '科目编码',
          fieldType: 'string',
          filterable: true,
          sortable: true,
          width: 100,
          align: 'left'
        },
        {
          fieldKey: 'subjectName',
          fieldLabel: '科目名称',
          fieldType: 'string',
          filterable: true,
          sortable: true,
          width: 120,
          align: 'left'
        },
        {
          fieldKey: 'summary',
          fieldLabel: '摘要',
          fieldType: 'string',
          filterable: true,
          sortable: false,
          width: 180,
          align: 'left'
        },
        {
          fieldKey: 'debitAmount',
          fieldLabel: '借方金额',
          fieldType: 'currency',
          filterable: true,
          sortable: true,
          width: 120,
          align: 'right'
        },
        {
          fieldKey: 'creditAmount',
          fieldLabel: '贷方金额',
          fieldType: 'currency',
          filterable: true,
          sortable: true,
          width: 120,
          align: 'right'
        },
        {
          fieldKey: 'balanceDirection',
          fieldLabel: '余额方向',
          fieldType: 'enum',
          filterable: true,
          sortable: true,
          width: 90,
          align: 'center',
          enumValues: [
            { label: '借', value: '借' },
            { label: '贷', value: '贷' }
          ]
        },
        {
          fieldKey: 'balance',
          fieldLabel: '余额',
          fieldType: 'currency',
          filterable: true,
          sortable: true,
          width: 130,
          align: 'right'
        },
        {
          fieldKey: 'accountingEntity',
          fieldLabel: '核算主体',
          fieldType: 'enum',
          filterable: true,
          sortable: true,
          width: 100,
          align: 'center',
          enumValues: [
            { label: '总公司', value: '总公司' },
            { label: '分公司一', value: '分公司一' }
          ]
        },
        {
          fieldKey: 'currency',
          fieldLabel: '币种',
          fieldType: 'enum',
          filterable: true,
          sortable: true,
          width: 80,
          align: 'center',
          enumValues: [
            { label: 'CNY', value: 'CNY' },
            { label: 'USD', value: 'USD' },
            { label: 'EUR', value: 'EUR' }
          ]
        },
        {
          fieldKey: 'auxiliaryItem',
          fieldLabel: '辅助核算',
          fieldType: 'string',
          filterable: true,
          sortable: false,
          width: 120,
          align: 'left'
        },
        {
          fieldKey: 'maker',
          fieldLabel: '制单人',
          fieldType: 'string',
          filterable: true,
          sortable: true,
          width: 80,
          align: 'center'
        },
        {
          fieldKey: 'reviewer',
          fieldLabel: '审核人',
          fieldType: 'string',
          filterable: true,
          sortable: true,
          width: 80,
          align: 'center'
        },
        {
          fieldKey: 'bookkeeper',
          fieldLabel: '记账人',
          fieldType: 'string',
          filterable: true,
          sortable: true,
          width: 80,
          align: 'center'
        }
      ]
    }
  },

  methods: {
    fetchDataFn(params) {
      return getAccountingData(params)
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
        this.$message.info('查看凭证: ' + row.voucherNo)
      } else if (action === 'edit') {
        this.$message.info('修改: ' + row.voucherNo)
      } else if (action === 'delete') {
        this.$confirm('确认删除凭证 ' + row.voucherNo + '？', '提示', { type: 'warning' })
          .then(() => { this.$message.success('已删除') })
          .catch(() => {})
      }
    }
  }
}
</script>

<style scoped>
.amount {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', monospace;
  font-size: 13px;
}
.debit {
  color: #e6a23c;
}
.credit {
  color: #67c23a;
}
</style>
