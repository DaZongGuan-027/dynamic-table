export default {
  props: {
    defaultFilterValues: { type: Object, default: () => ({}) },
    filterCacheKey: { type: String, default: '' },
    cacheFilters: { type: Boolean, default: false }
  },

  data() {
    return {
      filterValues: {},
      filterExpanded: true
    }
  },

  computed: {
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
            if (val.value !== '' && val.value !== null && val.value !== undefined) filters[key] = val
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
              values[meta.fieldKey] = { range: null }
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

      if (applyDefaults && this.cacheFilters && this.filterCacheKey) {
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
    },

    _loadCachedFilters() {
      try {
        const raw = localStorage.getItem('dynamic_table_filter_' + this.filterCacheKey)
        if (raw) return JSON.parse(raw)
      } catch (e) {}
      return null
    },

    _saveCachedFilters() {
      if (!this.cacheFilters || !this.filterCacheKey) return
      try {
        localStorage.setItem('dynamic_table_filter_' + this.filterCacheKey, JSON.stringify(this.filterValues))
      } catch (e) {}
    },

    _clearCachedFilters() {
      if (!this.filterCacheKey) return
      try {
        localStorage.removeItem('dynamic_table_filter_' + this.filterCacheKey)
      } catch (e) {}
    },

    resetFilters() {
      this.initFilterValues(false)
      this._clearCachedFilters()
      this.$emit('filter-change', {})
    },

    applyFilters() {
      this._saveCachedFilters()
      this.$emit('filter-change', this.activeFilters)
    },

    toggleFilterExpand() {
      this.filterExpanded = !this.filterExpanded
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
        const hasCache = this.cacheFilters && this.filterCacheKey && this._loadCachedFilters()
        this.initFilterValues(true)
      },
      immediate: true
    }
  }
}