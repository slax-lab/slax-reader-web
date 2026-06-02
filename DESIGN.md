# Slax Reader Design System

> 本文档描述 Slax Reader Web 应用（`slax-reader-dweb`）的视觉设计规范。所有新页面和组件的样式开发均应遵循此文档，以保持整体风格一致。
>
> 设计基调：**暖色纸质感 · 衬线排版 · 毛玻璃浮层 · 三主题适配**

---

## 〇、设计哲学

整套视觉语言围绕「让长文阅读舒适、克制、有温度」展开，落到组件上有四条贯穿始终的原则。新组件设计前请先对照这四条，确认风格方向，再查阅后续的 token 与组件规范。

### 1. 暖色纸质感（Warm Paper）

底色不是纯白而是暖奶油色（`--slax-bg: #faf8f2`），页面叠加三处径向渐变光斑模拟自然光。卡片、浮层都带极淡的暖色调，阴影也是暖色（`rgba(180, 88, 55, …)`）而非中性灰。**任何新表面都应贴合这层暖底，避免突兀的冷白或纯灰。**

### 2. 衬线排版（Serif Display）

标题、Logo、卡片标题、弹窗标题统一用衬线字体（`--slax-font-serif`：Playfair Display + Noto Serif SC），正文与 UI 用 Inter 无衬线。**衬线是品牌识别的核心**——凡是「标题性质」的文字都走衬线，配合负字距（`letter-spacing: -0.01em ~ -0.02em`）收紧观感。

### 3. 毛玻璃浮层（Frosted Glass）

顶栏、侧边面板、工具栏等「漂浮在内容之上」的半透明表面统一用 `--slax-surface` + `backdrop-filter: var(--slax-blur)`，让背后的暖色内容透出形成层次。需要完全遮挡的浮层（弹窗、popover、下拉）用不透明的 `--slax-surface-solid`。

### 4. 手绘内联图标（Hand-drawn Inline SVG）

**全站禁用图片 / 图标字体作为图标，一律手写内联 SVG。** 线性图标统一 `viewBox="0 0 24 24"`、`stroke="currentColor"`、`stroke-width: 1.5`（详见 §十一）。这样图标能随 `color` 跟随三主题变色、随字号缩放，且零资源依赖。这是与「纸质感 + 衬线」呼应的克制、轻盈的视觉手法。

> **克制原则**：靠对比而非粗重来划分区域——边框统一极淡（`--slax-border` 透明度仅 0.08），分隔靠留白和微妙色差完成；强调色 `--slax-accent` 只用在真正可点击 / 已激活的关键元素上，不滥用。

---

## 一、主题系统

应用支持三套主题，通过 `<html>` 上的 `data-slax-theme` 属性切换：

| 主题              | 属性值                   | 视觉特征                                                   |
| ----------------- | ------------------------ | ---------------------------------------------------------- |
| **Light**（默认） | 无属性                   | 暖奶油底色、橙红 accent、毛玻璃浮层、暖色阴影              |
| **Dark**          | `data-slax-theme="dark"` | 深棕暖色底、偏橙 accent、更深阴影                          |
| **E-ink**         | `data-slax-theme="eink"` | 纯黑白灰、无毛玻璃、无阴影、圆角收紧至 4/2px、禁用所有动效 |

**切换方式**：通过 `@nuxtjs/color-mode` 管理（配置 `dataValue: 'slax-theme'`、`storageKey: 'slax-color-mode'`）。`ThemeSwitcher` 组件调用 `useColorMode().preference = 'light' | 'dark' | 'eink'`，由 color-mode 模块负责把 `data-slax-theme` 写到 `<html>` 并持久化到 localStorage。iframe 文章预览通过 `useIframeTheme` 监听 `colorMode.value` 同步主题。**新增主题切换入口一律走 `useColorMode().preference`，不要直接写 `document.documentElement.dataset.slaxTheme`**——绕过 colorMode 会导致按钮 active 态、iframe 同步与持久化状态不一致。

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
--slax-shadow-modal    /* 弹窗阴影：warm + 0 20px 60px rgba(0,0,0,0.12) 大范围投影 */
```

E-ink 主题下三者均为 `none`。

### 2.3 圆角

```css
--slax-radius          /* 大圆角：14px（卡片、弹窗、面板） */
--slax-radius-sm       /* 小圆角：10px（按钮、输入框、标签） */
```

E-ink 主题下分别收紧为 4px / 2px。

### 2.4 字体

```css
--slax-font-sans       /* 无衬线：Inter + 系统字体（正文、UI） */
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

