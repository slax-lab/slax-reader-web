<template>
  <div class="bookmark-article" ref="bookmarkArticle" :class="{ articleStyle }">
    <div class="title">
      <span class="text">{{ title }}</span>
    </div>
    <div class="desc">
      <button
        v-if="allowStarred"
        class="star bg-[length:13.5px_13.5px] bg-[url('~/assets/images/tiny-star-disable.png')] bg-center"
        :class="{ enabled: isStarred }"
        @click="e => starBookmark(e, !isStarred)"
      ></button>
      <span class="text" v-if="detail.byline">{{ detail.byline }}</span>
      <span class="text">{{ dateString }}</span>
      <i class="seperator"></i>
      <button @click="websiteClick">{{ `${urlString}` }}</button>
    </div>
    <div class="tags">
      <BookmarkTags :bookmarkId="bookmarkId || 0" :tags="detail.tags" :readonly="!allowTagged" />
    </div>
    <div class="article-detail" ref="articleDetail" :class="{ [articleStyle]: true }">
      <div class="html-text" v-html="articleHTML"></div>
    </div>
    <div class="end">
      <div class="line"></div>
      <span class="ml-2">{{ $t('page.bookmarks_detail.no_more') }}</span>
      <div class="line"></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import BookmarkTags from '~/components/BookmarkTags.vue'

import { urlHttpString } from '@commons/utils/string'

import 'katex/dist/katex.css'
import { PhotoSwiperDotsElement, registerComponents, TweetFooterInfoElement, TweetUserInfoElement, UnsupportedVideoElement, WechatVideoInfoElement } from './CEComponents'
import { ArticleSelection } from './Selection/selection'
import { RESTMethodPath } from '@commons/types/const'
import { type MarkDetail, MarkType } from '@commons/types/interface'
import { formatDate } from '@vueuse/core'
import type { QuoteData } from '~/components/Chat/type'
import CursorToast from '~/components/CursorToast'
import Preview from '~/components/ImagePreview'
import Toast, { ToastType } from '~/components/Toast'
import type { BookmarkArticleDetail } from '~/composables/bookmark/type'
import { useArticleDetail } from '~/composables/bookmark/useArticle'

enum ArticleStyle {
  Default = 'default',
  Twitter = 'twitter',
  PhotoSwipeTopic = 'photo-swipe-topic'
}

const route = useRoute()
const props = defineProps({
  detail: {
    type: Object as PropType<BookmarkArticleDetail>,
    required: true
  },
  marks: {
    type: Object as PropType<MarkDetail>,
    required: false
  }
})

const emits = defineEmits(['screenLockUpdate', 'bookmarkUpdate', 'chatBotQuote'])

const { t } = useI18n()
const { detail } = toRefs(props)
const bookmarkArticle = ref<HTMLDivElement>()
const articleDetail = ref<HTMLDivElement>()
const isHandledHTML = ref(false)
const extraListeners: (() => void)[] = []

const { bookmarkId, shareCode, title, isStarred, allowStarred, allowAction, allowTagged, bookmarkUserId, updateStarred } = useArticleDetail(detail)
const articleStyle = computed(() => {
  const content = props.detail.content || ''
  if (content.indexOf('<slax-photo-swipe-topic>') === 0) {
    return ArticleStyle.PhotoSwipeTopic
  } else if (content.indexOf('<div class=\"tweet\">') === 0) {
    return ArticleStyle.Twitter
  }

  return ArticleStyle.Default
})

let articleSelection: ArticleSelection | null = null

watch(
  () => props.marks,
  value => {
    if (value && isHandledHTML.value) {
      handleDrawMark()
    }
  }
)

const dateString = computed(() => {
  const date = detail.value.published_at ?? detail.value.created_at ?? ''
  if (!date || date.length === 0) {
    return '--'
  }

  return formatDate(new Date(date), 'YYYY-MM-DD')
})

const urlString = computed(() => {
  return urlHttpString(detail.value.target_url)
})

