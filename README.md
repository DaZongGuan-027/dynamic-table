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

> 组件包还具名导出了 `useTableConfig`、`useFilter` 两个内部 mixin（组件本身已集成，一般无需单独引入），供有定制需求的场景复用。

## 基础用法

```vue
<template>
  <dynamic-table
    menu-id="M001"
    :field-meta-list="fieldMetaList"
    :fetch-data-fn="fetchDataFn"
    :export-data-fn="exportDataFn"
    export-file-name="用户数据"
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
import { fetchUserList, exportUserList, getTableConfig, saveTableConfig } from '@/api/table'

export default {
  data() {
    return {
      fieldMetaList: [
        { fieldKey: '__selection', fieldLabel: '选择框', fieldType: 'selection', width: 50 },
        { fieldKey: '__index', fieldLabel: '序号', fieldType: 'index', width: 50 },
        { fieldKey: 'username', fieldLabel: '用户名', fieldType: 'string', filterable: true, sortable: true, width: 120, align: 'left' },
        { fieldKey: 'age', fieldLabel: '年龄', fieldType: 'number', filterable: true, sortable: true, width: 80, align: 'center' },
        { fieldKey: 'status', fieldLabel: '状态', fieldType: 'enum', filterable: true, sortable: true, filterMultiple: false, width: 100, align: 'center',
          enumValues: [{ label: '启用', value: 1 }, { label: '禁用', value: 0 }]
        },
        { fieldKey: 'birthday', fieldLabel: '生日', fieldType: 'date', filterable: true, sortable: true, width: 120, align: 'center' },
        { fieldKey: 'salary', fieldLabel: '薪资', fieldType: 'currency', filterable: true, sortable: true, width: 130, align: 'right' },
        { fieldKey: 'department', fieldLabel: '部门', fieldType: 'string', filterable: true, sortable: true, width: 120, align: 'center',
          enumValues: { '001': '技术部', '002': '市场部', '003': '人事部' }
        },
        { fieldKey: 'createTime', fieldLabel: '创建时间', fieldType: 'date', filterable: true, sortable: true, width: 170, align: 'center' },
        { fieldKey: '__actions', fieldLabel: '操作', fieldType: 'actions', width: 150, actions: [
          { label: '查看', action: 'view', icon: 'el-icon-view' },
          { label: '编辑', action: 'edit', type: 'primary', icon: 'el-icon-edit' },
          { label: '删除', action: 'delete', type: 'danger', icon: 'el-icon-delete' }
        ]}
      ]
    }
  },
  methods: {
    fetchDataFn(params) {
      return fetchUserList(params)
    },
    exportDataFn(params) {
      return exportUserList(params)
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

### 协议与兼容原则（必读）

以下规则以组件实际传给回调函数的参数为准，页面和后端不要再各自推断或重新组装协议：

1. **分页参数默认使用 `page`、`pageSize`。** 新接口应直接接收这两个默认字段。已有接口无需为了接入组件而改造：如果后端已经使用 `pageNum` 或其他字段名，通过 `pageParamName`、`pageSizeParamName` 配置组件即可。配置后，该名称就是组件实际输出的协议，后端必须按该名称接收。
2. **`fetchDataFn` 应原样透传组件参数。** 不要在页面内把 `page` 改成 `pageNum`，也不要把 `filters` 再包一层；参数名适配应通过组件 Props 完成。
3. **筛选结构必须按字段类型处理。** 文本/数值使用 `{ operator, value }`，区间使用 `{ range }`，单个日期或未转换的单月使用 `{ value }`，枚举和布尔使用标量或数组。后端不能把 `{ value }` 当作无效格式。
4. **操作符语义不可混用。** `eq` 是精确等于，`contains` 才是包含；文本字段只是默认选择 `contains`，不代表 `eq` 也按模糊查询处理。
5. **全量导出默认使用组件内置 `exportDataFn`。** 组件负责提交当前可见导出字段、字段顺序、合并后的筛选条件和排序条件，后端负责查询全部匹配数据并生成文件。业务可以通过 `toolbar-left` 另行实现特殊导出，但不要把它描述成组件默认导出协议。
6. **业务逻辑只读取公开方法。** 业务按钮需要使用当前筛选条件时调用 `this.$refs.dynamicTable.getFilters()`；不要直接访问 `filterValues`、`columnSearchValues` 等内部状态，因为公开方法才会返回筛选面板、表头搜索和万能筛选合并后的最终请求条件。

> “后端服从组件协议”指后端接收组件**最终输出**的字段名。默认输出是 `page/pageSize`；已有接口通过 Props 配置后可以继续使用原字段名，不要求存量接口改名。

### Props

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| menuId | String | 是 | - | 菜单ID，用于配置隔离 |
| fieldMetaList | Array | 是 | - | 字段元数据列表，定义表格列（含选择框、序号、操作列等特殊列） |
| fetchDataFn | Function | 是 | - | 数据查询函数，接收 params 参数，返回 Promise `{ list, total }` |
| dataResponseAdapter | Function | 否 | null | 自定义列表响应转换函数，将接口响应转换为 `{ list, total }` |
| exportDataFn | Function | 否 | null | 后端导出函数；接收当前字段、筛选和排序配置，返回 `Blob`、`{ blob, fileName }`、Axios Blob 响应或 `{ downloadUrl, fileName }` |
| dataErrorHandler | Function | 否 | null | 分页查询失败后的统一错误处理函数；失败时列表保留上一次成功查询的数据 |
| exportFileName | String | 否 | '表格数据' | 导出接口未返回文件名时使用的默认文件名 |
| loadConfigFn | Function | 否 | null | 加载配置函数，接收 menuId，返回 Promise 配置对象 |
| saveConfigFn | Function | 否 | null | 保存配置函数，接收 config 对象，返回 Promise |
| configResponseAdapter | Function | 否 | null | 自定义配置响应转换函数，将接口响应转换为配置对象或 `null` |
| configErrorHandler | Function | 否 | null | 配置加载失败后的统一错误处理函数 |
| rowKey | String | 否 | 'id' | 行数据唯一标识字段 |
| reserveSelection | Boolean | 否 | false | 是否跨分页保留勾选；开启时必须保证 `rowKey` 全局唯一 |
| border | Boolean | 否 | true | 是否显示边框 |
| stripe | Boolean | 否 | true | 是否斑马纹 |
| tableHeight | String/Number | 否 | undefined | 固定表格高度，不设置则自适应（flex 布局） |
| maxHeight | String/Number | 否 | undefined | 表格最大高度，作为 `tableHeight` 或自适应高度的上限，超出后表格内部滚动 |
| showPagination | Boolean | 否 | true | 是否显示分页 |
| pageSizes | Array | 否 | [10,50,100,500] | 每页条数选项；当前页面初始展示条数取其中最小值。配置界面允许 1～2000，后端允许的最大值应与业务传入的选项一致 |
| pageSizeParamName | String | 否 | 'pageSize' | 组件传给 `fetchDataFn` 的分页大小字段名；已有后端字段不同时在此适配 |
| pageParamName | String | 否 | 'page' | 组件传给 `fetchDataFn` 的页码字段名；已有后端使用 `pageNum` 时配置为 `pageNum` |
| queryDebounceDelay | Number | 否 | 300 | 点击查询的防抖等待时间（毫秒）；连续触发时只执行最后一次查询 |
| headerAlign | String | 否 | 'center' | 表头对齐方式，默认居中 |
| actionColumnWidth | String/Number | 否 | 150 | 操作列默认宽度 |
| defaultFilterValues | Object | 否 | {} | 筛选条件默认值 |
| filterCacheKey | String | 否 | '' | 筛选缓存 key，优先于 menuId |
| cacheFilters | Boolean | 否 | true | 是否将筛选条件缓存到浏览器 |
| filterPopperAppendToBody | Boolean | 否 | true | 筛选弹层是否挂载到 body |
| defaultVisibleFields | Array | 否 | [] | 默认展示的列字段，不传则全部展示 |
| defaultFilterFields | Array | 否 | [] | 默认展示的筛选项字段（筛选条件项的初始化值），需为 `filterable` 的字段；用户保存过筛选配置后以用户配置为准 |
| showSummary | Boolean | 否 | false | 是否显示合计行 |
| showUniversalFilter | Boolean | 否 | true | 是否显示万能筛选 |
| defaultParameterValues | Object | 否 | {} | 自定义参数的默认值；与 `parameter-config` 插槽配合使用，用户已保存的同名参数优先 |

### fieldMetaList 字段定义

#### 数据列

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| fieldKey | String | 是 | 字段唯一标识 |
| fieldLabel | String | 是 | 字段显示名称 |
| fieldType | String | 是 | 字段类型：`string` / `number` / `enum` / `date` / `boolean` / `currency` |
| filterable | Boolean | 否 | 是否可筛选 |
| sortable | Boolean | 否 | 是否可排序 |
| width | Number | 否 | 列最小宽度（使用 min-width，自动扩展填满容器） |
| minWidth | Number | 否 | 列最小宽度，仅在 `width` 未设置时生效（兜底值） |
| formatter | Function | 否 | 单元格展示格式化函数 `(value) => string`，在类型格式化之后执行 |
| exportable | Boolean | 否 | 是否允许导出，默认为 `true` |
| exportFieldKey | String | 否 | 后端导出使用的字段标识；未配置时与 `fieldKey` 相同 |
| exportFieldLabel | String | 否 | 导出列名；未配置时使用 `fieldLabel` |
| exportFormat | String | 否 | 传给后端的导出格式标识，例如日期或金额格式 |
| align | String | 否 | 对齐方式：`left` / `center` / `right` |
| enumValues | Array/Object | 否 | 枚举值，支持数组 `[{ label, value }]` 或 Map `{ '001': '技术部' }` |
| loadEnumOptions | Function | 否 | 枚举选项懒加载函数，首次打开下拉框时调用，接收 `{ fieldKey, keyword, selectedValues, signal }`；返回格式见下文 |
| enumRemote | Boolean | 否 | 默认 `false`；配合 `loadEnumOptions` 使用，开启后在“过滤”框输入内容会以 300ms 防抖重新请求远程选项 |
| filterMultiple | Boolean | 否 | 枚举下拉是否允许多选，默认 `true`；设为 `false` 时筛选面板、表头筛选和万能筛选均为单选 |
| frozenPosition | String | 否 | 冻结方向提示：`'left'` / `'right'`；列是否冻结仍由表格配置及已保存的 `frozenFields` 决定 |
| dateFilterType | String | 否 | 日期筛选类型：`daterange`（默认）/ `monthrange` / `month` / `date` |
| monthToDateRange | Boolean | 否 | 默认 `false`；当 `dateFilterType: 'month'` 时，设为 `true` 会将所选月份转换为当月月初至月末的 `{ range }` |
| dateFormat | String | 否 | 日期展示格式：`yyyy-MM-dd`（默认）/ `yyyy-MM` / `yyyy-MM-dd HH:mm:ss` |

字段元数据当前**不支持** Element UI 风格的 `fixed`、`visible`、`showOverflowTooltip` 作为逐列控制项：

- 初始显示列使用组件 Prop `defaultVisibleFields`；用户调整后的显示状态由表格配置保存。
- 冻结列通过“表格配置”设置并保存；`frozenPosition` 只用于表达冻结方向，不等同于 `fixed`。
- 数据列统一启用内容溢出提示，当前不提供逐列关闭或开启的 `showOverflowTooltip`。

迁移旧页面时应删除这些无效字段，避免使用者误以为配置已经生效。

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
  { label: '查看', action: 'view', icon: 'el-icon-view' },
  { label: '编辑', action: 'edit', type: 'primary', icon: 'el-icon-edit' },
  { label: '删除', action: 'delete', type: 'danger', icon: 'el-icon-delete' }
]}
```

| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| label | String | 是 | 按钮文字 |
| action | String | 是 | 操作标识，用于 `row-action` 事件回调中区分 |
| type | String | 否 | 按钮类型，默认 `text`。可选 `primary`/`success`/`warning`/`danger`/`info`/`text` 等 |
| icon | String | 否 | 按钮图标，如 `el-icon-edit`、`el-icon-delete` |
| style | Object | 否 | 按钮自定义样式 |
| visible | Boolean/Function | 否 | true | 是否显示该按钮，传函数 `(row) => boolean` 可按行动态控制 |
| disabled | Boolean/Function | 否 | false | 是否禁用该按钮，传函数 `(row) => boolean` 可按行动态控制 |

> 特殊列的 `fieldKey` 推荐使用 `__selection`、`__index`、`__actions` 前缀，组件内部通过 `fieldType` 识别。不声明对应 `fieldType` 的特殊列则不会显示。

### fieldType 说明

| 类型 | 说明 |
|------|------|
| selection | 选择框列，支持多选，触发 `selection-change` 事件 |
| index | 序号列，自动显示行号（从1开始） |
| actions | 操作列，通过 `actions` 属性配置按钮，触发 `row-action` 事件 |
| string | 文本，筛选时为操作符下拉+输入框，默认"包含" |
| number | 数值，筛选时为操作符下拉+输入框，默认"等于" |
| currency | 金额，自动千分位格式化并保留两位小数，筛选同 number |
| enum | 枚举，筛选时为过滤输入框+下拉选择；默认多选（含全选），配置 `filterMultiple: false` 后为单选。支持静态 `enumValues` 或懒加载 `loadEnumOptions`；两者都未配置时才退化为字符串输入框 |
| date | 日期，筛选类型由 `dateFilterType` 控制，展示格式由 `dateFormat` 控制 |
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

