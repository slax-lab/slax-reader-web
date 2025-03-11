import UserOperateIcon from '~/components/UserOperateIcon.vue'

import { AsyncSubscribeButton } from '../isolation/Payment'

export const RightOperates = defineComponent({
  components: {
    UserOperateIcon
  },
  setup() {
    return () => (
      <>
        <AsyncSubscribeButton></AsyncSubscribeButton>
        <UserOperateIcon></UserOperateIcon>
      </>
    )
  }
})
