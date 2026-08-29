import Vue, { VueConstructor } from 'vue'

export type SortOrder = '' | 'ascending' | 'descending'
export type FieldType = 'string' | 'number' | 'enum' | 'date' | 'boolean' | 'currency' | 'selection' | 'index' | 'actions'

export interface EnumOption {
  label: string
  value: string | number | boolean
}

export interface FieldMeta<Row = Record<string, unknown>> {
  fieldKey: string
  fieldLabel: string
  fieldType: FieldType
  filterable?: boolean
  sortable?: boolean
  filterMultiple?: boolean
  enumValues?: EnumOption[] | Record<string, string>
  dateFilterType?: 'daterange' | 'monthrange' | 'month' | 'date'
  monthToDateRange?: boolean
  dateFormat?: string
  width?: number
  minWidth?: number
  align?: 'left' | 'center' | 'right'
  formatter?: (value: unknown, row?: Row) => unknown
  exportable?: boolean
  exportFieldKey?: string
  exportFieldLabel?: string
  exportFormat?: string
  actions?: Array<Record<string, unknown>>
}

export interface TableQueryParams {
  page?: number
  pageSize?: number
  filters: Record<string, unknown>
  sortBy: string
  sortOrder: SortOrder
  [key: string]: unknown
}

export interface TableQueryResult<Row = Record<string, unknown>> {
  list: Row[]
  total: number
}

export interface FetchContext {
  signal?: AbortSignal
}

export type FetchDataFn<Row = Record<string, unknown>> = (
  params: TableQueryParams,
  context: FetchContext
) => Promise<TableQueryResult<Row> | unknown>

export interface ExportField {
  fieldKey: string
  exportFieldKey: string
  fieldLabel: string
  fieldType: FieldType
  exportFormat: string
}

export interface ExportParams {
  menuId: string
  fields: ExportField[]
  filters: Record<string, unknown>
  sortBy: string
  sortOrder: SortOrder
}

export interface DynamicTableInstance<Row = Record<string, unknown>> extends Vue {
  refresh(): Promise<void>
  retry(): Promise<void>
  resetFilters(): void
  getFilters(): Record<string, unknown>
  getExportFields(): ExportField[]
  getTableConfig(): Record<string, unknown>
  getSelection(): Row[]
  clearSelection(): void
  toggleRowSelection(row: Row, selected?: boolean): void
  doLayout(): void
  getElTable(): Vue | undefined
}

declare const DynamicTable: VueConstructor<DynamicTableInstance>
export declare const useTableConfig: Record<string, unknown>
export declare const useFilter: Record<string, unknown>
export { DynamicTable }
export default DynamicTable