多选下拉框再次打开时，会按“全选 → 已选项 → 其他选项”的顺序展示，已选项按照用户的选择顺序置顶。为避免连续选择时列表跳动，该顺序只在每次打开下拉框时确定一次；下拉框保持打开期间不会因为继续勾选而重新排序。输入过滤关键词后以匹配结果顺序为准，不强行插入不匹配的已选项。单选下拉框始终保持原始选项顺序。

### 枚举下拉懒加载

当枚举数据量较大或必须从接口获取时，配置 `loadEnumOptions`。用户点击下拉框后，面板会立即打开并在内部显示“正在加载选项...”；加载成功后展示选项。首次成功加载的结果会在筛选面板、表头搜索和万能筛选之间共享并缓存，加载失败时下拉框会提示失败，关闭后重新打开即可重试。

```js
const fieldMetaList = [
  {
    fieldKey: 'departmentId',
    fieldLabel: '部门',
    fieldType: 'enum',
    filterable: true,
    filterMultiple: false,
    async loadEnumOptions({ keyword, selectedValues, signal }) {
      const response = await queryDepartments({ keyword, selectedValues }, { signal })
      return response.data.map(item => ({
        label: item.departmentName,
        value: item.departmentId
      }))
    }
  }
]
```

加载函数支持以下返回格式：

```js
[{ label: '技术部', value: '001' }]
{ '001': '技术部', '002': '市场部' }
{ list: [{ label: '技术部', value: '001' }] }
{ data: [{ label: '技术部', value: '001' }] }
```

需要根据关键词请求服务端时设置 `enumRemote: true`。组件会把过滤框内容作为 `keyword` 传入，并自动进行 300ms 防抖；新请求发出时会取消该字段尚未结束的旧请求：

```js
{
  fieldKey: 'userId',
  fieldLabel: '用户',
  fieldType: 'enum',
  filterable: true,
  enumRemote: true,
  loadEnumOptions: ({ keyword, selectedValues, signal }) =>
    searchUsers({ keyword, selectedValues }, { signal }).then(response =>
      response.data.list.map(user => ({ label: user.name, value: user.id }))
    )
}
```

`selectedValues` 是当前入口已经选中的值数组。远程接口按关键词查询时，建议同时返回这些值对应的选项，组件也会缓存已经加载过的已选项，避免新搜索结果替换后丢失名称。`signal` 是可选的 `AbortSignal`，建议传给 Axios/fetch 以取消过期请求；不使用取消能力时可以忽略它。业务数据发生变化后，可以清除缓存并重新加载：

```js
await this.$refs.dynamicTable.reloadEnumOptions('departmentId')
```

不传字段名会重新加载所有配置了 `loadEnumOptions` 的字段。加载成功触发 `enum-options-loaded`，参数为 `{ fieldKey, options }`；失败触发 `enum-load-error`，参数为 `{ fieldKey, error }`。

### 日期筛选格式

| dateFilterType | 控件 | 请求值 |
|----------------|------|--------|
| `daterange` | 开始日期、结束日期 | `{ range: ['2024-01-01', '2024-01-31'] }` |
| `monthrange` | 开始月份、结束月份 | `{ range: ['2024-01-01', '2024-03-31'] }` |
| `month` | 单个月份 | 默认 `{ value: '2024-02' }` |
| `month` + `monthToDateRange: true` | 单个月份 | `{ range: ['2024-02-01', '2024-02-29'] }` |
| `date` | 单个日期 | `{ value: '2024-02-15' }` |

