/**
 * v-autofocus —— 输入框出现即自动聚焦（opt-in）
 * v-show 弹层须绑 enabled=打开态，避免 leave 中聚焦。
 */
import type { DirectiveBinding, ObjectDirective } from 'vue'

interface AutofocusOptions {
  /** 聚焦延迟 ms，默认 150 */
  delay?: number
  /** 聚焦目标 selector */
  selector?: string
  /** 开关；v-show 须绑打开态 */
  enabled?: boolean
  /** 聚焦后全选，默认 false */
  select?: boolean
  /** 不滚动，默认 true */
  preventScroll?: boolean
  /** 不抢已聚焦控件 */
  respectExisting?: boolean
}

type AutofocusValue = boolean | number | AutofocusOptions | undefined

interface State {
  io?: IntersectionObserver
  timer?: ReturnType<typeof setTimeout>
  raf?: number
  intersecting: boolean
  generation: number
  hasFocused: boolean
  opts: Required<AutofocusOptions>
}

const FOCUSABLE = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])'
const store = new WeakMap<HTMLElement, State>()

function resolveOptions(v: AutofocusValue, m: Partial<Record<string, boolean>>): Required<AutofocusOptions> {
  const base: Required<AutofocusOptions> = {
    delay: 150,
    selector: '',
    enabled: true,
    select: !!m.select,
    preventScroll: true,
    respectExisting: true
  }
  if (v === false) return { ...base, enabled: false }
  if (typeof v === 'number') return { ...base, delay: v }
  if (v && typeof v === 'object') return { ...base, ...v, select: v.select ?? base.select }
  return base
}

function getTarget(el: HTMLElement, o: Required<AutofocusOptions>): HTMLElement | null {
  if (o.selector) return el.querySelector<HTMLElement>(o.selector)
  if (el.matches(FOCUSABLE)) return el
  return el.querySelector<HTMLElement>(FOCUSABLE)
}

function editableActive(el: HTMLElement): HTMLElement | null {
  const root = el.getRootNode() as Document | ShadowRoot
  const a = (root as Document).activeElement as HTMLElement | null
  return a && a.matches?.(FOCUSABLE) ? a : null
}

function isVisibleForFocus(t: HTMLElement): boolean {
  if (!t.isConnected) return false
  if (t.matches('[disabled], input[type="hidden"], [inert]')) return false
  if (t.closest('[inert]')) return false // 关闭中弹层兜底
  if (!t.getClientRects().length) return false // display:none / 脱离文档
  if (getComputedStyle(t).visibility === 'hidden') return false
  return true
}

function focusNow(el: HTMLElement, s: State): boolean {
  const o = s.opts
  if (!o.enabled || !el.isConnected) return false
  const t = getTarget(el, o)
  if (!t || !isVisibleForFocus(t)) return false
  const active = editableActive(el)
  if (o.respectExisting && active && active !== t) return false
  if (active === t) return true
  t.focus({ preventScroll: o.preventScroll })
  if (o.select && 'select' in t) (t as HTMLInputElement).select()
  return true
}

/** 统一取消 timer/rAF，作废在途回调 */
function cancel(s: State) {
  if (s.timer !== undefined) {
    clearTimeout(s.timer)
    s.timer = undefined
  }
  if (s.raf !== undefined) {
    cancelAnimationFrame(s.raf)
    s.raf = undefined
  }
  s.generation++
}

function schedule(el: HTMLElement, s: State) {
  if (s.hasFocused) return
  if (s.timer !== undefined || s.raf !== undefined) return // 已有 pending，不重排
  const gen = s.generation
  s.timer = setTimeout(() => {
    s.timer = undefined
    s.raf = requestAnimationFrame(() => {
      s.raf = undefined
      if (gen !== s.generation || !s.intersecting) return // 已取消/离屏：丢弃
      s.hasFocused = focusNow(el, s)
    })
  }, s.opts.delay)
}

function mount(el: HTMLElement, binding: DirectiveBinding<AutofocusValue>) {
  const opts = resolveOptions(binding.value, binding.modifiers)
  const s: State = { intersecting: false, generation: 0, hasFocused: false, opts }
  store.set(el, s)
  if (!opts.enabled) return
  s.io = new IntersectionObserver(
    entries => {
      for (const e of entries) {
        s.intersecting = e.isIntersecting
        if (e.isIntersecting) schedule(el, s)
        else {
          cancel(s)
          s.hasFocused = false // 离屏：允许重聚焦
        }
      }
    },
    { threshold: 0.01 }
  )
  s.io.observe(el)
}

function unmount(el: HTMLElement) {
  const s = store.get(el)
  if (!s) return
  cancel(s)
  s.io?.disconnect()
  store.delete(el)
}

const autofocus: ObjectDirective<HTMLElement, AutofocusValue> = {
  mounted: mount,
  updated(el, binding) {
    const s = store.get(el)
    const next = resolveOptions(binding.value, binding.modifiers)
    if (!s) return mount(el, binding)
    const delayChanged = next.delay !== s.opts.delay
    s.opts = next
    if (!next.enabled) return unmount(el) // 同 patch 内取消 pending
    if (!s.io) return mount(el, binding)
    if (delayChanged) cancel(s)
    // 仅可见且未聚焦时补偿
    if (!s.hasFocused && s.intersecting) schedule(el, s)
  },
  unmounted: unmount
}

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.vueApp.directive('autofocus', autofocus)
})
