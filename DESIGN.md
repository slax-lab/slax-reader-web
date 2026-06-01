# Slax Reader Design System

> 本文档描述 Slax Reader Web 应用（`slax-reader-dweb`）的视觉设计规范。所有新页面和组件的样式开发均应遵循此文档，以保持整体风格一致。
>
> 设计基调：**暖色纸质感 · 衬线排版 · 毛玻璃浮层 · 三主题适配**

---

## 一、主题系统

应用支持三套主题，通过 `<html>` 上的 `data-slax-theme` 属性切换：

| 主题              | 属性值                   | 视觉特征                                                   |
| ----------------- | ------------------------ | ---------------------------------------------------------- |
| **Light**（默认） | 无属性                   | 暖奶油底色、橙红 accent、毛玻璃浮层、暖色阴影              |
| **Dark**          | `data-slax-theme="dark"` | 深棕暖色底、偏橙 accent、更深阴影                          |
| **E-ink**         | `data-slax-theme="eink"` | 纯黑白灰、无毛玻璃、无阴影、圆角收紧至 4/2px、禁用所有动效 |

**切换方式**：`ThemeSwitcher` 组件写入 `document.documentElement.dataset.slaxTheme`，同时持久化到 localStorage。

---

## 二、设计 Token

所有样式值通过 CSS 变量消费，**禁止在组件内硬编码颜色、阴影、圆角、字号**。Token 定义在 `layers/core/styles/theme.tokens.css`。

### 2.1 颜色

```css
/* 背景层级（从底到顶） */
--slax-bg              /* 页面最底层背景 */
--slax-surface         /* 半透明卡片/浮层底色（含透明度） */
--slax-surface-solid   /* 不透明卡片/弹窗底色 */
--slax-topbar-bg       /* 顶栏专用半透明底色 */

/* 文本层级 */
--slax-text            /* 主文本 */
--slax-text-muted      /* 次要文本（标签、说明） */
--slax-text-light      /* 弱化文本（日期、占位符） */
--slax-btn-text        /* 主按钮文字（在 accent 底色上） */

/* 强调色 */
--slax-accent          /* 主强调色（按钮、链接、激活态） */
--slax-accent-soft     /* 柔和强调色（划线装饰） */
--slax-accent-bg       /* 强调色浅底（hover 背景、标签底色） */

/* 功能色 */
--slax-danger          /* 危险/错误 */
--slax-danger-bg       /* 危险浅底 */
--slax-border          /* 边框（含透明度） */
--slax-selection       /* 文本选区高亮 */
--slax-inset-hi        /* 卡片顶部内高光（inset box-shadow） */
```

### 2.2 阴影

```css
--slax-shadow-warm     /* 标准暖色阴影：0 8px 32px rgba(accent, 0.08) */
--slax-shadow-sm       /* 小阴影：0 2px 8px rgba(accent, 0.05) */
```

E-ink 主题下两者均为 `none`。

### 2.3 圆角

```css
--slax-radius          /* 大圆角：14px（卡片、弹窗、面板） */
--slax-radius-sm       /* 小圆角：10px（按钮、输入框、标签） */
```

E-ink 主题下分别收紧为 4px / 2px。

### 2.4 字体

```css
--slax-font-sans       /* 无衬线：Inter + PingFang SC（正文、UI） */
--slax-font-serif      /* 衬线：Playfair Display + Noto Serif SC（标题、Logo、卡片标题） */
--slax-font-mono       /* 等宽：SF Mono + Fira Code（代码） */
```

**使用规则**：

- 页面/section 标题、Logo、文章标题 → `var(--slax-font-serif)`
- 正文、按钮、导航、表单 → 继承 `body`（`var(--slax-font-sans)`）

### 2.5 字号（8 档语义）

```css
--slax-fs-display  /* 32px — 文章大标题 */
--slax-fs-h2       /* 22px — 二级标题、section 标题、面板标题 */
--slax-fs-brand    /* 20px — Logo */
--slax-fs-card     /* 17px — 列表卡片标题、弹窗标题 */
--slax-fs-body     /* 16px — 正文 */
--slax-fs-meta     /* 14px — 辅助信息、侧栏导航 */
--slax-fs-aux      /* 13px — 日期、来源、副标题、小按钮 */
--slax-fs-tag      /* 12px — 标签、角标、计数徽章 */
```

### 2.6 动效

