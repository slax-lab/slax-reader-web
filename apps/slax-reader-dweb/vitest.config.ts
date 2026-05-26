import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    dir: './tests',
    include: ['**/*.spec.ts'],
    setupFiles: ['./tests/setup/index.ts'],
    environment: 'nuxt',
    testTimeout: 10000,
    environmentOptions: {
      nuxt: {
        domEnvironment: 'happy-dom',
        mock: {
          intersectionObserver: true,
          indexedDb: true
        }
      }
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: ['layers/core/app/**/*.{ts,vue}'],
      exclude: [
        'layers/core/app/**/*.d.ts',
        'layers/core/app/**/types.ts',
        'layers/core/app/app.vue',
        'layers/core/app/error.vue',
        'layers/core/app/layouts/**',
        'layers/core/app/plugins/**'
        // 第三期 sprint 2.1（2026-05-25）：pwa.ts 已重构 pwaRuntime seam + 5 用例覆盖，从 exclude 移除
        // 注意：layers/core/app/pages/** 不排除——页面承载主要业务逻辑（多个文件 400+ 行），
        // 必须纳入覆盖率分母。但第一/二期不为 pages 设局部门槛，仅观测。
      ],
      thresholds: {
        // 全局门槛第一期注释保留，等核心模块完成后再启用
        // lines: 70, branches: 65, functions: 70, statements: 70,

        // 第一期：只对已写样板的具体文件设阈值，避免未测试同目录文件按 0% 拖垮均值
        'layers/core/app/utils/string.ts': {
          lines: 90,
          branches: 85,
          functions: 90,
          statements: 90
        },
        'layers/core/app/composables/useAuth.ts': {
          lines: 80,
          branches: 70,
          functions: 90,
          statements: 80
        },

        // 第二期 sprint 1（2026-05-23 启用）：request.ts 23 用例覆盖完整
        // 实测 100/93.33/100/100，阈值给定 80/70/85/80 留 ~10pt 缓冲
        'layers/core/app/utils/request.ts': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },

        // 第二期 sprint 2.2（2026-05-23 启用）：user.ts 54 用例覆盖完整
        // 实测 100/100/100/100，阈值给定 80/70/85/80 留 ~20pt 缓冲
        'layers/core/app/stores/user.ts': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },

        // 第二期 sprint 3（2026-05-23 启用）：environment.ts 13 用例覆盖完整
        // 实测 100/94.44/100/100，branches 94.44% 因 v8 把 split(';')[0] ?? '' fallback 算不可达分支
        // 阈值给定 80/70/85/80 留余量
        'layers/core/app/utils/environment.ts': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },

        // 第二期 sprint 3（2026-05-23 启用）：DwebEnvironmentAdapter.ts 6 用例覆盖完整
        // 实测 100/100/100/100，阈值给定 80/70/85/80 留余量
        'layers/core/app/components/Article/Selection/adapters/DwebEnvironmentAdapter.ts': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },

        // 第二期 sprint 4（2026-05-24 启用）：modal.ts 8 用例覆盖完整
        // 实测 100/100/100/100，阈值给定 80/70/85/80 留余量
        'layers/core/app/utils/modal.ts': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },

        // 第二期 sprint 4（2026-05-24 启用）：Modal/index.ts 12 用例覆盖完整
        // 实测 100/100/100/100，阈值给定 80/70/85/80 留余量
        'layers/core/app/components/Modal/index.ts': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },

        // 第二期 sprint 5（2026-05-24 启用）：useBookmarkRelative.ts 24 用例覆盖完整
        // 实测 lines 98.24 / branches 92 / functions 86.66 / statements 98.38
        // functions 仅 86.66 因 logAnalyzed / logChat 为占位空实现（spec §1.7 决议不补测）
        // 阈值给定 80/70/85/80 留余量
        'layers/core/app/composables/useBookmarkRelative.ts': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },

        // 第三期 sprint 2.2（2026-05-25 启用）：composables/useUserRelative.ts 5 用例覆盖完整
        // 实测 lines 100 / branches 100 / functions 100 / statements 100
        // useUserSubscribe 内 checkUserSubscribedIsExpired 占位实现总返 false（utils/userRelative.ts 已 100% 覆盖）
        // 阈值给定 80/70/85/80 留余量
        'layers/core/app/composables/useUserRelative.ts': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },

        // 第三期 sprint 3.1（2026-05-25 启用）：composables/useNotification.ts 18 用例覆盖完整
        // 关键约束：happy-dom 默认无 navigator.serviceWorker / Notification，必须 stubGlobal 才能进入 supported 路径
        //         C7（无 Notification）必须独立 describe 不 stub Notification（lessons §6 + spec 修订 1/2）
        //         C11 subscribe().then() 不 await，必须 await 多次 microtask flush 后断言 mockPost
        //         sendMessage 是闭包不能 spy，断言改 swRegistration.active.postMessage
        // 阈值给定 80/70/85/80 留余量
        'layers/core/app/composables/useNotification.ts': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },

        // 第三期 sprint 3.2（2026-05-25 启用）：components/Notification/UserNotification.vue 17 用例覆盖完整
        // 实测 lines 87.5 / branches 73.58 / functions 95 / statements 87.23
        // NotificationCell 子组件 stub 避免污染（spec §2.1 修订 1）
        // 顶层 setup 块 if (notification.isSupportedNotification) 在每次 mount 触发，必须前置 mockUseNotification.mockReturnValue
        // 阈值给定 80/70/85/80 留余量
        'layers/core/app/components/Notification/UserNotification.vue': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },

        // 第三期 sprint 4A（2026-05-25 启用）：components/Chat/ChatBot.vue 49 用例完整非流式覆盖
        // 实测 lines 84.19 / branches 72.96 / functions 95.45 / statements 83.66
        // 流式 chat() / SSE 推迟第四期 e2e（spec §1.1 修订 7 决议）
        // 关键约束：
        //  - ChatBot/ChatResponseType/ChatParamsType 是 Nuxt auto-import → mockNuxtImport
        //  - enum 值全大写：CONTENT/FUNCTION/STATUS_UPDATE / CONTENT/QUESTIONS/ASK
        //  - capturedCallback payload key 大写（data.FUNCTION）
        //  - 必须 mountWithApp（模板用 $t 需 i18n 插件）
        //  - getComputedStyle 必须 spy（isDark / botSize 依赖）
        // 阈值给定 80/70/85/80 留余量
        'layers/core/app/components/Chat/ChatBot.vue': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },

        // 第三期 sprint 4B Task 4.3（2026-05-25 启用）：pages/bookmarks/[id].vue 32 用例完整集成覆盖
        // 实测 lines 95.07 / branches 88.13 / functions 87.8 / statements 95.74
        // 关键约束：
        //  - useBookmark mock + 捕获 options（让 spec 手动驱动 initialRequestTask / initialTasksCompleted）
        //  - DetailLayout stub 必须渲染 named slots + 暴露 isSmallScreen() 方法
        //  - RequestError 用对象签名 { message, name, code }
        //  - 子组件 stub 必须设 name 字段才能 findComponent({ name }) 命中
        // 阈值给定 80/70/85/80 留余量
        'layers/core/app/pages/bookmarks/[id].vue': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },

        // 第三期 sprint 4B Task 4.2（2026-05-25 启用）：pages/bookmarks/index.vue 50 用例完整集成覆盖
        // 实测 lines 90.81 / branches 78.10 / functions 85.13 / statements 92.36
        // 关键约束：
        //  - useUserStore 全 vi.mock（mountWithApp 独立 Pinia 让 spyOn 失效）
        //  - useNotification 显式 import → vi.mock；addChannelMessageHandler / useScroll 是 Nuxt auto-import → mockNuxtImport
        //  - useScroll mockNuxtImport factory 不引 ref（TDZ），用 vi.hoisted plain { value: 0 }
        //  - useRoute beforeEach 创建 reactive proxy；用例改 reactive proxy 触发 watch（修改原始对象绕过 Vue proxy）
        //  - useInfiniteScroll mock 立即调 callback（Promise.resolve().then），驱动 onLoadMore
        //  - 子组件 stub 必须设 name 字段（findComponent 命中）+ 渲染 named slots（v-slot:operates 等）
        //  - useRouter mock 包 beforeEach/afterEach/beforeResolve/push/replace/back/forward（nuxt navigation-repaint 插件依赖）
        // 阈值给定 80/70/85/80 留余量
        'layers/core/app/pages/bookmarks/index.vue': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },

        // 第三期 sprint 4B Task 4.4（2026-05-26 启用）：pages/w/[id].vue 16 用例集成覆盖
        // 实测 lines 61.39 / branches 44.23 / functions 56.75 / statements 62.66
        // **关键约束 — 阈值低于其它 pages 的根因**：
        //  - 本页核心是 iframe + Service Worker liveproxy（150 行 setup 中 iframe / SW 占 ~60 行）
        //  - happy-dom 无原生 SW，iframe.contentDocument body innerText 不真实，injectInlineScript / highlightMarks
        //    依赖真实浏览器才能跑通；这部分行 v8 算未覆盖
        //  - 通过 vi.stubGlobal 替换 navigator.serviceWorker + iframe load 立即触发，能覆盖到 register/postMessage 路径
        //    但 iframe.contentDocument.querySelector 等真实 DOM 行为无法 stub
        //  - 这部分覆盖缺口 = 第四期 e2e 兜底（phase4-todo 已登记）
        // 阈值给定 50/40/50/50 留余量（实测 61/44/56/62）
        'layers/core/app/pages/w/[id].vue': {
          lines: 50,
          branches: 40,
          functions: 50,
          statements: 50
        },

        // 第三期 sprint 5（2026-05-26 启用）：components/ 批量 unit 治理 4 个高 ROI 文件
        //  - CopyButton.vue：纯 i18n 文案 + svg，2 用例 100/100/100/100
        //  - DotsMenu.vue：bubble 切换 + actions emit + outsideClick，6 用例 100/100/100/100
        //  - OptionsBar.vue：v-model:index + watch + closePopup，9 用例 96/90/100/96
        //  - BookmarkList/TabsSidebar.vue：trash 按钮 + getAllButtons expose，6 用例 100/92/86/97
        // 阈值统一 80/70/85/80
        'layers/core/app/components/CopyButton.vue': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },
        'layers/core/app/components/DotsMenu.vue': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },
        'layers/core/app/components/OptionsBar.vue': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },
        'layers/core/app/components/BookmarkList/TabsSidebar.vue': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },

        // 第三期 sprint 5 batch 2（2026-05-26 启用）：components/ 中型 4 文件全 100% 覆盖
        //  - QuickStart.vue：5 用例，100/100/100/100（install button window.open）
        //  - InputBar.vue：12 用例，100/100/100/100（v-model:text + Enter onKeyDown + focus expose）
        //  - BookmarkList/SearchTopModal.vue：6 用例，100/100/100/100（show watch + topModalClick + analyticsLog 异常分支）
        //  - BookmarkList/SearchHeader.vue：12 用例，100/88.88/100/100（onMounted+watch defaultSearchText+pwaOpen+vector tag）
        // 阈值统一 80/70/85/80
        'layers/core/app/components/QuickStart.vue': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },
        'layers/core/app/components/InputBar.vue': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },
        'layers/core/app/components/BookmarkList/SearchTopModal.vue': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },
        'layers/core/app/components/BookmarkList/SearchHeader.vue': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },

        // 第三期 sprint 5 batch 3（2026-05-26 启用）：components/ 中大型 3 文件
        //  - AppHeader.vue：14 用例，96.55/96.42/91.66/96.55（mobile sidebar + analyticsLog pathname）
        //  - Modal/EditName.vue：10 用例，90.24/88.88/90.9/90.24（useScrollLock vi.mock 绕开 happy-dom 限制）
        //  - BookmarkList/AddUrlTopModal.vue：8 用例，96.77/100/87.5/96.77（addUrlButtonEnable computed 全分支）
        // 阈值统一 80/70/85/80
        'layers/core/app/components/AppHeader.vue': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },
        'layers/core/app/components/Modal/EditName.vue': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },
        'layers/core/app/components/BookmarkList/AddUrlTopModal.vue': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },

        // 第三期 sprint 5 batch 4（2026-05-26 启用）：components/ 4 文件
        //  - NavigateStyleButton.vue：7 用例，100/100/100/100（loading 短路 + clickable computed）
        //  - Modal/LoginModal.vue：6 用例，100/100/100/100（GoogleLoginButton 透传 + close + after-leave dismiss）
        //  - Modal/SnapshotStatusModal.vue：8 用例，100/100/100/100（dontRemindAgain v-model + confirm emit + after-leave）
        //  - Modal/Feedback.vue：11 用例，97.91/96.29/100/97.95（feedback 空短路 + analyticsLog + UAParser 环境拼接 + email 路径）
        // 阈值统一 80/70/85/80
        'layers/core/app/components/NavigateStyleButton.vue': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },
        'layers/core/app/components/Modal/LoginModal.vue': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },
        'layers/core/app/components/Modal/SnapshotStatusModal.vue': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },
        'layers/core/app/components/Modal/Feedback.vue': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },

        // 第三期 sprint 1.2（2026-05-25 启用）：composables/bookmark/useBookmark.ts 31 用例覆盖完整
        // 实测 lines 100 / branches 94.73 / functions 100 / statements 100
        // 含主 spec 30 用例 + non-client 1 用例（isClient=false 路径走 vi.doMock + vi.resetModules）
        // 阈值给定 80/70/85/80 留余量
        'layers/core/app/composables/bookmark/useBookmark.ts': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },

        // 第三期 sprint 1.3（2026-05-25 启用）：composables/bookmark/useWebBookmark.ts 33 用例覆盖完整
        // 实测 lines 100 / branches 92 / functions 100 / statements 100
        // 含主 spec 32 用例（28 useWebBookmark + 3 useWebBookmarkDetail + 1 useStar）+ non-client 1 用例
        // 关键约束：showAnalyzed/showChatbot 内 if (summariesExpanded.value) 同步 + panelType watch 异步
        //         覆盖 logAnalyzed/logChat 分支必须调用前先同步设值（spec §5.5 修订 1）
        // 阈值给定 80/70/85/80 留余量
        'layers/core/app/composables/bookmark/useWebBookmark.ts': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },

        // 第三期 sprint 1.4（2026-05-25 启用）：composables/bookmark/useCommon.ts 23 用例覆盖完整
        // 实测 lines 98.87 / branches 81.48 / functions 100 / statements 98.86
        // 含主 spec 22 用例（5 useTracking + 17 useResize）+ non-client 1 用例
        // branches 81.48 因 line 78 `if (value === oldValue) return` 是死分支（vue ref 同值不触发 watcher，spec §5.3 决议容忍）
        // 阈值给定 80/70/85/80 留余量
        'layers/core/app/composables/bookmark/useCommon.ts': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },

        // 第二期 sprint 6.1（2026-05-24 启用）：utils 4 个轻量文件覆盖完整
        // userRelative.ts 1 用例 → 实测 100/100/100/100
        // zip.ts 5 用例 → 实测 100/80/100/100
        // channel.ts 9 用例 → 实测 100/87.5/100/100（含 close listener）
        // analytics.ts 7 用例 → 实测 100/95.83/100/100
        // 阈值统一给定 80/70/85/80 留余量
        'layers/core/app/utils/userRelative.ts': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },
        'layers/core/app/utils/zip.ts': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },
        'layers/core/app/utils/channel.ts': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },
        'layers/core/app/utils/analytics.ts': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },

        // 第二期 sprint 6.2（2026-05-24 启用）：chatbot.ts 27 用例覆盖完整
        // constructor 3 + createMessages 5 + handleData 13 + 边界 6
        // 实测 lines 92.66 / branches 85.36 / functions 100 / statements 92.52
        // 阈值给定 80/70/85/80 留余量
        'layers/core/app/utils/chatbot.ts': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },

        // 第三期 sprint 2.1（2026-05-25 启用）：pwa.ts 重构 pwaRuntime seam + 5 用例覆盖
        // 实测 lines 100 / branches 100 / functions 100 / statements 100
        // 关键决议：useNuxtApp().$pwa.isPWAInstalled 是 configurable: false 不能 defineProperty
        //         → 源码抽 pwaRuntime 对象（getInstalled 方法）让测试通过 vi.spyOn 替换属性查找
        // 阈值给定 80/70/85/80 留余量
        'layers/core/app/utils/pwa.ts': {
          lines: 80,
          branches: 70,
          functions: 85,
          statements: 80
        },

        // 第二期收尾（2026-05-24 启用）：utils/** 目录级阈值
        // 第三期 sprint 2.1（2026-05-25 升级）：pwa.ts 重构后纳入分母，含 10 个治理文件
        //   string.ts / userRelative.ts / zip.ts / channel.ts / analytics.ts /
        //   environment.ts / modal.ts / request.ts / chatbot.ts / pwa.ts
        // 第三期 sprint 2.3（2026-05-25 升级）：从 90/85/90/90 升至 95/85/95/95
        //   实测 97/88.84/100/96.93（lines/branches/functions/statements）
        //   branches 88.84 暂保持 85（受 chatbot.ts 85.36 / channel.ts 87.5 / zip.ts 80 拖累，待补 branches 后单独升）
        //   lines/functions/statements 升 5 点提升基线
        'layers/core/app/utils/**': {
          lines: 95,
          branches: 85,
          functions: 95,
          statements: 95
        }
      }
    }
  }
})
