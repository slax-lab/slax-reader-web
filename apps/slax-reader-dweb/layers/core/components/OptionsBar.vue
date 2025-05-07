<template>
  <div class="options-bar">
    <div class="bar-container" @click="showOptions = !showOptions">
      <span class="title">{{ options[selectedIndex] }}</span>
      <i class="bg-[url('@images/button-tiny-bottom-arrow.png')]"></i>
    </div>
    <Transition name="operates">
      <div class="options-container" v-show="showOptions">
        <div class="options">
          <div class="option-wrapper" v-for="(item, index) in options" :key="index" @click="optionClick(index)">
            <span>{{ item }}</span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps({
  options: {
    required: true,
    type: Array as PropType<string[]>
  },
  defaultSelecedIndex: {
    required: false,
    type: Number,
    default: 0
  }
})

const emits = defineEmits(['optionSelected'])

const selectedIndex = defineModel<number>('index', { default: 0 })
const showOptions = ref(false)

selectedIndex.value = props.defaultSelecedIndex

const optionClick = (index: number) => {
  if (index !== selectedIndex.value) {
    selectedIndex.value = index
    emits('optionSelected', index)
  }

  showOptions.value = false
}
</script>

<style lang="scss" scoped>
.options-bar {
  --style: relative select-none;

  .bar-container {
    --style: bg-#fff relative z-11 pl-8px pr-6px max-w-200px overflow-hidden rounded-4px border-(1px solid #33333314) min-w-120px h-30px cursor-pointer flex items-center
      justify-between;

    .title {
      --style: text-(14px #333) line-height-20px whitespace-nowrap overflow-hidden text-ellipsis;
    }

    i {
      --style: ml-5px shrink-0 w-16px h-16px bg-contain transition-transform duration-250;
    }
  }

  .options-container {
    --style: absolute top-full right-0 pt-10px z-10;
    .options {
      --style: min-w-136px p-10px bg-#fff max-w-200px rounded-8px border-(1px #3333330d solid) flex flex-col justify-center cursor-pointer overflow-hidden
        shadow-[0px_20px_100px_0px_#0000001a];

      .option-wrapper {
        --style: 'h-40px flex justify-start items-center px-10px py-11px rounded-8px transition-bg ease-in-out duration-300 hover:(bg-#3333330a)';

        span {
          --style: text-(13px #333) line-height-18px font-500 whitespace-nowrap overflow-hidden text-ellipsis;
        }
      }
    }
  }
}

.operates-leave-to,
.operates-enter-from {
  --style: 'opacity-0';
}

.operates-enter-active,
.operates-leave-active {
  --style: transition-all duration-250 ease-in-out;
}
</style>
