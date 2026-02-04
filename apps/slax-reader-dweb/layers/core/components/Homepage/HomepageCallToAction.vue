<template>
  <section class="cta-section">
    <div class="container">
      <div class="section-header">
        <h2>Start Your Intelligent Reading Journey Today</h2>
        <p>Read smarter, learn faster, remember more</p>
      </div>
      <a @click="emit('getStarted')" class="btn-free">
        <span>Get Started - It's Free</span>
        <img src="@images/arrow-right-black.png" alt="" />
      </a>
    </div>
  </section>
</template>

<script lang="ts" setup>
const emit = defineEmits<{
  getStarted: []
}>()
</script>

<style lang="scss" scoped>
* {
  font-family: -apple-system, 'system-ui', 'Segoe UI', Roboto, sans-serif !important;
}

.container {
  --style: max-w-1200px mx-auto px-20px;
}

.cta-section {
  --style: pt-68px pb-80px;
  background: linear-gradient(180deg, #2eb396 0%, #5edda8 100%);
  .section-header {
    --style: text-center mb-48px;
    h2 {
      --style: text-40px text-[#fff] font-bold mb-24px;
    }
    p {
      --style: text-18px text-[#fff] font-400;
    }
  }
  .btn-free {
    --style: 'm-auto w-fit flex gap-12px items-center h-60px px-32px rounded-10px justify-center text-#1F1F1F text-20px font-600 bg-white relative overflow-hidden transition-all duration-300 no-underline select-none';

    &::before {
      --style: 'content-empty absolute top-50% left-50% w-0 h-0 rounded-full -translate-x-1/2 -translate-y-1/2';
      background: #16b99820;
      transition:
        width 0.6s,
        height 0.6s;
    }

    &:hover {
      --style: '-translate-y-2px shadow-[0_8px_24px_rgba(0,0,0,0.2)]';

      &::before {
        --style: w-300px h-300px;
      }
    }

    &:active {
      --style: translate-y-0;
    }

    img {
      --style: w-16px relative z-1;
    }

    span {
      --style: relative z-1;
    }
  }
}
</style>
