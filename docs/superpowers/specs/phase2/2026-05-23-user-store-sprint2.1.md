# 第二期 Sprint 2.1：stores/user.ts 纯逻辑部分覆盖

> Sprint 2 拆分第一段。覆盖 user store 8 个 getter + 10 个纯本地 state action（不调 request、不依赖 nuxt auto-import 的可隔离 action），共 36 用例（getter 18 + 纯本地 action 6 + subscribe action 12）。Sprint 2.2 再补 request 调用类 + 复合 action。

**Goal**：让 `stores/user.ts` 的纯逻辑分支获得完整覆盖，验证 Pinia store + setActivePinia 范式可用；本 sprint **暂不**为 user.ts 启用 vitest.config 单文件阈值（要等 sprint 2.2 完成 request 类 action 后整体启用）。

**前置文档**：`.claude/test-framework/PLAN.md` §6.2、§7、§8 P1 第 4 项 stores/user

**强制纪律**（继承 sprint 1）：

1. 写 spec 前必须 Read 被测源码 + commons/types/src/interface.ts 看 UserInfo + checkUserSubscribedIsExpired 实现
2. 不用 `as any` / `@ts-ignore` / 过松断言绕过失败用例
3. commit message 英文

---

## 1. 被测面分析

`apps/slax-reader-dweb/layers/core/app/stores/user.ts`（238 行），Sprint 2.1 覆盖范围：

### 1.1 Getters（8 个全部覆盖）

| Getter                    | 行号  | 行为                                                                               |
| ------------------------- | ----- | ---------------------------------------------------------------------------------- |
| `userInfo`                | 64    | 直接返回 state.user                                                                |
| `currentLocale`           | 65    | state.locale 或 fallback `'en'`                                                    |
| `isJustPaid`              | 66-70 | payTimeRecord 不存在 → false；存在且 < 10 分钟 → true；> 10 分钟 → false           |
| `isSubscriptionExpired`   | 71-75 | user 不存在 → true；调 `checkUserSubscribedIsExpired(user)`（外部纯函数）          |
| `isLogin`                 | 76    | 直接调 `haveRequestToken()`（auto-import）                                         |
| `showCloseInstallExtTips` | 77-82 | 返回 `{ canShow, showedAlready }`，基于 `lastCloseInstallExtTipsDates.length` 判断 |
| `showShareTips`           | 83-85 | `!state.shareTipsClicked`                                                          |
| `canRequetPushPermission` | 86-88 | lastRequestPushPermissionDate === 0 或 距 now 大于 1 小时                          |

### 1.2 Actions 纯本地 state（10 个本 sprint 覆盖）

| Action                                | 行号    | 行为                                              |
| ------------------------------------- | ------- | ------------------------------------------------- |
| `clearUserInfo`                       | 117-119 | `this.user = null`                                |
| `updatePayTimeRecord`                 | 158-160 | `this.payTimeRecord = Date.now()`                 |
| `clearPayTimeRecord`                  | 161-163 | `this.payTimeRecord = null`                       |
| `updateCloseInstallExtTipsDate`       | 164-166 | append Date.now() 到 lastCloseInstallExtTipsDates |
| `updateShareTipsClicked`              | 167-169 | `this.shareTipsClicked = true`                    |
| `updateLastRequestPushPermissionDate` | 185-187 | `this.lastRequestPushPermissionDate = Date.now()` |
| `getSubscribeCollectionTimeRecord`    | 188-196 | 返回订阅状态 / null                               |
| `isJustSubscribeCollection`           | 197-209 | 复杂逻辑：状态一致 + 10 分钟内 → true             |
| `updateSubscribeCollectionTimeRecord` | 210-219 | 写入 record（含初始化 null → {} 分支）            |
| `clearSubscribeCollectionTimeRecord`  | 220-231 | 删 record（含全空时置回 null 分支）               |

### 1.3 不在本 sprint 范围（推迟到 Sprint 2.2）

