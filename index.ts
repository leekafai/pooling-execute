import EventEmitter = require('events')
import * as os from 'os'
import { Worker } from 'worker_threads'
import * as crypto from 'node:crypto'
interface minionOptions {
  limit: number,
  script: string,
  workerData?: unknown
}
interface NewWorkerOpts {
  workerData?: unknown
}
type waitQueueItem = {
  data: any,
  uid: string
}
class ThreadPool {
  pool = new Map<number, Worker>()
  freeWorker: boolean[] = []
  workerEvent = new EventEmitter()
  waitQueue: waitQueueItem[] = []
  constructor(minionOptions: minionOptions) {
    const limit = minionOptions?.limit || (os.cpus()?.length || 2) - 1
    const script = minionOptions?.script
    const workerData = minionOptions.workerData
    for (let i = 0; i < limit; i++) {
      this.newWorker(script, { workerData })
    }
    setInterval(() => {
      const freeWorkerId = this.freeWorker.indexOf(true)
      if (freeWorkerId < 0 || !this.waitQueue.length) return
      const { data, uid } = this.waitQueue.shift()
      this.freeWorker[freeWorkerId] = false
      const worker = this.pool.get(freeWorkerId)
      worker.on('message', (d) => {
        this.freeWorker[worker.threadId] = true
        this.workerEvent.emit(uid, d)
        worker.off('message', () => { })
      })
      console.log(typeof data)
      worker.postMessage(data)

    }, 0)
  }
  // 增加 worker 

  private newWorker(script: string, opts: NewWorkerOpts) {
    const worker = new Worker(script, { workerData: opts.workerData })
    this.pool.set(worker.threadId, worker)
    this.freeWorker[worker.threadId] = true
  }
  // get listener() {
  //   return this.workerEvent
  // }

  // worker(id: number) {
  //   return this.pool.get(id)
  // }
  exec(data?: unknown) {
    const uid = crypto.randomBytes(4).toString('hex')
    this.waitQueue.push({ data, uid })
    const callback = new Promise((res, rej) => {
      this.workerEvent.on(uid, (d) => {
        if (d.constructor === Error) {
          return rej(d)
        }
        res(d)
      })
    })
    return callback
  }
}
export default ThreadPool