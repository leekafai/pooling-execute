# pooling execute
---

A easy way to use worker_threads 

```javascript
// index.js
const path = require('path')

const ThreadPool = require('pooling-execute').default

const main = async () => {
  const x = new ThreadPool({ 
    limit: 5, 
    script: path.join(__dirname, 'worker.js'),
    workerData:{}
     })

  for (let i = 0; i < 10; i++) {
    const t = Math.random()
    x.exec(t) // return a promise
      .then((d) => {
        console.log(d === t, 'result')
      })
      .catch((e) => {
        console.log(e, 'Err')
      })
  }


}
main()
// worker.js
const { parentPort } = require("worker_threads");
// you can still use workerData from worker_threads

parentPort.on('message', async (d) => {
  setTimeout(() => {
    parentPort.postMessage(
      Math.random() > 0.5 ?
       d : 
       new Error(Date.now() + '') // post Error to Promise.catch
      )
  }, 2e3)

})
```
