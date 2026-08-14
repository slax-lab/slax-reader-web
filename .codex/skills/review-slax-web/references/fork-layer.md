# Fork / Upstream 层解析规则 + 覆盖契约

读这份的时机：阶段 1 判定文件归属时；阶段 6（diff 涉及组件/页面覆盖 / upstream layer 时）。

**这是本项目第一坑**：改错 copy 会让修复"看起来不生效"，反复排查浪费多轮。审查任何文件前先判定归属。

---

## 1. 三份 checkout，认准 dev server 服务的那份

- **dev server 服务的**：`apps/slax-reader-dweb`（fork app）
- 它 `extends` 的 base 层：`upstream/apps/slax-reader-dweb/layers/core`（git submodule）
- 无关 checkout：`../slax-reader-web`（同分支但不在继承链上，改它不生效）

**review 时**：diff 落在 `../slax-reader-web` → `[Critical]` 改错仓库（除非作者明确说这是另一条线）。

---

## 2. Nuxt Layer 覆盖解析（web app）

- `nuxt.config.ts`: `extends: ['../../upstream/apps/slax-reader-dweb/layers/core']`
- fork 用扁平 `app/`（pages/components/composables/...）；upstream 用 `layers/core/app/...`
- fork `app/X` **覆盖** layer `app/X`（同相对路径即覆盖）
- alias：
  - `#layers/core/...` → upstream 基线
  - `~/...` / `@/...` → fork 自己的 `app/`
  - `nuxt.config.ts` 里有少量**显式覆盖 alias**（把某个 `#layers/core/.../X.vue` 强制指向 fork 的 `app/.../X.vue`，如 `BookmarkList/BookmarksTopBar.vue`、`Notification/NotificationCell.vue`）

**判定流程**（对每个改动的 dweb 组件/页面）：

1. 文件在 `apps/slax-reader-dweb/app/**`？→ fork override 或 fork-only
2. 文件在 `upstream/.../layers/core/app/**`？→ 继承基线（改它影响所有未覆盖处）
3. 不确定某组件归属 → Grep fork `app/` 有没有同相对路径文件 + 查 `nuxt.config.ts` alias 表

**review 时要查的**：

- 本该改 upstream layer 的组件（未被 fork 覆盖）却改到了 fork `app/`（或反之）→ `[Should-Fix]`/`[Critical]`，可能只有一半生效
- 新增 fork override 但没在 diff 里看到对 upstream 基线的对照 → `[Question]`：是有意 fork 分叉还是应该改上游？

---

## 3. 覆盖漂移（override drift）

fork override 文件是 upstream 某文件的分叉副本。upstream 基线更新后，override 不会自动跟上。

**review 时要查的**：

- diff 改了某个 fork override，同名 upstream 基线最近是否也在动？两边逻辑是否已漂移？
- 新增 override 时：是否只为了少量 Pro 差异而整份 copy 了 upstream？→ 能否改用 slot / props / 组合而非整份覆盖，减少未来漂移面

---

## 4. Extension 的 alias 复用

- `wxt.config.ts`: `@public/*` → `upstream/apps/slax-reader-extensions/src`；`@/*` → fork `src/`
- fork 不 copy upstream，只 import `@public` 的服务 + 加 Pro/diff 代码
- build outDir 是 `build/`（load `build/chrome-mv3`，不是 `dist`）

**review 时要查的**：extension diff 里把 upstream 逻辑 copy 进 fork `src/` 而非从 `@public` import → `[Should-Fix]` 重复代码。

---

## 5. commons 包联动

- `@commons/types` / `@commons/utils` / `@slax-reader/selection` → `upstream/commons/*`
- `@commons/types-pro` → fork-only `commons/types-pro`
- 改 `upstream/commons/*` 会**双端**影响（web + extension）

**review 时要查的**：diff 改了 `upstream/commons/*` → 提醒作者双端回归；改了 `@slax-reader/selection` 源码 → 必须 `tsup` rebuild `dist`（见 project-gotchas §selection）。

---

## 6. 样式 token 层

- fork 有 `app/assets/styles/fork.tokens.css`（`css:` 加载），只放 `--slax-*` 语义 token，**DERIVED** 自 upstream `theme.tokens.css`
- 规则：fork 里**永不重复声明** upstream 变量（否则 light/dark/eink 漂移）；一律 `--slax-` 前缀

**review 时要查的**：fork 里出现 `--color-xxx: ...`（upstream 命名）重声明 → `[Should-Fix]` 漂移风险。

---

## 7. 静态资源

字体/图片等静态资源放 upstream 层 `layers/core/public/`（`/fonts/` 即映射于此）。fork 新增静态资源要确认放对层。
