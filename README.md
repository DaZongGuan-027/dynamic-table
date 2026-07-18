# dynamic-table-vue2-element

基于 Vue2 + Element UI 的动态配置表格组件，支持动态列配置、冻结列（左右可选）、筛选、排序、分页、筛选方案保存、金额格式化、可配置操作列等功能。

## 安装

```bash
npm install dynamic-table-vue2-element
```

### 前置依赖

确保项目中已安装以下依赖：

```bash
npm install vue@^2.6.0 element-ui@^2.15.0 vuedraggable@^2.24.0
```

## 引入

### 全局注册

```js
import Vue from 'vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import DynamicTable from 'dynamic-table-vue2-element'
import 'dynamic-table-vue2-element/lib/dynamic-table.css'

Vue.use(ElementUI)
Vue.use(DynamicTable)
```

### 按需引入

```js
import DynamicTable from 'dynamic-table-vue2-element'
import 'dynamic-table-vue2-element/lib/dynamic-table.css'

export default {
  components: { DynamicTable }
}
```

## 基础用法

```vue
<template>
  <dynamic-table
    menu-id="M001"
    user-id="U10001"
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
    </template>

    <template #column-status="{ row }">
      <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="mini">
        {{ row.status === 1 ? '启用' : '禁用' }}
      </el-tag>
    </template>
  </dynamic-table>
</template>

<script>
import { fetchUserList, getTableConfig, saveTableConfig } from '@/api/table'

export default {
  data() {
    return {
      actions: [
        { label: '查看', action: 'view' },
        { label: '编辑', action: 'edit' },
        { label: '删除', action: 'delete', style: { color: '#f56c6c' } }
      ],
      fieldMetaList: [
        { fieldKey: 'username', fieldLabel: '用户名', fieldType: 'string', filterable: true, sortable: true, width: 120, align: 'left' },
        { fieldKey: 'age', fieldLabel: '年龄', fieldType: 'number', filterable: true, sortable: true, width: 80, align: 'center' },
        { fieldKey: 'status', fieldLabel: '状态', fieldType: 'enum', filterable: true, sortable: true, width: 100, align: 'center',
          enumValues: [{ label: '启用', value: 1 }, { label: '禁用', value: 0 }]
        },
        { fieldKey: 'birthday', fieldLabel: '生日', fieldType: 'date', filterable: true, sortable: true, width: 120, align: 'center' },
        { fieldKey: 'salary', fieldLabel: '薪资', fieldType: 'currency', filterable: true, sortable: true, width: 130, align: 'right' },
        { fieldKey: 'department', fieldLabel: '部门', fieldType: 'string', filterable: true, sortable: true, width: 120, align: 'center',
          enumValues: { '001': '技术部', '002': '市场部', '003': '人事部' }
        },
        { fieldKey: 'createTime', fieldLabel: '创建时间', fieldType: 'date', filterable: true, sortable: true, width: 170, align: 'center' }
      ]
    }
  },
  methods: {
    fetchDataFn(params) {
      return fetchUserList(params)
    },
    loadConfigFn(menuId, userId) {
      return getTableConfig(menuId, userId)
    },
    saveConfigFn(config) {
      return saveTableConfig(config)
    },
    handleSelectionChange(selection) {
      console.log('选中行:', selection)
    },
    handleRowAction({ action, row }) {
      if (action === 'view') console.log('查看:', row)
      if (action === 'edit') console.log('编辑:', row)
      if (action === 'delete') console.log('删除:', row)
    }
  }
}
</script>
```

## API

### Props

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| menuId | String | 是 | - | 菜单ID，用于配置隔离 |
| userId | String | 是 | - | 用户ID，用于配置隔离 |
| fieldMetaList | Array | 是 | - | 字段元数据列表，定义表格列 |
| fetchDataFn | Function | 是 | - | 数据查询函数，接收 params 参数，返回 Promise `{ list, total }` |
| loadConfigFn | Function | 否 | null | 加载配置函数，接收 (menuId, userId)，返回 Promise 配置对象 |
| saveConfigFn | Function | 否 | null | 保存配置函数，接收 config 对象，返回 Promise |
| rowKey | String | 否 | 'id' | 行数据唯一标识字段 |
| border | Boolean | 否 | true | 是否显示边框 |
| stripe | Boolean | 否 | true | 是否斑马纹 |
| tableHeight | String/Number | 否 | undefined | 固定表格高度，不设置则自适应 |
| showSelection | Boolean | 否 | false | 是否显示选择框列 |
| showIndex | Boolean | 否 | false | 是否显示序号列 |
| showPagination | Boolean | 否 | true | 是否显示分页 |
| pageSizes | Array | 否 | [10,20,50,100] | 每页条数选项 |
| headerAlign | String | 否 | 'center' | 表头对齐方式，默认居中 |
| rowActions | Array | 否 | [] | 操作列按钮配置 |
| actionColumnWidth | String/Number | 否 | 150 | 操作列宽度 |