```css
--slax-blur          /* 毛玻璃：blur(16px) saturate(150%) */
--slax-ease-spring   /* 弹性曲线：cubic-bezier(0.16, 1, 0.3, 1) */
--slax-dur-normal    /* 标准时长：0.2s */
--slax-dur-fast      /* 快速时长：0.15s */
```

E-ink 主题下 `--slax-blur: none`，且 `theme.css` 通配禁用所有 `transition` / `animation`。

### 2.7 布局

```css
--slax-header-height      /* 当前页面顶栏高度（默认 56px，快照页 52px，移动端 48px） */
--slax-header-h-list      /* 56px — 列表页/设置页 */
--slax-header-h-snapshot  /* 52px — 快照阅读页 */
--slax-header-h-mobile    /* 48px — ≤768px 移动端 */
--slax-sidebar-w          /* 240px — 列表页左侧边栏 */
--slax-shell-w            /* 1200px — 最大内容壳宽 */
--slax-content-w          /* 820px — 快照页正文最大宽 */
```

---

## 三、页面背景

每个主要页面（列表页、设置页）在 `<style lang="scss">` 非 scoped 块中 override `body` 背景，以实现暖色氛围渐变：

```scss
/* 页面级背景 override（非 scoped，仅在该页面路由激活时生效） */
body {
  background: #faf8f2;
}

body::before {
  content: '';
  position: fixed;
  inset: 0;
  background:
    radial-gradient(at 30% 0%, #faf5eb 0%, transparent 50%), radial-gradient(at 80% 20%, #f6efe4 0%, transparent 60%), radial-gradient(at 50% 80%, #f8efe4 0%, transparent 40%);
  z-index: -1;
  pointer-events: none;
}

[data-slax-theme='dark'] body {
  background: #141210;
}
[data-slax-theme='dark'] body::before {
  background:
    radial-gradient(at 30% 0%, #1e1810 0%, transparent 50%), radial-gradient(at 80% 20%, #1a1612 0%, transparent 60%), radial-gradient(at 50% 80%, #181410 0%, transparent 40%);
}

[data-slax-theme='eink'] body {
  background: #ffffff;
}
[data-slax-theme='eink'] body::before {
  display: none;
}
```

> 注：这里的硬编码色值是 `--slax-bg` 和渐变 token 的具体值，属于页面级背景 override 的惯例写法，不违反"禁止硬编码颜色"规范。

---

## 四、顶栏（Topbar）

### 规格

```
高度：var(--slax-header-height)（列表/设置页 56px，快照页 52px，移动端 48px）
背景：var(--slax-topbar-bg) + backdrop-filter: var(--slax-blur)
底边：1px solid var(--slax-border)
z-index：100
position：fixed，top/left/right: 0
```

### 内层容器

```scss
.topbar-inner {
  max-width: 960px; /* 或 var(--slax-shell-w) 视页面而定 */
  margin: 0 auto;
  padding: 0 24px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
```

### Logo

```scss
font-family: var(--slax-font-serif);
font-size: var(--slax-fs-brand); /* 20px */
font-weight: 500;
color: var(--slax-text); /* 深色，非 accent 橙色 */
letter-spacing: -0.02em;
```

### 内容区顶部留白

所有页面内容区必须预留顶栏高度：

```scss
padding-top: calc(var(--slax-header-height) + 32px);
```

---

## 五、卡片（Card）

卡片是设置页、列表页的核心容器单元。

### 标准卡片

```scss
.settings-card {
  background: var(--slax-surface);
  border: 1px solid var(--slax-border);
  border-radius: var(--slax-radius);
  box-shadow: inset 0 1px 0 var(--slax-inset-hi);
  padding: 24px;
}
```

### 列表卡片（书签条目）

```scss
.article-card {
  background: var(--slax-surface);
  border: 1px solid var(--slax-border);
  border-radius: var(--slax-radius);
  box-shadow: inset 0 1px 0 var(--slax-inset-hi);
  transition: all var(--slax-dur-normal);

  &:hover {
    box-shadow:
      var(--slax-shadow-warm),
      inset 0 1px 0 var(--slax-inset-hi);
    transform: translateY(-1px);
  }
}
```

### 规则

- **不使用通用 `section` 标签选择器**给子组件加卡片样式，避免 Vue scoped 样式穿透到子组件根节点
- 卡片间距用父容器 `gap: 16px`（flex/grid）统一控制，不在卡片自身加 `margin-top`
- 卡片内 section 标题用衬线字体，字号 `--slax-fs-h2`，字重 500

---

## 六、Section 标题

