<script>
const ROW_HEIGHT = 34
const VIEWPORT_ROWS = 12
const OVERSCAN = 4

export default {
  name: 'VirtualEnumOptions',
  props: {
    options: { type: Array, default: () => [] },
    enabled: { type: Boolean, default: null },
    threshold: { type: Number, default: 100 }
  },
  data() { return { start: 0, scrollElement: null, onScroll: null, activeIndex: -1 } },
  computed: {
    useVirtual() { return this.enabled === null ? this.options.length >= this.threshold : this.enabled },
    visibleOptions() {
      if (!this.useVirtual) return this.options
      return this.options.slice(this.start, this.start + VIEWPORT_ROWS + OVERSCAN * 2)
    }
  },
  watch: {
    options() { this.start = 0; this.activeIndex = -1; this.$nextTick(this.bindScroll) },
    useVirtual() { this.start = 0; this.activeIndex = -1; this.$nextTick(this.bindScroll) }
  },
  mounted() {
    this.onKeydown = this.handleKeydown.bind(this)
    document.addEventListener('keydown', this.onKeydown, true)
    this.$nextTick(this.bindScroll)
  },
  updated() { this.$nextTick(this.bindScroll) },
  beforeDestroy() {
    this.unbindScroll()
    if (this.onKeydown) document.removeEventListener('keydown', this.onKeydown, true)
  },
  methods: {
    bindScroll() {
      if (!this.useVirtual || !this.$el) return
      const wrap = this.$el.closest && this.$el.closest('.el-select-dropdown__wrap') || document.querySelector('.el-select-dropdown:not([style*="display: none"]) .el-select-dropdown__wrap')
      if (!wrap) return
      if (this.scrollElement !== wrap) { this.unbindScroll(); this.scrollElement = wrap }
      if (!this.onScroll) {
        this.onScroll = () => {
          const next = Math.max(0, Math.floor(wrap.scrollTop / ROW_HEIGHT) - OVERSCAN)
          if (next !== this.start) this.start = next
        }
        wrap.addEventListener('scroll', this.onScroll, { passive: true })
      }
      this.$el.style.height = `${this.options.length * ROW_HEIGHT}px`
      this.$el.style.position = 'relative'
      wrap.scrollTop = Math.min(wrap.scrollTop, Math.max(0, this.options.length * ROW_HEIGHT - wrap.clientHeight))
      this.onScroll()
    },
    handleKeydown(event) {
      if (!this.useVirtual || !this.scrollElement || !this.options.length) return
      const select = event.target.closest && event.target.closest('.el-select')
      const dropdown = this.$el.closest && this.$el.closest('.el-select-dropdown')
      if (!select || !dropdown || window.getComputedStyle(dropdown).display === 'none') return
      let next = this.activeIndex
      if (event.key === 'ArrowDown') next = Math.min(this.options.length - 1, next + 1)
      else if (event.key === 'ArrowUp') next = Math.max(0, next < 0 ? 0 : next - 1)
      else if (event.key === 'Home') next = 0
      else if (event.key === 'End') next = this.options.length - 1
      else if (event.key === 'Enter' && this.activeIndex >= 0) {
        const active = this.$el.querySelector(`[data-virtual-index="${this.activeIndex}"]`)
        if (active) {
          event.preventDefault()
          event.stopImmediatePropagation()
          active.click()
        }
        return
      } else return
      event.preventDefault()
      event.stopImmediatePropagation()
      this.activeIndex = next
      const rowTop = next * ROW_HEIGHT
      if (rowTop < this.scrollElement.scrollTop) this.scrollElement.scrollTop = rowTop
      else if (rowTop + ROW_HEIGHT > this.scrollElement.scrollTop + this.scrollElement.clientHeight) {
        this.scrollElement.scrollTop = rowTop + ROW_HEIGHT - this.scrollElement.clientHeight
      }
      this.start = Math.max(0, Math.floor(this.scrollElement.scrollTop / ROW_HEIGHT) - OVERSCAN)
      this.$nextTick(() => {
        const active = this.$el.querySelector(`[data-virtual-index="${next}"]`)
        if (active) active.classList.add('is-hovering')
      })
    },
    unbindScroll() {
      if (this.scrollElement && this.onScroll) this.scrollElement.removeEventListener('scroll', this.onScroll)
      this.scrollElement = null
      this.onScroll = null
    }
  },
  render(h) {
    const children = this.visibleOptions.map((opt, offset) => {
      const index = this.useVirtual ? this.start + offset : offset
      return h('el-option', {
        key: opt.value,
        class: { 'is-hovering': this.activeIndex === index },
        attrs: { 'data-virtual-index': index },
        props: { label: opt.label, value: opt.value },
        style: this.useVirtual ? { position: 'absolute', top: `${index * ROW_HEIGHT}px`, left: '0', right: '0' } : undefined
      })
    })
    return h('div', { class: 'virtual-enum-options', style: { height: this.useVirtual ? `${this.options.length * ROW_HEIGHT}px` : undefined, position: this.useVirtual ? 'relative' : undefined } }, children)
  }
}
</script>
