<template>
  <div class="h-full w-full flex items-start justify-start px-15 py-20" style="background: linear-gradient(45deg, #fff 0%, #16b998 100%)">
    <div class="h-full w-full flex items-start justify-start">
      <div class="h-full w-full flex flex-col justify-between">
        <div class="flex flex-row items-center text-left text-[70px] font-black">
          <!-- <img class="h-200px mr-15" src="@images/logo.png" /> -->
          <span class="line-clamp-3 overflow-hidden text-ellipsis"> {{ title }} </span>
        </div>
        <p class="mb-0 text-4xl text-#16B998 font-bold">r.slax.com</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
  }>(),
  {
    title: 'title'
  }
)
</script>