const articleHTML = computed(() => {
  return detail.value.content?.replace(/<img/g, '<img loading="lazy"') || ''
})

onMounted(() => {
  registerComponents()

  nextTick(() => {
    handleHTML().then(() => {
      handleDrawMark()
    })
  })
})

onUnmounted(() => {
  try {
    articleSelection?.closeMonitor()
    extraListeners.forEach(listener => listener())
  } finally {
  }
})

const jumpToHighLight = () => {
  const highlightId = parseInt(route.query.highlight as string)
  if (!highlightId || isNaN(highlightId)) return

  const marks = detail.value.marks || props.marks || []
  let mark = marks.mark_list?.find(item => item.id === highlightId)
  if (!mark) return

  if (mark.type === MarkType.REPLY) {
    const rootId = mark.root_id
    mark = marks.mark_list?.find(item => item.id === rootId)
    if (!mark) return
  }

  for (const source of mark.source) {
    if (source.type === 'image') {
      const paths = source.path.split('>')
      const tailIdx = paths.length - 1
      const newPath = [...paths.slice(0, tailIdx), ' slax-mark ', paths[tailIdx]]
      source.path = newPath.join('>')
    }

    const element = document.querySelector(source.path)
    if (element) {
      element.scrollIntoView({ behavior: 'auto', block: 'center' })
      setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 500)

      break
    }
  }

  // 去掉URL中的Query
  navigateTo({ path: route.path, query: {} })
}

const handleHTML = async () => {
  const articleDetailDom = articleDetail.value
  if (!articleDetailDom) {
    return
  }

  const [imgs, svgs, uls, anchors, videos, iframes, wechatVideos, details] = await Promise.allSettled(
    ['img', 'svg', 'ul', 'a', 'video', 'iframe', 'mp-common-videosnap', 'details'].map(tag => {
      return Array.from(articleDetailDom.querySelectorAll(tag)) || []
    })
  )

  await Promise.allSettled([
    imgs.status === 'fulfilled' && handleHTMLImgs(imgs.value as HTMLImageElement[]),
    svgs.status === 'fulfilled' && handleHTMLSvgs(svgs.value as SVGSVGElement[]),
    uls.status === 'fulfilled' && handleHTMLUls(uls.value as HTMLUListElement[]),
    anchors.status === 'fulfilled' && handleHTMLAnchors(anchors.value as HTMLAnchorElement[]),
    videos.status === 'fulfilled' && handleHTMLVideos(videos.value as HTMLVideoElement[]),
    iframes.status === 'fulfilled' && handleHTMLIFrames(iframes.value as HTMLIFrameElement[]),
    wechatVideos.status === 'fulfilled' && handleHTMLWechatVideos(wechatVideos.value as HTMLElement[]),
    details.status === 'fulfilled' && handleHTMLDetails(details.value as HTMLDetailsElement[])
  ])

  const handlers: Promise<void>[] = []
  if (articleStyle.value === ArticleStyle.PhotoSwipeTopic) {
    handlers.push(handlePhotoSwipeTopicStyle())
  } else if (articleStyle.value === ArticleStyle.Twitter) {
    handlers.push(handleTweetComponents())
  }

  await Promise.allSettled(handlers)

  isHandledHTML.value = true
}

