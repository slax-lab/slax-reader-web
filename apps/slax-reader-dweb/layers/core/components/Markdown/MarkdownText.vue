<template>
  <div class="markdown-text" ref="markdownTextContainer">
    <div class="markdown-content" v-html="markdownHTMLText"></div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'

import { parseMarkdownText } from '@commons/utils/parse'

import 'highlight.js/styles/atom-one-dark.css'

const props = defineProps<{ text: string }>()
const emits = defineEmits(['anchorClick'])

const markdownTextContainer = ref<HTMLDivElement>()
const markdownHTMLText = ref('')

watch(
  () => props.text,
  () => {
    update()
  }
)

const parseHTML = (html: string) => {
  const reg = new RegExp(/\<a rel\=\"noopener\" href\=\"(anchor_.+?)\"\>(.+?)\<\/a\>/g)
  let matches: RegExpExecArray | null = null

  const result: { text: string; href: string }[] = []
  while ((matches = reg.exec(html)) !== null) {
    result.push({
      href: matches[1],
      text: matches[0]
    })
  }

  result.forEach(item => {
    html = html.replaceAll(item.text, item.text.replace(`href="${item.href}"`, `class="slax_link" data-link="${item.href}"`))
  })

  return html
}

const update = () => {
  const rawHTML = parseMarkdownText(props.text)
  const parsedHTML = parseHTML(rawHTML)

  markdownHTMLText.value = parsedHTML
  nextTick(() => {
    handleAnchors()
  })
}

update()

const handleAnchors = () => {
  Array.from(markdownTextContainer.value!.querySelectorAll('.markdown-content .slax_link')).forEach(dom => {
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
</script>

<style lang="scss" scoped>
.markdown-text {
  .markdown-content {
    --style: flex flex-col;
    &::v-deep(*) {
      --style: m-0 text-#0f1419;
    }

    &::v-deep(h1) {
      --style: font-bold text-(20px #0f1419) line-height-28px 'not-first:mt-32px';
    }

    &::v-deep(h2) {
      --style: font-bold text-(16px #0f1419) line-height-22px mt-32px;
    }

    &::v-deep(h3),
    &::v-deep(h4),
    &::v-deep(h5) {
      --style: font-bold text-(12px #0f1419) mt-20px;
    }

    // 非标题类内容，在前面有内容时才增加间距
    &::v-deep(* + ul),
    &::v-deep(* + ol),
    &::v-deep(li > ul),
    &::v-deep(li > ol) {
      --style: mt-16px;
    }

    &::v-deep(ul) {
      --style: pl-0 flex flex-col list-none;
      li {
        --style: relative pl-20px box-border font-normal text-(14px #333333) line-height-20px;

        &::marker {
          --style: content-none hidden text-#a8b1cd;
        }

        & li {
          &::marker {
            --style: content-none hidden text-#a8b1cd;
          }
          &:before {
            --style: box-border top-8px left-4px w-4px h-4px border border-#a8b1cd border-solid bg-#fff;
          }
        }

        &:not(:first-child) {
          --style: 'not-first:mt-14px';
        }

        &:before {
          --style: absolute top-8px left-4px w-4px h-4px bg-#a8b1cd content-empty rounded;
        }
      }
    }

    &::v-deep(a) {
      --style: -top-1px relative text-#5080a8;
    }

    &::v-deep(a:not(.slax_link)) {
      color: #5080a8;
    }

    &::v-deep(.slax_link) {
      margin-left: 0px;
      user-select: none;
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
      background-color: rgba(22, 185, 152, 0.12);
      border-radius: 3px;
      color: #333333;
      transition:
        background-color 0.15s ease-in-out,
        color 0.15s ease-in-out;
    }

    &::v-deep(.slax_link:hover) {
      background-color: #475467;
      color: #fff !important;
    }
  }
}
</style>
