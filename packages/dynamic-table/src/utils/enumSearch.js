// Build searchable records once per option-array identity. Search still scans the
// complete loaded collection; callers can virtualize only the returned window.
const cache = typeof WeakMap === 'function' ? new WeakMap() : null

export function getSearchableEnumOptions(options) {
  const list = Array.isArray(options) ? options : []
  if (cache && cache.has(list)) return cache.get(list)
  const indexed = list.map(option => ({
    option,
    label: String(option && option.label != null ? option.label : '').toLocaleLowerCase(),
    value: String(option && option.value != null ? option.value : '').toLocaleLowerCase()
  }))
  if (cache) cache.set(list, indexed)
  return indexed
}

export function searchEnumOptions(options, keyword) {
  const query = String(keyword == null ? '' : keyword).toLocaleLowerCase()
  const indexed = getSearchableEnumOptions(options)
  if (!query) return indexed.map(entry => entry.option)
  return indexed.filter(entry => entry.label.includes(query) || entry.value.includes(query)).map(entry => entry.option)
}