const handleHTMLImgs = (imgs: HTMLImageElement[]) => {
  const loadingKey = 'slax-image-loading'

  imgs.forEach(img => {
    // const isWrapperByAnchor = (img: HTMLImageElement) => {
    //   let parent = img.parentElement
    //   while (parent) {
    //     if (parent.tagName.toLowerCase() === 'a') {
    //       return true
    //     }

    //     parent = parent.parentElement
    //   }

    //   return false
    // }
    img.srcset = ''
    img.onload = e => {
      img.classList.remove(loadingKey)

      if (articleStyle.value === ArticleStyle.PhotoSwipeTopic) {
      } else {
        if (img.naturalWidth < 5 || img.naturalHeight < 5) {
          img.setAttribute('style', 'display: none;')
          return
        } else if (img.naturalWidth < 200) {
          img.setAttribute('style', `width: ${img.naturalWidth}px !important;`)
          return
        }
      }

      img.onclick = () => {
        const rect = img.getBoundingClientRect()
        const frame = {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          imgWidth: img.naturalWidth,
          imgHeight: img.naturalHeight
        }

        emits('screenLockUpdate', true)
        Preview.showImagePreview({
          url: img.currentSrc || img.src,
          frame,
          dismissHandler: () => {
            emits('screenLockUpdate', false)
          }
        })

        return false
      }
    }

    img.referrerPolicy = ''

    img.onerror = e => {
      img.classList.remove(loadingKey)
      img.style.display = 'none'
    }

    img.classList.add(loadingKey)
  })
}

const handleHTMLSvgs = (svgs: SVGSVGElement[]) => {
  svgs.forEach(svg => {
    const paths = Array.from(svg.getElementsByTagName('path')) || []
    if (paths.length < 10) {
      svg.setAttribute('style', 'display: none;')
      return
    }

    const viewBox = svg.viewBox
    if (!viewBox) {
      return
    }

    const { width, height } = viewBox.baseVal
    if (width < 5 || height < 5) {
      svg.setAttribute('style', 'display: none;')
    } else {
      svg.setAttribute('style', `width: ${width}px !important; height: ${height}px !important;`)
    }
  })
}

const handleHTMLUls = (uls: HTMLUListElement[]) => {
  uls.forEach(ul => {
    if (ul.querySelector('li')) {
      ul.classList.add('has-li')
    }
  })
}

const handleHTMLAnchors = (anchors: HTMLAnchorElement[]) => {
  const url = new URL(detail.value.target_url)
  if (!url) {
    return
  }

  anchors.forEach(anchor => {
    const href = anchor.getAttribute('href')
    if (!href) {
      return
    }

    if (href.indexOf('#') === 0) {
      anchor.target = ''
    } else {
      const regex = /^\/.*/
      if (regex.test(href)) {
        anchor.href = `${url.origin}${href}`
      } else if (href.indexOf('http') === -1 && href.indexOf('https') === -1) {
        anchor.href = `${url.origin}${anchor.pathname}`
      }

      anchor.target = '_blank'
    }
  })
}

const handleHTMLWechatVideos = (videos: HTMLElement[]) => {
  videos.forEach(video => {
    const data = {
      url: video.getAttribute('data-url'),
      headimgurl: video.getAttribute('data-headimgurl'),
      nickname: video.getAttribute('data-nickname'),
      desc: video.getAttribute('data-desc')
    }

    video.parentNode?.replaceChild(new WechatVideoInfoElement({ data }), video)
  })
}
const handleHTMLVideos = (videos: HTMLVideoElement[]) => {
  const removeVideo = (video: HTMLVideoElement) => {
    const poster = video.getAttribute('poster')
    const unsupportVideo = new UnsupportedVideoElement({
      poster
    })

    unsupportVideo.addEventListener('posterClick', () => {
      websiteClick()
    })

    video.parentElement?.replaceChild(unsupportVideo, video)
  }

  videos.forEach(video => {
    // 监听错误事件
    removeVideo(video)
  })
}

const handleHTMLIFrames = (iframes: HTMLIFrameElement[]) => {
  iframes.forEach(iframe => {
    if (iframe.width && Number(iframe.width) > 100) {
      iframe.width = '100%'
    }
  })
}

const handleHTMLDetails = (details: HTMLDetailsElement[]) => {
  details.forEach(detail => {
    const summary = detail.querySelector('summary')
    if (summary) {
      detail.open = true
    }
  })
}

