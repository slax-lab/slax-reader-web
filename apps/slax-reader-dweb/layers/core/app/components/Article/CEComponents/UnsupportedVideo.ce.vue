<template>
  <div class="video-poster-container" @click="posterClick">
    <template v-if="poster">
      <img :src="poster" alt="" />
      <button>
        <i></i>
      </button>
    </template>
    <template v-else>
      <span>
        {{ t('component.bookmark_article.video_not_support_tips') }}
      </span>
    </template>
  </div>
</template>

<script lang="ts" setup>
const t = (text: string) => {
  return useNuxtApp().$i18n.t(text)
}

defineProps({
  poster: {
    type: String,
    required: false
  }
})

const emits = defineEmits(['posterClick'])

const posterClick = () => {
  emits('posterClick')
}
</script>

<style lang="scss" scoped>
.video-poster-container {
  position: relative;
  cursor: pointer;
  display: inline-block;
  overflow: hidden;

  span {
    --style: text-#5490C2 underline-none border-none decoration-none cursor-pointer select-none;
  }

  img {
    max-width: 100%;
    display: block;
    object-fit: contain;
  }

  button {
    cursor: pointer;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 60px;
    height: 60px;
    background: rgba(0, 0, 0, 0.6);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 0;

    i {
      width: 0;
      height: 0;
      border-style: solid;
      border-width: 12px 0 12px 20px;
      border-color: transparent transparent transparent #ffffff;
      margin-left: 5px;
    }
  }
}
</style>
