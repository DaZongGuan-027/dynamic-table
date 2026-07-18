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
    :field-meta-list="fieldMetaList"
    :fetch-data-fn="fetchDataFn"
    :load-config-fn="loadConfigFn"
    :save-config-fn="saveConfigFn"
    row-key="id"
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
      fieldMetaList: [
        { fieldKey: '__selection', fieldLabel: '选择框', fieldType: 'selection', width: 50 },
        { fieldKey: '__index', fieldLabel: '序号', fieldType: 'index', width: 50 },
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
        { fieldKey: 'createTime', fieldLabel: '创建时间', fieldType: 'date', filterable: true, sortable: true, width: 170, align: 'center' },
        { fieldKey: '__actions', fieldLabel: '操作', fieldType: 'actions', width: 150, actions: [
          { label: '查看', action: 'view' },
          { label: '编辑', action: 'edit' },
          { label: '删除', action: 'delete', style: { color: '#f56c6c' } }
        ]}
      ]
    }
  },
  methods: {
    fetchDataFn(params) {
      return fetchUserList(params)
    },
    loadConfigFn(menuId) {
      return getTableConfig(menuId)
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
| fieldMetaList | Array | 是 | - | 字段元数据列表，定义表格列（含选择框、序号、操作列等特殊列） |
| fetchDataFn | Function | 是 | - | 数据查询函数，接收 params 参数，返回 Promise `{ list, total }` |
| loadConfigFn | Function | 否 | null | 加载配置函数，接收 menuId，返回 Promise 配置对象 |
| saveConfigFn | Function | 否 | null | 保存配置函数，接收 config 对象，返回 Promise |
| rowKey | String | 否 | 'id' | 行数据唯一标识字段 |
| border | Boolean | 否 | true | 是否显示边框 |
| stripe | Boolean | 否 | true | 是否斑马纹 |
| tableHeight | String/Number | 否 | undefined | 固定表格高度，不设置则自适应 |
| showPagination | Boolean | 否 | true | 是否显示分页 |
| pageSizes | Array | 否 | [10,20,50,100] | 每页条数选项 |
| headerAlign | String | 否 | 'center' | 表头对齐方式，默认居中 |
| actionColumnWidth | String/Number | 否 | 150 | 操作列默认宽度（当 fieldMetaList 中 actions 列未指定 width 时生效） |

### fieldMetaList 字段定义

#### 数据列

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

#### 特殊列

特殊列（选择框、序号、操作列）通过 `fieldType` 统一管理，在 `fieldMetaList` 中声明即可，支持显隐、排序、宽度调整和冻结配置。

| fieldType | fieldKey（推荐） | 说明 | 额外属性 |
|-----------|------------------|------|----------|
| `selection` | `__selection` | 选择框列，触发 `selection-change` 事件 | `width`：列宽，默认 50 |
| `index` | `__index` | 序号列，显示行号 | `width`：列宽，默认 50 |
| `actions` | `__actions` | 操作列，通过 `actions` 属性配置按钮 | `actions`：按钮数组，`width`：列宽，默认使用 `actionColumnWidth` prop |

**actions 按钮配置**：

```js
{ fieldKey: '__actions', fieldLabel: '操作', fieldType: 'actions', width: 150, actions: [
  { label: '查看', action: 'view' },
  { label: '编辑', action: 'edit' },
  { label: '删除', action: 'delete', style: { color: '#f56c6c' } }
]}
```

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| label | String | 是 | 按钮文字 |
| action | String | 是 | 操作标识，用于 `row-action` 事件回调中区分 |
| style | Object | 否 | 按钮自定义样式 |

> 特殊列的 `fieldKey` 推荐使用 `__selection`、`__index`、`__actions` 前缀，组件内部通过 `fieldType` 识别。不声明对应 `fieldType` 的特殊列则不会显示。

### fieldType 说明

| 类型 | 说明 |
|------|------|
| selection | 选择框列，支持多选，触发 `selection-change` 事件 |
| index | 序号列，自动显示行号 |
| actions | 操作列，通过 `actions` 属性配置按钮，触发 `row-action` 事件 |
| string | 文本，筛选时为操作符下拉+输入框，默认"包含" |
| number | 数值，筛选时为操作符下拉+输入框，默认"等于" |
| currency | 金额，自动千分位格式化并保留两位小数，筛选同 number |
| enum | 枚举，筛选时为多选下拉，列展示自动显示 label |
| date | 日期，筛选时为日期范围选择器（含快捷按钮），自动拼接 00:00:00/23:59:59 |
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

### 操作列

- 通过 `fieldMetaList` 中 `fieldType: 'actions'` 的项配置操作按钮
- `actions` 数组中每个按钮通过 `action` 标识区分，点击触发 `@row-action` 事件
- 操作列默认不冻结，可在配置抽屉中设置冻结方向
- 操作列支持显隐、排序、宽度调整，与其他列统一管理

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
    username: { operator: 'contains', value: '张' },  // 字符串：操作符+值
    status: [1],                                        // 枚举：多选值数组
    age: { operator: 'eq', value: 25 },                 // 数值：操作符+值
    salary: { operator: 'gte', value: 5000 },           // 金额：操作符+值
    birthday: { start: '2024-01-01 00:00:00', end: '2024-12-31 23:59:59' },  // 日期：自动拼接时间
    isActive: true                                       // 布尔：直接传值
  },
  sortBy: 'createTime',
  sortOrder: 'descending'
}
```

#### 筛选操作符说明

| 操作符值 | 含义 | 适用类型 |
|----------|------|----------|
| eq | 等于 | string, number, currency |
| neq | 不等于 | string |
| gt | 大于 | string, number, currency |
| lt | 小于 | string, number, currency |
| gte | 大于等于 | number, currency |
| lte | 小于等于 | number, currency |
| contains | 包含 | string, number, currency |
| notContains | 不包含 | string, number, currency |

> 字符串类型默认操作符为 `contains`，数值/金额类型默认操作符为 `eq`

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

  visibleFields: '["username","age","status"]',       // JSON 字符串
  frozenFields: '["username"]',
  frozenPositions: '{"username":"left","balance":"right"}',
  columnWidths: '{"username":120,"age":80}',           // 列宽配置
  filterFields: '["username","status"]',
  columnOrder: '["username","age","status"]',
  filterSchemes: '[{"name":"方案1","filterValues":{}}]'
}
```