- `refreshUserInfo`（91-105）：调 `request().get`
- `getUserInfo`（106-116）：复合（refresh 分支调 refreshUserInfo）
- `refreshUserToken`（145-157）：调 `request().post` + useCookies + useRuntimeConfig
- `changeUserSetting`（136-144）：调 `request().post`
- `changeLocale`（129-135）：复合，调 changeUserSetting + refreshUserToken + changeLocalLocale
- `changeLocalLocale`（120-128）：调 useNuxtApp().$i18n
- `checkAndRefreshUserToken`（170-184）：调 useCookies + 复合 refreshUserToken

---

## 2. 测试切分

写到 `apps/slax-reader-dweb/tests/unit/stores/user.spec.ts`（**注意路径前缀**：dweb 的 vitest.config.ts 里 `test.dir` 是相对子包的 `./tests`，spec 必须放 `apps/slax-reader-dweb/tests/...` 下才会被 `pnpm --F @apps/slax-reader-dweb test` 收集，**不能**放仓库根 `tests/...`）。该 spec 需要新建 `apps/slax-reader-dweb/tests/unit/stores/` 目录（PHASE1.md §3 已规划但第一期未启用）。

分 3 段 describe：

### 2.1 `describe('getters')`（18 用例）

- `userInfo` 返回 state.user（2：null / 已设置）
- `currentLocale` fallback `'en'`（1：locale 为空字符串 / undefined）+ 已设置时返回原值（1）= 2 用例
- `isJustPaid`（3：payTimeRecord null / 距 now <10 分钟 / >10 分钟）
- `isSubscriptionExpired`（2：user=null → true；user!=null → 调 checkUserSubscribedIsExpired 返回 false。**审计修订**：补 user 非空分支）
- `isLogin`（2：haveRequestToken→true / →false）
- `showCloseInstallExtTips`（3：长度 0 / 长度 1 边界 / 长度 2。**审计修订**：补长度 1 边界）
- `showShareTips`（1：state.shareTipsClicked 取反）
- `canRequetPushPermission`（**审计修订**：3 个分支必测——date=0 短路 true / date≠0 距 now ≤ 1h false / date≠0 距 now > 1h true）

合计：2 + 2 + 3 + 2 + 2 + 3 + 1 + 3 = **18 用例**（先前数学算错，纠正到 18）。

### 2.2 `describe('纯本地 state actions')`（6 用例）

- `clearUserInfo` → user 置 null
- `updatePayTimeRecord` → 锁时间断言 payTimeRecord = mocked Date.now()
- `clearPayTimeRecord` → payTimeRecord = null
- `updateCloseInstallExtTipsDate` → append（验证 array 长度 +1 + 末尾值 = mocked Date.now()）
- `updateShareTipsClicked` → shareTipsClicked = true
- `updateLastRequestPushPermissionDate` → 锁时间断言

### 2.3 `describe('subscribe 相关 actions')`（12 用例 —— 审计修订）

- `getSubscribeCollectionTimeRecord` 整个 record 为 null → 返回 null
- `getSubscribeCollectionTimeRecord` collectionCode 不存在 → 返回 null（**审计修订**：补 collectionCode 缺失分支）
- `getSubscribeCollectionTimeRecord` 存在 → 返回 { subscribed/cancelled/deleted } 结构
- `isJustSubscribeCollection` record 为 null → false（**审计修订**：补整个 record 为 null 分支）
- `isJustSubscribeCollection` collectionCode 不存在 → false（**审计修订**：补 code 缺失分支）
- `isJustSubscribeCollection` 状态一致 + 距 now < 10 分钟 → true
- `isJustSubscribeCollection` 状态不一致 → false
- `isJustSubscribeCollection` 状态一致 + 距 now > 10 分钟 → false（**审计修订**：补"同状态超 10 分钟"分支）
- `updateSubscribeCollectionTimeRecord` 初次 record 为 null 时初始化（null → {}）+ 写入 / 后续覆盖（合并 1 用例两阶段）
- `clearSubscribeCollectionTimeRecord` record 为 null 时早退（**审计修订**：补 `if (!this.subscribeCollectionTimeRecord) return` 早退分支 —— 调用不报错、record 仍为 null）
- `clearSubscribeCollectionTimeRecord` 删唯一 key → record 整个置回 null
- `clearSubscribeCollectionTimeRecord` 删一个 key 后还有其它 key → record 保留剩余（**审计修订**：补 else 分支）

