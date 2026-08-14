# Vue 3.5 + Nuxt + UnoCSS 已知陷阱

读这份的时机：diff 涉及组件 / composable / SSR / 响应式 / 样式时。每条附"搜什么"—— 框架行为版本敏感，凭记忆下结论会错。

---

## Vue 响应式

### 丢失响应性（destructuring）

- 解构 `props`、`reactive()`、store 会丢响应性
- 正确：`toRefs` / `toRef(props, 'x')` / `storeToRefs(store)`
- `[Should-Fix]`：`const { foo } = props` 之后 watch/computed 依赖 `foo`

### computed 里写副作用

- computed 应纯函数。里面 `await` / 改状态 / 打接口 → 反模式
- watch / watchEffect 才是副作用的地方

### watch 语义

- 默认 lazy（不立即执行）；需要首帧就跑 → `{ immediate: true }`
- 对象/数组深层变更 → `{ deep: true }`（或 watch getter）
- `watchEffect` 自动收集依赖，但异步里 await 之后新增的依赖不再收集
- 搜：`"Vue 3.5 watch deep reactive pitfall"`

### 生命周期清理

- `setInterval` / `addEventListener` / 第三方实例（mermaid/markmap/observer）必须在 `onUnmounted` 清理
- VueUse 的 `useEventListener` / `useIntervalFn` 自动清理，优先用
- `[Should-Fix]`/`[Critical]`：手写监听无清理 → 内存泄漏 / 重复触发

### Vue 3.5 新 API

- `defineModel()` / `useTemplateRef()` / `useId()` / props 解构默认值（编译期保留响应性）
- 搜：`"Vue 3.5 defineModel reactivity"`、`"Vue 3.5 props destructure reactivity"` 确认当前行为

---

## v-for / key

- `v-for` 必须有稳定 `key`（不要用 index，除非列表纯静态）
- **keyed fragment 空↔非空崩溃**：Vue3.5 异步 patch 下，keyed `v-for` fragment 从空变非空（或反之）可能崩（本项目 /b/[id] 标签栏踩过）。修复套路：保证 fragment 恒定挂载 / 加占位 / 避免异步 patch 期间结构骤变。见 project-gotchas。
- 搜：`"Vue 3.5 v-for fragment patch crash"`

---

## Nuxt SSR / Hydration

### Hydration mismatch

- SSR 首帧与 client 首帧输出必须一致
- 常见根因：`Date.now()` / `Math.random()` / `window` / `localStorage` / `navigator` 直接在 setup 顶层用
- 正确：客户端专属逻辑放 `onMounted` / `import.meta.client` 守卫 / `<ClientOnly>`
- 搜：`"Nuxt hydration mismatch <cause>"`

### 数据获取

- `useAsyncData` / `useFetch` 有去重 key 语义；同 key 会共享。乱用 key 导致数据串
- `useState` 是 SSR-safe 的跨请求隔离状态；不要用模块级 `ref` 存请求态（跨请求泄漏）
- 搜：`"Nuxt useState vs ref SSR shared state"`、`"useAsyncData key dedup"`

### 插件 / 中间件执行序

- Nuxt plugin 顺序、`.client`/`.server` 后缀、route middleware 执行时机
- 搜：`"Nuxt plugin execution order client server"`

### import.meta

- `import.meta.client` / `import.meta.server` / `import.meta.dev` 守卫环境专属代码

---

## Pinia

- store 解构丢响应性 → `storeToRefs`
- `$patch` vs 直接赋值；action 里的 `this`
- SSR 下 store 状态 hydration（Nuxt 的 `@pinia/nuxt` 处理，但自定义序列化要小心）

---

## UnoCSS

- **裸 JS token 灾难**：源码里出现类似 class 的裸字符串（如 `!!container`、模板里的 JS 表达式片段）会被 UnoCSS 当 class 提取，生成非法 CSS，`build` 时 lightningcss 报 `Unexpected token '!'`。**dev 正常，build 才炸**。见 project-gotchas。
- attributify 模式下属性名冲突
- `theme` / preset 改动影响全局
- 搜：`"UnoCSS lightningcss unexpected token build"`、`"UnoCSS attributify pitfall"`

---

## 异步组件 / 代码分割

- 大依赖（markmap/mermaid/katex/highlight.js）应动态 import / `defineAsyncComponent`，避免进首屏 bundle
- 搜：`"Nuxt dynamic import chunk"`

---

## 渲染性能

- 大列表无虚拟滚动 → 卡顿（本项目 bookmarks 用了虚拟滚动，注意动画约束）
- `v-if` vs `v-show`：频繁切换用 `v-show`，条件极少变用 `v-if`
- 深层 `watch({deep})` 大对象 → 昂贵
- inline 对象/数组 literal 作 props → 每次 render 新引用，触发子组件更新

---

## 事件 / DOM

- `v-autofocus` 等自定义指令：v-show 弹层须绑 `enabled=打开态`（本项目约定，见 project-gotchas）
- `ref` 拿 DOM 要在 `onMounted` 后；模板 ref 用 `useTemplateRef`（3.5）
