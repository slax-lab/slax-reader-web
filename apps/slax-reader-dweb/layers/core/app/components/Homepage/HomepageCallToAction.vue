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
    --style: 'm-auto w-fit flex gap-12px items-center h-60px px-32px rounded-10px justify-center text-#1F1F1F text-20px font-600 bg-white relative overflow-hidden no-underline select-none';
    will-change: transform, box-shadow;
    transition:
      transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
      box-shadow 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);

    &::before {
      --style: 'content-empty absolute top-50% left-50% w-0 h-0 rounded-full -translate-x-1/2 -translate-y-1/2';
      background: radial-gradient(circle, #16b99830 0%, #16b99810 100%);
      transform: translate(-50%, -50%) scale(0);
      transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }

    &:hover {
      --style: '-translate-y-3px shadow-[0_12px_32px_rgba(0,0,0,0.25)]';
      transform: translateY(-3px) scale(1.02);

      &::before {
        transform: translate(-50%, -50%) scale(2.5);
        width: 300px;
        height: 300px;
      }
    }

    &:active {
      --style: 'translate-y-1px shadow-[0_4px_12px_rgba(0,0,0,0.15)]';
      transform: translateY(1px) scale(0.98);
      transition:
        transform 0.1s cubic-bezier(0.4, 0, 0.2, 1),
        box-shadow 0.1s cubic-bezier(0.4, 0, 0.2, 1);
    }

    img {
      --style: w-16px relative z-1;
      transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    span {
      --style: relative z-1;
    }

    &:hover img {
      transform: translateX(3px);
    }
  }
}
</style>
