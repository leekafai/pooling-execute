const path = require('path')
const { stdout } = require('process')
const wait = async (ms = 1e3) => {
  return new Promise((res) => {
    setTimeout(() => {
      res()
    }, ms)
  })
}
const ThreadPool = require('../index-update').default
// const ThreadPool = require('../index').default
// const ThreadPool = require('../index2').default
// const ThreadPool = require('../memleak').default

// 测试是否有丢任务
const executeMinute = 5
const main = async () => {
  const start = Date.now()
  const x = new ThreadPool({
    // num: 5, 
    filename: path.join(__dirname, './worker.js')
  })

  const format = (bytes) => {
    return Number((bytes / 1024 / 1024).toFixed(2))
  }
  const muFormat = (obj) => {
    for (let k of Object.keys(obj)) {
      obj[k] = format(obj[k])
    }
    return obj
  }
  console.log(x.size, 'size')
  let time = 1e3
  let lastTime = Date.now()
  const timer = setInterval(() => {

    console.log(Date.now() - lastTime, '>>')
    lastTime = Date.now()
    if (Math.random() > 0.5) {
      console.log('refresh')
      time = time === 1e3 ? 1e4 : 1e3
      clearInterval(timer)
    } else {
      timer.refresh()
    }
  }, time)
  // setTimeout(() => {
  //   process.exit()
  // }, executeMinute * (60000))
  // const start = Date.now()
  // setInterval(() => {
  //   let arr = [10, 20, 30, 40, 50]
  //   let index = Math.floor((Math.random() * arr.length))
  //   const t = arr[index]
  //   x.exec(t)
  //     .then((d) => {
  //       if (d !== t) throw new Error('>>')
  //       // console.log(d, t)
  //       const f = muFormat(process.memoryUsage())
  //       stdout.write(`\r ${~~((Date.now() - start) / 1000 / 60)}min rss:${f.rss},ht:${f.heapTotal},hu:${f.heapUsed},ex:${f.external},ab:${f.arrayBuffers}`)
  //     })
  //     .catch((e) => {
  //       console.log(e, 'Err')
  //     })

  // }, 10)

  // job lost
  // let c = 0
  // let limit = 1e4
  // const start = Date.now()
  // for (let i = 0; i < limit; i++) {

  //   x.exec(i).then((d) => {
  //     if (d !== i) throw new Error(`${d},${i}`)
  //     if (d === i) {
  //       const f = muFormat(process.memoryUsage())
  //       stdout.write(`\r ${((Date.now() - start) / 1000 / 60).toFixed(2)}min rss:${f.rss},ht:${f.heapTotal},hu:${f.heapUsed}`)
  //       c++

  //     }
  //     if (c === limit) {
  //       console.log(c, '>>')

  //       process.exit()
  //     }

  //   })
  // }

}
main()