# dynamic-table-vue2-element v1.2.0 更新报告

**版本号**：1.1.10 → 1.2.0  
**更新日期**：2026-07-22  
**更新类型**：功能增强 + 问题修复  

---

## 一、问题修复

### 1. 筛选区域下拉框/日期弹层被裁剪或遮挡

**问题描述**：筛选面板内 el-select、el-date-picker 的下拉弹层被 `.filter-form-scroll` 容器裁剪，或被下方表格遮挡，导致选项不可见。

**原因**：之前为修复 el-select 在 el-popover 内定位问题，将所有 `popper-append-to-body` 硬编码为 `false`，弹层留在滚动容器内部，被 `overflow-y: auto` 裁剪。

**修复方案**：新增 `filterPopperAppendToBody` 属性，默认值为 `true`，弹层挂载到 body 上，不再被滚动容器裁剪。

**升级影响**：无破坏性变更，默认行为即为修复后的效果。

---

## 二、新增功能

### 2. 分页参数字段名可配置

**背景**：组件固定使用 `page` / `pageSize` 作为分页参数名，与若依框架常用的 `pageNum` / `pageSize` 不一致，导致后端接口需额外适配。

**新增属性**：

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| pageParamName | String | `'page'` | 分页页码参数名 |
| pageSizeParamName | String | `'pageSize'` | 每页条数参数名 |

**使用示例**：

```vue
<dynamic-table
  menu-id="M001"
  :field-meta-list="fieldMetaList"
  :fetch-data-fn="fetchDataFn"
  page-param-name="pageNum"
  page-size-param-name="pageSize"
/>
```

适配若依框架时，只需设置 `page-param-name="pageNum"` 即可，fetchDataFn 接收的参数将变为：

```js
{ pageNum: 1, pageSize: 10, filters: {...}, sortBy: '', sortOrder: '' }
```

---

### 3. 操作列按钮支持动态样式

**背景**：操作列按钮的 `type` 只能配置静态值，无法根据行数据动态决定按钮颜色或禁用状态。例如"发票"按钮需要根据 `invcount > 0` 显示不同颜色。

**新增能力**：`actions` 配置中的 `type`、`disabled`、`visible` 属性均支持函数，接收 `row` 参数返回动态值。

**使用示例**：

```js
{ fieldKey: '__actions', fieldLabel: '操作', fieldType: 'actions', actions: [
  { label: '发票', action: 'invoice',
    type: (row) => row.invcount > 0 ? 'success' : 'danger'
  },
  { label: '附件', action: 'attachment',
    type: (row) => row.attcount > 0 ? 'primary' : 'info',
    disabled: (row) => row.attcount === 0
  },
  { label: '删除', action: 'delete',
    type: 'danger',
    visible: (row) => row.deletable !== false
  }
]}
```

| 属性 | 类型 | 说明 |
|------|------|------|
| type | String \| Function(row) | 按钮类型，支持函数动态返回 |
| disabled | Boolean \| Function(row) | 是否禁用，支持函数动态返回 |
| visible | Boolean \| Function(row) | 是否显示，支持函数动态返回，默认 true |

---

### 4. 操作列支持自定义 Slot

**背景**：之前操作列只能使用组件内置的按钮渲染，自定义能力不足。

**新增插槽**：

| 插槽名 | 作用域参数 | 说明 |
|--------|-----------|------|
| actions | { row } | 自定义操作列内容 |

**使用示例**：

```vue
<dynamic-table
  menu-id="M001"
  :field-meta-list="fieldMetaList"
  :fetch-data-fn="fetchDataFn"
>
  <template #actions="{ row }">
    <el-button type="text" size="mini" @click="handleView(row)">查看</el-button>
    <el-button type="text" size="mini" @click="handleEdit(row)">编辑</el-button>
  </template>
</dynamic-table>
```

> 注意：使用 `#actions` 插槽时，`fieldMetaList` 中仍需声明 `fieldType: 'actions'` 的列，但按钮渲染由插槽完全接管，`actions` 数组配置将被忽略。

---

### 5. 筛选条件默认值

**背景**：业务需要默认日期为当天并回显到筛选控件，但组件没有直接提供默认值注入机制。

**新增属性**：

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| defaultFilterValues | Object | `{}` | 筛选条件默认值，初始化时注入 |

**使用示例**：

```vue
<dynamic-table
  menu-id="M001"
  :field-meta-list="fieldMetaList"
  :fetch-data-fn="fetchDataFn"
  :default-filter-values="defaultFilters"
/>
```

