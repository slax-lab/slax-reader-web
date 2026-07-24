import { BlankMarkProcessor } from './blank-mark.processor'
import { ClassIsolationProcessor } from './class-isolation.processor'
import { PreLineProcessor } from './preline.processor'
import type { DOMProcessor, SsrRewriteContext, SsrRewriter } from './types'

// 两个 handler 重叠注册
// onEndTag，引擎会丢回调
function createSsrArticleProcessorGroups(): DOMProcessor[][] {
  return [[new ClassIsolationProcessor(), new BlankMarkProcessor()], [new PreLineProcessor()]]
}

// HTMLRewriter 由 Workers 提供
type SsrRewriterCtor = new () => SsrRewriter & { transform(response: Response): Response }

async function runSsrPass(Rewriter: SsrRewriterCtor, html: string, processors: DOMProcessor[], ctx: SsrRewriteContext): Promise<string> {
  const rewriter = new Rewriter()
  for (const processor of processors) {
    processor.ssr!.registerRewriter(rewriter, ctx)
  }
  // 显式标 HTML 类型
  const transformed = rewriter.transform(new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } }))
  return await transformed.text()
}

// SSR 改写正文，不可用时原样返回
export async function runArticleSsrProcessors(html: string, ctx: SsrRewriteContext = {}): Promise<string> {
  const Rewriter = (globalThis as { HTMLRewriter?: SsrRewriterCtor }).HTMLRewriter
  if (!import.meta.server || !Rewriter || !html) return html

  const groups = createSsrArticleProcessorGroups()
    .map(group => group.filter(p => p.ssr))
    .filter(group => group.length > 0)
  if (groups.length === 0) return html

  try {
    let current = html
    for (const group of groups) {
      current = await runSsrPass(Rewriter, current, group, ctx)
    }
    return current
  } catch (error) {
    // 失败退回原文，不阻断渲染
    console.error('[ssr-runner] failed, fallback to raw html:', error)
    return html
  }
}
