const {spawn} = require('child_process')
const net = require('net')
const {promises: fs} = require('fs')
const waitOn = require('wait-on')
const ndjson = require('ndjson')
const {socketPath} = require('./index.js')

module.exports = async function (binName, binPath, args) {
  try {
    await fs.access(socketPath)
  } catch {
    const child = spawn('quicken-worker', [], {
      detached: true,
      stdio: 'ignore',
      env: {
        ...process.env,
        FORCE_COLOR: 2
      }
    })
    child.unref()

    await waitOn({resources: [socketPath]})
  }

  const socket = net.connect(socketPath, () => {
    const input = ndjson.stringify()
    const output = ndjson.parse()
    input.pipe(socket)
    socket.pipe(output)

    input.write({
      cwd: process.cwd(),
      binName,
      binPath,
      args
    })
    output.on('data', ({type, data}) => {
      if (type === 'stdout') {
        process.stdout.write(data)
      } else if (type === 'stderr') {
        process.stderr.write(data)
      } else {
        socket.end()

        // eslint-disable-next-line unicorn/no-process-exit
        process.exit(data)
      }
    })
  })
}