const handlePhotoSwipeTopicStyle = async () => {
  const swiper = document.querySelector('slax-photo-swipe-topic > .topic-container .swiper')
  if (!swiper) {
    return
  }

  const count = swiper.childElementCount

  const dotsEle = new PhotoSwiperDotsElement({
    count,
    selectIndex: 0
  })

  const indexSelectedHandler = (event: Event) => {
    const customEvent = event as CustomEvent<number[]>
    const args = customEvent.detail
    console.log(args)

    if (!args || args.length === 0) {
      return
    }

    dotsEle.selectIndex = args[0]
    swiper.scrollTo({
      left: args[0] * swiper.clientWidth,
      behavior: 'smooth'
    })
  }

  dotsEle.addEventListener('indexSelected', indexSelectedHandler)
  swiper.parentElement?.appendChild(dotsEle)

  const debouncedScrollFn = useDebounceFn(
    () => {
      const index = Math.round(swiper.scrollLeft / swiper.clientWidth)
      dotsEle.selectIndex = index
    },
    50,
    { maxWait: 5000 }
  )

  swiper.addEventListener('scroll', debouncedScrollFn)

  extraListeners.push(() => {
    dotsEle.removeEventListener('indexSelected', indexSelectedHandler)
    swiper.removeEventListener('scroll', debouncedScrollFn)
  })
}

const handleTweetComponents = async () => {
  const tweetHeader = document.querySelector('tweet-header')
  if (tweetHeader && tweetHeader instanceof HTMLElement) {
    const tweetHeaderElement = new TweetUserInfoElement({
      href: tweetHeader.dataset['href'],
      avatar: tweetHeader.dataset['avatar'],
      name: tweetHeader.dataset['name'],
      description: tweetHeader.dataset['description'],
      screenName: tweetHeader.dataset['screenName'],
      location: tweetHeader.dataset['location'],
      website: tweetHeader.dataset['website'],
      createdAt: tweetHeader.dataset['createdAt'],
      followers: parseInt(tweetHeader.dataset['followers'] || '0'),
      followings: parseInt(tweetHeader.dataset['followings'] || '0')
    })

    tweetHeader.parentElement?.replaceChild(tweetHeaderElement, tweetHeader)
  }

  const tweetFooter = document.querySelector('tweet-footer')
  if (tweetFooter && tweetFooter instanceof HTMLElement) {
    const tweetFooterElement = new TweetFooterInfoElement({
      replyCount: parseInt(tweetFooter.dataset['replyCount'] || '0'),
      retweetCount: parseInt(tweetFooter.dataset['retweetCount'] || '0'),
      favoriteCount: parseInt(tweetFooter.dataset['favoriteCount'] || '0')
    })

    tweetFooter.parentElement?.replaceChild(tweetFooterElement, tweetFooter)
  }
}

const handleDrawMark = async () => {
  if (!articleSelection && bookmarkArticle.value && articleDetail.value) {
    articleSelection = new ArticleSelection({
      shareCode: shareCode || '',
      bookmarkId: bookmarkId || 0,
      allowAction: allowAction.value,
      ownerUserId: bookmarkUserId.value,
      containerDom: bookmarkArticle.value,
      monitorDom: articleDetail.value,
      postQuoteDataHandler: (data: QuoteData) => {
        emits('chatBotQuote', data)
      }
    })
  }

  if (!articleSelection) {
    return
  }

  const promise = []
  if ('marks' in detail.value) {
    promise.push(articleSelection?.drawMark(detail.value.marks))
  } else if (props.marks) {
    promise.push(articleSelection?.drawMark(props.marks))
  }

  if (promise.length > 0 && !articleSelection.isMonitoring) {
    articleSelection?.startMonitor()
  }

  await Promise.all(promise).then(() => {
    jumpToHighLight()
  })
}

const websiteClick = () => {
  window.open(`${urlString.value}`)
}

