<template>
  <section>
    <div class="title">{{ $t('page.user.import_third_party_data') }}</div>
    <div class="info">
      <div class="import">
        <div class="import-description">
          <p>{{ `${$t('page.user.import_description')}\n\n${$t('page.user.import_note1')}\n${$t('page.user.import_note2')}` }}</p>
        </div>
        <div class="omnivore-section">
          <ClientOnly>
            <NavigateStyleButton :title="`${$t('page.user.import_third_party_data')} Omnivore`" @action="omnivoreClick" />
          </ClientOnly>
          <button class="inline" @click="popupImportProgress">
            <span>{{ $t('page.user.view_import_progress') }}</span>
          </button>
        </div>
      </div>
    </div>
  </section>
  <ImportProgressModal v-if="showImportProgressModal" @close="showImportProgressModal = false" />
  <ImportLoadingModal v-if="showImportLoadingModal" :progress="importProgress" :text="importText" />
</template>

<script lang="ts" setup>
import NavigateStyleButton from '#layers/core/components/NavigateStyleButton.vue'
import ImportLoadingModal from '#layers/core/components/ThirdPartyImport/ImportLoadingModal.vue'
import ImportProgressModal from '#layers/core/components/ThirdPartyImport/ImportProgressModal.vue'

import { RESTMethodPath } from '@commons/types/const'
import Toast from '#layers/core/components/Toast'

const showImportProgressModal = ref(false)
const showImportLoadingModal = ref(false)
const importProgress = ref(0)
const importText = ref('')

const chooseFile = (type: string) => {
  let input = document.createElement('input')
  document.body.appendChild(input)
  input.type = 'file'
  input.id = 'file'
  input.hidden = true
  input.onchange = e => {
    if (e.target) {
      importThirdPartyData(type)
    }
    document.body.removeChild(input)
  }
  input.click()
}

const importThirdPartyData = async (type: string) => {
  const file = document.getElementById('file') as HTMLInputElement
  if (!file.files || file.files.length === 0) {
    console.log('not select file')
    return
  }
  showImportLoadingModal.value = true
  importText.value = 'unzip file...'
  const metadataList = await unzipGetFile(file.files[0], /metadata_[0-9]+_to_[0-9]+.json/)
  if (!metadataList) {
    Toast.showToast({
      text: `file not found or is not ${type} file`
    })
    return
  }

  importText.value = 'upload file...'
  importProgress.value = 20
  // 分批上传
  for (const [idx, metadata] of metadataList.entries()) {
    importText.value = `upload file ${idx + 1} of ${metadataList.length}...`
    await request
      .uploadFile({
        url: RESTMethodPath.IMPORT_THIRD_PARTY_DATA,
        query: {
          type,
          file_type: metadata.type
        },
        fileContent: metadata
      })
      .then(() => {
        importProgress.value += Math.ceil(((idx + 1) / metadataList.length) * 100)
        Toast.showToast({
          text: `import ${type} data success, please wait for a moment`
        })
      })
  }
  showImportLoadingModal.value = false
}

const popupImportProgress = () => {
  showImportProgressModal.value = true
}

const omnivoreClick = () => {
  chooseFile('omnivore')
}
</script>

<style lang="scss" scoped>
section {
  --style: 'mt-48px not-first:mt-60px';
  .title {
    --style: font-600 text-(24px #0f1419) line-height-33px text-left select-none;
  }

  .info {
    .import {
      --style: mt-8px;

      .import-description {
        --style: whitespace-pre-line;

        p {
          --style: text-(14px #333) line-height-22px;
        }
      }

      .omnivore-section {
        --style: mt-24px flex justify-between items-center;
        button.inline {
          --style: 'text-(14px #5490c2) line-height-20px underline underline-#5490C2 transition-all duration-250 hover:(scale-102) active:(scale-105)';
        }
      }
    }
  }
}
</style>
