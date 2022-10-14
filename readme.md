# pooling execute
---

A easy way to use worker_threads 

```javascript
// index.js
const path = require('path')

const ThreadPool = require('poolingexecute').default

const main = async () => {
  const x = new ThreadPool({ 
    limit: 5, 
    script: path.join(__dirname, 'worker.js'),
    workerData:{}
     })

  setInterval(
    () => {
    x.exec(Date.now())
    .then((d) => {
      console.log(d, 'result')
    })
    .catch((e) => {
      console.log(e, 'Err')
    })
    }, 5e1)

}
main()
// worker.js
const { parentPort } = require("worker_threads");
// you can still use workerData from worker_threads
parentPort.on('message', async (d) => {
  
  setTimeout(() => {
    parentPort.postMessage(Math.random > 0.5 ? (Date.now() - d) : new Error(Date.now() + ''))
  }, 2e3)

})
```