### saveConfigFn 接收格式

与 loadConfigFn 返回格式一致。

## 功能说明

### 表头配置
- 勾选展示列，拖拽调整顺序
- 每列可配置宽度，最小值 50
- 两个冻结按钮（◀左 / ▶右），点击激活，再次点击取消，左右互斥
- 选择框列（`selection`）、序号列（`index`）、操作列（`actions`）也支持显隐、排序、冻结配置和宽度调整
- 冻结位置和列宽持久化保存

### 金额类型
- `fieldType: 'currency'` 自动千分位格式化，保留两位小数
- 如 `50000` 显示为 `50,000.00`
- 筛选和表头搜索同 number 类型

### 操作列
- 通过 `fieldMetaList` 中 `fieldType: 'actions'` 配置操作按钮，无需手写 slot
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
- 字符串/数值/金额类型：操作符下拉 + 值输入框
- 日期类型：日期范围选择器，含快捷按钮（本月、上月、近三个月、本年、重置）
- 日期筛选值自动拼接时间：开始日期拼接 `00:00:00`，结束日期拼接 `23:59:59`
- 筛选区域超过3行自动出现滚动条

### 筛选方案
- 最多保存5个常用筛选方案
- 支持修改方案名称（点击名称或编辑图标）
- 使用方案后修改筛选值，保存时提示覆盖或新建
- 重置按钮同时清除筛选面板条件、表头搜索条件和排序

### 还原默认配置
- 配置抽屉底部提供"还原默认"按钮
- 点击后二次确认，确认后将所有配置还原为初始化状态
- 还原内容包括：表头显隐/顺序/冻结/列宽、筛选字段配置、筛选方案
- 同时清除浏览器中当前菜单的本地缓存
- 还原后立即生效，表格自动刷新

### 表头搜索
- 点击表头名称弹出下拉菜单，支持排序和搜索
- 排序三态切换：升序 → 降序 → 无
- 字符串/数值/金额类型搜索支持操作符选择
- 日期类型搜索使用日期范围选择器，含快捷按钮
- 表头搜索条件与筛选面板条件合并后一起传给 fetchDataFn

### 分页
- 固定在表格底部，不随数据高度变化

## 后端接口设计

### 1. 保存配置接口

**请求方式**：`POST /api/table/config`

**请求参数**：

```json
{
  "menuId": "M001",

  "visibleFields": "[\"username\",\"age\",\"status\"]",
  "frozenFields": "[\"username\"]",
  "frozenPositions": "{\"username\":\"left\"}",
  "columnWidths": "{\"username\":120,\"age\":80}",
  "filterFields": "[\"username\",\"status\"]",
  "columnOrder": "[\"username\",\"age\",\"status\"]",
  "filterSchemes": "[{\"name\":\"方案1\",\"filterValues\":{\"username\":{\"operator\":\"contains\",\"value\":\"张\"}}}]"
}
```

