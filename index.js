"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const EventEmitter = require("events");
const os = __importStar(require("os"));
const worker_threads_1 = require("worker_threads");
const denque_1 = __importDefault(require("denque"));
const fs = __importStar(require("fs"));
class ThreadPool {
    constructor(options) {
        this._workerPool = new Map();
        this._workerEvent = new EventEmitter();
        this._execQueue = new denque_1.default([]);
        this._idleWorkerIdQueue = new denque_1.default([]);
        this._poolMaxSize = (os.cpus()?.length || 2) - 1;
        this._opts = {};
        this._poolToDestroy = false;
        const initWorkerCount = options?.num || this._poolMaxSize;
        if (initWorkerCount <= 0)
            throw new Error('num must bigger than 0');
        if (!fs.existsSync(options.filename)) {
            throw new Error(`${options.filename} not exist`);
        }
        console.log(this._opts, 'opts');
        this._opts.filename = options?.filename;
        this._opts.workerOptions = options.workerOptions;
        for (let i = 0; i < initWorkerCount; i++) {
            this._newWorker(this._opts.filename, this._opts.workerOptions);
        }
    }
    _setExecTimerActive(delay = 0) {
        if (!this._execTimer) {
            this._execTimer = setInterval(() => {
                if (this._execQueue.isEmpty()) {
                    return;
                }
                this._assign();
            }, delay);
        }
    }
    _toggleExecTimer() {
        if (this._execTimer) {
            clearInterval(this._execTimer);
            this._execTimer = null;
            return;
        }
        this._setExecTimerActive();
    }
    get size() {
        return this._workerPool.size;
    }
    _assign(jobItem) {
        jobItem = jobItem || this._execQueue.shift();
        if (!jobItem)
            return;
        const worker = this._getIdleWorker();
        if (!worker) {
            this._setExecTimerActive();
            return this._execQueue.push(jobItem);
        }
        let { uid } = jobItem;
        worker
            .once('message', (v) => {
            this._workerEvent.emit(uid, v);
            uid = null;
            this._idleWorkerIdQueue.push(worker.threadId);
        })
            .postMessage(jobItem.value, jobItem.transferList);
        jobItem = null;
    }
    _getIdleWorker() {
        const id = this._idleWorkerIdQueue.shift();
        return this._workerPool.get(id);
    }
    _newWorker(filename, opts) {
        const worker = new worker_threads_1.Worker(filename, opts);
        this._workerPool.set(worker.threadId, worker);
        this._idleWorkerIdQueue.push(worker.threadId);
    }
    destroy(force = false) {
        const execDestroy = async () => {
            this._poolToDestroy = true;
            const group = [];
            for (const [, worker] of this._workerPool) {
                group.push(worker.terminate());
            }
            await Promise.all(group);
            this._workerPool.clear();
            this._idleWorkerIdQueue.clear();
            this._execQueue.clear();
            this._execTimer && clearInterval(this._execTimer);
            this._workerEvent.removeAllListeners();
        };
        return new Promise((res, rej) => {
            try {
                if (force) {
                    execDestroy().then(() => {
                        res(true);
                    });
                }
                else {
                    const w = setInterval(() => {
                        if (this._workerPool.size !==
                            this._idleWorkerIdQueue.size()) {
                            return;
                        }
                        if (!this._execQueue.isEmpty()) {
                            return;
                        }
                        if (this._poolToDestroy)
                            return;
                        execDestroy().then(() => {
                            clearInterval(w);
                            res(true);
                        });
                    }, 0);
                }
            }
            catch (err) {
                rej(err);
            }
        });
    }
    exec(value, transferList) {
        return new Promise((res, rej) => {
            let uid = Symbol(0);
            this._workerEvent.once(uid, (d) => {
                uid = null;
                if (d.constructor === Error) {
                    return rej(d);
                }
                res(d);
            });
            this._assign({ value, transferList, uid });
        });
    }
}
exports.default = ThreadPool;
//# sourceMappingURL=index.js.map