```scss
.section-title {
  font-family: var(--slax-font-serif);
  font-size: var(--slax-fs-h2); /* 22px */
  font-weight: 500;
  color: var(--slax-text);
  line-height: 1.4;
  margin-bottom: 20px;
  user-select: none;
}
```

---

## 七、按钮

### 主按钮（Primary）

```scss
background: var(--slax-accent);
color: var(--slax-btn-text);
border: none;
border-radius: var(--slax-radius-sm);
padding: 8px 20px;
font-size: var(--slax-fs-aux); /* 13px */
font-weight: 500;
transition: all var(--slax-dur-normal);

&:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--slax-accent) 20%, transparent);
}
&:disabled {
  opacity: 0.35;
}
```

### 行式导航按钮（NavigateStyleButton）

全宽 cell 布局，左文字右箭头，适用于设置页跳转操作：

```scss
display: flex;
align-items: center;
justify-content: space-between;
width: 100%;
padding: 14px 16px;
background: var(--slax-surface-solid);
border: 1px solid var(--slax-border);
border-radius: var(--slax-radius-sm);

.nav-title {
  font-size: var(--slax-fs-body);
  font-weight: 500;
  color: var(--slax-accent);
}

.nav-arrow {
  color: var(--slax-accent);
  opacity: 0.6;
  transition: transform var(--slax-dur-normal) var(--slax-ease-spring);
}

&:hover {
  background: var(--slax-accent-bg);
  border-color: color-mix(in srgb, var(--slax-accent) 30%, var(--slax-border));
  .nav-arrow {
    transform: translateX(3px);
  }
}
```

### 幽灵按钮（Ghost）

```scss
background: transparent;
border: 1px solid var(--slax-border);
border-radius: var(--slax-radius-sm);
color: var(--slax-text-muted);
padding: 6px 16px;
font-size: var(--slax-fs-aux);
font-weight: 500;
transition: all var(--slax-dur-normal);

&:hover {
  background: var(--slax-surface);
  color: var(--slax-text);
}
```

### 文字按钮（Text）

```scss
background: transparent;
border: none;
color: var(--slax-accent);
font-size: var(--slax-fs-aux);
padding: 0;
cursor: pointer;
transition: opacity var(--slax-dur-normal);

&:hover {
  opacity: 0.75;
}
```

### 危险按钮

```scss
/* 删除/警示操作统一使用 --slax-danger token，自动适配三套主题 */
background: var(--slax-danger);
color: var(--slax-btn-text);
border: none;
border-radius: var(--slax-radius-sm);
padding: 8px 20px;
font-size: var(--slax-fs-aux);
font-weight: 500;
transition: all var(--slax-dur-normal);

&:hover {
  opacity: 0.85;
}
&:disabled {
  opacity: 0.5;
}
```

危险操作的 hover 背景色使用 `var(--slax-danger-bg)`（如列表删除按钮 hover 态）：

```scss
&.danger:hover {
  color: var(--slax-danger);
  background: var(--slax-danger-bg);
}
```

---

## 八、弹窗（Modal）

```scss
/* 遮罩 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 20, 25, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

/* 内容区 */
.modal-content {
  background: var(--slax-surface-solid);
  border: 1px solid var(--slax-border);
  border-radius: var(--slax-radius);
  box-shadow:
    var(--slax-shadow-warm),
    0 20px 60px rgba(0, 0, 0, 0.12);
  max-width: 92vw;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 头部 */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--slax-border);

  .modal-title {
    font-family: var(--slax-font-serif);
    font-size: var(--slax-fs-card);
    font-weight: 500;
    color: var(--slax-text);
  }
}

/* 底部操作区 */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--slax-border);
}
```

**规则**：

- 弹窗必须用 `<Teleport to="body">` 渲染，避免 z-index 层叠问题
- 关闭按钮使用内联 SVG（`×` 路径），不使用图片
- 入场动画：`translateY(-25px) + opacity 0 → 1`，缓动 `var(--slax-ease-spring)`

---

## 九、Popover / 下拉菜单

```scss
.popover {
  background: var(--slax-surface-solid);
  border: 1px solid var(--slax-border);
  border-radius: var(--slax-radius);
  box-shadow:
    var(--slax-shadow-warm),
    0 12px 36px color-mix(in srgb, var(--slax-accent) 12%, transparent);
  z-index: 200;
}

/* 菜单项 */
.popover-item {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  font-size: var(--slax-fs-aux);
  color: var(--slax-text-muted);
  border-radius: var(--slax-radius-sm);
  cursor: pointer;
  transition: all var(--slax-dur-normal);

  &:hover {
    background: var(--slax-accent-bg);
    color: var(--slax-text);
  }
}
```

