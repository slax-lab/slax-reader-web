<template>
  <div class="edit-tag-modal" :class="{ appear }" @click="closeModal">
    <Transition name="modal" @after-leave="onAfterLeave">
      <div class="modal-content" v-show="appear" @click.stop>
        <div class="header">
          <span>{{ t('component.edit_tag.title') }}</span>
          <button class="close" @click="closeModal">
            <img src="@images/button-dialog-close.png" />
          </button>
        </div>
        <div class="content">
          <textarea
            v-model="editname"
            :placeholder="tagName"
            v-on-key-stroke:Enter="[onKeyDown, { eventName: 'keydown' }]"
            @compositionstart="compositionstart"
            @compositionend="compositionend"
          ></textarea>
        </div>
        <div class="bottom">
          <button @click="submitTagName">{{ t('common.operate.save') }}</button>
        </div>
        <Transition name="opacity">
          <div class="absolute inset-0 flex items-center justify-center bg-#f5f5f355" v-show="isLoading">
            <div class="i-svg-spinners:180-ring-with-bg text-3xl text-emerald"></div>
          </div>
        </Transition>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { RESTMethodPath } from '@commons/types/const'
import { vOnKeyStroke } from '@vueuse/components'
import Toast, { ToastType } from '#layers/core/components/Toast'

const props = defineProps({
  bookmarkId: Number,
  tagId: Number,
  tagName: String
})

const emits = defineEmits(['close', 'dismiss', 'success', 'delete'])

const isLoading = ref(false)
const isLocked = useScrollLock(window)
const appear = ref(false)
const editname = ref('')
const compositionAppear = ref(false)

isLocked.value = true

onMounted(() => {
  setTimeout(() => {
    appear.value = true
  })
})

const closeModal = () => {
  if (isLoading.value) {
    return
  }

  appear.value = false
}
const submitTagName = () => {
  editTagName()
}
const editTagName = async () => {
  if (isLoading.value) {
    return
  }

  if (editname.value === props.tagName || editname.value.trim() === '') {
    closeModal()
    return
  }

  isLoading.value = true
  const req = {
    tag_id: props.tagId,
    tag_name: editname.value
  }

  await request.post({
    url: RESTMethodPath.UPDATE_USER_TAG,
    body: req
  })

  isLoading.value = false
  closeModal()
  emits('success', props.tagId, editname.value)
}

const deleteTag = async () => {
  if (isLoading.value) {
    return
  }

  isLoading.value = true

  const res = await request.post<{ ok: boolean }>({
    url: RESTMethodPath.DELETE_USER_TAG,
    body: {
      tag_id: props.tagId
    }
  })

  isLoading.value = false

  if (res) {
    closeModal()
    emits('delete', props.tagId)
  } else {
    Toast.showToast({
      text: t('common.tips.delete_tag_failed'),
      type: ToastType.Error
    })
  }
}

const onAfterLeave = () => {
  isLocked.value = false
  emits('dismiss')
}

const compositionstart = () => {
  compositionAppear.value = true
}

const compositionend = () => {
  compositionAppear.value = false
}

const onKeyDown = (e: KeyboardEvent) => {
  if (e.key !== 'Enter' || compositionAppear.value) {
    return
  }

  e.preventDefault()
  e.stopPropagation()
  submitTagName()
}

const t = (text: string) => {
  return useNuxtApp().$i18n.t(text)
}
</script>

<style lang="scss" scoped>
.edit-tag-modal {
  --style: fixed inset-0 z-100 bg-transparent flex-center transition-colors duration-250;
  &.appear {
    --style: bg-#0f141999;
  }
}

button {
  --style: 'hover:(scale-103 opacity-90) active:(scale-105) transition-all duration-250';
}

.modal-content {
  --style: bg-#f5f5f3 rounded-2 p-24px w-480px select-none mb-10 relative overflow-hidden;

  .header {
    --style: flex justify-between items-center;
    span {
      --style: text-(13px #999999) line-height-18px;
    }

    button {
      --style: w-16px h-16px;
      img {
        --style: w-full;
      }
    }
  }

  .content {
    --style: mt-16px flex flex-col items-center justify-stretch;
    textarea {
      --style: w-full h-60px rounded-2 border-(1px solid #3333330d) text-(15px #0f1419) bg-#fcfcfc line-height-22px py-12px px-16px resize-none outline-none;

      &::placeholder,
      &::-webkit-input-placeholder {
        --style: text-(15px #999999);
      }
    }
  }

  .bottom {
    --style: mt-20px flex justify-end items-center;

    & > * {
      --style: 'not-first:ml-32px';
    }

    button:not(.delete) {
      --style: flex-center w-100px h-40px bg-#16B998 rounded-2 text-(14px #ffffff) font-semibold line-height-40px transition-all duration-250;

      &:hover {
        --style: bg-#14a689;
      }

      &:active {
        --style: scale-105;
      }
    }
  }
}

.modal-leave-to,
.modal-enter-from {
  --style: opacity-0 -translate-y-25px;
}

.modal-enter-active,
.modal-leave-active {
  --style: transition-all duration-250 ease-in-out;
}
</style>
