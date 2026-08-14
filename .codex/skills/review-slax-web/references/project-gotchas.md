# Slax Reader (web) 项目专属踩坑

读这份的时机：diff 涉及 fork 覆盖 / selection / i18n / tokens / 自定义指令 / 构建 时。

---

## 1. 改错 copy（第一坑）

见 `fork-layer.md`。dev server 服务 `apps/slax-reader-dweb`，extends `upstream/.../layers/core`。改 `../slax-reader-web` 不生效。未被 fork 覆盖的组件应改 upstream layer。

**review 时**：任何 dweb 组件改动，先判定归属；落在错 checkout / 错层 → `[Critical]`/`[Should-Fix]`。

## 2. `@slax-reader/selection` 改源码必须 rebuild dist

改 `upstream/commons/selection/src` 后，运行时用的是 `dist`，源码改动不 rebuild 不生效。

**review 时**：diff 改了 selection `src` 但没有对应 `dist` 变化 / 没提 rebuild → `[Should-Fix]`，提醒作者跑 `tsup` build。

## 3. layer / 配置改动要重启 dev server

改 `nuxt.config.ts`、层继承、alias、`css:`、`fork.tokens.css` 加载 → 必须重启 dev server 才生效。HMR 不覆盖这些。

**review 时**：涉及上述配置的改动，报告里提醒"需重启 dev server 验证"。

## 4. UnoCSS 裸 JS token → build 崩

UnoCSS 会把源码里像 class 的裸字符串（如 `!!container`、某些 JS 表达式片段）当 class 提取，生成非法 CSS，`build` 时 lightningcss 报 `Unexpected token '!'`。**dev 正常，build 才炸**。

**review 时**：diff 引入了可能被 UnoCSS 误提取的裸 token → `[Should-Fix]`，建议作者跑真实 `pnpm build:dweb` 验证（不要只信 dev）。

## 5. Dashboard 内部页面免 i18n

Dashboard 组件不面向普通用户，硬编码文案不需要国际化。

**review 时**：不要把 Dashboard 里的硬编码中文/英文文案报成 i18n 缺失。但**非 Dashboard** 的用户可见文案硬编码 → `[Should-Fix]`，应走 `layers/core/i18n/locales`。

## 6. i18n locale 三份对齐

改 locale key 要各语言文件同步补（zh / en / ...，在 `layers/core/i18n/locales`）。漏补会 runtime 显示 key 或回退。

**review 时**：diff 只改了 zh.json 没改 en.json（或反之）→ `[Should-Fix]`。

## 7. `--slax-*` 主题 token，别硬编码颜色

用 `--slax-*` 语义 token（fork）/ upstream `theme.tokens.css` 变量，不要硬编码颜色，否则 light/dark/eink 三主题漂移。fork `fork.tokens.css` 里永不重复声明 upstream 变量。

**review 时**：新增硬编码 hex/rgb 颜色 → `[Should-Fix]`；fork 里重声明 upstream 变量 → `[Should-Fix]`。

## 8. `v-autofocus` 指令约定

dweb 全局有输入框自动聚焦指令 `v-autofocus`。用在 v-show 弹层里时，须绑 `enabled=打开态`，否则聚焦时机错。

**review 时**：v-show 弹层里的输入框用了 `v-autofocus` 但没绑打开态 → `[Should-Fix]`。

## 9. keyed fragment 空↔非空崩溃

Vue3.5 异步 patch 下，keyed `v-for` fragment 从空变非空（或反之）可能崩（/b/[id] 标签栏历史 bug）。

**review 时**：新增/修改 keyed `v-for`，其数据源可能异步地从空变非空 → `[Should-Fix]`，建议恒定挂载 / 占位 / 避免异步 patch 期间结构骤变。

## 10. base 分支是 `develop`

PR / diff 对比基线用 `develop`，不是 `main`。子模块 `upstream` 有独立分支。

**review 时**：`git diff` / `codex review --base` 都用 `develop`。

## 11. 提交约定

不要主动 `git commit`（除非用户明确要求）。commit message 末尾按仓库约定署名。只 review，需要的动作写进报告。
