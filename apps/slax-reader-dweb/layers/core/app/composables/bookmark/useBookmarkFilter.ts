// 书签列表筛选状态 + 路由读取 + 纯导航 helper
// 职责边界（重构决策1/4）：只持有 filter 状态 ref 和「无副作用的纯导航」helper
//   （仅改 ref + navigateTo），不碰列表数据、不碰页面级 scrollY。
//   编排动作（selectTopic/selectCollection/selectTab：组合 reset/load + scrollY）留在页面层，
//   以此避免与 useBookmarkData 形成构造期循环依赖。
import { computed, ref } from 'vue'

export const useBookmarkFilter = () => {
  const route = useRoute()

  const filterStatus = ref(`${route.query.filter || 'inbox'}`)
  const filterTopicId = ref(Number(route.query.topic_id || ''))
  const filterTopicName = ref(`${route.query.topic_name || ''}`)
  const filterCollectionId = ref(Number(route.query.c_id || ''))
  const filterCollectionCode = ref<string>(String(route.query.c_code || ''))
  const filterCollectionName = ref<string>(String(route.query.c_name || ''))

  const isInTrash = computed(() => filterStatus.value === 'trashed')
  const isCurrentInboxTab = computed(() => filterStatus.value === 'inbox' || !filterStatus.value)

  // 纯导航：选择话题。改 topic ref + navigateTo（replace:true），不触发列表加载
  const applyTopic = async (info: { id: number; name: string } | null) => {
    const topicParams: Record<string, number | string> = {}
    if (info) {
      info.id && (topicParams.topic_id = info.id)
    }

    filterTopicId.value = info?.id || 0
    filterTopicName.value = info?.name || ''

    const paramsStr = Object.keys(topicParams)
      .map(key => `${key}=${topicParams[key]}`)
      .join('&')

    await navigateTo(`/bookmarks?filter=topics${paramsStr.length > 0 ? '&' + paramsStr : ''}`, {
      replace: true
    })
  }

  // 纯导航：选择合集。改 collection ref + navigateTo（replace:true）
  const applyCollection = async (info: { id: number; name: string; code: string } | null) => {
    const collectParams: Record<string, number | string> = {}
    if (info) {
      info.id && (collectParams.c_id = info.id)
      info.name && (collectParams.c_name = info.name)
      info.code && (collectParams.c_code = info.code)
    }

    filterCollectionId.value = info?.id || 0
    filterCollectionCode.value = info?.code || ''
    filterCollectionName.value = info?.name || ''

    const paramsStr = Object.keys(collectParams)
      .map(key => `${key}=${collectParams[key]}`)
      .join('&')

    await navigateTo(`/bookmarks?filter=collections${paramsStr.length > 0 ? '&' + paramsStr : ''}`, {
      replace: true
    })
  }

  // 纯导航：切换 tab。改 filterStatus + 清零 topic/collection id + navigateTo
  //   （notifications 用 replace:false 以支持浏览器返回，其余 replace:true）
  //   改 filterStatus 后由页面 watch(filterStatus) 触发重载，故此处不调 onLoadMore
  const applyTab = async (type: string) => {
    filterStatus.value = type
    filterCollectionId.value = 0
    filterTopicId.value = 0

    await navigateTo(`/bookmarks?filter=${type}`, {
      replace: type !== 'notifications'
    })
  }

  return {
    filterStatus,
    filterTopicId,
    filterTopicName,
    filterCollectionId,
    filterCollectionCode,
    filterCollectionName,
    isInTrash,
    isCurrentInboxTab,
    applyTopic,
    applyCollection,
    applyTab
  }
}
