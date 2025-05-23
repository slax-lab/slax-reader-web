import { Base } from './base'
import type { SelectionConfig } from './type'

export class SelectionMonitor extends Base {
  private _isMonitoring = false
  private _monitorDom: HTMLElement | null = null
  private _mouseUpHandler: (e: MouseEvent | TouchEvent) => void

  constructor(config: SelectionConfig, mouseUpHandler: (e: MouseEvent | TouchEvent) => void) {
    super(config)
    this._monitorDom = this.config.monitorDom || null
    this._mouseUpHandler = mouseUpHandler
  }

  start() {
    if (!this._monitorDom) return

    const handler = this.mouseUpHandler
    this._monitorDom.addEventListener('mouseup', handler)
    this._monitorDom.addEventListener('touchend', handler)
    this._monitorDom.addEventListener('mousedown', this.handleMouseDown)
    this._isMonitoring = true
  }

  stop() {
    if (!this._monitorDom) return

    this._monitorDom.removeEventListener('mouseup', this.mouseUpHandler)
    this._monitorDom.removeEventListener('touchend', this.mouseUpHandler)
    this._monitorDom.removeEventListener('mousedown', this.handleMouseDown)
    this._isMonitoring = false
  }

  clearMouseListenerTry() {
    this.document.removeEventListener('mouseup', this.mouseUpHandler)
    this._monitorDom?.removeEventListener('mouseenter', this.handleMouseEnter)
    this._monitorDom?.removeEventListener('mouseleave', this.handleMouseLeave)
  }

  private handleMouseEnter = () => {
    this.document.removeEventListener('mouseup', this.mouseUpHandler)
    this.document.removeEventListener('touchend', this.mouseUpHandler)
  }

  private handleMouseLeave = () => {
    this.document.addEventListener('mouseup', this.mouseUpHandler)
    this.document.addEventListener('touchend', this.mouseUpHandler)
  }

  private handleMouseDown = () => {
    if (!this._monitorDom) return
    this._monitorDom.addEventListener('mouseenter', this.handleMouseEnter)
    this._monitorDom.addEventListener('mouseleave', this.handleMouseLeave)
  }

  get isMonitoring() {
    return this._isMonitoring
  }

  get mouseUpHandler() {
    return this._mouseUpHandler
  }
}