**各档完整排版参数**（字号之外，字重 / 行高 / 字距同样是风格的一部分，标题档务必带负字距）：

| 语义档              | 字号 | 字体  | 字重 | 行高 | 字距    | 典型用途                           |
| ------------------- | ---- | ----- | ---- | ---- | ------- | ---------------------------------- |
| `--slax-fs-display` | 32px | serif | 500  | 1.4  | -0.02em | 快照页文章大标题（H5 收至 26px）   |
| `--slax-fs-h2`      | 22px | serif | 500  | 1.4  | -0.01em | 文章内 h2、侧边面板标题            |
| `--slax-fs-brand`   | 20px | serif | 500  | —    | -0.02em | 顶栏 Logo                          |
| `--slax-fs-card`    | 17px | serif | 500  | 1.45 | -0.01em | 列表卡片标题、**弹窗标题**         |
| `--slax-fs-body`    | 16px | sans  | 400  | 1.85 | —       | 快照页正文（长文行高放宽至 1.85）  |
| `--slax-fs-meta`    | 14px | sans  | 400  | 1.6  | —       | 侧栏导航、作者名、tag、二级按钮    |
| `--slax-fs-aux`     | 13px | sans  | 300  | 1.5  | —       | 日期、来源、副标题（字重偏细 300） |
| `--slax-fs-tag`     | 12px | sans  | 400  | 1.5  | —       | 来源标签、计数徽章、小字提示       |

> 衬线档（display / h2 / brand / card）一律 `font-family: var(--slax-font-serif)` + 负字距；其余继承 `body` 的无衬线。`--slax-fs-aux` 的 `font-weight: 300` 是刻意的——日期来源这类元信息要「轻到几乎不被注意」。

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
--slax-content-min-w      /* 640px — 快照页正文最小宽（push 布局收缩下限） */

/* 快照页侧边面板（SidePanel 拖拽 + push 布局，详见 useSnapshotLayout） */
--slax-side-panel-w       /* 440px — 侧边面板默认宽 */
--slax-side-panel-min-w   /* 380px — 拖拽收窄下限 */
--slax-side-panel-max-w   /* 680px — 拖拽展宽上限 */
--slax-push-amount        /* 由 JS 动态写入的“完整有效推距”（默认 0px）；
                             CSS 消费方按需 * -0.5 做内容居中修正，不要再预先折半 */
```

---

## 三、页面背景

页面背景由**全局样式统一驱动，单个页面无需也不应再 override**：

- 底色：`theme.css` 中 `body { background: var(--slax-bg) }` 兜底，随主题切换。
- 氛围渐变：`global.scss` 中的 `body::before` 用三处径向渐变叠加，颜色全部走 token，E-ink 下 token 为 `transparent` 自动隐藏。

```scss
/* global.scss —— 全站唯一的氛围渐变层，已 token 化，勿在页面内复制 */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 0; /* 配合 #__nuxt { z-index: 1 } 压在内容之下 */
  pointer-events: none;
  background:
    radial-gradient(at 30% 0%, var(--slax-grad-a) 0%, transparent 50%), radial-gradient(at 80% 20%, var(--slax-grad-b) 0%, transparent 60%),
    radial-gradient(at 50% 80%, var(--slax-grad-c) 0%, transparent 40%);
}
```

对应 token（`--slax-bg` / `--slax-grad-a/b/c`）在三套主题中均已声明，E-ink 的 `--slax-grad-*` 为 `transparent`。

> **禁止**在页面 `<style>` 里重新定义 `body` / `body::before` 背景——既会与全局渐变层重复，又容易硬编码出与 token 不一致的色值（历史遗留的页面级 override 已统一移除）。需要特殊背景时，新增带主题适配的 `--slax-*` token，再在全局或组件内消费。

### 按页微调渐变（受控例外）

如果某类页面需要与全站不同的氛围渐变，**不要复制 `body::before` 规则，而是 override 渐变 token**，让全局那一份渲染逻辑读到不同的值。当前唯一例外是阅读详情页（`pages/bookmarks/[id]`、`pages/s/[id]`）：它们用更暖的 `#fff4e0` 系渐变，其余页面用 `:root` 的 `#faf5eb` 系。

