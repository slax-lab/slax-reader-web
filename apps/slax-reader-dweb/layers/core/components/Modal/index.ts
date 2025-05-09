import EditName from './EditName.vue'
import EditTag from './EditTag.vue'
import Feedback from './Feedback.vue'
import LoginModal from './LoginModal.vue'
import ShareModal, { ShareModalType } from './ShareModal.vue'

export const showFeedbackModal = (options: { title: string; reportType: string; params?: Record<string, string | number> }) => {
  const app = modalBootloader({
    ele: Feedback,
    props: {
      reportType: options.reportType,
      title: options.title,
      params: options.params ?? {},
      onDismiss: () => {
        app.unmount()
        app._container?.remove()
      }
    }
  })
}

export const showEditNameModal = (options: { bookmarkId: number; name: string; aliasName?: string; callback?: (name: string) => void }) => {
  const app = modalBootloader({
    ele: EditName,
    props: {
      name: options.name,
      aliasName: options.aliasName || '',
      bookmarkId: options.bookmarkId,
      onDismiss: () => {
        app.unmount()
        app._container?.remove()
      },
      onSuccess: (name: string) => {
        options.callback && options.callback(name)
      }
    }
  })
}

export const showEditTagModal = (options: { tagId: number; tagName: string; callback?: (id: number, name: string) => void; deleteCallback?: (id: number) => void }) => {
  const app = modalBootloader({
    ele: EditTag,
    props: {
      tagId: options.tagId,
      tagName: options.tagName || '',
      onDismiss: () => {
        app.unmount()
        app._container?.remove()
      },
      onSuccess: (id: number, name: string) => {
        options.callback && options.callback(id, name)
      },
      onDelete: (id: number) => {
        options.deleteCallback && options.deleteCallback(id)
      }
    }
  })
}

export const showLoginModal = (options: { redirect?: string }) => {
  const app = modalBootloader({
    ele: LoginModal,
    props: {
      redirect: options.redirect,
      onDismiss: () => {
        app.unmount()
        app._container?.remove()
      }
    }
  })
}

export const showShareConfigModal = (options: { bookmarkId: number; title: string; type?: ShareModalType }) => {
  const app = modalBootloader({
    ele: ShareModal,
    props: {
      bookmarkId: options.bookmarkId,
      title: options.title,
      type: options.type || ShareModalType.Bookmark,
      onDismiss: () => {
        app.unmount()
        app._container?.remove()
      }
    }
  })
}
