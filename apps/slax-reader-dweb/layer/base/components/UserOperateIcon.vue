<template>
  <div class="user-operate-icon" ref="userOperateIcon">
    <div class="user-icon">
      <img v-if="!userStore.userInfo" src="@images/user-default-avatar.png" alt="" />
      <img v-else :src="userStore.userInfo.picture" alt="" />
    </div>
    <Transition name="operates">
      <div class="user-operates-container" v-show="isHovered">
        <div class="user-operates">
          <div class="operate" @click="infoClick">
            <img src="@images/user-operate-info.png" alt="" />
            <span>{{ $t('component.user_operate_icon.personal_info') }}</span>
          </div>
          <div class="operate" @click="logoutClick">
            <img src="@images/user-operate-logout.png" alt="" />
            <span>{{ $t('component.user_operate_icon.logout') }}</span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
const userOperateIcon = ref<HTMLDivElement>()
const isHovered = useElementHover(userOperateIcon)

const userStore = useUserStore()
const auth = useAuth()

const infoClick = () => {
  navigateTo('/user')
}

onDeactivated(() => {
  isHovered.value = false
})

const logoutClick = () => {
  auth.clearAuth()
  navigateTo('/login', {
    replace: true
  })
}
</script>

<style lang="scss" scoped>
.user-operate-icon {
  --style: relative;

  .user-icon {
    --style: 'rounded-full border-(1px #ffffff solid) w-24px h-24px relative overflow-hidden cursor-pointer transition-transform duration-250 hover:scale-102 active:scale-105';
    img {
      --style: absolute w-full h-full top-0 left-0 object-contain;
    }
  }

  .user-operates-container {
    --style: absolute top-full right-0 pt-10px z-10;
    .user-operates {
      --style: w-136px h-104px px-10px bg-#fff rounded-8px border-(1px #3333330d solid) flex flex-col justify-center cursor-pointer overflow-hidden;
      box-shadow: 0px 20px 60px 0px #0000001a;

      .operate {
        --style: 'flex justify-start items-center px-10px py-11px rounded-8px transition-bg ease-in-out duration-300 hover:(bg-#3333330a)';

        img {
          --style: w-16px h-16px object-contain;
        }

        span {
          --style: ml-16px text-(13px #333) line-height-18px font-500;
        }
      }
    }
  }
}

.operates-leave-to,
.operates-enter-from {
  --style: 'opacity-0 !h-0';
}

.operates-enter-active,
.operates-leave-active {
  --style: transition-all duration-250 ease-in-out;
}
</style>