合计：3（getSubscribeCollectionTimeRecord） + 5（isJustSubscribeCollection）+ 1（update）+ 3（clear）= **12 用例**。

> §2.3 实际拆细 12 用例。先前 5/8/11 用例都漏分支，逐轮纠正到 12。

合计 sprint 2.1：18 + 6 + 12 = **36 用例**（比初版 21 多 15 个，主要来自 getter 分支补全 + subscribe action 边界补全）。

---

## 3. mock 链路

### 3.1 Pinia setup

```ts
import { setActivePinia, createPinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

let pinia: ReturnType<typeof createPinia>
beforeEach(() => {
  pinia = createPinia()
  setActivePinia(pinia)
})
```

### 3.2 nuxt auto-import

```ts
// haveRequestToken（isLogin getter）
const { haveRequestTokenMock } = vi.hoisted(() => ({
  haveRequestTokenMock: vi.fn(() => false)
}))
mockNuxtImport('haveRequestToken', () => haveRequestTokenMock)

// useI18n —— **关键**：useUserStore() 初始化时 state.locale 取值自 useI18n()?.locale?.value
// （stores/user.ts:54），不 mock 会让首次实例化报 "useI18n must be called from inside a setup function"。
// 用 ?. 操作符让 store 在 mock 不存在时也能继续，但本 sprint 显式 mock 让 currentLocale fallback 分支
// 可以通过手动覆盖 store.locale 来精确测，避免依赖 useI18n 的运行时返回值。
const { useI18nMock } = vi.hoisted(() => ({
  useI18nMock: vi.fn(() => ({ locale: { value: 'en' } }))
}))
mockNuxtImport('useI18n', () => useI18nMock)
```

> 注：currentLocale fallback 分支测试时（`state.locale === '' || undefined`），不要靠重新 mock useI18n 返回不同值——直接 `store.locale = ''` 手动写入更可控。

### 3.3 vi.useFakeTimers（用于 Date.now 相关 action / getter）

```ts
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-05-23T10:00:00Z'))
})
afterEach(() => {
  vi.useRealTimers()
})
```

> 注：仅在需要锁时间的 describe 块用，避免影响其它 describe 的时间相关行为。

### 3.4 piniaPluginPersistedstate

`stores/user.ts:236` 配了 `persist: [...]`。测试时用 `createPinia()` 不会启用 persist 插件（除非显式 `pinia.use(piniaPluginPersistedstate)`），所以默认状态从 state() 初始值起步，断言隔离干净。

如果发现 persist 仍然在干扰（比如残留 localStorage），spec 顶层加：

```ts
beforeEach(() => {
  localStorage.clear()
})
```

### 3.5 不需要 mock 的部分

- `request()` —— 本 sprint 不触发任何调它的 action
- `useNuxtApp().$i18n` —— `changeLocalLocale` 不在本 sprint
- `useCookies` / `useRuntimeConfig` —— 同上
- `checkUserSubscribedIsExpired`（来自 `apps/slax-reader-dweb/layers/core/app/utils/userRelative.ts:3`，当前 stub 永远返回 false —— 但仍要 mock 不到 / 直接调，让 `isSubscriptionExpired` 测试锁住"调用并原样返出"行为）

---

## 4. 预期阈值（不在本 sprint 启用）

