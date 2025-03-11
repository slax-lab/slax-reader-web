import { type AugmentedBrowser } from 'wxt/browser'

interface ExtendedBrowser extends AugmentedBrowser {
  sidePanel: chrome.sidePanel
}

declare global {
  declare const browser: ExtendedBrowser
}
