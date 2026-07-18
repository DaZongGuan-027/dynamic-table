export default {
  props: {
    menuId: { type: String, required: true },
    userId: { type: String, required: true },
    fieldMetaList: { type: Array, required: true },
    loadConfigFn: { type: Function, default: null },
    saveConfigFn: { type: Function, default: null }
  },

  data() {
    return {
      configLoading: false,
      config: null,
      visibleFields: [],
      frozenFields: [],
      frozenPositions: {},
      filterFields: [],
      columnOrder: [],
      filterSchemes: []
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

  created() {
    this.loadConfig()
  },

  methods: {
    async loadConfig() {
      if (!this.loadConfigFn) {
        this.resetToDefault()
        return
      }
      this.configLoading = true
      try {
        const config = await this.loadConfigFn(this.menuId, this.userId)
        if (config) {
          this.config = config
          this.visibleFields = this._parseJsonField(config.visibleFields) || this.fieldMetaList.map(f => f.fieldKey)
          this.frozenFields = this._parseJsonField(config.frozenFields) || []
          this.frozenPositions = this._parseJsonField(config.frozenPositions) || {}
          this.filterFields = this._parseJsonField(config.filterFields) || []
          this.columnOrder = this._parseJsonField(config.columnOrder) || this.fieldMetaList.map(f => f.fieldKey)
          this.filterSchemes = this._parseJsonField(config.filterSchemes) || []
        } else {
          this.resetToDefault()
        }
      } catch (e) {
        this.resetToDefault()
      } finally {
        this.configLoading = false
      }
    },

    _parseJsonField(val) {
      if (Array.isArray(val)) return val
      if (typeof val === 'string') {
        try { return JSON.parse(val) } catch (e) { return null }
      }
      return null
    },

    resetToDefault() {
      this.visibleFields = this.fieldMetaList.map(f => f.fieldKey)
      this.frozenFields = []
      this.frozenPositions = {}
      this.filterFields = []
      this.columnOrder = this.fieldMetaList.map(f => f.fieldKey)
      this.filterSchemes = []
    },

    async saveConfig() {
      if (!this.saveConfigFn) {
        this.$emit('config-saved', this._buildConfig())
        return
      }
      const config = this._buildConfig()
      try {
        await this.saveConfigFn(config)
        this.config = config
        this.$message.success('配置已保存')
      } catch (e) {
        this.$message.error('配置保存失败')
      }
    },

    _buildConfig() {
      return {
        menuId: this.menuId,
        userId: this.userId,
        visibleFields: JSON.stringify(this.visibleFields),
        frozenFields: JSON.stringify(this.frozenFields),
        frozenPositions: JSON.stringify(this.frozenPositions),
        filterFields: JSON.stringify(this.filterFields),
        columnOrder: JSON.stringify(this.columnOrder),
        filterSchemes: JSON.stringify(this.filterSchemes)
      }
    },

    handleConfigChange({ visibleFields, columnOrder, frozenFields, frozenPositions, filterFields, filterSchemes }) {
      this.visibleFields = visibleFields
      this.columnOrder = columnOrder
      this.frozenFields = frozenFields
      this.frozenPositions = frozenPositions || {}
      this.filterFields = filterFields
      this.filterSchemes = filterSchemes
      this.saveConfig()
    },

    handleApplyScheme(filterValues) {
      this.$emit('apply-scheme', filterValues)
    }
  }
}
