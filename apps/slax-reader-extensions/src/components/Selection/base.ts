import type { SelectionConfig } from './type'

export class Base {
  constructor(private _config: SelectionConfig) {}

  protected get window() {
    return window!
  }

  protected get document() {
    return document!
  }

  protected get config() {
    return this._config
  }
}
