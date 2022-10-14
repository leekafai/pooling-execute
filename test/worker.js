const { parentPort } = require("worker_threads");

parentPort.on('message', async (d) => {
  console.log(d, 'on message', typeof d)
  setTimeout(() => {

    parentPort.postMessage(Math.random > 0.5 ? (Date.now() - d) : new Error(Date.now() + ''))

  }, 2e3)

})