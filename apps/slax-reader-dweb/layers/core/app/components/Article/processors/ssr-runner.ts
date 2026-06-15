import { ClassIsolationProcessor } from './class-isolation.processor'
import type { DOMProcessor, SsrRewriteContext, SsrRewriter } from './types'

// SSR 可参与改写的处理器清单（可配置入口）。
// 只放服务端安全的（无 CE / 不 extends HTMLElement）。
// 工厂延迟实例化：避免模块顶层 new 触发打包惰性 init 的 “is not a constructor”。
function createSsrArticleProcessors(): DOMProcessor[] {
  return [new ClassIsolationProcessor()]
}

// HTMLRewriter 由 Workers 运行时提供，用窄签名取全局。
type SsrRewriterCtor = new () => SsrRewriter & { transform(response: Response): Response }

// SSR 用 HTMLRewriter 改写正文；非服务端/无 HTMLRewriter 时原样返回。
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

    // 显式标 HTML 类型，不依赖默认 content-type。
    const transformed = rewriter.transform(new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } }))
    return await transformed.text()
  } catch (error) {
    // 改写仅为优化，失败退回原文，不阻断渲染。
    console.error('[ssr-runner] failed, fallback to raw html:', error)
    return html
  }
}