筛选面板、表头筛选、万能筛选和筛选缓存使用相同结构。字段筛选类型发生变化时，组件会按当前结构校验缓存；不兼容的字段缓存会自动忽略。

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
| config-saved | config | 配置保存时触发，仅在未提供 `saveConfigFn` 时触发（无后端模式），config 为完整配置对象 |
| config-error | error | 配置加载失败时触发；组件会使用默认展示，但阻止保存以免覆盖服务端配置 |
| config-save-error | error | 配置保存失败时触发 |
| config-save-blocked | error | 配置加载失败后尝试保存时触发 |
| parameter-change | values | 自定义参数加载、保存或还原默认值后触发，参数为完整的自定义参数对象 |
| enum-options-loaded | { fieldKey, options } | 懒加载枚举选项成功后触发 |
| enum-load-error | { fieldKey, error } | 懒加载枚举选项失败后触发；下拉框中同时显示失败提示 |
| export-success | result | 导出文件成功后触发 |
| export-error | error | 导出失败后触发 |
| data-error | error | 分页查询失败后触发 |

### Slots

| 插槽名 | 作用域参数 | 说明 |
|--------|-----------|------|
| toolbar-left | - | 工具栏左侧按钮区域 |
| column-{fieldKey} | { row, value } | 自定义列内容渲染 |
| actions | { row } | 自定义操作列内容，覆盖默认的操作按钮渲染 |
| loading | - | 自定义数据加载状态 |
| empty | - | 自定义空数据状态 |
| error | { error, retry } | 自定义加载失败状态，`retry` 可重新请求 |
| parameter-config | { values, setValue } | 在“参数配置”页签中增加自定义控件；`values` 为当前编辑副本，推荐通过 `setValue(key, value)` 更新 |

### 实例方法

通过表格组件 `ref` 可调用：`refresh()`、`retry()`、`resetFilters()`、`getFilters()`、`getExportFields()`、`getTableConfig()`、`getParameterValues()`、`loadEnumOptions(fieldKey, options)`、`reloadEnumOptions(fieldKey)`、`getSelection()`、`clearSelection()`、`toggleRowSelection(row, selected)`、`doLayout()` 和 `getElTable()`。

### 扩展参数配置

使用 `parameter-config` 插槽可以在“表格配置 → 参数配置”中加入业务参数。参数在用户点击“保存”后写入配置的 `settings.parameterValues`，并通过 `parameter-change` 通知使用方：

```vue
<dynamic-table
  ref="dynamicTable"
  :default-parameter-values="{ dense: false, rowLimit: 100 }"
  @parameter-change="handleParameterChange"
>
  <template slot="parameter-config" slot-scope="{ values, setValue }">
    <div class="config-switch-row">
      <span>紧凑模式</span>
      <el-switch
        :value="values.dense"
        @input="setValue('dense', $event)"
      />
    </div>
  </template>
</dynamic-table>
```

自定义参数必须是可 JSON 序列化的数据。组件只负责展示编辑入口和持久化，参数的业务效果由使用方在 `parameter-change` 中实现；也可以随时调用 `getParameterValues()` 获取当前生效值。

`getFilters()` 返回的就是下一次列表查询和组件内置导出使用的合并筛选条件。同步、批量处理、业务导出等按钮如果需要沿用表格当前条件，应这样读取：

```js
handleSync() {
  const filters = this.$refs.dynamicTable
    ? this.$refs.dynamicTable.getFilters()
    : {}
  return syncData({ filters })
}
```

不要读取 `this.$refs.dynamicTable.filterValues`、`columnSearchValues` 或 `lastCustomFilterValues`。这些是组件内部的分段状态，单独读取任何一项都可能与当前列表的实际筛选条件不一致，后续版本也不保证其结构稳定。

### fetchDataFn 参数格式

```js
{
  page: 1,
  pageSize: 10,
  filters: {          // 筛选面板 + 表头搜索的合并条件
    username: { operator: 'contains', value: '张' },  // 字符串：操作符+值
    status: 1,                                          // 单选枚举：标量（多选枚举仍为数组）
    age: { operator: 'eq', value: 25 },                 // 数值：操作符+值
    salary: { operator: 'gte', value: 5000 },           // 金额：操作符+值
    birthday: { range: ['2024-01-01', '2024-12-31'] },      // 日期范围
    periodDate: { range: ['2024-02-01', '2024-02-29'] }, // 单月转日期范围
    isActive: true                                       // 布尔：直接传值
  },
  sortBy: 'createTime',
  sortOrder: 'descending'
}
```

上例使用组件默认分页字段。如果已有后端接收 `pageNum`，页面只需配置参数名：

```vue
<dynamic-table
  page-param-name="pageNum"
  page-size-param-name="pageSize"
  :fetch-data-fn="fetchDataFn"
/>
```

此时 `fetchDataFn` 收到的是 `{ pageNum, pageSize, filters, sortBy, sortOrder }`。已有接口不需要改字段名；`fetchDataFn` 仍然直接把 `params` 交给接口，不做二次转换。新接口未配置上述 Props 时，应按默认的 `page/pageSize` 接收。

`fetchDataFn` 的第二个参数为请求上下文，可将 `signal` 交给 Axios 或 Fetch，以便组件在翻页、快速筛选、切换菜单和销毁时取消旧请求：

```js
fetchDataFn(params, { signal }) {
  return axios.post('/api/table/data', params, { signal })
}
```

单个月份转换为日期范围：

```js
{
  fieldKey: 'periodDate',
  fieldLabel: '所属月份',
  fieldType: 'date',
  dateFilterType: 'month',
  monthToDateRange: true,
  filterable: true
}
```

