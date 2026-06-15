import { ClassIsolationProcessor } from './class-isolation.processor'
import type { DOMProcessor, SsrRewriteContext, SsrRewriter } from './types'

// SSR 可改写的处理器清单
// 只放服务端安全的，延迟实例化
function createSsrArticleProcessors(): DOMProcessor[] {
  return [new ClassIsolationProcessor()]
}

// HTMLRewriter 由 Workers 提供
type SsrRewriterCtor = new () => SsrRewriter & { transform(response: Response): Response }

// SSR 改写正文，不可用时原样返回
export async function runArticleSsrProcessors(html: string, ctx: SsrRewriteContext = {}): Promise<string> {
  const Rewriter = (globalThis as { HTMLRewriter?: SsrRewriterCtor }).HTMLRewriter
  if (!import.meta.server || !Rewriter || !html) return html

  const processors = createSsrArticleProcessors().filter(p => p.ssr)
  if (processors.length === 0) return html

  try {
    const rewriter = new Rewriter()
    for (const processor of processors) {
      processor.ssr!.registerRewriter(rewriter, ctx)
    }

    // 显式标 HTML 类型
    const transformed = rewriter.transform(new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } }))
    return await transformed.text()
  } catch (error) {
    // 失败退回原文，不阻断渲染
    console.error('[ssr-runner] failed, fallback to raw html:', error)
    return html
  }
}
