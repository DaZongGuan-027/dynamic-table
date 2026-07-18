export default {
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
          } else if (Object.values(val).some(v => v !== null && v !== undefined && v !== '')) {
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
    initFilterValues() {
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
      this.filterValues = values
    },

    resetFilters() {
      this.initFilterValues()
      this.$emit('filter-change', {})
    },

    applyFilters() {
      this.$emit('filter-change', this.activeFilters)
    },

    toggleFilterExpand() {
      this.filterExpanded = !this.filterExpanded
    }
  },

  watch: {
    activeFilterMetaList: {
      handler() {
        this.initFilterValues()
      },
      immediate: true
    }
  }
}