跑 coverage 实测 user.ts 大概行覆盖 60-70%（getter + 纯本地 action 覆盖了 ~120 行，剩 ~80 行是 sprint 2.2 的 request 类 + 复合 action）。本 sprint 仅在 PHASE1 报告里**记录实测值**作为基线。Sprint 2.2 完成后再启用阈值（80/70/85/80）。

---

## 5. Sprint 2.1 任务拆分（2 个 task 串行）

### Task 1：spec 骨架 + getters（18 用例）

新建 `apps/slax-reader-dweb/tests/unit/stores/user.spec.ts`，落 §3 mock 链路 + §3.1 Pinia 骨架，写 §2.1 getters 的 18 用例。

commit：`test(dweb): cover user store getters (sprint 2.1.1)`

### Task 2：补 actions 纯本地 state + subscribe 相关（18 用例）

在同一文件继续追加 §2.2（6 用例）+ §2.3（12 用例），合计 18 用例。

commit：`test(dweb): cover user store local-state + subscription tracking (sprint 2.1.2)`

---

## 6. 风险

| 风险 | 概率 | 缓解 |
| --- | --- | --- |
| `mockNuxtImport('haveRequestToken', ...)` 在 isLogin getter 触发时不生效 —— Pinia getter 调用时机 vs vitest hoist 时机 | 中 | 用法与 sprint 1 useAuth.spec.ts 一致；如失效，先尝试在 isLogin 用例内部直接 `haveRequestTokenMock.mockReturnValue(true)` 再调 store |
| `isSubscriptionExpired` 调 `checkUserSubscribedIsExpired`（utils/userRelative.ts:3，当前 stub 永远返回 false） | 低 | 本 sprint 用 `tests/fixtures/user.ts` 的 `makeUser`/`baseUser` 覆盖 user!=null 分支，断言当前实现透传 false；未来若 utils 真有逻辑改动，此用例会自然反映新行为 |
| Pinia persist 插件让 state 在测试间残留 | 低 | §3.4 已说明；如残留，加 localStorage.clear() |
| 用例数 36（18 getter + 6 纯本地 action + 12 subscribe action）固定，不允许凑数刷无效用例也不允许"合并冗余" —— 每个 it 必须对应源码一条独立分支 | - | 实施时 task 各 spec 段写完先 grep coverage 看 user.ts 的 branch 行号是否覆盖到，发现遗漏立即补 |

---

## 7. 验收清单

- [ ] 36 用例全过（Task 1: 18 + Task 2: 18）
- [ ] user.ts 实测覆盖率记录到 PLAN.md（getter + 纯本地 action 路径覆盖率应 70%+，含 sprint 2.2 推迟的 request 类 action 整体应在 65-75% 之间）
- [ ] 全量 72 → 108 用例通过（不增 todo / fail）
- [ ] PLAN.md §7 渐进策略表 sprint 2.1 行新增（标"纯逻辑覆盖完成、阈值待 sprint 2.2 启用"）
- [ ] commit 全英文，分 2 commits（task 2.1.1 + 2.1.2）

## 8. Self-Review

1. ✓ Pinia setActivePinia 在 beforeEach 重建，state 隔离干净
2. ✓ 时间相关用例用 vi.useFakeTimers 锁时间
3. ✓ haveRequestToken 用 mockNuxtImport（auto-import，与 sprint 1 useAuth 同模式）
4. ✓ 不在本 sprint 启用阈值（避免 coverage 不达 80% 时误锁，等 sprint 2.2 整体启用）
5. ✓ checkUserSubscribedIsExpired 当前 stub（永远 false），用例锁住"调用并原样返出"未来内部有逻辑时自然反映
6. ✓ spec 路径 `apps/slax-reader-dweb/tests/unit/stores/user.spec.ts`（dweb 子包内），符合 vitest.config 的 dir './tests' 收集范围
7. ✓ 审计三轮已修订：路径前缀对齐 dweb / getter 分支补全 / subscribe action 边界补全
