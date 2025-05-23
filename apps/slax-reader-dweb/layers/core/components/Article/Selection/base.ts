import type { SelectionConfig } from './type'

export class Base {
  constructor(private _config: SelectionConfig) {}

  protected get window() {
    return this.config.iframe ? this.config.iframe.contentWindow! : window!
  }

  protected get document() {
    return this.config.iframe ? this.config.iframe.contentDocument! : document!
  }

  protected get config() {
    return this._config
  }
}