const starBookmark = async (event: MouseEvent, isStar: boolean) => {
  if (!bookmarkId || !updateStarred) {
    return
  }

  try {
    await updateStarred(isStar)

    postChannelMessage('star', { id: bookmarkId, cancel: !isStar })

    CursorToast.showToast({
      text: t(!isStar ? 'common.tips.unstar_success' : 'common.tips.star_success'),
      trackDom: event.target as HTMLElement
    })

    emits('bookmarkUpdate', detail.value)
  } catch (e) {
    console.log(e)
    Toast.showToast({
      text: t('common.tips.operate_failed'),
      type: ToastType.Error
    })
  }
}

const findQuote = (quote: QuoteData) => {
  articleSelection?.findQuote(quote)
}

defineExpose({
  findQuote
})
</script>

<style lang="scss" scoped>
.bookmark-article {
  --style: relative -mb-10px;

  .title {
    --style: text-(24px #0f1419) font-semibold line-height-36px line-clamp-2;
  }

  .desc {
    --style: flex items-center mt-16px;

    .star {
      --style: shrink-0 -mt-1px w-16px h-16px;

      &.enabled {
        background-image: url('~/assets/images/tiny-star-enable.png');
      }
    }
    .text {
      --style: 'text-(14px #999999 ellipsis) line-height-20px not-first:ml-10px shrink-0 overflow-hidden max-w-200px whitespace-nowrap';
    }

    .seperator {
      --style: 'mx-8px w-1px h-10px bg-#d6d6d6 flex-shrink-0';
    }

    button {
      --style: 'text-(14px #999999 ellipsis) line-height-20px hover:(underline underline-#999999) shrink-1 overflow-hidden whitespace-nowrap';
    }
  }

  .tags {
    --style: mt-16px;
  }

  .article-detail {
    *::selection {
      --style: 'bg-#ffd99933';
    }

    &::v-deep(slax-mark) {
      --style: color-inherit relative transition-colors duration-250;

      &.comment {
        --style: 'cursor-pointer';
        border-bottom: 1.5px dashed #f6af69 !important;
      }

      &.stroke {
        --style: 'cursor-pointer';
        border-bottom: 1.5px dashed #f6af69 !important;
      }

      &.self-stroke {
        border-bottom: 1.5px solid #f6af69 !important;
      }

      &.highlighted {
        --style: 'bg-#FCF4E8';
      }

      &:has(img) {
        --style: p-0px relative inline-block;
        &.comment {
          border: 2px dashed #f6af69 !important;
        }

        &.stroke {
          border: 2px solid #f6af69 !important;
        }

        &::after {
          content: '···';
          --style: absolute h-25px w-25px px-0px rounded-full bg-#f6af69ee -right-5px -top-5px line-height-25px text-(#fff 15px align-center) transition-transform duration-250;
        }

        slax-mark {
          --style: '!p-0';
          &::after {
            --style: content-none;
          }
        }
      }

      slax-mark {
        --style: '!border-none ';
      }
    }
  }

  .end {
    --style: text-(12px #999999) select-none py-60px flex-center;
    .line {
      --style: w-36px h-1px bg-#a8b1cd3d;
    }

    span {
      --style: mx-12px;
    }
  }
}
</style>

<!-- eslint-disable-next-line vue-scoped-css/enforce-style-type -->
<style lang="scss">
@use '@/styles/article/index.scss' as article;
@use 'github-syntax-light/lib/github-light.css' as *;

/* 该类下所有样式都是使用入侵的形式去调整，设置时可以根据下方注释的分类来进行对应设置 */

@mixin style($type) {
  @if $type == 'default' {
    @include article.article;
  } @else if $type == 'twitter' {
    @include article.twitter;
  } @else if $type == 'photo-swipe-topic' {
    @include article.photo-swipe-topic;
  } @else {
    @include article.article;
  }
}

.article-detail {
  --style: mt-24px;
  @include article.reset;

  &.default {
    @include style('default');
  }

  &.twitter {
    @include style('twitter');
  }

  &.photo-swipe-topic {
    @include style('photo-swipe-topic');
  }
}
</style>
