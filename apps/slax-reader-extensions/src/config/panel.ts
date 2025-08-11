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
}
