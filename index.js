"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EventEmitter = require("events");
const os = require("os");
const worker_threads_1 = require("worker_threads");
const crypto = require("node:crypto");
class ThreadPool {
    constructor(minionOptions) {
        this.pool = new Map();
        this.freeWorker = [];
        this.workerEvent = new EventEmitter();
        this.waitQueue = [];
        const limit = minionOptions?.limit || (os.cpus()?.length || 2) - 1;
        const script = minionOptions?.script;
        const workerData = minionOptions.workerData;
        for (let i = 0; i < limit; i++) {
            this.newWorker(script, { workerData });
        }
        setInterval(() => {
            const freeWorkerId = this.freeWorker.indexOf(true);
            if (freeWorkerId < 0 || !this.waitQueue.length)
                return;
            const { data, uid } = this.waitQueue.shift();
            this.freeWorker[freeWorkerId] = false;
            const worker = this.pool.get(freeWorkerId);
            worker.on('message', (d) => {
                this.freeWorker[worker.threadId] = true;
                this.workerEvent.emit(uid, d);
                worker.off('message', () => { });
            });
            console.log(typeof data);
            worker.postMessage(data);
        }, 0);
    }
    newWorker(script, opts) {
        const worker = new worker_threads_1.Worker(script, { workerData: opts.workerData });
        this.pool.set(worker.threadId, worker);
        this.freeWorker[worker.threadId] = true;
    }
    exec(data) {
        const uid = crypto.randomBytes(4).toString('hex');
        this.waitQueue.push({ data, uid });
        const callback = new Promise((res, rej) => {
            this.workerEvent.on(uid, (d) => {
                if (d.constructor === Error) {
                    return rej(d);
                }
                res(d);
            });
        });
        return callback;
    }
}
exports.default = ThreadPool;
//# sourceMappingURL=index.js.map