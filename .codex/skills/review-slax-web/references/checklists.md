# 四焦点落地检查项

读这份的时机：阶段 6 综合分析时；阶段 2 肉眼点评作为引子。

---

## 焦点 1：写法是否最优

- [ ] **复用**：项目里已有同等功能的 composable / util / 组件？（阶段 5 复用扫描结论）
- [ ] **归属**：改的是正确的 fork/upstream 层？（见 fork-layer.md）
- [ ] **分层**：组件只做视图 + 交互？数据/业务逻辑下沉到 composable / store / service？
- [ ] **命名**：组件/props/emit 名表意？布尔 flag props 有没有用 enum/字面量联合替代的余地？
- [ ] **props**：>5 个 props → 考虑对象；boolean props 太多 → 重新设计
- [ ] **嵌套深度**：模板/逻辑嵌套超过 3 层 → 提取子组件/函数
- [ ] **死代码**：unreachable 分支、unused import、注释掉的代码块
- [ ] **类型**：`any` 滥用？`unknown` 没收敛？`as X` 绕过校验？
- [ ] **错误处理**：每个 throw/reject 都有处理？catch 是否真处理而非吞？
- [ ] **一致性**：跟项目里同类问题现有写法一致？

## 焦点 2：性能 & 渲染

- [ ] **响应式开销**：computed 缓存了重计算？还是每次 render 重算？
- [ ] **大列表**：虚拟滚动 / 分页？
- [ ] **重渲染**：inline 对象/数组 literal 作 props（每次新引用）？大范围 reactive 触发全量更新？
- [ ] **watch 成本**：`{deep}` 大对象？高频源没 debounce/throttle？
- [ ] **代码分割**：大依赖（markmap/mermaid/katex）动态 import？没进首屏 bundle？
- [ ] **v-if vs v-show**：频繁切换用错？
- [ ] **图片/资源**：懒加载？尺寸合理？
- [ ] **SSR 负担**：能 CSR 的重活压到了 server？
- [ ] **内存**：监听/interval/第三方实例在 onUnmounted 清理？

## 焦点 3：边界 / 残缺

- [ ] **空值**：empty array / null / undefined / empty string / 首次进入
- [ ] **加载/错误/空 三态**：都有 UI 分支？还是只画了成功态？
- [ ] **离线态**：断网时的行为（本地优先场景）
- [ ] **超长/超大**：长文本溢出、长列表、大图
- [ ] **并发/竞态**：快速连点、请求返回乱序（先发后到）、check-then-act 窗口
- [ ] **权限/越权**：能不能访问不属于自己的资源？路由守卫覆盖？
- [ ] **时区/本地化**：时间展示、数字/货币格式
- [ ] **hydration**：SSR/CSR 首帧一致？
- [ ] **路由边界**：无效 param、深链直达、后退/前进状态
- [ ] **key 边界**：keyed v-for 空↔非空切换（本项目崩过）

## 焦点 4：阴性 BUG（看着对、其实错）

- [ ] **丢响应性**：解构 props/reactive/store 后依赖它
- [ ] **computed 副作用**：computed 里 await / 改状态 / 打接口
- [ ] **watch 语义**：缺 `immediate` / `deep`；watchEffect 里 await 后的依赖不再收集
- [ ] **catch 吞错**：`catch (e) {}` / 只 console.log 不处理
- [ ] **缺 await**：返回 Promise 但没 await；`onMounted(async ...)` 里未处理 rejection
- [ ] **`||` vs `??`**：0 / '' / false 被错误兜底
- [ ] **模块级共享状态**：SSR 下跨请求泄漏（应 useState）
- [ ] **正则 lastIndex**：带 `g` flag 的 regex 复用，`.test()` 之间串 lastIndex
- [ ] **数组 mutation**：`arr.sort()` / `reverse()` 改了响应式原数组
- [ ] **闭包陷阱**：循环里回调引用循环变量
- [ ] **JSON.parse 抛错**：外部/用户数据直接 parse 没 try/catch
- [ ] **类型 vs 运行时**：TS 说是 X，接口返回可能是别的
- [ ] **v-html/XSS**：用户内容未 sanitize
- [ ] **hydration 隐性 mismatch**：条件渲染依赖了 client-only 值

---

## 严重度判定

| 触发条件                                                                                | 等级           |
| --------------------------------------------------------------------------------------- | -------------- |
| 数据损坏 / XSS 等安全漏洞 / 越权 / 崩溃白屏 / 本地云端数据漂移 / 改错 copy 导致上线无效 | `[Critical]`   |
| 性能/可维护性明显损失但不立即出事 / 覆盖漂移 / 缺空态                                   | `[Should-Fix]` |
| 风格、可读性、小型优化                                                                  | `[Nit]`        |
| 不能判定对错，需要作者说明上下文                                                        | `[Question]`   |

边界场景里"不确定但风险高"的优先归 `[Should-Fix]` 而非 `[Question]` —— 你先表态，作者可 push back。