#### 筛选操作符说明

| 操作符值 | 含义 | 适用类型 |
|----------|------|----------|
| eq | 等于 | string, number, currency |
| neq | 不等于 | string, number, currency |
| contains | 包含 | string |
| in | 多个（按逗号/顿号/斜杠拆分） | string |
| notContains | 不包含 | string |
| startsWith | 开头是 | string |
| endsWith | 结尾是 | string |
| gt | 大于 | number, currency |
| lt | 小于 | number, currency |
| gte | 大于等于 | number, currency |
| lte | 小于等于 | number, currency |

> 字符串类型默认操作符为 `contains`，数值/金额类型默认操作符为 `eq`。`in` 操作符会将输入值按英文逗号 `,`、中文逗号 `，`、中文顿号 `、`、斜杠 `/` 拆分为数组传递到后端。

这里的“默认”只表示控件初次选择的操作符，不会改变操作符本身的含义：

- `{ operator: 'eq', value: '张' }`：只匹配值等于“张”的记录。
- `{ operator: 'contains', value: '张' }`：匹配值中包含“张”的记录。

后端必须按 `operator` 分支处理，不能把所有字符串条件统一解释为精确匹配或统一解释为模糊匹配。

### fetchDataFn 返回格式

```js
{
  list: [],    // 当前页数据
  total: 100   // 总条数
}
```

组件默认兼容直接返回、Axios `{ data }` 包装以及常见的 `{ code, data }` 包装。如接口字段不是 `list`、`total`，可使用：

```vue
<dynamic-table :data-response-adapter="res => ({ list: res.data.records, total: res.data.count })" />
```

### 后端导出

传入 `exportDataFn` 后，“表格配置”左侧会显示纯下载图标。组件只提交点击时的当前可见数据字段、字段顺序、筛选条件和排序条件，不提交 `page`、`pageSize`：

点击下载图标后会提示“将根据表头配置进行导出，是否确认？”。确认后才调用 `exportDataFn`，取消或关闭弹窗不会发起导出请求。

```js
exportDataFn({ menuId, fields, filters, sortBy, sortOrder }) {
  return axios.post('/api/table/export', {
    menuId,
    fields,
    filters,
    sortBy,
    sortOrder
  }, { responseType: 'blob' })
}
```

`exportDataFn` 收到的参数示例：

```js
{
  menuId: 'M001',
  fields: [
    { fieldKey: 'username', exportFieldKey: 'user_name', fieldLabel: '用户名', fieldType: 'string', exportFormat: '' },
    { fieldKey: 'status', fieldLabel: '状态', fieldType: 'enum' }
  ],
  filters: {
    status: 1,
    createTime: { range: ['2024-01-01', '2024-12-31'] }
  },
  sortBy: 'createTime',
  sortOrder: 'descending'
}
```

说明：

- `fields` 按当前表格展示顺序传递。
- 隐藏字段以及选择框、序号、操作列不会导出。
- `exportable: false` 的字段不会导出；后端优先使用 `exportFieldKey` 识别导出字段。
- 展示格式函数不能序列化给后端；服务端应根据 `exportFieldKey`、`fieldType` 和 `exportFormat` 完成格式化。
- 导出条件包含筛选面板、表头搜索和万能筛选的合并结果。
- 服务端负责查询全部匹配数据并生成文件；组件不会循环查询分页接口。
- 支持直接返回 `Blob`、`{ blob, fileName }`、Axios Blob 响应或 `{ downloadUrl, fileName }`。
- Axios 模式必须配置 `responseType: 'blob'`。

这是组件的默认全量导出方式，接入方通常只需要实现 `exportDataFn`。如果某个页面存在完全不同的业务导出（例如导出勾选记录、导出固定模板），可以在 `toolbar-left` 中自行增加按钮；该按钮的参数和交互由业务页面负责，不会替代或改变 `exportDataFn` 的协议。为避免出现两个含义相同的导出入口，同一页面不要同时配置内置全量导出和同功能的自定义按钮。

### loadConfigFn 返回格式

```js
{
  version: 2,
  menuId: 'M001',

  visibleFields: '["username","age","status"]',       // JSON 字符串
  frozenFields: '["username"]',
  frozenPositions: '{"username":"left","balance":"right"}',
  columnWidths: '{"username":120,"age":80}',           // 列宽配置
  filterFields: '["username","status"]',
  columnOrder: '["username","age","status"]',
  filterSchemes: '[{"name":"方案1","filterValues":{}}]',
  settings: '{"pageSizes":[10,50,100,500],"showSummary":true,"showUniversalFilter":true,"parameterValues":{"dense":false}}',
  pageSizes: '[10,50,100,500]'                          // 兼容旧版后端的冗余字段（可选）
}
```

`version: 2` 将分页选项、功能开关和自定义参数独立存入 `settings`。组件仍兼容旧配置：保存在 `columnWidths` 的 `__pageSizes`、`__showSummary`、`__showUniversalFilter`，以及 v1.1.x 顶层 `pageSizes` 字段，读取后自动迁移，后续保存即写为 version 2。为避免后端字段白名单丢弃 `settings` 导致分页参数丢失，保存时除 `settings.pageSizes` 外还会同步写入顶层 `pageSizes`（读取时 `settings` 优先）。