```scss
/* 详情页 <style lang="scss">（非 scoped） */
html {
  --style: bg-surface-solid; /* 阅读界面不透明底色，盖住其它装饰但保留 body::before 透出 */
}

/* 只正向命中 light（含 color-mode 注入前的无属性首屏态），其余主题各自沿用 :root token */
:root[data-slax-theme='light'],
:root:not([data-slax-theme]) {
  --slax-grad-a: #fff4e0;
  --slax-grad-b: #faecdc;
}
```

> **为什么用白名单而非 `:not` 黑名单**：选择器要正向枚举「哪些主题适用此覆盖」，而不是排除「哪些不适用」。若写成 `:root:not([dark]):not([eink])`，将来新增任何主题（如 sepia）都会被误命中，得回到每个详情页补 `:not([sepia])`，漏一个就是 bug；正向写法下，新主题既不等于 `light` 也不是「无属性」，自动落回它在 `theme.tokens.css` 的 `:root` 值，**详情页零改动**——新增主题的维护点收敛回 token 文件一处。
>
> **特异性**：两条选择器均为 `(0,2,0)`（`:root` 0,1,0 + 属性/`:not` 内属性 0,1,0），高于全局 light 的 `:root`（0,1,0），覆盖不依赖源码顺序。`@nuxtjs/color-mode` 对所有主题（含 light）都会写 `<html data-slax-theme="...">`，第二条 `:not([data-slax-theme])` 仅兜注入前的极早期态。**这是 token override，不是复制背景规则**——与上面的「禁止」并不冲突。

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

适用于次要操作、返回、取消等非强制性操作（如 404 页返回首页、弹窗取消按钮）：

```scss
background: transparent;
border: 1px solid var(--slax-border);
border-radius: var(--slax-radius-sm);
color: var(--slax-text-muted);
padding: 8px 20px;
font-size: var(--slax-fs-body);
font-weight: 500;
cursor: pointer;
transition: all var(--slax-dur-normal);

&:hover {
  background: var(--slax-surface);
  color: var(--slax-text);
  border-color: color-mix(in srgb, var(--slax-text-light) 40%, var(--slax-border));
  transform: translateY(-1px);
  box-shadow: var(--slax-shadow-sm);
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
  box-shadow: var(--slax-shadow-modal);
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

图标是「手绘内联 SVG」原则（§〇.4）的落地，是整套风格的关键一环。

### 规格

- **全部使用内联 SVG**，绝不使用图片文件（`.png`）或图标字体作为图标
- 标准规格：`viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"`
- 尺寸：常规 16–20px，小图标（关闭、箭头、对勾等）14px；尺寸用 `width`/`height` 属性或外层 `--style: w-16px h-16px`
- 线性图标统一 `stroke-linecap="round" stroke-linejoin="round"`，转角更柔和、贴合纸质感
- **极小的「对勾 / 加号」等需要在 9–12px 内清晰可辨的图标**，stroke-width 提到 `2.5`（线条太细会糊）
- 实心图标（如 Twitter / X logo）用 `fill="currentColor"`，不描边
- 颜色一律 `stroke="currentColor"`（或 `fill="currentColor"`）+ 外层 `color: var(--slax-*)` 继承，禁止在 SVG 内写死色值

### 常用图标 path 速查

直接复制以下 path，套上标准规格的 `<svg>` 外壳即可。统一从 24×24 viewBox 出发：

```html
<!-- 关闭 × -->
<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />

<!-- 对勾 ✓（stroke-width 2.5）-->
<polyline points="20 6 9 17 4 12" />

<!-- 复制 -->
<rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" />

<!-- 分享（三圆点连线）-->
<circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
<path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />

<!-- 链接 -->
<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
<path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />

<!-- 提示 / 信息圆 -->
<circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" />

<!-- 更多（竖向三点）-->
<circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />

<!-- 编辑 -->
<path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />

<!-- 星标（fill 切换选中态）-->
<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
```

### 加载态例外

加载指示器（`i-svg-spinners:*`）属于 Iconify 动态 spinner，是功能性动画而非装饰图标，可继续沿用；颜色用 `text-accent` 跟随主题。

---

