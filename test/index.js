const path = require('path')

const ThreadPool = require('..').default

const main = async () => {
  const x = new ThreadPool({ limit: 5, script: path.join(__dirname, './worker.js') })

  setInterval(() => {
    x.exec(Date.now()).then((d) => {
      console.log(d, 'result')
    }).catch((e) => {
      console.log(e, 'Err')
    })
  }, 5e1)

}
main()