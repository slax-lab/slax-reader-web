# PowerSync / 本地优先同步 陷阱

读这份的时机：diff 涉及 `apps/slax-reader-dweb/app/local-first/**`、PowerSync schema/query、离线同步逻辑时。

**重要前置**：PowerSync 行为版本敏感，任何具体行为务必联网核实当前版本（搜 `"PowerSync <feature> <year>"`）。本项目有本地优先审计记录，参考 `.claude/powersync-local-first-audit.md` / `.claude/POWERSYNC_AUDIT_TODO.md`。

---

## 1. 乐观更新 & 回滚

- 本地优先：先写本地 SQLite → 后台同步到后端。写失败要回滚本地状态，否则本地与云端漂移。
- **review 时**：本地写入后没有失败回滚路径 / 没有冲突处理 → `[Should-Fix]`。
- UI 乐观态（先展示成功）与实际同步结果不一致时怎么收敛？

## 2. 离线 / 在线切换

- 断网→联网重连时的补同步；重连风暴（多标签页同时同步）
- **review 时**：新增的同步触发是否考虑离线态？离线时调后端 API 会怎样降级？

## 3. 幂等 / 去重

- 同一条本地变更可能被同步多次（重连、重试）。后端应幂等；本地 changelog 应去重。
- 本项目有 local-first 去重相关工作（`.claude/docs/localfirst-fork-dedup/`）。
- **review 时**：新增写入是否会产生重复 change 记录？

## 4. Schema / 查询

- PowerSync schema 与后端 schema 的映射；本地 SQL 查询在 SQLite 语义下的行为
- 大结果集查询在主线程解析 → 卡 UI（考虑分页 / 增量）
- **review 时**：新查询是否有 LIMIT / 分页？watch query 的更新频率？

## 5. 响应式桥接

- PowerSync 查询结果 → Vue 响应式的桥接（watch query / reactive wrapper）
- **review 时**：query watcher 是否在组件卸载时正确释放？结果映射到 ref 有没有丢响应性？

## 6. fork 特有

- 本地优先是 fork 的 Pro 能力之一（`app/local-first/`、`app/composables/local-first/`）。判定归属：这些一般是 fork-only，不在 upstream 层。
- **review 时**：本地优先相关改动几乎都在 fork `app/` 下，别去 upstream 找基线。

## 7. 埋点 / 可观测

- 同步失败、冲突、回滚都应有日志/metric（extension 侧有 metricService 埋点约定）
- **review 时**：silent 的同步失败分支 → `[Should-Fix]`。
