enum StatusCode {
  NOT_LOGIN = 401
}

enum RESTMethodPath {
  LOGIN = '/v1/user/login',
  ME = '/v1/user/me',
  BOOKMARK_EXISTS = '/v1/bookmark/exists',
  ADD_BOOKMARK = '/v1/bookmark/add',
  ADD_URL_BOOKMARK = '/v1/bookmark/add_url',
  DELETE_BOOKMARK = '/v1/bookmark/del',
  TRASH_BOOKMARK = '/v1/bookmark/trash',
  REVERT_BOOKMARK = '/v1/bookmark/trash_revert',
  BOOKMARK_DETAIL = '/v1/bookmark/detail',
  BOOKMARK_LIST = '/v1/bookmark/list',
  BOOKMARK_AI_SUMMARIES = '/v1/aigc/summaries',
  BOOKMARK_AI_SUMMARIES_LIST = '/v1/bookmark/summaries',
  BOOKMARK_ARCHIVE = '/v1/bookmark/archive',
  BOOKMARK_STAR = '/v1/bookmark/star',
  BOOKMARK_ALIAS_TITLE = '/v1/bookmark/alias_title',
  REPORT_FEEDBACK = '/v1/user/report',
  GET_BIND_LINK = '/v1/user/bind_link',
  GET_BIND_LIST = '/v1/user/bind_list',
  USER_INFO = '/v1/user/userinfo',
  USER_INFO_SETTING = '/v1/user/setting',
  TOKEN_REFRESH = '/v1/user/refresh',
  USER_INFO_ENABLE_SETTING = '/v1/user/setting/enable',
  USER_INFO_DISABLE_SETTING = '/v1/user/setting/disable',
  CREATE_SUBSCRIPTION = '/v1/subscription/create_subscription',
  CREATE_ONCE_SUBSCRIPTION = '/v1/subscription/create_once',
  CANCEL_SUBSCRIPTION = '/v1/subscription/cancel',
  ADD_MARK = '/v1/mark/create',
  DELETE_MARK = '/v1/mark/delete',
  CREATE_BOOKMARK_SHARE = '/v1/share/create',
  EXISTS_SHARE_BOOKMARK = '/v1/share/exists',
  SHARE_BOOKMARK_DETAIL = '/v1/share/detail',
  SHARE_BOOKMARK_MARK_LIST = '/v1/share/mark_list',
  UPDATE_SHARE_BOOKMARK = '/v1/share/update',
  DELETE_SHARE_BOOKMARK = '/v1/share/delete',
  BOT_CHAT = '/v1/aigc/chat',
  TAG_LIST = '/v1/tag/list',
  ADD_BOOKMARK_TAG = '/v1/bookmark/add_tag',
  DELETE_BOOKMARK_TAG = '/v1/bookmark/del_tag',
  ADD_USER_TAG = '/v1/tag/create',
  UPDATE_USER_TAG = '/v1/tag/update',
  DELETE_USER_TAG = '/v1/tag/delete',
  IMPORT_THIRD_PARTY_DATA = '/v1/bookmark/import',
  IMPORT_THIRD_PARTY_DATA_PROGRESS = '/v1/bookmark/import_status',
  HIGHLIGHT_LIST = '/v1/mark/list',
  SEARCH_CONTENT = '/v1/bookmark/search',
  CONNECT_MESSAGE = '/v1/user/messages',
  SUBSCRIBE_PUSH = '/v1/user/subscribe/pushapi',
  GET_UNREAD_COUNT = '/v1/user/unread_count',
  NOTIFICATION_LIST = '/v1/user/notifications',
  NOTIFICATION_MARK_READ_ALL = '/v1/user/read_notifications',
  NOTIFICATION_MARK_READ = '/v1/user/read_notification',
  STRIPE_CONNECT = '/v1/user/setting/stripe_connect',
  STRIPE_CONNECT_LOGIN = '/v1/user/setting/stripe_login',
  COLLECT_OWNER_SHARE_SETTING = '/v1/collection/setting',
  COLLECT_INFO = '/v1/collection',
  COLLECT_SUBSCRIBE = '/v1/collection/subscribe',
  COLLECT_SUBSCRIBED = '/v1/collection/subscribed',
  COLLECT_UNSUBSCRIBE = '/v1/collection/unsubscribe',
  COLLECT_DELETE_SUBSCRIBE = '/v1/collection/delete_subscribe',
  COLLECT_SUBSCRIBED_LIST = '/v1/collection/subscribed_list',
  COLLECT_BOOKMARK_DETAIL = '/v1/collection/bookmark'
}

enum LocalStorageKey {
  USER_TOKEN = 'local:token',
  USER_BOOKMARKS = 'local:bookmarks',
  BOOKMARK_RECORDS = 'local:bookmark_records',
  ANALYTICS_ENABLED = 'local:analytics-enabled',
  USER_INFO = 'local:user_info'
}

export { RESTMethodPath, StatusCode, LocalStorageKey }
