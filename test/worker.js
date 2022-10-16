const { parentPort } = require("worker_threads");

parentPort.on('message', async (ms) => {
  const x = setTimeout(() => {
    parentPort.postMessage(ms)
    // console.dir(process.memoryUsage(), { from: 'worker' })
    // console.dir(process.cpuUsage())
    // clearTimeout(x)
    // ~~(Math.random() * 100)
  }, 1e2)

})