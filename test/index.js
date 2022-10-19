const { profile } = require('console')
const path = require('path')
const wait = async (ms = 1e3) => {
  return new Promise((res) => {
    const x = setTimeout(() => {
      clearTimeout(x)
      res()
    }, ms)
  })
}
const ThreadPool = require('../index').default
// const ThreadPool = require('../perf').default
const main = async () => {
  const x = new ThreadPool({ limit: 5, filename: path.join(__dirname, './worker.js') })

  const { rss, heapTotal, heapUsed } = process.memoryUsage()
  let maxRss = rss, minRss = rss, MaxHeapTotal = heapTotal, MinHeapTotal = heapTotal, MinHeapUsed = heapUsed, MaxHeapUsed = heapUsed
  // setInterval(() => {
  //   // if (c > 10) return process.exit()


  //   const { rss, heapTotal, heapUsed } = process.memoryUsage()
  //   maxRss = Math.max(maxRss, rss)
  //   minRss = Math.min(minRss, rss)

  //   MaxHeapTotal = Math.max(MaxHeapTotal, heapTotal)
  //   MinHeapTotal = Math.min(MinHeapTotal, heapTotal)

  //   MaxHeapUsed = Math.max(MaxHeapUsed, heapUsed)
  //   MinHeapUsed = Math.min(MinHeapUsed, heapUsed)

  //   console.log('----')
  //   console.dir({ maxRss, minRss, MaxHeapTotal, MinHeapTotal, MaxHeapUsed, MinHeapUsed })


  //   // console.dir(process.memoryUsage())
  //   // console.dir(process.cpuUsage())
  //   // c++
  // }, 1e3)

  // setInterval(() => {

  //   // console.log(t)
  //   const t = 1
  //   x.exec(t)
  //     .then((d) => {
  //       console.log(d === t, t, 'result')
  //     })
  //     .catch((e) => {
  //       console.log(e, 'Err')
  //     })

  // }, 1e3)
  // for (let i = 0; i < 10; i++) {
  //   x.exec(i)
  //     .then((d) => {
  //       console.log(d === i, i, 'result1')
  //     })
  //     .catch((e) => {
  //       console.log(e, 'Err')
  //     })
  // }

  // await wait(5e3)

  // for (let i = 0; i < 10; i++) {
  //   x.exec(i)
  //     .then((d) => {
  //       console.log(d === i, i, 'result2')
  //     })
  //     .catch((e) => {
  //       console.log(e, 'Err')
  //     })
  // }
  // await wait(5e3)
  // x.destroy()
  let c = 0
  const v = setInterval(() => {
    for (let i = 0; i < 10; i++) {

      x.exec(i)
        .then((d) => {
          c++
          console.log(d === i, i, c, 'result2')

        })
        .catch((e) => {
          console.log(e, 'Err')
        })

      // x.destroy(true).then(() => {
      //   clearInterval(v)
      // })

    }

  }, 5e3)

}
main()