const {promises: fs} = require('fs')
const net = require('net')
const ndjson = require('ndjson')
const {socketPath} = require('./index.js')

module.exports = async function () {
  try {
    await fs.access(socketPath)
  } catch {
    return
  }

  const socket = net.connect(socketPath, () => {
    const input = ndjson.stringify()
    input.pipe(socket)
    input.end({stop: true})
  })
}
