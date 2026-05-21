/// <reference lib="WebWorker" />
import { NotificationWorker } from './sw'

declare const self: ServiceWorkerGlobalScope
console.log(self.__WB_MANIFEST)

const worker = new NotificationWorker()
console.log(`[slax sw] notification worker initialize`)
worker.initialize()
