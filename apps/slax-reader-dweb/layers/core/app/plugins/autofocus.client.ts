/**
 * v-autofocus —— 输入框"出现即自动聚焦"指令（opt-in）
 *
 * 目标：凡需要"出现输入框"的场景，输入框出现后自动聚焦，省去用户手动点击。
 * 出现后延迟 0–1s（默认 150ms）再聚焦，错开弹层入场动画，不要求立刻。
 *
 * 设计要点：
 * - 用 IntersectionObserver 监听元素可见性，统一覆盖两种"出现"机制：
 *     ① <Transition><div v-if>      —— 输入每次出现都重新挂载（mounted 触发）
 *     ② <Transition><div v-show>     —— 输入挂载一次，靠 display 切显隐（mounted 时不可见）
 * - 聚焦目标惰性解析：指令可标在 input 本身或其包裹容器。
 * - 不抢焦：用户已聚焦其他可编辑控件时不抢（respectExisting）。
 * - 可重复：弹层再次打开会重新聚焦。
 *
 * ⚠️ 用法契约（重要）：
 *   ① v-if 创建/销毁型：直接 `v-autofocus` 即可，关闭即 unmounted，无 leave 聚焦风险。
 *   ② v-show + Transition 复用挂载型：必须绑打开态 `v-autofocus="{ enabled: open }"`，
 *      否则关闭动画(leave)期间元素仍 connected/有 rect，pending 聚焦可能打到正在关闭的输入上。
 *
 * 已知限制：
 * - iOS Safari 非用户手势的 focus() 通常不弹软键盘（只聚焦）。
 * - 自动聚焦会移动读屏焦点；常驻/页面加载即出现的输入慎用。
 * - shadow DOM (.ce.vue / defineCustomElement) 全局指令不生效，改用 useAutofocus()。
 */
import type { DirectiveBinding, ObjectDirective } from 'vue'

interface AutofocusOptions {
  /** 聚焦延迟 ms，默认 150 */
  delay?: number
  /** 容器内聚焦目标 selector，默认自动解析 input/textarea/select/contenteditable */
  selector?: string
  /** 开关，默认 true；v-show 弹层须绑打开态 */
  enabled?: boolean
  /** 聚焦后全选已有文本，默认 false（可用 v-autofocus.select 修饰符） */
  select?: boolean
  /** focus 时不滚动，默认 true */
  preventScroll?: boolean
  /** 已有可编辑控件聚焦则不抢，默认 true */
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
  if (t.closest('[inert]')) return false // 关闭中的弹层父层常被置 inert，作为兜底
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

/** 统一取消：清 timer + rAF，并 bump generation 令在途回调失效 */
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
      if (gen !== s.generation || !s.intersecting) return // 已被 cancel / 已离屏：丢弃
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
          s.hasFocused = false // 离屏：取消在途 + 允许下次重聚焦
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
    if (!next.enabled) return unmount(el) // open→false 的同一次 patch 内取消 pending，杜绝 leave 中聚焦
    if (!s.io) return mount(el, binding)
    if (delayChanged) cancel(s)
    // 仅在 IO 认定可见、且尚未成功聚焦时补偿（覆盖"容器先现、内层 input 后 v-if"）
    if (!s.hasFocused && s.intersecting) schedule(el, s)
  },
  unmounted: unmount
}

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.vueApp.directive('autofocus', autofocus)
})
