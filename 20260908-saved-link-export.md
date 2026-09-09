# 收藏链接导出

设置页在导入卡片后新增免费的“导出收藏链接”卡片。CSV 为默认格式，也可选择 JSON。两种格式都包含已归档的收藏，排除回收站；不包含高亮、评论、文章正文或图片文件。

导出从账号的收藏库读取数据，不受当前搜索、标签或列表筛选影响。文章、快捷链接，以及抓取中或抓取失败的收藏均包含在内。标题依次采用自定义标题、文章标题、URL。

## 文件格式

文件名采用浏览器所在时区的日期，例如 `slax-reader-links-20260908.csv`。收藏时间和 JSON 中的导出时间使用 UTC ISO 8601 格式。

CSV 使用 UTF-8，文件开头带 BOM。表头固定为：

```csv
url,title,tags,saved_at,is_read,is_archived,is_starred,type
```

每条收藏占一条 CSV 记录。标签列存储名称组成的 JSON 数组。所有数据单元格使用双引号包裹，内部双引号写成两个双引号，记录之间使用 CRLF。为避免电子表格执行公式，公式前缀及以制表符、回车或换行开头的文本添加单引号。URL 和标题也应用这一规则。阅读、归档和星标状态独立保存为 `true` 或 `false`。类型为 `article` 或 `shortcut`。

JSON 保留原始文本，不添加电子表格转义字符。示例：

```json
{
  "schema_version": 1,
  "exported_at": "2026-09-08T00:00:00.000Z",
  "items": [
    {
      "url": "https://example.com/",
      "title": "示例文章",
      "tags": [{ "name": "阅读", "source": "ai" }],
      "saved_at": "2026-09-07T12:00:00.000Z",
      "is_read": false,
      "is_archived": true,
      "is_starred": false,
      "type": "article"
    }
  ]
}
```

标签的 `source` 原样保留，不转换成前端的其他来源名称。本版本不支持把此 JSON 导入 Reader。

## 请求和取消

客户端顺序请求 `GET /v1/bookmark/export`，后续请求传递服务端返回的 `cursor`，每页最多 500 条。服务端首次请求确定收藏 ID 上界，后续新收藏不进入这次导出；各页元数据按读取时刻获取，读取前已删除的收藏会被略过。

客户端逐页转换并暂存文件片段，全部请求成功后才创建下载。取消会中止当前 HTTP 请求并清空片段；离开设置页也会取消。失败显示重试，重试从第一页开始，不下载残缺文件。导出期间禁用格式选择和导出按钮，显示已准备条数。空库显示“没有可导出的收藏链接”。

事件 `bookmark_export_start`、`bookmark_export_complete`、`bookmark_export_failure`、`bookmark_export_cancel` 只附带格式、数量和耗时；不记录 URL、标题或标签。完成事件表示已触发浏览器下载，无法确认用户是否最终保存文件。

## 验证方法

前端单元测试包含 CSV 的 Unicode、逗号、引号、换行、公式保护，JSON 原文与标签来源，多页与空页、失败与重试、过期会话、HTTP 中止、重复点击、卸载取消，以及 CSV 和 JSON 各 100,000 条的完整性测试。托管版本通过测试入口引用共享测试，避免两套实现。

在托管前端项目目录执行：

```sh
pnpm --dir apps/slax-reader-dweb exec vitest run tests/unit/components/UserExportSection.spec.ts tests/unit/utils/bookmarkExport.spec.ts
```

浏览器性能验证夹具位于 `apps/slax-reader-dweb/tests/fixtures/20260908-bookmark-export-browser.html`。把夹具复制到临时目录并命名为 `index.html`，使用 esbuild 将 `apps/slax-reader-dweb/layers/core/app/utils/bookmarkExport.ts` 打包为同目录的 `export.js`，参数为 `--bundle --format=esm --platform=browser`。在该目录运行 `python3 -m http.server 8766` 后访问 `http://localhost:8766`。生成的 JavaScript 仅用于本地验证，不提交。夹具验证 100,000 条完整性、浏览器计时、取消延迟和可用时的堆内存读数；堆内存读数不包括 Blob 的全部占用。

本次验证使用 Node.js 22.22.2。15 项功能测试通过，修改文件的 ESLint 检查通过，托管前端生产构建通过。完整类型检查仍有既有错误，涉及标签筛选、登录中间件和文本解析等文件；导出相关文件没有类型错误。完整 ESLint 检查仍报告其他文件的既有错误。具体数量与运行记录保存在本次项目发布记录中。

上线顺序为后端接口先上线，再发布前端。

## 提交前复查

2026-09-08，在最新主分支上单独整理导出改动，托管组件与共享工具共 15 项测试通过，Node 22.22.2 网页构建通过，变更文件 lint 通过。完整网页类型检查仍有 24 条既有错误，导出文件无类型错误。100,000 条浏览器合成样本两种格式逐条校验通过；CSV 约 1.6 秒、JSON 约 1.8 秒，取消在下一页前生效。未执行真实账号端到端导出。
