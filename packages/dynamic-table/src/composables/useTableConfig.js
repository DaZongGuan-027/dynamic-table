import {
  getMinimumPageSize,
  parseJsonArray,
  parseJsonObject,
  readTableSettings,
  unwrapResponseData
} from '../utils/tableUtils.mjs'

export default {
  props: {
    menuId: { type: String, required: true },

    fieldMetaList: { type: Array, required: true },
    loadConfigFn: { type: Function, default: null },
    saveConfigFn: { type: Function, default: null },
    deleteConfigFn: { type: Function, default: null },
    configResponseAdapter: { type: Function, default: null },
    configErrorHandler: { type: Function, default: null },
    defaultFilterFields: { type: Array, default: () => [] }
  },

  data() {
    return {
      configLoading: false,
      configSaving: false,
      configError: null,
      configLoadFailed: false,
      configSaveQueue: null,
      configSaveSequence: 0,
      config: null,
      visibleFields: [],
      frozenFields: [],
      frozenPositions: {},
      filterFields: [],
      columnOrder: [],
      filterSchemes: [],
      columnWidths: {},
      configuredPageSizes: null,
      configuredShowSummary: undefined,
      configuredShowUniversalFilter: undefined,
      configLoadSequence: 0
    }
  },

  computed: {
    fieldMetaMap() {
      const map = {}
      this.fieldMetaList.forEach(f => {
        map[f.fieldKey] = f
      })
      return map
    },

    orderedVisibleFields() {
      if (this.columnOrder.length > 0) {
        return this.columnOrder.filter(key => this.visibleFields.includes(key))
      }
      return this.visibleFields
    },


    activeFilterMetaList() {
      return this.filterFields
        .map(key => this.fieldMetaMap[key])
        .filter(Boolean)
        .filter(f => f.filterable)
    }
  },


  methods: {
    async loadConfig() {
      const requestId = ++this.configLoadSequence
      if (!this.loadConfigFn) {
        this.configError = null
        this.configLoadFailed = false
        this.config = null
        this.resetToDefault()
        return
      }
      this.configLoading = true
      try {
        const response = await this.loadConfigFn(this.menuId)
        if (requestId !== this.configLoadSequence) return
        let config = this.configResponseAdapter
          ? this.configResponseAdapter(response)
          : unwrapResponseData(response)
        if (config && (typeof config !== 'object' || Array.isArray(config))) {
          throw new Error('配置接口返回值必须是对象或 null')
        }
        if (config && Object.keys(config).length === 0) config = null
        this.configError = null
        this.configLoadFailed = false
        if (config) {
          this.config = config
          this.visibleFields = parseJsonArray(config.visibleFields) || this._getDefaultVisibleFields()
          this.frozenFields = parseJsonArray(config.frozenFields) || []
          this.frozenPositions = parseJsonObject(config.frozenPositions) || {}
          this.filterFields = parseJsonArray(config.filterFields) || this._getDefaultFilterFields()
          this.columnOrder = parseJsonArray(config.columnOrder) || this.fieldMetaList.map(f => f.fieldKey)
          this.filterSchemes = parseJsonArray(config.filterSchemes) || []
          this.columnWidths = parseJsonObject(config.columnWidths) || {}
          const settings = readTableSettings(config, this.columnWidths)
          this.configuredPageSizes = settings.pageSizes
          this.configuredShowSummary = settings.showSummary
          this.configuredShowUniversalFilter = settings.showUniversalFilter
          this.$delete(this.columnWidths, '__defaultPageSize')
          this.$delete(this.columnWidths, '__pageSizes')
          this.$delete(this.columnWidths, '__showSummary')
          this.$delete(this.columnWidths, '__showUniversalFilter')
          this.reconcileConfigWithFields()
          this._initPageSizeFromConfig()

        } else {
          this.config = null
          this.resetToDefault()
        }
      } catch (e) {
        if (requestId !== this.configLoadSequence) return
        this.configError = e
        this.configLoadFailed = true
        this.$emit('config-error', e)
        if (this.configErrorHandler) {
          try { this.configErrorHandler(e) } catch (handlerError) { console.error('configErrorHandler 执行失败:', handlerError) }
        }
        this.resetToDefault()
      } finally {
        if (requestId === this.configLoadSequence) this.configLoading = false
      }
    },

    _initPageSizeFromConfig() {
      const ps = this.configuredPageSizes
      if (ps && ps.length > 0) {
        this.pageSize = getMinimumPageSize(ps, this.pageSize)
      } else if (this.pageSizes && this.pageSizes.length > 0) {
        this.pageSize = getMinimumPageSize(this.pageSizes, this.pageSize)
      }
    },

    _getDefaultVisibleFields() {
      if (this.defaultVisibleFields && this.defaultVisibleFields.length > 0) {
        return [...this.defaultVisibleFields]
      }
      return this.fieldMetaList.map(f => f.fieldKey)
    },

    _getDefaultFilterFields() {
      if (!this.defaultFilterFields || this.defaultFilterFields.length === 0) return []
      const seen = {}
      return this.defaultFilterFields.filter(key => {
        if (seen[key]) return false
        seen[key] = true
        const meta = this.fieldMetaMap[key]
        return meta && meta.filterable
      })
    },

    resetToDefault() {
      this.visibleFields = this._getDefaultVisibleFields()
      this.frozenFields = []
      this.frozenPositions = {}
      this.filterFields = this._getDefaultFilterFields()
      this.columnOrder = this.fieldMetaList.map(f => f.fieldKey)
      this.filterSchemes = []
      this.columnWidths = {}
      this.configuredPageSizes = null
      this.configuredShowSummary = undefined
      this.configuredShowUniversalFilter = undefined
      if (this.pageSizes && this.pageSizes.length > 0) {
        this.pageSize = getMinimumPageSize(this.pageSizes, this.pageSize)
      }
    },

    clearStorageConfig() {
      if (typeof localStorage === 'undefined') return
      const key = 'dynamic_table_config_' + this.menuId
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k && k.startsWith(key)) {
          keysToRemove.push(k)
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k))
    },

    async saveConfig() {
      if (this.configLoadFailed) {
        const error = new Error('配置加载失败，为避免覆盖服务端配置，本次保存已阻止')
        this.$message.error(error.message)
        this.$emit('config-save-blocked', error)
        return
      }
      if (!this.saveConfigFn) {
        const config = this._buildConfig()
        this.config = config
        this.$emit('config-saved', config)
        return
      }
      const config = this._buildConfig()
      const requestId = ++this.configSaveSequence
      const queuedSave = (this.configSaveQueue || Promise.resolve())
        .catch(() => {})
        .then(() => this.saveConfigFn(config))
      this.configSaveQueue = queuedSave
      this.configSaving = true
      try {
        await queuedSave
        this.config = config
        this.$message.success('配置已保存')
      } catch (e) {
        this.$message.error('配置保存失败')
        this.$emit('config-save-error', e)
      } finally {
        if (requestId === this.configSaveSequence) this.configSaving = false
      }
    },

    _buildConfig() {
      return {
        version: 2,
        menuId: this.menuId,

        visibleFields: JSON.stringify(this.visibleFields),
        frozenFields: JSON.stringify(this.frozenFields),
        frozenPositions: JSON.stringify(this.frozenPositions),
        filterFields: JSON.stringify(this.filterFields),
        columnOrder: JSON.stringify(this.columnOrder),
        filterSchemes: JSON.stringify(this.filterSchemes),
        columnWidths: JSON.stringify(this.columnWidths),
        settings: JSON.stringify({
          pageSizes: this.configuredPageSizes,
          showSummary: this.configuredShowSummary,
          showUniversalFilter: this.configuredShowUniversalFilter
        })
      }
    },

    handleConfigChange({ visibleFields, columnOrder, frozenFields, frozenPositions, columnWidths, filterFields, filterSchemes, pageSizes, showSummary, showUniversalFilter }) {
      this.visibleFields = visibleFields
      this.columnOrder = columnOrder
      this.frozenFields = frozenFields
      this.frozenPositions = frozenPositions || {}
      this.columnWidths = columnWidths || {}
      this.filterFields = filterFields
      this.filterSchemes = filterSchemes
      this.configuredPageSizes = pageSizes && pageSizes.length > 0 ? pageSizes : null
      if (showSummary !== undefined) this.configuredShowSummary = showSummary
      if (showUniversalFilter !== undefined) this.configuredShowUniversalFilter = showUniversalFilter
      if (pageSizes && pageSizes.length > 0) {
        this.pageSize = getMinimumPageSize(pageSizes, this.pageSize)
      } else if (this.pageSizes && this.pageSizes.length > 0) {
        this.pageSize = getMinimumPageSize(this.pageSizes, this.pageSize)
      }
      this.saveConfig()
      this.tableKey++
      this.$nextTick(() => {
        this.doLayout()
        this.fetchData()
      })
    },

    handleApplyScheme(filterValues) {
      this.$emit('apply-scheme', filterValues)
    },

    reconcileConfigWithFields() {
      const validKeys = this.fieldMetaList.map(field => field.fieldKey)
      const validSet = new Set(validKeys)
      const configuredSet = new Set(this.columnOrder)
      const newKeys = validKeys.filter(key => !configuredSet.has(key))
      this.columnOrder = this.columnOrder.filter(key => validSet.has(key)).concat(newKeys)
      this.visibleFields = this.visibleFields.filter(key => validSet.has(key))
      newKeys.forEach(key => {
        if (!this.defaultVisibleFields.length || this.defaultVisibleFields.includes(key)) this.visibleFields.push(key)
      })
      this.frozenFields = this.frozenFields.filter(key => validSet.has(key))
      this.filterFields = this.filterFields.filter(key => validSet.has(key) && this.fieldMetaMap[key] && this.fieldMetaMap[key].filterable)
      Object.keys(this.frozenPositions).forEach(key => { if (!validSet.has(key)) this.$delete(this.frozenPositions, key) })
      Object.keys(this.columnWidths).forEach(key => { if (!validSet.has(key)) this.$delete(this.columnWidths, key) })
    }
  }
}
