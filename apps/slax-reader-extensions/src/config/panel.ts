import aiImage from '~/assets/panel-item-ai.png'
import aiHighlightedImage from '~/assets/panel-item-ai-highlighted.png'
import aiSelectedImage from '~/assets/panel-item-ai-selected.png'
import aiSubImage from '~/assets/panel-item-ai-sub.png'
import chatbotImage from '~/assets/panel-item-chatbot.png'
import chatbotHighlightedImage from '~/assets/panel-item-chatbot-highlighted.png'
import chatbotSelectedImage from '~/assets/panel-item-chatbot-selected.png'
import chatbotSubImage from '~/assets/panel-item-chatbot-sub.png'
import commentsImage from '~/assets/panel-item-comments.png'
import commentsHighlightedImage from '~/assets/panel-item-comments-highlighted.png'
import commentsSelectedImage from '~/assets/panel-item-comments-selected.png'
import commentsSubImage from '~/assets/panel-item-comments-sub.png'

import archieveImage from '~/assets/panel-item-archieve.png'
import archieveSelectedImage from '~/assets/panel-item-archieve-selected.png'
import archieveHighlightedImage from '~/assets/panel-item-archieve-highlighted.png'
import starImage from '~/assets/panel-item-star.png'
import starSelectedImage from '~/assets/panel-item-star-selected.png'
import starHighlightedImage from '~/assets/panel-item-star-highlighted.png'

import feedbackImage from '~/assets/panel-item-feedback.png'
import shareImage from '~/assets/panel-item-share.png'
import shareHighlightedImage from '~/assets/panel-item-share-highlighted.png'

export enum PanelItemType {
  'AI' = 'ai',
  'Chat' = 'chat',
  'Share' = 'share',
  'Comments' = 'comments',
  'Archieve' = 'archieve',
  'Star' = 'star',
  'Feedback' = 'feedback'
}

export interface PanelItem {
  type: PanelItemType
  icon: string
  highlighedIcon: string
  selectedIcon?: string
  title?: string | ComputedRef<string>
  hovered: boolean
  selectedColor?: string
  isSelected?: () => boolean
  isLoading?: boolean
  finishHandler?: () => void
}

interface ImageInfo {
  main: string
  sub: string
  highlighted: string
  selected: string
}

export const Images: Record<'ai' | 'chatbot' | 'comments' | 'star' | 'archieve' | 'share' | 'feedback', ImageInfo> = {
  ai: {
    main: aiImage,
    sub: aiSubImage,
    highlighted: aiHighlightedImage,
    selected: aiSelectedImage
  },
  chatbot: {
    main: chatbotImage,
    sub: chatbotSubImage,
    highlighted: chatbotHighlightedImage,
    selected: chatbotSelectedImage
  },
  comments: {
    main: commentsImage,
    sub: commentsSubImage,
    highlighted: commentsHighlightedImage,
    selected: commentsSelectedImage
  },
  star: {
    main: starImage,
    sub: starImage,
    highlighted: starHighlightedImage,
    selected: starSelectedImage
  },
  archieve: {
    main: archieveImage,
    sub: archieveImage,
    highlighted: archieveHighlightedImage,
    selected: archieveSelectedImage
  },
  share: {
    main: shareImage,
    sub: shareImage,
    highlighted: shareHighlightedImage,
    selected: shareImage
  },
  feedback: {
    main: feedbackImage,
    sub: feedbackImage,
    highlighted: feedbackImage,
    selected: feedbackImage
  }
}