**响应格式**：

```json
{
  "code": 200,
  "message": "success",
  "data": null
}
```

**设计要点**：
- 以 `menuId` 作为配置标识，`userId` 由后端从登录态（Token/Session）中获取，前端不传递
- 同一用户同一菜单只保存一份配置
- 所有数组/对象字段以 JSON 字符串存储，后端无需解析，直接存取即可
- `columnWidths` 存储用户自定义的列宽，key 为 fieldKey，value 为像素值
- `filterSchemes` 中的 `filterValues` 结构与 `fetchDataFn` 的 `filters` 参数一致
- 建议使用 `INSERT ... ON DUPLICATE KEY UPDATE` 或 `UPSERT` 语义实现保存

**数据库表设计参考**：

```sql
CREATE TABLE t_table_config (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  menu_id VARCHAR(64) NOT NULL COMMENT '菜单ID',
  user_id VARCHAR(64) NOT NULL COMMENT '用户ID，后端从登录态获取',
  visible_fields TEXT COMMENT '可见字段JSON',
  frozen_fields TEXT COMMENT '冻结字段JSON',
  frozen_positions TEXT COMMENT '冻结位置JSON',
  column_widths TEXT COMMENT '列宽配置JSON',
  filter_fields TEXT COMMENT '筛选字段JSON',
  column_order TEXT COMMENT '列顺序JSON',
  filter_schemes TEXT COMMENT '筛选方案JSON',
  created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_menu_user (menu_id, user_id)
);
```

### 2. 查询配置接口

**请求方式**：`GET /api/table/config/{menuId}`

**响应格式**：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "menuId": "M001",
    "visibleFields": "[\"username\",\"age\",\"status\"]",
    "frozenFields": "[\"username\"]",
    "frozenPositions": "{\"username\":\"left\"}",
    "columnWidths": "{\"username\":120,\"age\":80}",
    "filterFields": "[\"username\",\"status\"]",
    "columnOrder": "[\"username\",\"age\",\"status\"]",
    "filterSchemes": "[{\"name\":\"方案1\",\"filterValues\":{}}]"
  }
}
```

**设计要点**：
- 无配置时返回 `null` 或空对象，组件会使用默认配置
- 返回的 JSON 字符串由前端解析，后端无需处理

### 3. 列表数据查询接口

**请求方式**：`POST /api/table/data`

**请求参数**：

```json
{
  "page": 1,
  "pageSize": 10,
  "filters": {
    "username": { "operator": "contains", "value": "张" },
    "status": [1, 2],
    "age": { "operator": "gte", "value": 20 },
    "salary": { "operator": "lte", "value": 50000 },
    "birthday": { "start": "2024-01-01 00:00:00", "end": "2024-12-31 23:59:59" },
    "isActive": true
  },
  "sortBy": "createTime",
  "sortOrder": "descending"
}
```

**响应格式**：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      { "id": 1, "username": "张三", "age": 25, "status": 1, "birthday": "2024-01-15", "salary": 8000, "isActive": true, "createTime": "2024-06-01 10:00:00" }
    ],
    "total": 100
  }
}
```

**后端筛选条件处理逻辑**：

| 字段类型 | filters 结构 | 后端处理方式 |
|----------|-------------|-------------|
| string | `{ operator, value }` | 根据 operator 拼接 SQL：`eq` → `=`, `neq` → `!=`, `contains` → `LIKE %val%`, `notContains` → `NOT LIKE %val%`, `gt` → `>`, `lt` → `<` |
| number/currency | `{ operator, value }` | 根据 operator 拼接 SQL：`eq` → `=`, `gt` → `>`, `lt` → `<`, `gte` → `>=`, `lte` → `<=`, `contains` → `LIKE %val%`, `notContains` → `NOT LIKE %val%` |
| enum | `[value1, value2]` | `IN (value1, value2)` |
| date | `{ start, end }` | `start` 已拼接 `00:00:00`，`end` 已拼接 `23:59:59`，直接用 `BETWEEN start AND end` |
| boolean | `true/false` | `= true` 或 `= false` |

**设计要点**：
- `filters` 中的 key 为 `fieldKey`，后端需映射为实际数据库字段名
- 日期筛选值前端已自动拼接时间后缀，后端可直接用于范围查询
- 枚举类型值为数组，后端使用 `IN` 查询
- 排序字段 `sortBy` 需映射为数据库字段名，`sortOrder` 为 `ascending` / `descending`
- 建议对 `filters` 中的值做 SQL 注入防护（参数化查询）
