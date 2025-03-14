<template>
  <div class="mark-mind-map" ref="container" :style="{ opacity: data.length > 0 ? 1 : 0, background: isFullscreen ? '#fff' : 'transparent' }">
    <svg class="mind-svg" ref="svg"></svg>
    <div class="mind-toolbar" v-if="props.showToolbar">
      <div class="item" v-for="icon in toolbarIcons" :key="icon.id" @click="toolbarClick(icon)">
        <div class="icon-bg"></div>
        <svg v-html="icon.svg"></svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

import { base64toBlob } from '@commons/utils/data'

import dom2Img, { AutoFitByRatio } from 'easy-dom2img'
import type Renderer from 'markdown-it/lib/renderer.mjs'
import Token from 'markdown-it/lib/token.mjs'
import { type INode, wrapFunction } from 'markmap-common'
import { builtInPlugins, Transformer } from 'markmap-lib'
import { type IMarkmapOptions, Markmap } from 'markmap-view'

const props = defineProps({
  data: { type: String, default: '' },
  showToolbar: { type: Boolean, require: false, default: false },
  hideAnchor: { type: Boolean, require: false, default: false },
  defaultExpandLevel: { type: Number, require: false, default: -1 }
})

const emits = defineEmits(['anchorClick', 'download', 'graphHeightUpdate'])

interface ToolbarIcon {
  id: 'scale-up' | 'scale-down' | 'fullscreen' | 'fullscreen-exit' | 'download'
  svg: string
}

