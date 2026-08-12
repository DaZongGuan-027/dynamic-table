export default {
  props: {
    defaultFilterValues: { type: Object, default: () => ({}) },
    filterCacheKey: { type: String, default: '' },
    cacheFilters: { type: Boolean, default: true }
  },

  data() {
    return {
      filterValues: {},
      filterExpanded: true
    }
  },

  computed: {
    _filterCacheId() {
      return this.filterCacheKey || this.menuId || ''
    },

    activeFilters() {
      const filters = {}
      Object.keys(this.filterValues).forEach(key => {
        const val = this.filterValues[key]
        if (val === null || val === undefined || val === '') return
        if (typeof val === 'object' && !Array.isArray(val)) {
          if (val.range !== undefined) {
            if (Array.isArray(val.range) && val.range.length === 2) {
              filters[key] = {
                start: val.range[0] + ' 00:00:00',
                end: val.range[1] + ' 23:59:59'
              }
            }
          } else if (val.operator !== undefined) {
            if (val.value !== '' && val.value !== null && val.value !== undefined) {
              if (val.operator === 'in') {
                const parts = String(val.value).split(/[,，、/]/).map(s => s.trim()).filter(s => s)
                if (parts.length > 0) {
                  filters[key] = parts
                }
              } else {
                filters[key] = val
              }
            }
          } else if (Object.keys(val).some(k => val[k] !== null && val[k] !== undefined && val[k] !== '')) {
            filters[key] = val
          }
        } else if (Array.isArray(val)) {
          if (val.length > 0) filters[key] = val
        } else {
          filters[key] = val
        }
      })
      return filters
    }
  },

  methods: {
    initFilterValues(applyDefaults) {
      const values = {}
      this.activeFilterMetaList.forEach(meta => {
        const hasEnum = meta.enumValues && (Array.isArray(meta.enumValues) ? meta.enumValues.length > 0 : Object.keys(meta.enumValues).length > 0)
        if (hasEnum) {
          values[meta.fieldKey] = []
        } else {
          switch (meta.fieldType) {
            case 'string':
              values[meta.fieldKey] = { operator: 'contains', value: '' }
              break
            case 'number':
            case 'currency':
              values[meta.fieldKey] = { operator: 'eq', value: '' }
              break
            case 'date':
              const dft = meta.dateFilterType || 'daterange'
              if (dft === 'daterange' || dft === 'monthrange') {
                values[meta.fieldKey] = { range: null }
              } else {
                values[meta.fieldKey] = { value: null }
              }
              break
            case 'boolean':
              values[meta.fieldKey] = ''
              break
            default:
              values[meta.fieldKey] = { operator: 'contains', value: '' }
          }
        }
      })

      if (applyDefaults && this.defaultFilterValues) {
        Object.keys(this.defaultFilterValues).forEach(key => {
          if (values[key] !== undefined) {
            values[key] = JSON.parse(JSON.stringify(this.defaultFilterValues[key]))
          }
        })
      }

      if (applyDefaults && this.cacheFilters && this._filterCacheId) {
        const cached = this._loadCachedFilters()
        if (cached) {
          Object.keys(cached).forEach(key => {
            if (values[key] !== undefined) {
              values[key] = cached[key]
            }
          })
        }
      }

      this.filterValues = values

      if (applyDefaults && this.cacheFilters && this._filterCacheId && this.$refs.filterPanel) {
        const cachedText = this._loadCachedEnumFilterText()
        if (cachedText) {
          this.$nextTick(() => {
            if (this.$refs.filterPanel) {
              this.$refs.filterPanel.initEnumFilterText(cachedText)
            }
          })
        }
      }
    },

    _loadCachedFilters() {
      if (!this._filterCacheId) return null
      try {
        const raw = localStorage.getItem('dynamic_table_filter_' + this._filterCacheId)
        if (raw) return JSON.parse(raw)
      } catch (e) {}
      return null
    },

    _saveCachedFilters() {
      if (!this.cacheFilters || !this._filterCacheId) return
      try {
        localStorage.setItem('dynamic_table_filter_' + this._filterCacheId, JSON.stringify(this.filterValues))
      } catch (e) {}
    },

    _clearCachedFilters() {
      if (!this._filterCacheId) return
      try {
        localStorage.removeItem('dynamic_table_filter_' + this._filterCacheId)
        localStorage.removeItem('dynamic_table_enum_filter_text_' + this._filterCacheId)
      } catch (e) {}
    },

    _loadCachedEnumFilterText() {
      if (!this._filterCacheId) return null
      try {
        const raw = localStorage.getItem('dynamic_table_enum_filter_text_' + this._filterCacheId)
        if (raw) return JSON.parse(raw)
      } catch (e) {}
      return null
    },

    _saveCachedEnumFilterText(textMap) {
      if (!this.cacheFilters || !this._filterCacheId) return
      try {
        localStorage.setItem('dynamic_table_enum_filter_text_' + this._filterCacheId, JSON.stringify(textMap))
      } catch (e) {}
    },

    resetFilters() {
      this.initFilterValues(false)
      this._clearCachedFilters()
      if (this.$refs.filterPanel) {
        this.$refs.filterPanel.clearEnumFilterText()
      }
      this.$emit('filter-change', {})
    },

    applyFilters() {
      this._saveCachedFilters()
      this.$emit('filter-change', this.activeFilters)
    },

    toggleFilterExpand() {
      this.filterExpanded = !this.filterExpanded
      this.$nextTick(() => {
        if (typeof this.doLayout === 'function') {
          this.doLayout()
        }
      })
    },

    scrollFilterToTop() {
      this.$nextTick(() => {
        const el = this.$el && this.$el.querySelector('.filter-form-scroll')
        if (el) el.scrollTop = 0
      })
    }
  },

  watch: {
    activeFilterMetaList: {
      handler() {
        this.initFilterValues(true)
      },
      immediate: true
    },
    filterValues: {
      handler() {
        if (this.cacheFilters && this._filterCacheId) {
          this._saveCachedFilters()
        }
      },
      deep: true
    }
  }
}