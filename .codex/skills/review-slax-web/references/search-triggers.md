# 必搜清单 / Search Triggers

阶段 3 的兜底：见到以下模式时**一律联网搜**，不要凭记忆下结论。每条给出"识别模式"和"搜什么"。

---

## Vue 3.5 / 组合式 API

- 模式：`defineModel` / `useTemplateRef` / `useId` / props 解构默认值 / `watchEffect` / `effectScope` / `shallowRef` / `toValue`
- 搜：`"Vue 3.5 <api> reactivity pitfall 2026"`、`"Vue 3.5 <api> gotcha site:github.com"`

## Nuxt

- 模式：`useAsyncData` / `useFetch` / `useState` / `useLazyAsyncData` / `definePageMeta` / route middleware / plugin / `<ClientOnly>` / `useHydration`
- 搜：`"Nuxt <api> SSR hydration <year>"`、`"Nuxt useState shared state leak"`、`"Nuxt useFetch key dedup"`

## SSR / Hydration

- 模式：setup 顶层用 `window`/`localStorage`/`navigator`/`Date.now()`/`Math.random()`
- 搜：`"Nuxt hydration mismatch <cause>"`

## VueUse

- 模式：`useEventListener` / `useIntervalFn` / `useIntersectionObserver` / `useDebounceFn` / `useStorage` / `useVirtualList` / 任何 `@vueuse/*` composable
- 搜：`"VueUse <composable> cleanup SSR <year>"`、`"@vueuse/core <composable> issue"`

## Pinia

- 模式：`storeToRefs` / `$patch` / `$subscribe` / store 解构 / SSR store hydration
- 搜：`"Pinia storeToRefs reactivity"`、`"Pinia Nuxt SSR hydration"`

## PowerSync / 本地优先

- 模式：`app/local-first/**` / PowerSync schema / watch query / 离线同步 / 乐观更新
- 搜：`"PowerSync <feature> <year>"`、`"PowerSync offline conflict resolution"`、`"PowerSync web sql watch"`

## UnoCSS

- 模式：`uno.config.ts` preset 改动 / attributify / `theme` / 裸 class-like token
- 搜：`"UnoCSS lightningcss unexpected token build"`、`"UnoCSS <preset> pitfall"`

## 渲染 / 内容库

- 模式：`markdown-it` / `markmap-lib` / `mermaid` / `highlight.js` / `katex` / `dompurify` / `easy-dom2img`
- 搜：`"<lib> <version> XSS OR performance OR memory 2026"`、DOMPurify 配置是否放行危险标签

## TS / JS 语法糖

| 模式                      | 搜什么                                                     |
| ------------------------- | ---------------------------------------------------------- | --- | ----------------------------------- | --- | ----------------------------------- |
| `using` / `await using`   | `"TypeScript using declaration support"` + 是否需 polyfill |
| `Promise.withResolvers()` | `"Promise.withResolvers browser support"`                  |
| `structuredClone`         | `"structuredClone browser support"`                        |
| `satisfies`               | 一般 OK，看 TS 版本                                        |
| `??` / `??=` vs `         |                                                            | `   | `"nullish coalescing pitfalls"`（`x |     | default` 在 0/''/false 时错误兜底） |
| Top-level await           | Nuxt/Vite 支持情况                                         |

## 类型断言 / 绕过

- `as any` / `as unknown as X` / `// @ts-ignore` / `// @ts-expect-error` → 看是否绕过类型检查，一般 `[Should-Fix]`

## 安全（前端）

- 模式：`v-html` / `innerHTML` / `dangerouslySetInnerHTML` 等价物 / 用户内容渲染
- 搜：`"Vue v-html XSS DOMPurify"`；确认用户内容经过 sanitize
- 模式：`target="_blank"` 无 `rel="noopener"` → tabnabbing
- 模式：URL 拼接用户输入 / open redirect

## 构建 / 依赖

- 升级 Nuxt / Vue / UnoCSS / VueUse / PowerSync 大版本 → 搜 changelog breaking changes
- 新引入 npm 包 → 搜维护状态、体积、是否有同类已在用

---

## 通用启发式

如果你犹豫"这个用法对吗"超过 2 秒 → **直接搜**，不要继续犹豫。