配置接口同样兼容直接对象、Axios 和 `{ code, data }` 包装。若接口结构不同，可通过 `configResponseAdapter` 转换。配置加载异常会触发 `config-error`，且在重新加载成功前阻止保存；连续保存会按顺序执行，避免旧请求晚返回覆盖新配置。

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
- 枚举类型：过滤输入框 + 下拉选择；默认多选（含全选，选项 > 1 时显示），`filterMultiple: false` 时单选
- 日期类型：由 `dateFilterType` 控制筛选格式（`daterange`/`monthrange`/`month`/`date`）
- 布尔类型：是/否下拉
- 日期、月份区间和开启 `monthToDateRange` 的单月筛选统一使用 `{ range: [开始日期, 结束日期] }`
- 筛选区域超过3行自动出现滚动条
- 筛选条件默认缓存到浏览器 localStorage，可通过 `cacheFilters` 属性控制
- 重置按钮同时清除筛选面板条件、表头搜索条件、排序和浏览器缓存

### 默认筛选项

通过 `defaultFilterFields` 属性可指定页面**首次加载时默认展示**的筛选项字段（对应配置抽屉"筛选配置"中勾选的结果，即内部 `filterFields` 的初始化值）：

```vue
<dynamic-table
  menu-id="M001"
  :field-meta-list="fieldMetaList"
  :fetch-data-fn="fetchDataFn"
  :default-filter-fields="['username', 'status', 'createTime']"
/>
```

说明：

- 该属性只作为筛选项的**初始化值**，仅在没有用户已保存配置时生效。
- 传值需为 `fieldMetaList` 中 `filterable: true` 的字段，无效或重复的字段会被自动过滤，顺序按传入顺序展示。
- 用户通过"表格配置 → 筛选配置"调整并保存后，一律以用户保存的配置为准（即使保存为空数组，也会按用户的选择不展示任何筛选项）。
- 点击"还原默认"后，筛选项会恢复为该属性定义的默认值。
- 不传该属性时保持原行为：默认不展示任何筛选项。

### 万能筛选
- 筛选面板底部左侧提供带“万能筛选”标题的万能筛选区域，可动态选择任意字段进行筛选
- “常用方案”位于“保存筛选”按钮左侧，与查询、重置操作集中显示在右侧
- 已输入或已选择值的筛选项会显示蓝色边框、浅蓝背景和高亮标题，清空后自动恢复默认样式
- 筛选项标题宽度为 80px，超出时显示省略号，鼠标移入后通过 Tooltip 立即显示完整名称；下载图标悬停显示“导出”
- 选择字段后自动根据字段类型渲染对应筛选控件
- 可通过 `showUniversalFilter` 属性或在配置抽屉中控制显隐

### 合计行
- 设置 `showSummary` 属性开启合计行
- 当前页数据由组件求和，名称显示为“当前页合计”
- 合计标签显示在第一个非金额/数字类型的可见数据列
- 可在配置抽屉的"参数配置" tab 中开关合计行

### 动态属性与缓存兼容

- `menuId` 变化时自动重新加载对应配置、筛选缓存和分页数据。
- `fieldMetaList` 变化时自动删除失效字段配置并追加新字段，随后重新布局和查询。
- 未保存用户配置时，`defaultVisibleFields`、`defaultFilterFields` 和 `pageSizes` 的变化会即时生效。
- 字段筛选类型与旧缓存结构不匹配时，该字段旧缓存会被忽略，无需用户手动清除。

### 筛选方案
- 最多保存5个常用筛选方案
- 支持修改方案名称（点击名称或编辑图标）
- 使用方案后修改筛选值，保存时提示覆盖或新建
- 重置按钮同时清除筛选面板条件、表头搜索条件和排序

### 跨页选择

- 设置 `reserveSelection` 后，组件除使用 Element UI 的保留选择外，还会按 `rowKey` 独立保存选中数据。
- 翻页或表格配置导致表格重建时会自动恢复当前页勾选，`getSelection()` 返回全部已保留行。
- `rowKey` 必须在整个数据集内唯一；调用 `clearSelection()` 可清除全部跨页选择。

### 还原默认配置
- 配置抽屉底部提供"还原默认"按钮
- 点击后二次确认，确认后将所有配置还原为初始化状态
- 还原内容包括：表头显隐/顺序/冻结/列宽、筛选方案；筛选字段配置还原为 `defaultFilterFields` 属性定义的默认筛选项（未传该属性则为空）
- 同时清除浏览器中当前菜单的本地缓存
- 还原后立即生效，表格自动刷新

### 表头搜索
- 点击表头名称弹出下拉菜单，支持排序和搜索
- 排序三态切换：升序 → 降序 → 无
- 字符串/数值/金额类型搜索支持操作符选择
- 枚举类型搜索：过滤输入框 + 下拉选择 + 搜索确认按钮；默认多选，`filterMultiple: false` 时单选
- 日期类型搜索由 `dateFilterType` 控制选择器格式
- 表头搜索条件与筛选面板条件合并后一起传给 fetchDataFn

### 自适应高度
- 不设置 `tableHeight` 时，表格使用 flex 布局自适应填满容器
- 筛选区域展开/收起后自动重新分配空间
- 支持 keep-alive 缓存页面，激活时自动重新布局

### 列宽自适应
- 数据列使用 `min-width`，列不会小于配置宽度
- 当所有列宽之和小于容器宽度时，列自动按比例扩展填满
- 当所有列宽之和超过容器宽度时，正常横向滚动

### 分页
- 固定在表格底部，不随数据高度变化
- 可在配置抽屉的“参数配置” tab 中自定义分页条数选项，当前页面初始展示条数始终取已选选项中的最小值
- 默认已选条数为 10/50/100/500；支持预设条数快选（10/20/50/100/200/500/1000/2000），也可手动输入 1～2000 的自定义条数
- 清空用户保存的分页选项时，会回退到 `pageSizes` Prop；不会固定回退为 1。未传 `pageSizes` 时回退到默认的 10/50/100/500，并取 10 作为当前条数
- 后端分页上限必须与页面实际提供的 `pageSizes` 一致。如果后端最多只允许 500，页面就不应提供 1000/2000；若页面允许选择 2000，后端也必须正确接收 2000，不能静默截断后仍返回不匹配的分页结果
- 分页字段默认是 `page/pageSize`。存量接口可用 `pageParamName/pageSizeParamName` 保留原字段名，配置后的字段名就是后端必须接收的协议

