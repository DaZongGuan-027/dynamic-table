import DynamicTable from './src/index.vue'
import useTableConfig from './src/composables/useTableConfig'
import useFilter from './src/composables/useFilter'

DynamicTable.install = function(Vue) {
  Vue.component(DynamicTable.name, DynamicTable)
}

export { DynamicTable, useTableConfig, useFilter }
export default DynamicTable