// 快照详情页侧栏面板的单一来源：右侧 edge toolbar 按钮与 side panel tab 共用同一份
// 定义（id / 文案 / 图标），避免两处重复维护。
//
// 页面通过 `panels` prop 传入要启用的 id 子集来灵活裁剪（如非 owner 不显示 Chat）；
// 不传则默认全部启用，保持既有页面行为不变。后续若按权限 / 订阅 / 实验位再做调整，
// 只需改页面侧的 computed，组件与注册表无需变动。

export type SnapshotPanelId = 'ai' | 'chat' | 'comment'

export interface SnapshotPanelDef {
  id: SnapshotPanelId
  label: string
  icon: string
}

// 数组顺序即展示顺序。
export const SNAPSHOT_PANELS: SnapshotPanelDef[] = [
  {
    id: 'ai',
    label: 'AI 解析',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9.5 2l.5 4 4 .5-4 .5-.5 4-.5-4-4-.5 4-.5z"/><path d="M15 12l.5 3 3 .5-3 .5-.5 3-.5-3-3-.5 3-.5z"/></svg>`
  },
  {
    id: 'chat',
    label: 'Chat',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><circle cx="9" cy="9" r="1" fill="currentColor"/><circle cx="15" cy="9" r="1" fill="currentColor"/></svg>`
  },
  {
    id: 'comment',
    label: '评论',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>`
  }
]

// 按传入的 id 列表过滤并保持注册表顺序；未传（undefined）时返回全部。
export function resolveSnapshotPanels(ids?: SnapshotPanelId[]): SnapshotPanelDef[] {
  if (!ids) return SNAPSHOT_PANELS
  const allow = new Set(ids)
  return SNAPSHOT_PANELS.filter(panel => allow.has(panel.id))
}
