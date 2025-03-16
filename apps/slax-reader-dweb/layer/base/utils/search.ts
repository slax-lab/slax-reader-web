// 寻找符合文本的对应元素
export const findMatchingElement = (text: string, dom?: Element) => {
  // 递归函数，用来找到包含文本的最小元素
  function searchNodes(node: Node) {
    // 如果当前节点是文本节点且包含目标文本
    if (node.nodeType === Node.TEXT_NODE && node.nodeValue?.includes(text) && node.parentElement) {
      // 返回此文本节点的父元素
      return [node.parentElement]
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // 如果是元素节点
      const foundChildren: Node[] = []
      // 遍历子节点
      node.childNodes.forEach(child => {
        const result = searchNodes(child)
        if (result && result.length > 0) {
          // 如果找到匹配子节点，记录之
          foundChildren.push(...result)
        }
      })
      // 如果在子节点中找到匹配，返回找到的匹配节点
      if (foundChildren.length > 0) {
        return foundChildren
      } else if (node.textContent?.includes(text)) {
        // 没有匹配的子节点，但当前节点包含文本，返回当前节点
        return [node]
      } else if (node instanceof HTMLElement && node.innerText?.includes(text)) {
        // 没有匹配的子节点，但当前节点包含文本，返回当前节点
        return [node]
      }
    }
    // 未找到匹配，返回null
    return null
  }

  // 保存匹配到的最小元素
  const matchedElements: Node[] = []
  const foundelements = searchNodes(dom || document.body)
  // 如果匹配元素不在数组内，则添加到数组
  foundelements?.forEach(matchedElement => {
    if (matchedElement && !matchedElements.includes(matchedElement)) {
      matchedElements.push(matchedElement)
    }
  })

  return matchedElements
}

// 用于解析markdown文本，提取且关系节点的关系，返回一个二元组列表，每个二元组第一个代表其父节点，第二个则是子节点
export const extractMarkdownNodes = (modelResponse: string) => {
  // 匹配# ## -，分别是一二三级节点
  let root = ''
  let levelOneNode = ''

  const resList: [string, string][] = []
  const rootPatt = new RegExp('^#\\s*(.+)')
  const levelOnePatt = new RegExp('^##\\s*(.+)')
  const levelTwoPatt = new RegExp('^-\\s*(.+)')

  const lines = modelResponse.split('\n')
  lines.forEach(line => {
    if (!root) {
      const rMatch = rootPatt.exec(line)
      if (rMatch) {
        root = rMatch[1]
        return
      }
    }
    const loMatch = levelOnePatt.exec(line)
    if (loMatch) {
      levelOneNode = loMatch[1]
      const edge: [string, string] = [root, levelOneNode]
      // 使用 JSON.stringify 来比较两个数组（边）是否相等
      if (!resList.some(e => JSON.stringify(e) === JSON.stringify(edge))) {
        resList.push(edge)
        return
      }
    }
    const ltMatch = levelTwoPatt.exec(line)
    if (ltMatch) {
      const edge: [string, string] = [levelOneNode, ltMatch[1]]
      if (!resList.some(e => JSON.stringify(e) === JSON.stringify(edge))) {
        resList.push(edge)
      }
    }
  })

  return resList
}

// 用于解析markdown文本，提取所有的锚点引用，返回一个字符串列表
export const queryMarkdownAnchorQuote = (markdown: string) => {
  const anchorPatt = new RegExp(/\[(.+)\]\(#(.+[(.*)]*.*?)\)/g)
  const result: { index: number; anchorNum: string; text: string; anchorText: string }[] = []
  let matches: RegExpExecArray | null = null
  while ((matches = anchorPatt.exec(markdown)) !== null) {
    result.push({
      index: matches.index,
      anchorNum: encodeURIComponent(String(matches[1])),
      text: matches[2],
      anchorText: matches[0]
    })
  }

  return result
}

// 用于解析markdown文本，提取所有的锚点引用（包括不完整的），返回一个字符串列表
export const querySimularMarkdownAnchorQuote = (markdown: string) => {
  const anchorPatt = new RegExp(/\[(.+)\]\(#(.*)/g)
  const result: { index: number; anchorNum: string; text: string; anchorText: string }[] = []
  let matches: RegExpExecArray | null = null
  while ((matches = anchorPatt.exec(markdown)) !== null) {
    result.push({
      index: matches.index,
      anchorNum: encodeURIComponent(String(matches[1])),
      text: matches[2],
      anchorText: matches[0]
    })
  }

  return result
}

// 用于解析markdown文本，提取所有的锚点引用，返回一个字符串列表
export const queryEndlineSentenceBeginWithStartBlock = (markdown: string) => {
  const sentencesPatt = new RegExp(/\[(.*)$/g)
  const result: { index: number; text: string }[] = []
  let matches: RegExpExecArray | null = null
  while ((matches = sentencesPatt.exec(markdown)) !== null) {
    result.push({
      index: matches.index,
      text: matches[0]
    })
  }

  return result
}

// 用于解析markdown文本，提取所有的类似锚点的引用，返回一个字符串列表
export const queryAnchorAlikeQuote = (markdown: string) => {
  const sentencesPatt = new RegExp(/(\[\d\]\(anchor_.*\))/g)
  const result: { index: number; text: string }[] = []
  let matches: RegExpExecArray | null = null
  while ((matches = sentencesPatt.exec(markdown)) !== null) {
    result.push({
      index: matches.index,
      text: matches[0]
    })
  }

  return result
}
