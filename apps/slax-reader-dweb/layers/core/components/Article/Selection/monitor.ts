export class SelectionMonitor {
  private _isMonitoring = false
  private _mouseUpHandler: (e: MouseEvent | TouchEvent) => void

  constructor(
    private _monitorDom: HTMLElement | null,
    mouseUpHandler: (e: MouseEvent | TouchEvent) => void
  ) {
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
    document.removeEventListener('mouseup', this.mouseUpHandler)
    this._monitorDom?.removeEventListener('mouseenter', this.handleMouseEnter)
    this._monitorDom?.removeEventListener('mouseleave', this.handleMouseLeave)
  }

  private handleMouseEnter = () => {
    document.removeEventListener('mouseup', this.mouseUpHandler)
    document.removeEventListener('touchend', this.mouseUpHandler)
  }

  private handleMouseLeave = () => {
    document.addEventListener('mouseup', this.mouseUpHandler)
    document.addEventListener('touchend', this.mouseUpHandler)
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
