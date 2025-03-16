<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3>{{ $t('page.user.import_progress') }}</h3>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>
      <div class="progress-table" v-if="!isLoading">
        <div class="header table-row">
          <div class="platform">{{ $t('page.user.platform') }}</div>
          <div class="status">{{ $t('page.user.status') }}</div>
          <div class="count">{{ $t('page.user.url_count') }}</div>
          <div class="batches">{{ $t('page.user.batches_progress') }}</div>
          <div class="time">{{ $t('page.user.import_time') }}</div>
        </div>
        <div v-for="item in progressData" :key="item.id" class="table-row">
          <div class="platform">
            <img :src="getPlatformIcon(item.type)" :alt="item.type" />
            <span>{{ item.type }}</span>
          </div>
          <div class="status">
            <span :class="getStatusClass(item.status)">{{ getStatusText(item.status) }}</span>
          </div>
          <div class="count">{{ item.count }}</div>
          <div class="progress">{{ Math.round((item.current_count / item.batch_count) * 100) }}%</div>
          <div class="time">{{ formatDate(item.created_at) }}</div>
        </div>
      </div>
      <div class="loading-container" v-else>
        <div class="i-svg-spinners:90-ring w-32px color-#5490c2"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Toast, { ToastType } from '../Toast'
import { RESTMethodPath } from '@commons/types/const'
import type { ImportProcessResp } from '@commons/types/interface'

const progressData = ref<ImportProcessResp[]>([])
const isLoading = ref(false)

const getImportProgressData = async () => {
  isLoading.value = true
  request
    .get<ImportProcessResp[]>({
      url: RESTMethodPath.IMPORT_THIRD_PARTY_DATA_PROGRESS
    })
    .then(res => {
      if (!res) {
        Toast.showToast({
          text: 'Network error',
          type: ToastType.Error
        })
        return
      }
      progressData.value = res
    })
    .finally(() => {
      isLoading.value = false
    })
}

const getPlatformIcon = (platform: string) => {
  switch (platform) {
    case 'omnivore':
      return new URL('@images/import-three-party-logo-omnivore.png', import.meta.url).toString()
    default:
      return ''
  }
}

const getStatusText = (status: number) => {
  return {
    0: 'Pending',
    1: 'Processing',
    2: 'Failed',
    3: 'Success'
  }[status]
}

const getStatusClass = (status: number) => {
  return {
    'status-success': status === 3,
    'status-pending': status === 0,
    'status-failed': status === 2,
    'status-processing': status === 1
  }
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleString()
}

getImportProgressData()
</script>

<style lang="scss" scoped>
.modal-overlay {
  --style: fixed inset-0 bg-black/50 flex items-center justify-center z-50;
}

.modal-content {
  --style: bg-white rounded-16px w-800px max-h-80vh max-w-90vw shadow-xl overflow-hidden flex flex-col;
}

.modal-header {
  --style: flex justify-between items-center px-24px py-16px border-b-(1px solid #eee);

  h3 {
    --style: text-(18px #333) font-600 m-0;
  }

  .close-btn {
    --style: text-24px text-#666 bg-transparent border-none cursor-pointer hover: text-#333;
  }
}

.loading-container {
  --style: flex items-center justify-center flex-1 py-40px;
}

.progress-table {
  --style: p-20px overflow-auto;
  min-width: 760px;

  .table-row {
    --style: grid items-center py-10px px-16px rounded-8px;
    grid-template-columns: 200px 120px 100px 120px 1fr;
    min-width: 100%;
    gap: 16px;

    &.header {
      --style: text-(14px #666) font-500 bg-#f8f9fa mb-8px;
    }

    &:not(.header) {
      --style: text-(14px #333) hover: bg-#f8f9fa transition-colors duration-200;
    }
  }

  .platform {
    --style: flex items-center gap-12px;

    img {
      --style: w-24px h-24px object-contain;
    }
  }

  .status {
    span {
      --style: px-8px py-2px rounded-full text-12px;

      &.status-success {
        --style: bg-#e6f4ea text-#1e8e3e;
      }
      &.status-pending {
        --style: bg-#fef7e0 text-#f2994a;
      }
      &.status-failed {
        --style: bg-#fce8e8 text-#eb5757;
      }
      &.status-processing {
        --style: bg-#e6f4ea text-#006aff;
      }
    }
  }
}
</style>
