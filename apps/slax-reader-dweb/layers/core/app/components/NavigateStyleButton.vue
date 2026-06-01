<template>
  <button class="navigate-style-button" @click="buttonClick" :class="{ clickable }">
    <div class="content">
      <span>
        {{ title }}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </span>
    </div>
    <Transition name="opacity">
      <div class="loading" v-show="loading">
        <div class="i-svg-spinners:90-ring text-h2" style="color: var(--slax-accent)"></div>
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
  --style: relative bg-surface-solid px-12px py-13px rounded-radius-sm border-(1px solid border) overflow-hidden;

  &.clickable {
    --style: 'transition-all duration-normal hover:(translateY--1px bg-accent-bg) active:(scale-110)';
  }

  .content {
    --style: flex-center;
    span {
      --style: text-body font-600;
      color: var(--slax-accent);
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    svg {
      flex-shrink: 0;
    }
  }

  .loading {
    --style: absolute inset-0 flex-center bg-surface-solid;
  }
}
</style>