**互斥规则**：同一页面多个 popover 使用 `useExclusivePopover` composable 管理，保证同时只有一个展开。

---

## 十、标签 / 徽章（Tag / Badge）

```scss
/* 胶囊标签 */
.tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: var(--slax-fs-tag); /* 12px */
  background: var(--slax-accent-bg);
  color: var(--slax-text-muted);
  border: 1px solid var(--slax-border);
}

/* 计数徽章 */
.badge {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 10px;
  font-size: var(--slax-fs-tag);
  font-weight: 500;
  background: var(--slax-accent-bg);
  color: var(--slax-accent);
}
```

---

## 十一、图标

- **全部使用内联 SVG**，不使用图片文件（`.png`）作为图标
- 标准规格：`width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"`
- 小图标（箭头、关闭等）：14×14
- 颜色通过 `color: var(--slax-*)` + `stroke="currentColor"` 继承，不硬编码

---

## 十二、骨架屏（Skeleton）

```scss
.skeleton {
  background: var(--slax-border); /* 自动适配 dark 主题 */
  border-radius: 8px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
```

---

## 十三、Toast 通知

```scss
.toast {
  background: var(--slax-surface-solid);
  border: 1px solid var(--slax-border);
  border-radius: var(--slax-radius-sm);
  backdrop-filter: var(--slax-blur);
  box-shadow: var(--slax-shadow-warm);
  padding: 10px 16px;
  font-size: var(--slax-fs-aux);
  color: var(--slax-text);
}

/* 成功态：左侧 accent 竖线 */
.toast-success {
  border-left: 3px solid var(--slax-accent);
}

/* 错误态：左侧 danger 竖线 */
.toast-error {
  border-left: 3px solid var(--slax-danger);
}
```

---

## 十四、响应式断点

| 断点   | 值       | 行为                                                       |
| ------ | -------- | ---------------------------------------------------------- |
| 移动端 | `≤768px` | 顶栏高度切 48px，侧边栏隐藏，内容全宽，padding 收紧至 16px |
| 窄屏   | `≤600px` | 底部工具栏仅图标，隐藏文字                                 |
| 小屏   | `≤920px` | 列表页侧边栏隐藏                                           |

---

## 十五、动效规范

| 场景                | 参数                                 |
| ------------------- | ------------------------------------ |
| 标准 transition     | `all var(--slax-dur-normal)`         |
| 快速 transition     | `all var(--slax-dur-fast)`           |
| 浮层滑入 / 面板出现 | `var(--slax-ease-spring)` 弹性曲线   |
| 毛玻璃              | `backdrop-filter: var(--slax-blur)`  |
| E-ink 主题          | 所有 transition / animation 强制禁用 |

---

## 十六、禁止事项

| 禁止                                                     | 原因                                      |
| -------------------------------------------------------- | ----------------------------------------- |
| 硬编码颜色（`#5490c2`、`#0f1419`、`#ecf0f5` 等）         | 无法跟随主题切换                          |
| 使用图片文件作为图标                                     | 无法跟随主题变色，增加资源依赖            |
| 修改 `theme.tokens.css` 中的共享 token 来满足单页需求    | 会影响所有页面                            |
| 使用通用标签选择器（如 `section { ... }`）给子组件加样式 | Vue scoped 样式会穿透到子组件根节点       |
| 弹窗不使用 `<Teleport to="body">`                        | 导致 z-index 层叠问题                     |
| 新增 `--slax-*` token 未在三套主题中同步声明             | E-ink / Dark 主题下 token 回退到 light 值 |

---

## 十七、代码风格

### UnoCSS `--style` 简写

项目使用 UnoCSS，支持 `--style` 属性简写：

```html
<!-- 等价于 class="flex items-center gap-8px" -->
<div --style="flex items-center gap-8px"></div>
```

复杂样式（含 CSS 变量、伪类、媒体查询）直接写在 `<style lang="scss" scoped>` 中。

### 样式优先级

1. `theme.tokens.css` — 全局 token，只读
2. `global.scss` — 全局基础样式（body、button reset 等）
3. 页面级 global `<style>` — 页面背景 override（非 scoped）
4. 组件 `<style scoped>` — 组件私有样式

### 文件命名

- 组件：`PascalCase.vue`
- 样式类名：`kebab-case`
- CSS 变量：`--slax-*`（私有前缀，避免与第三方冲突）