## 十一-A、复选框 & 开关（Checkbox & Toggle）

二者都用纯 SVG / CSS 绘制，**不使用图片对勾**。

### 复选框（Checkbox）

方形小框 + 内联对勾，选中态用 accent 浅底而非实底，保持克制：

```scss
.checkbox {
  width: 14px;
  height: 14px;
  border: 1px solid var(--slax-border);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  transition: all var(--slax-dur-fast);

  .tick {
    /* 内联 SVG <polyline points="20 6 9 17 4 12"> stroke-width=2.5 */
    width: 9px;
    height: 9px;
    color: var(--slax-accent);
    opacity: 0;
    transition: opacity var(--slax-dur-fast);
  }

  &.selected {
    background: var(--slax-accent-bg);
    border-color: var(--slax-accent-soft);
    .tick {
      opacity: 0.7;
    }
  }
}

/* hover 仅提示未选中项 */
.option:hover .checkbox:not(.selected) {
  border-color: var(--slax-accent-soft);
}
```

> 对勾用 `opacity` 渐显而非 `display` 切换，过渡更顺；选中底 `accent-bg` + 边框 `accent-soft` 的组合是「标记相关但不抢眼」的标准搭配。

### 开关（Toggle）

胶囊轨道 + 圆形滑块，开态填 `--slax-accent`，滑块带 `--slax-shadow-sm`：

```scss
.toggle {
  position: relative;
  width: 36px;
  height: 20px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--slax-text-light) 40%, transparent);
  transition: background var(--slax-dur-normal);

  .knob {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--slax-surface-solid);
    box-shadow: var(--slax-shadow-sm);
    transition: transform var(--slax-dur-normal);
  }

  &.on {
    background: var(--slax-accent);
    .knob {
      transform: translateX(16px);
    }
  }
}
```

> 关态轨道用 `--slax-text-light` 淡化色而非硬编码灰，三套主题下都能正确回退。

---

## 十一-B、表单（Input / Textarea）

输入类控件统一：`--slax-surface-solid` 底 + `--slax-border` 边框 + 圆角 `--slax-radius-sm`，聚焦态用 accent 描边 + 柔光环，placeholder 用 `--slax-text-light`：

```scss
textarea,
input[type='text'] {
  width: 100%;
  padding: 12px 16px;
  background: var(--slax-surface-solid);
  border: 1px solid var(--slax-border);
  border-radius: var(--slax-radius-sm);
  color: var(--slax-text);
  font-size: var(--slax-fs-meta);
  line-height: 1.6;
  outline: none;
  transition: all var(--slax-dur-normal);

  &::placeholder {
    color: var(--slax-text-light);
  }

  &:focus {
    border-color: color-mix(in srgb, var(--slax-accent) 40%, var(--slax-border));
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--slax-accent) 12%, transparent);
  }
}

textarea {
  resize: none;
}
```

> 聚焦光晕 `0 0 0 3px accent@12%` 是全站统一的「激活」反馈，比纯变色边框更明确，又不喧宾夺主。

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

### UnoCSS `--style` 指令

项目通过 UnoCSS `transformerDirectives` 注册了 `--style`（配置 `applyVariable: ['--at-apply', '--style']`），它是写在 `<style>` 块里的 **CSS 声明**（类似 `@apply`），把空格分隔的 utilities 就地展开到选择器上——**不是** Vue / HTML 模板属性。在模板里写 `<div --style="...">` 不会生效。

```scss
/* 在 <style lang="scss" scoped> 中，对选择器声明 --style */
.dots-menu {
  --style: relative flex;
}
.menu-item {
  --style: px-20px py-10px flex items-center rounded-8px cursor-pointer;
}
```

需要 utilities 无法表达的样式（含 CSS 变量、伪类、媒体查询、嵌套）时，与 `--style` 写在同一选择器内，直接用常规 SCSS 即可。

### 样式优先级

1. `theme.tokens.css` — 全局 token，只读
2. `global.scss` — 全局基础样式（body、button reset 等）
3. 页面级 global `<style>` — 页面背景 override（非 scoped）
4. 组件 `<style scoped>` — 组件私有样式

### 文件命名

- 组件：`PascalCase.vue`
- 样式类名：`kebab-case`
- CSS 变量：`--slax-*`（私有前缀，避免与第三方冲突）