## 后端接口设计

### 1. 保存配置接口

**请求方式**：`POST /api/table/config`

**请求参数**：

```json
{
  "version": 2,
  "menuId": "M001",

  "visibleFields": "[\"username\",\"age\",\"status\"]",
  "frozenFields": "[\"username\"]",
  "frozenPositions": "{\"username\":\"left\"}",
  "columnWidths": "{\"username\":120,\"age\":80}",
  "filterFields": "[\"username\",\"status\"]",
  "columnOrder": "[\"username\",\"age\",\"status\"]",
  "filterSchemes": "[{\"name\":\"方案1\",\"filterValues\":{\"username\":{\"operator\":\"contains\",\"value\":\"张\"}}}]",
  "settings": "{\"pageSizes\":[10,50,100,500],\"showSummary\":true,\"showUniversalFilter\":true}"
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
  config_version INT NOT NULL DEFAULT 2 COMMENT '配置结构版本',
  visible_fields TEXT COMMENT '可见字段JSON',
  frozen_fields TEXT COMMENT '冻结字段JSON',
  frozen_positions TEXT COMMENT '冻结位置JSON',
  column_widths TEXT COMMENT '列宽配置JSON',
  filter_fields TEXT COMMENT '筛选字段JSON',
  column_order TEXT COMMENT '列顺序JSON',
  filter_schemes TEXT COMMENT '筛选方案JSON',
  settings TEXT COMMENT '分页选项及功能开关JSON',
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
    "version": 2,
    "menuId": "M001",
    "visibleFields": "[\"username\",\"age\",\"status\"]",
    "frozenFields": "[\"username\"]",
    "frozenPositions": "{\"username\":\"left\"}",
    "columnWidths": "{\"username\":120,\"age\":80}",
    "filterFields": "[\"username\",\"status\"]",
    "columnOrder": "[\"username\",\"age\",\"status\"]",
    "filterSchemes": "[{\"name\":\"方案1\",\"filterValues\":{}}]",
    "settings": "{\"pageSizes\":[10,50,100,500],\"showSummary\":true,\"showUniversalFilter\":true}"
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
    "status": 1,
    "age": { "operator": "gte", "value": 20 },
    "salary": { "operator": "lte", "value": 50000 },
    "birthday": { "range": ["2024-01-01", "2024-12-31"] },
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
| string | `{ operator, value }` | 根据 operator 拼接 SQL：`eq` → `=`, `neq` → `!=`, `contains` → `LIKE %val%`, `notContains` → `NOT LIKE %val%`, `startsWith` → `LIKE val%`, `endsWith` → `LIKE %val`, `in` → `IN (val1, val2, ...)` |
| number/currency | `{ operator, value }` | 根据 operator 拼接 SQL：`eq` → `=`, `neq` → `!=`, `gt` → `>`, `lt` → `<`, `gte` → `>=`, `lte` → `<=` |
| enum（单选） | `value` | `= value` |
| enum（多选） | `[value1, value2]` | `IN (value1, value2)` |
| date（日期/月份区间或单月转区间） | `{ range: [start, end] }` | 使用 `range[0]`、`range[1]` 进行区间查询 |
| date（单个日期或未转换的单月） | `{ value }` | 使用 `value` 进行等值查询；单月值格式为 `yyyy-MM` |
| boolean | `true/false` | `= true` 或 `= false` |

**设计要点**：
- `filters` 中的 key 为 `fieldKey`，后端需映射为实际数据库字段名
- `daterange`、`monthrange` 以及 `monthToDateRange: true` 的单月筛选使用 `{ range }`；`date` 和默认单月筛选使用 `{ value }`，后端必须同时支持这两种日期结构
- 枚举单选值为标量，使用等值查询；多选值为数组，使用 `IN` 查询
- 排序字段 `sortBy` 需映射为数据库字段名，`sortOrder` 为 `ascending` / `descending`
- 建议对 `filters` 中的值做 SQL 注入防护（参数化查询）

**后端公共方法封装建议**：

由于每个列表页面的筛选处理逻辑高度一致，建议封装公共方法，避免每个页面重复编写。核心思路：**通过反射获取分页查询对象的字段，根据字段类型自动构建查询条件**。

**1. 操作符枚举定义**

```java
public enum FilterOperator {
    EQ("eq", "="),
    NEQ("neq", "!="),
    CONTAINS("contains", "LIKE"),
    NOT_CONTAINS("notContains", "NOT LIKE"),
    STARTS_WITH("startsWith", "LIKE"),
    ENDS_WITH("endsWith", "LIKE"),
    IN("in", "IN"),
    GT("gt", ">"),
    LT("lt", "<"),
    GTE("gte", ">="),
    LTE("lte", "<=");

    private final String code;
    private final String sql;
    // getter, fromCode(String code) 静态方法
}
```

**2. 公共筛选方法**

```java
/**
 * 通用筛选条件构建器
 * 通过反射获取分页对象的所有字段，根据 filters 参数自动构建 QueryWrapper 条件
 *
 * @param wrapper   MyBatis-Plus QueryWrapper
 * @param filters   前端传入的 filters 对象
 * @param clazz     分页查询对象的 Class（字段名即 fieldKey，通过 @TableField 映射数据库列名）
 */
