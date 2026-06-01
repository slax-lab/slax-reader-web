<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-content">
        <div class="modal-header">
          <span class="modal-title">{{ $t('page.user.import_progress') }}</span>
          <button class="close-btn" @click="$emit('close')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div class="progress-table" v-if="!isLoading">
          <div class="table-header table-row">
            <div class="col-platform">{{ $t('page.user.platform') }}</div>
            <div class="col-status">{{ $t('page.user.status') }}</div>
            <div class="col-count">{{ $t('page.user.url_count') }}</div>
            <div class="col-batches">{{ $t('page.user.batches_progress') }}</div>
            <div class="col-time">{{ $t('page.user.import_time') }}</div>
          </div>
          <div v-for="item in progressData" :key="item.id" class="table-row">
            <div class="col-platform">
              <img :src="getPlatformIcon(item.type)" :alt="item.type" />
              <span>{{ item.type }}</span>
            </div>
            <div class="col-status">
              <span :class="getStatusClass(item.status)">{{ getStatusText(item.status) }}</span>
            </div>
            <div class="col-count">{{ item.count }}</div>
            <div class="col-batches">{{ Math.round((item.current_count / item.batch_count) * 100) }}%</div>
            <div class="col-time">{{ formatDate(item.created_at) }}</div>
          </div>
          <div class="empty-state" v-if="progressData.length === 0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span>{{ $t('page.user.no_import_records') }}</span>
          </div>
        </div>
        <div class="loading-container" v-else>
          <div class="i-svg-spinners:90-ring w-28px" style="color: var(--slax-accent)"></div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import Toast, { ToastType } from '../Toast'
import { RESTMethodPath } from '@commons/types/const'
import type { ImportProcessResp } from '@commons/types/interface'

const progressData = ref<ImportProcessResp[]>([])
const isLoading = ref(false)

const getImportProgressData = async () => {
  isLoading.value = true
  request()
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
    case 'pocket':
      return new URL('@images/import-three-party-logo-pocket.png', import.meta.url).toString()
    default:
      return ''
  }
}

const getStatusText = (status: number) => {
  return (
    {
      0: 'Pending',
      1: 'Processing',
      2: 'Failed',
      3: 'Success'
    }[status] ?? '-'
  )
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
  position: fixed;
  inset: 0;
  background: rgba(15, 20, 25, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.modal-content {
  background: var(--slax-surface-solid);
  border: 1px solid var(--slax-border);
  border-radius: var(--slax-radius);
  box-shadow:
    var(--slax-shadow-warm),
    0 20px 60px rgba(0, 0, 0, 0.12);
  width: 800px;
  max-width: 92vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--slax-border);
  flex-shrink: 0;

  .modal-title {
    font-family: var(--slax-font-serif);
    font-size: var(--slax-fs-card);
    font-weight: 500;
    color: var(--slax-text);
    line-height: 1.4;
  }

  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: transparent;
    border: none;
    border-radius: var(--slax-radius-sm);
    color: var(--slax-text-light);
    cursor: pointer;
    transition: all var(--slax-dur-normal);

    &:hover {
      background: var(--slax-surface);
      color: var(--slax-text);
    }
  }
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 48px 24px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px 24px;
  color: var(--slax-text-light);

  svg {
    opacity: 0.4;
  }

  span {
    font-size: var(--slax-fs-aux);
  }
}

.progress-table {
  padding: 16px;
  overflow: auto;
  flex: 1;

  .table-row {
    display: grid;
    align-items: center;
    padding: 10px 12px;
    border-radius: var(--slax-radius-sm);
    gap: 12px;
    grid-template-columns: 180px 110px 90px 110px 1fr;
    min-width: 600px;

    &.table-header {
      font-size: var(--slax-fs-aux);
      color: var(--slax-text-muted);
      font-weight: 500;
      background: var(--slax-surface);
      margin-bottom: 4px;
    }

    &:not(.table-header) {
      font-size: var(--slax-fs-aux);
      color: var(--slax-text);
      transition: background var(--slax-dur-normal);

      &:hover {
        background: var(--slax-surface);
      }
    }
  }

  .col-platform {
    display: flex;
    align-items: center;
    gap: 10px;

    img {
      width: 20px;
      height: 20px;
      object-fit: contain;
      border-radius: 4px;
    }
  }

  .col-status {
    span {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: var(--slax-fs-tag);
      font-weight: 500;

      &.status-success {
        background: rgba(30, 142, 62, 0.1);
        color: #1e8e3e;
      }

      &.status-pending {
        background: rgba(242, 153, 74, 0.1);
        color: #f2994a;
      }

      &.status-failed {
        background: color-mix(in srgb, var(--slax-danger) 10%, transparent);
        color: var(--slax-danger);
      }

      &.status-processing {
        background: color-mix(in srgb, var(--slax-accent) 10%, transparent);
        color: var(--slax-accent);
      }
    }
  }
}
</style>
