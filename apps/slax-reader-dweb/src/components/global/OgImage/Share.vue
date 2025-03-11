<template>
  <div class="h-full w-full flex items-start justify-start bg-gray-50 px-15 py-20">
    <div class="h-full w-full flex items-start justify-start">
      <div class="h-full w-full flex flex-col justify-between">
        <div class="flex flex-row items-center text-left text-[70px] font-black">
          <img class="h-200px" src="~/assets/images/logo.png" />
          <span class="line-clamp-3 ml-15 overflow-hidden text-ellipsis"> {{ title }} </span>
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

<!-- og image 的服务端渲染暂不支持 unocss directive，因此直接在标签赋值tailwind类属性即可  -->