const transformer = new Transformer([
  ...builtInPlugins,
  {
    name: 'target-blank',
    transform(transformHooks) {
      transformHooks.parser.tap(md => {
        md.renderer.rules.link_open = (tokens: Token[], idx: number) => {
          const token = tokens[idx]
          return `<a href="${token.attrGet('href')}">`
        }

        md.renderer.rules.link_close = () => {
          return '</a>'
        }

        md.renderer.rules.link_open = wrapFunction<[tokens: Token[], idx: number, options: Record<string, any>, env: any, self: Renderer], string>(
          md.renderer.rules.link_open,
          (render, tokens, idx, options: any, ...args) => {
            const anchorOpenTag = render(tokens, idx, { ...options, linkTarget: '_self' }, ...args)
            const anchorOpenTagWithData = anchorOpenTag.replace(`href="${tokens[idx].attrGet('href')}"`, `data-link="${tokens[idx].attrGet('href')}"`)
            return `${anchorOpenTagWithData.substring(0, anchorOpenTagWithData.length - 1)} class="slax_link" >`
          }
        )
      })

      return {}
    }
  }
])
const svg = ref<SVGSVGElement>()
const markmind = ref<Markmap | null>()
const container = ref<HTMLDivElement>()
const isFullscreen = ref(false)
const downloading = ref(false)
const toolbarIcons = computed<ToolbarIcon[]>(() => {
  const fullScreenAvailable = !!document.documentElement.requestFullscreen
  const icons: ToolbarIcon[] = [
    {
      id: 'scale-up',
      svg: '<svg width="100%" height="100%" viewBox="0 0 48 48" fill="none"><path d="M21 38C30.3888 38 38 30.3888 38 21C38 11.6112 30.3888 4 21 4C11.6112 4 4 11.6112 4 21C4 30.3888 11.6112 38 21 38Z" fill="none" stroke="#333" stroke-width="4" stroke-linejoin="round"/><path d="M21 15L21 27" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M15.0156 21.0156L27 21" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M33.2216 33.2217L41.7069 41.707" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    },
    {
      id: 'scale-down',
      svg: '<svg width="100%" height="100%" viewBox="0 0 48 48" fill="none"><path d="M21 38C30.3888 38 38 30.3888 38 21C38 11.6112 30.3888 4 21 4C11.6112 4 4 11.6112 4 21C4 30.3888 11.6112 38 21 38Z" fill="none" stroke="#333" stroke-width="4" stroke-linejoin="round"/><path d="M15 21L27 21" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M33.2216 33.2217L41.7069 41.707" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    }
  ]

  if (fullScreenAvailable) {
    icons.push(
      !isFullscreen.value
        ? {
            id: 'fullscreen',
            svg: '<svg width="100%" height="100%" viewBox="0 0 48 48" fill="none"><path d="M33 6H42V15" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M42 33V42H33" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 42H6V33" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 15V6H15" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
          }
        : {
            id: 'fullscreen-exit',
            svg: '<svg width="100%" height="100%" viewBox="0 0 48 48" fill="none"><path d="M33 6V15H42" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 6V15H6" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 42V33H6" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M33 42V33H41.8995" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
          }
    )
  }

  icons.push({
    id: 'download',
    svg: '<svg width="100%" height="100%" viewBox="0 0 48 48" fill="none"><path d="M6 24.0083V42H42V24" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M33 23L24 32L15 23" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M23.9917 6V32" stroke="#333" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  })

  return icons
})

function debounce<T extends (...args: any[]) => any>(func: T, wait: number = 300): (...args: Parameters<T>) => void {
  let canExecute = true
  let needExecute = false
  const handler = (...args: Parameters<T>) => {
    if (canExecute) {
      func(...args)
      canExecute = false
      needExecute = false

      setTimeout(() => {
        canExecute = true
        if (needExecute) {
          needExecute = false
          handler(...args)
        }
      }, wait)
    } else {
      needExecute = true
    }
  }

  return handler
}

watch(
  () => props.data,
  () => {
    debounceUpdate()
  }
)

onMounted(async () => {
  initSVG()
  await update()

  addListener()
  monitorKeyboard()
  updateGraphHeight()
})

onUnmounted(() => {
  removeListener()
  markmind.value?.destroy()
})

const addListener = () => {
  window.addEventListener('resize', resizeFit)
  document.onfullscreenchange = () => {
    isFullscreen.value = document.fullscreenElement === document.querySelector('.mark-mind-map')
  }
}

const removeListener = () => {
  window.removeEventListener('resize', resizeFit)
  document.onfullscreenchange = null
}

const resizeFit = () => {
  if (!markmind.value) {
    return
  }

  markmind.value.fit()
}

const initSVG = () => {
  const options: Partial<IMarkmapOptions> = {
    zoom: true,
    pan: true
  }

  if (props.defaultExpandLevel >= 0) {
    options.initialExpandLevel = props.defaultExpandLevel
  }

  markmind.value = svg.value ? Markmap.create(svg.value, options) : null
  markmind.value!.handlePan = (e: WheelEvent) => {
    console.log(e)
  }

  markmind.value!.handleZoom = (e: any) => {
    console.log(e)
  }

  markmind.value!.toggleNode = async (data: INode) => {
    let a = null
    data.payload = {
      ...data.payload,
      fold: (a = data.payload) != null && a.fold ? 0 : 1
    }

    markmind.value!.renderData(data)
    handleAnchors()
    await fitMap()
    updateGraphHeight()
    nextTick(() => {
      document.querySelector('.mark-mind-map')?.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' })
    })
  }
}

const updateGraphHeight = () => {
  const gHeight = document.querySelector('svg > g')?.getBoundingClientRect().height || 0
  emits('graphHeightUpdate', { height: gHeight })
}

const monitorKeyboard = () => {
  const isMac = /Mac/i.test(navigator.platform || navigator.userAgent)
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    console.log(e.key)
    if (['ArrowUp', 'ArrowDown'].indexOf(e.key) === -1) {
      return
    }

    const fire = (e.ctrlKey && !isMac) || ((e.ctrlKey || e.metaKey) && isMac)
    if (!fire) {
      return
    }

    if (e.key === 'ArrowUp') {
      markmind.value!.rescale(2)
    } else if (e.key === 'ArrowDown') {
      markmind.value!.rescale(0.5)
    }
  })
}

const debounceUpdate = debounce(() => {
  update()
}, 1000)

const update = async () => {
  if (!markmind.value) {
    return
  }

  const { root } = transformer.transform(props.data)
  markmind.value.setData(root, {
    style: () => `
      .mark-mind-map .markmap-foreign {
        font-family:
          PingFangSC,
          PingFang SC;
        font-weight: 400;
        font-size: 12px;
        color: #333333;
        line-height: 20px;
      }
      .mark-mind-map .markmap-foreign > div {
        display: flex;
        align-items: center;
      }
      .mark-mind-map .slax_link {
        margin-left: 6px;
        user-select: none;
        display: ${props.hideAnchor ? 'none' : 'inline-block'};
        cursor: pointer;
        text-decoration: none !important;
        vertical-align: middle;
        height: 16px;
        padding: 0 5px;
        font-family:
          PingFangSC,
          PingFang SC;
        font-weight: 500;
        font-size: 10px;
        line-height: 16px;
        background-color: rgba(22, 185, 152, 0.12) !important;
        border-radius: 3px;
        color: #333333 !important;
        transition:
          background-color 0.15s ease-in-out,
          color 0.15s ease-in-out;
      }

      .mark-mind-map .slax_link:hover {
        background-color: #475467 !important;
        color: #fff !important;
      }
    `
  })

  handleAnchors()
  await fitMap()
}

const toolbarClick = async (icon: ToolbarIcon) => {
  if (icon.id === 'scale-up') {
    await markmind.value!.rescale(1.5)
  } else if (icon.id === 'scale-down') {
    await markmind.value!.rescale(0.5)
  } else if (icon.id === 'fullscreen') {
    requestFullscreen()
  } else if (icon.id === 'fullscreen-exit') {
    cancelFullscreen()
  } else if (icon.id === 'download') {
    requestDownload()
  }
}

const handleAnchors = () => {
  Array.from(document.querySelectorAll('.mark-mind-map .mind-svg .slax_link')).forEach(dom => {
    const anchorDom = dom as HTMLAnchorElement
    if (anchorDom.onclick) {
      return
    }

    const link = anchorDom.dataset['link']
    anchorDom.onclick = () => {
      emits('anchorClick', link)
    }
  })
}

const requestFullscreen = () => {
  document.querySelector('.mark-mind-map')?.requestFullscreen()
}

const cancelFullscreen = () => {
  document.exitFullscreen()
}

const requestDownload = async () => {
  if (downloading.value === true) {
    return
  }

  downloading.value = true

  try {
    await fitMap()
    const dom = document.querySelector('.mark-mind-map') as HTMLElement

    const { data: imgUrl } = await dom2Img(dom, {
      width: 2000,
      height: AutoFitByRatio,
      bgcolor: '#fff'
    })

    const blob = base64toBlob(imgUrl)
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.download = `[思维导图]_${document.title}.png`
    link.click()
    window.URL.revokeObjectURL(link.href) // 释放内存
  } catch (error) {
    console.error(error)
  } finally {
    downloading.value = false
  }
}

const scaleUp = () => {
  markmind.value!.rescale(2)
}

const scaleDown = () => {
  markmind.value!.rescale(0.5)
}

const fitMap = async () => {
  await markmind.value!.fit()
}

defineExpose({
  scaleUp,
  scaleDown,
  fitMap
})
</script>

<style lang="scss" scoped>
.mark-mind-map {
  --style: relative w-full h-full;

  .mind-svg {
    --style: absolute w-full h-full top-0 left-0;
  }

  .mind-toolbar {
    --style: absolute select-none flex items-center bottom-1/10 left-1/2 -translate-x-1/2;

    .item {
      --style: 'cursor-pointer relative w-20px h-20px p-12pxtransition-transform duration-200 ease-in-out not-first:ml-5 hover:scale-110';
      .icon-bg {
        --style: absolute top-0 left-0 bg-#f5f5f3 filter-blur-10 w-full h-full;
      }

      svg {
        --style: 'absolute w-full h-full z-1 transform-colors duration-200 hover:text-emerald';
        div {
          --style: w-full h-full;
        }
      }
    }
  }
}
</style>
