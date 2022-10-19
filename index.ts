import EventEmitter = require('events')
import * as os from 'os'
import { TransferListItem, Worker, WorkerOptions } from 'worker_threads'
import Denque from "denque"
import * as fs from 'fs'

interface Options {
  // How many workers to initialize
  num?: number,
  filename?: string,
  workerOptions?: WorkerOptions,
  // Automatic scale the pool size
  // max?: number
}
type execQueueItem = {
  value: unknown,
  uid: string | symbol,
  transferList?: readonly TransferListItem[]
}
// type excuteData = {
//   value: unknown,
//   transferList?: readonly TransferListItem[]

// }
interface PoolWorker extends Worker {
  uid?: string | symbol
}
class ThreadPool {
  // TODO scaleable
  private _workerPool = new Map<number, PoolWorker>()
  private _workerEvent = new EventEmitter()
  private _execQueue = new Denque<execQueueItem>([]);
  private _idleWorkerIdQueue = new Denque<number>([])
  private _execTimer: NodeJS.Timer
  private _poolMaxSize: number = (os.cpus()?.length || 2) - 1
  // private _poolMinSize = 2
  private _opts: Options = {}
  private _poolToDestroy = false

  constructor(options: Options) {
    const initWorkerCount = options?.num || this._poolMaxSize

    if (initWorkerCount <= 0) throw new Error('num must bigger than 0')

    if (!fs.existsSync(options.filename)) {
      throw new Error(`${options.filename} not exist`)
    }
    console.log(this._opts, 'opts')
    this._opts.filename = options?.filename
    this._opts.workerOptions = options.workerOptions

    for (let i = 0; i < initWorkerCount; i++) {
      this._newWorker(this._opts.filename, this._opts.workerOptions)
    }

  }
  private _setExecTimerActive(delay = 0) {
    if (!this._execTimer) {
      this._execTimer = setInterval(() => {
        // reduce execute waiting queue
        if (this._execQueue.isEmpty()) {
          return
        }

        this._assign()

      }, delay)
    }
  }

  private _toggleExecTimer() {
    if (this._execTimer) {
      clearInterval(this._execTimer)
      this._execTimer = null
      return
    }
    this._setExecTimerActive()
  }

  get size() {
    return this._workerPool.size
  }

  private _assign(jobItem?: execQueueItem) {

    jobItem = jobItem || this._execQueue.shift()
    if (!jobItem) return

    const worker = this._getIdleWorker()
    if (!worker) {
      // no idle worker
      // push to wait queue
      this._setExecTimerActive()
      return this._execQueue.push(jobItem)
    }

    // worker.uid = jobItem.uid
    let { uid } = jobItem
    worker
      .once('message', (v) => {

        this._workerEvent.emit(uid, v)
        uid = null
        // set idle
        this._idleWorkerIdQueue.push(worker.threadId)

      })
      .postMessage(jobItem.value, jobItem.transferList)
    jobItem = null

  }
  private _getIdleWorker() {
    const id = this._idleWorkerIdQueue.shift()
    return this._workerPool.get(id)
  }
  /**
   * new a worker
   * @param filename worker script file
   * @param opts new worker options
   */
  private _newWorker(filename: string, opts: WorkerOptions) {
    const worker = new Worker(filename, opts)
    this._workerPool.set(worker.threadId, worker)
    this._idleWorkerIdQueue.push(worker.threadId)
  }
  /**
   * 
   * @param {boolean} force force to destroy the pool,abandon the undone. default false.
   * @returns 
   */
  destroy(force = false): Promise<boolean> {
    const execDestroy = async () => {
      this._poolToDestroy = true
      const group = []
      for (const [, worker] of this._workerPool) {
        group.push(worker.terminate())
      }
      await Promise.all(group)
      // console.log(x)
      this._workerPool.clear()
      this._idleWorkerIdQueue.clear()
      this._execQueue.clear()
      this._execTimer && clearInterval(this._execTimer)
      this._workerEvent.removeAllListeners()
      // console.log('destroyed')
    }
    return new Promise((res, rej) => {
      // console.log(this._execQueue)
      // if (this._poolToDestroy) {
      //   res()
      // }
      try {
        if (force) {
          execDestroy().then(() => {
            res(true)
          })

        } else {
          const w = setInterval(() => {
            if (
              this._workerPool.size !==
              this._idleWorkerIdQueue.size()
            ) {
              return
            }
            if (!this._execQueue.isEmpty()) {
              return
            }
            if (this._poolToDestroy) return
            execDestroy().then(() => {
              clearInterval(w)
              res(true)
            })
          }, 0)
        }
      } catch (err) {
        // console.error(err)
        rej(err)

      }

    })

  }
  // submit(data: excuteData) {
  //   return new Promise((res, rej) => {
  //     const { value, transferList } = data
  //     let uid = Symbol(0)
  //     this._workerEvent.once(uid, (d) => {
  //       uid = null
  //       if (d.constructor === Error) {
  //         return rej(d)
  //       }
  //       res(d)
  //     })
  //     this._execQueue.push({ value, uid, transferList })
  //   })


  // }
  /**
   * Send  to the worker that is received via require('worker_threads').parentPort.on('message'). See port.postMessage() for more details.
   * @param value any value
   * @param transferList 
   * @returns 
   */
  exec(value: unknown, transferList?: readonly TransferListItem[]) {
    return new Promise((res, rej) => {
      let uid = Symbol(0)
      this._workerEvent.once(uid, (d) => {
        uid = null
        if (d.constructor === Error) {
          return rej(d)
        }
        res(d)
      })

      // const sendData = 
      this._assign({ value, transferList, uid })


    })
  }
}
export default ThreadPool
// 5min rss:76.35,ht:8.53,hu:6.88,ex:1.44,ab:0.03
// change uid from symbol to string