```js
data() {
  const today = new Date().toISOString().slice(0, 10)
  return {
    defaultFilters: {
      createdate: { range: [today, today] },
      status: [1, 2],
      username: { operator: 'contains', value: '' }
    }
  }
}
```

`defaultFilterValues` 的 key 为 `fieldKey`，value 结构与 `filterValues` 一致：
- 枚举类型：数组 `[value1, value2]`
- 字符串/数值/金额：`{ operator: 'xxx', value: 'xxx' }`
- 日期：`{ range: ['2024-01-01', '2024-12-31'] }`
- 布尔：`true` / `false`

---

### 6. 筛选条件本地缓存

**背景**：业务要求刷新页面后保留筛选条件，重置时清除缓存。

**新增属性**：

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| filterCacheKey | String | `''` | 缓存标识，为空则不缓存 |
| cacheFilters | Boolean | `false` | 是否启用筛选条件本地缓存 |

**使用示例**：

```vue
<dynamic-table
  menu-id="M001"
  :field-meta-list="fieldMetaList"
  :fetch-data-fn="fetchDataFn"
  filter-cache-key="movement_dynamic_filter_cache"
  :cache-filters="true"
/>
```

**行为说明**：
- 开启后，点击"查询"时自动将筛选条件保存到 localStorage
- 页面刷新后自动恢复上次的筛选条件
- 点击"重置"或"还原默认"时自动清除缓存
- 缓存 key 格式：`dynamic_table_filter_{filterCacheKey}`

---

### 7. 筛选区域滚动位置重置

**背景**：刷新、重置后筛选条件滚动条未回到顶部。

**新增方法**：

| 方法 | 说明 |
|------|------|
| scrollFilterToTop() | 将筛选区域滚动条重置到顶部 |

**行为说明**：
- 点击"重置"和"还原默认"时自动执行
- 也可通过 ref 手动调用：`this.$refs.dynamicTable.scrollFilterToTop()`

---

## 三、完整新增属性汇总

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| filterPopperAppendToBody | Boolean | `true` | 筛选/表头搜索弹层是否挂载到 body，设为 false 可修复 popover 内定位问题 |
| pageParamName | String | `'page'` | 分页页码参数名 |
| pageSizeParamName | String | `'pageSize'` | 每页条数参数名 |
| defaultFilterValues | Object | `{}` | 筛选条件默认值 |
| filterCacheKey | String | `''` | 筛选缓存标识 |
| cacheFilters | Boolean | `false` | 是否启用筛选缓存 |

---

## 四、升级指南

### 1. 安装新版本

```bash
npm install dynamic-table-vue2-element@1.2.0
```

### 2. 兼容性说明

本次升级**完全向后兼容**，所有新增属性均有默认值，无需修改现有代码即可升级。

### 3. 推荐适配项

| 适配项 | 说明 |
|--------|------|
| 若依框架分页 | 添加 `page-param-name="pageNum"` |
| 筛选弹层遮挡 | 默认已修复，如遇 popover 内定位异常可设置 `:filter-popper-append-to-body="false"` |
| 操作列动态按钮 | 将 `type` / `disabled` / `visible` 改为函数形式 |
| 筛选默认日期 | 配置 `defaultFilterValues` |
| 筛选条件缓存 | 配置 `filterCacheKey` + `:cache-filters="true"` |
| 分页条数扩展 | 传入 `:page-sizes="[10, 20, 50, 100, 200, 500]"` |

### 4. fetchDataFn 参数变更

若使用了 `pageParamName` / `pageSizeParamName`，fetchDataFn 接收的参数结构中分页字段名将随之变化，后端接口需对应适配：

```js
// 默认（v1.1.x 兼容）
{ page: 1, pageSize: 10, filters: {...}, sortBy: '', sortOrder: '' }

// 设置 page-param-name="pageNum" 后
{ pageNum: 1, pageSize: 10, filters: {...}, sortBy: '', sortOrder: '' }
```

---

## 五、涉及文件

| 文件 | 变更内容 |
|------|---------|
| packages/dynamic-table/src/index.vue | 新增 props、操作列动态样式/slot、分页参数可配、scrollFilterToTop |
| packages/dynamic-table/src/FilterPanel.vue | popperAppendToBody prop、日期选择器 append-to-body |
| packages/dynamic-table/src/ColumnHeader.vue | popperAppendToBody prop、日期选择器 append-to-body |
| packages/dynamic-table/src/composables/useFilter.js | defaultFilterValues、缓存机制、scrollFilterToTop、initFilterValues 重构 |
| package.json | 版本号 1.1.10 → 1.2.0 |