public static <T> void buildFilters(QueryWrapper<T> wrapper, Map<String, Object> filters, Class<T> clazz) {
    if (filters == null || filters.isEmpty()) return;

    for (Map.Entry<String, Object> entry : filters.entrySet()) {
        String fieldKey = entry.getKey();
        Object value = entry.getValue();

        // 通过反射获取字段，确定字段类型
        Field field = ReflectionUtils.findField(clazz, fieldKey);
        if (field == null) continue;

        Class<?> fieldType = field.getType();
        String column = getColumnName(field); // 获取 @TableField 注解的列名，无注解则驼峰转下划线

        if (value instanceof Map) {
            // 对象筛选：{ operator, value }、{ range: [start, end] } 或 { value }
            Map<String, Object> filterMap = (Map<String, Object>) value;
            if (filterMap.containsKey("operator")) {
                String operatorCode = (String) filterMap.get("operator");
                Object filterValue = filterMap.get("value");
                FilterOperator op = FilterOperator.fromCode(operatorCode);
                if (op == null) continue;
                applyOperator(wrapper, column, op, filterValue, fieldType);
            } else if (filterMap.containsKey("range")) {
                // 日期范围
                List<?> range = (List<?>) filterMap.get("range");
                if (range.size() == 2) {
                    wrapper.between(column, range.get(0), range.get(1));
                }
            } else if (filterMap.containsKey("value")) {
                // 单个日期或未转换的单月
                Object singleValue = filterMap.get("value");
                if (singleValue != null && !singleValue.toString().isEmpty()) {
                    wrapper.eq(column, singleValue);
                }
            }
        } else if (value instanceof List) {
            // 枚举多选
            List<?> values = (List<?>) value;
            if (!values.isEmpty()) {
                wrapper.in(column, values);
            }
        } else if (value instanceof Boolean) {
            wrapper.eq(column, value);
        } else if (value instanceof String || value instanceof Number) {
            // 枚举单选等标量筛选
            wrapper.eq(column, value);
        }
    }
}

/**
 * 根据操作符类型应用查询条件
 */
private static void applyOperator(QueryWrapper<?> wrapper, String column, FilterOperator op, Object value, Class<?> fieldType) {
    if (value == null || value.toString().isEmpty()) return;
    String strVal = value.toString();

    switch (op) {
        case EQ:       wrapper.eq(column, strVal); break;
        case NEQ:      wrapper.ne(column, strVal); break;
        case CONTAINS: wrapper.like(column, strVal); break;
        case NOT_CONTAINS: wrapper.notLike(column, strVal); break;
        case STARTS_WITH: wrapper.likeRight(column, strVal); break;
        case ENDS_WITH: wrapper.likeLeft(column, strVal); break;
        case IN:
            if (value instanceof List) {
                wrapper.in(column, (List<?>) value);
            }
            break;
        case GT:       wrapper.gt(column, strVal); break;
        case LT:       wrapper.lt(column, strVal); break;
        case GTE:      wrapper.ge(column, strVal); break;
        case LTE:      wrapper.le(column, strVal); break;
    }
}
```

**3. 使用示例**

```java
@PostMapping("/data")
public Result<PageResult<UserVO>> listUsers(@RequestBody PageRequest params) {
    QueryWrapper<User> wrapper = new QueryWrapper<>();
    // 一行代码完成所有筛选条件构建
    FilterHelper.buildFilters(wrapper, params.getFilters(), User.class);
    // 排序
    if (params.getSortBy() != null) {
        wrapper.orderBy(true, "descending".equals(params.getSortOrder()),
            getColumnName(User.class, params.getSortBy()));
    }
    Page<User> page = userService.page(new Page<>(params.getPage(), params.getPageSize()), wrapper);
    return Result.success(PageResult.of(page, UserVO.class));
}
```

**设计要点**：
- 操作符枚举统一管理，前端 `operator` 值与后端枚举 `code` 一一对应
- 通过反射自动识别字段类型，无需每个页面手写 if-else
- 公共方法 `buildFilters` 可在所有列表接口复用，新增页面零代码
- `@TableField` 注解自动映射 fieldKey → 数据库列名，支持驼峰转下划线

### 4. 全量导出接口

**请求方式**：`POST /api/table/export`

导出接口不接收分页参数。后端必须对 `fields` 和排序字段进行白名单校验，并使用当前筛选条件查询全部匹配数据。

**请求参数**：

```json
{
  "menuId": "M001",
  "fields": [
    { "fieldKey": "username", "fieldLabel": "用户名", "fieldType": "string" },
    { "fieldKey": "status", "fieldLabel": "状态", "fieldType": "enum" },
    { "fieldKey": "createTime", "fieldLabel": "创建时间", "fieldType": "date" }
  ],
  "filters": {
    "status": 1,
    "createTime": { "range": ["2024-01-01", "2024-12-31"] }
  },
  "sortBy": "createTime",
  "sortOrder": "descending"
}
```

**同步文件响应**：

```http
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename*=UTF-8''users.csv
```

前端应使用 `responseType: 'blob'`。组件会优先读取 `Content-Disposition` 文件名；读取不到时使用 `exportFileName`。

后端也可以返回已生成文件的地址：

```json
{
  "downloadUrl": "/api/table/export/download/abc123",
  "fileName": "用户数据.xlsx"
}
```

大数据量场景建议使用流式 CSV 或异步导出任务，避免在前端循环请求分页数据，也避免在服务端一次性将全部数据保存在内存中。

## 开发与发布检查

组件包包含 `types/index.d.ts`，TypeScript 项目可直接获得字段元数据、查询参数、导出参数及实例方法类型。

```bash
npm test              # 运行纯函数单元测试
npm run check         # 单元测试 + 组件库构建
npm run build         # 示例应用生产构建
```

执行 `npm publish` 前会自动运行测试和生产模式组件库构建。
