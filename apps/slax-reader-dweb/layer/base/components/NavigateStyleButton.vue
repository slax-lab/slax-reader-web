<template>
  <button class="navigate-style-button" @click="buttonClick" :class="{ clickable }">
    <div class="content">
      <span> {{ title }} <img src="@images/button-tiny-arrow-right.png" alt="" /></span>
    </div>
    <Transition name="opacity">
      <div class="loading" v-show="loading">
        <div class="i-svg-spinners:90-ring text-24px color-#5490c2"></div>
      </div>
    </Transition>
  </button>
</template>

<script setup lang="ts">
const props = defineProps({
  title: {
    type: String,
    required: true
  },
  loading: {
    type: Boolean,
    required: false
  }
})

const emits = defineEmits(['action'])

const clickable = computed(() => {
  return !props.loading
})

const buttonClick = () => {
  if (props.loading) {
    return
  }

  emits('action')
}
</script>

<style lang="scss" scoped>
.navigate-style-button {
  --style: relative bg-#fcfcfc px-12px py-13px rounded-8px border-(1px solid #a8b1cd3d) overflow-hidden;

  &.clickable {
    --style: 'transition-all duration-250 hover:(scale-105 bg-#fafafa) active:(scale-110)';
  }

  .content {
    --style: flex-center;
    span {
      --style: text-(16px #5490c2) line-height-22px font-600;
    }

    img {
      --style: ml-8px w-16px h-16px;
    }
  }

  .loading {
    --style: absolute inset-0 flex-center bg-#fcfcfc;
  }
}
</style>
