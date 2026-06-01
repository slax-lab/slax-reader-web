# Open Pages 样式重构规格

日期：2026-06-01  
分支：feature/snapshot-detail-redesign

## 目标

将 dweb 中 7 个页面（`[...slug].vue`、`error.vue`、`login.vue`、`privacy.vue`、`terms.vue`、`delete-account-notice.vue`、`how-do-i-delete-my-account.vue`）的样式全面对齐 DESIGN.md 规范：消除硬编码颜色、复用已有顶栏组件、统一页面背景渐变。

## 范围

| 文件                                               | 改动类型                                        |
| -------------------------------------------------- | ----------------------------------------------- |
| `pages/[...slug].vue`                              | 顶栏替换为 SnapshotTopBar + token 化 + 背景渐变 |
| `app/error.vue`                                    | 同上                                            |
| `pages/login.vue`                                  | 背景渐变 + token 化                             |
| `pages/(open_docs)/privacy.vue`                    | token 化 + 背景渐变                             |
| `pages/(open_docs)/terms.vue`                      | token 化 + 背景渐变                             |
| `pages/(open_docs)/delete-account-notice.vue`      | token 化 + 背景渐变                             |
| `pages/(open_docs)/how-do-i-delete-my-account.vue` | token 化 + 背景渐变                             |

## 设计决策

### 顶栏（slug / error）

- 删除内联 `.header` 结构，改用 `<SnapshotTopBar>`（已符合 DESIGN.md）
- `left` slot：可点击文字 Logo，`font-family: var(--slax-font-serif)`，`color: var(--slax-text)`，点击跳转 `/bookmarks`
- `right` slot：空
- 删除 `.responsive-width`、`.header-container`、`.left`、`.right` 等冗余类

### 页面背景

所有页面统一使用 DESIGN.md 第三节标准渐变，在非 scoped `<style>` 块中 override `body`：

```scss
body {
  background: #faf8f2;
}
body::before {
  /* 三色径向渐变 */
}
[data-slax-theme='dark'] body {
  background: #141210;
}
// ...
```

### 颜色 token 映射

| 硬编码值                       | 替换 token               |
| ------------------------------ | ------------------------ |
| `#fcffff`                      | `var(--slax-bg)`         |
| `#16b998`                      | `var(--slax-accent)`     |
| `#16b9981f`                    | `var(--slax-accent-bg)`  |
| `#999999`                      | `var(--slax-text-muted)` |
| `#1f1f1f` / `#333333`          | `var(--slax-text)`       |
| `#6a6e8333`                    | `var(--slax-border)`     |
| `#f5f5f3` / `bg-surface-solid` | `var(--slax-bg)`         |
| `duration-250`                 | `var(--slax-dur-normal)` |

### login.vue

- 背景从 `bg-gradient-to-br from-#f8fffc to-#e6fff3` 改为标准页面背景渐变
- `.title` 加 `font-family: var(--slax-font-serif)`，颜色改 `var(--slax-text)`
- `.subtitle` 颜色改 `var(--slax-text-muted)`

### 文档页（privacy / terms / delete-account-notice / how-do-i-delete-my-account）

- 无顶栏，保持纯文档样式
- 背景 token 化 + 标准渐变
- language-tab 颜色全部 token 化

## 不改动

- 所有页面的 `<script>` 逻辑
- `ContentRenderer` 相关结构
- `markdownContent.contentStyle` mixin
- `SnapshotTopBar.vue` 本身