### fieldMetaList 字段定义

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| fieldKey | String | 是 | 字段唯一标识 |
| fieldLabel | String | 是 | 字段显示名称 |
| fieldType | String | 是 | 字段类型：`string` / `number` / `enum` / `date` / `boolean` / `currency` |
| filterable | Boolean | 否 | 是否可筛选 |
| sortable | Boolean | 否 | 是否可排序 |
| width | Number | 否 | 列宽 |
| align | String | 否 | 对齐方式：`left` / `center` / `right` |
| enumValues | Array/Object | 否 | 枚举值，支持数组 `[{ label, value }]` 或 Map `{ '001': '技术部' }` |
| frozenPosition | String | 否 | 冻结位置：`'left'` / `'right'`，不设置则不冻结 |

### fieldType 说明

| 类型 | 说明 |
|------|------|
| string | 文本，筛选时为输入框；有 enumValues 时自动变为下拉选择 |
| number | 数值，筛选时为范围输入（最小值-最大值） |
| currency | 金额，自动千分位格式化并保留两位小数，筛选同 number |
| enum | 枚举，筛选时为多选下拉，列展示自动显示 label |
| date | 日期，筛选时为日期范围选择器 |
| boolean | 布尔，筛选时为是/否下拉 |

### enumValues 格式

支持两种格式：

```js
// 数组格式
enumValues: [{ label: '启用', value: 1 }, { label: '禁用', value: 0 }]

// Map 格式（key 为实际值，value 为显示名称）
enumValues: { '001': '技术部', '002': '市场部', '003': '人事部' }
```

非 enum 类型字段配置了 enumValues 后，筛选面板和表头搜索也会自动使用下拉选择，列展示会自动做编码→名称映射。

### rowActions 配置

```js
rowActions: [
  { label: '查看', action: 'view' },
  { label: '编辑', action: 'edit' },
  { label: '删除', action: 'delete', style: { color: '#f56c6c' } }
]
```

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| label | String | 是 | 按钮文字 |
| action | String | 是 | 操作标识，用于事件回调中区分 |
| style | Object | 否 | 按钮自定义样式 |

操作列默认不冻结，可在配置抽屉中设置冻结到左侧或右侧。

### Events

| 事件名 | 参数 | 说明 |
|--------|------|------|
| selection-change | selection | 选中行变化时触发 |
| row-action | { action, row } | 操作列按钮点击时触发，action 为 rowActions 中配置的标识 |

### Slots

| 插槽名 | 作用域参数 | 说明 |
|--------|-----------|------|
| toolbar-left | - | 工具栏左侧按钮区域 |
| column-{fieldKey} | { row, value } | 自定义列内容渲染 |

### fetchDataFn 参数格式

```js
{
  page: 1,
  pageSize: 10,
  filters: {          // 筛选面板 + 表头搜索的合并条件
    username: '张',
    status: [1],
    age: { min: 20, max: 40 },
    salary: { min: 5000, max: 20000 },
    birthday: { start: '2024-01-01', end: '2024-12-31' }
  },
  sortBy: 'createTime',
  sortOrder: 'descending'
}
```

### fetchDataFn 返回格式

```js
{
  list: [],    // 当前页数据
  total: 100   // 总条数
}
```

### loadConfigFn 返回格式

```js
{
  menuId: 'M001',
  userId: 'U10001',
  visibleFields: '["username","age","status"]',       // JSON 字符串
  frozenFields: '["username"]',
  frozenPositions: '{"username":"left","balance":"right"}',
  filterFields: '["username","status"]',
  columnOrder: '["username","age","status"]',
  filterSchemes: '[{"name":"方案1","filterValues":{}}]'
}
```

### saveConfigFn 接收格式

与 loadConfigFn 返回格式一致。

## 功能说明

### 列配置
- 勾选展示列，拖拽调整顺序
- 两个冻结按钮（◀左 / ▶右），点击激活，再次点击取消，左右互斥
- 序号列、选择框列、操作列也支持冻结配置
- 冻结位置持久化保存

### 金额类型
- `fieldType: 'currency'` 自动千分位格式化，保留两位小数
- 如 `50000` 显示为 `50,000.00`
- 筛选和表头搜索同 number 类型

### 操作列
- 通过 `rowActions` 配置操作按钮，无需手写 slot
- 点击触发 `@row-action` 事件，通过 `action` 标识区分操作类型
- 操作列默认不冻结，可在配置抽屉中设置冻结方向

### 编码映射
- `enumValues` 支持数组格式和 Map 格式
- 非 enum 字段配置 `enumValues` 后，列展示自动做编码→名称映射
- 筛选面板和表头搜索自动使用下拉选择替代输入框

### 表头对齐
- `headerAlign` 属性控制表头默认对齐方式，默认 `'center'`
- 各列仍可通过 `align` 单独设置数据对齐方式

### 筛选配置
- 勾选需要作为筛选项的字段，拖拽调整顺序
- 筛选面板根据字段类型自动生成对应控件
- 筛选区域超过3行自动出现滚动条

### 筛选方案
- 最多保存5个常用筛选方案
- 使用方案后修改筛选值，保存时提示覆盖或新建
- 重置按钮同时清除筛选面板条件、表头搜索条件和排序

### 表头搜索
- 点击表头名称弹出下拉菜单，支持排序和搜索
- 排序三态切换：升序 → 降序 → 无
- 日期类型选择完开始和结束日期后自动触发搜索
- 表头搜索条件与筛选面板条件合并后一起传给 fetchDataFn

### 分页
- 固定在表格底部，不随数据高度变化
