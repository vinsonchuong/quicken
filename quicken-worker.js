#!/usr/bin/env node
const net = require('net')
const path = require('path')
const pEvent = require('p-event')
const quicken = require('quicken')
const ndjson = require('ndjson')
const resolve = require('resolve')

const originalStdoutWrite = process.stdout.write
const originalStderrWrite = process.stderr.write

const server = net.createServer()
const incomingConnections = pEvent.iterator(server, 'connection', {
  resolutionEvents: ['close']
})

server.listen(quicken.socketPath)

async function handleNextConnection() {
  const {value: socket, done} = await incomingConnections.next()

  if (done) {
    return
  }

  const input = ndjson.parse()
  const output = ndjson.stringify()
  socket.pipe(input)
  output.pipe(socket)

  process.stdout.write = (data) => {
    output.write({type: 'stdout', data})
  }

  process.stderr.write = (data) => {
    output.write({type: 'stderr', data})
  }

  input.on('data', async ({stop, cwd, binName, binPath, args}) => {
    server.unref()
    socket.unref()

    if (stop) {
      server.close()
    }

    try {
      const config = {
        ...require('./package.json').quicken,
        ...require(path.resolve('package.json')).quicken
      }
      const dependencies = config[binName]
      for (const dependency of dependencies) {
        const filePath = resolve.sync(dependency, {basedir: path.resolve()})
        delete require.cache[filePath]
      }

      delete require.cache[binPath]

      process.chdir(cwd)
      process.argv.splice(2, Number.POSITIVE_INFINITY, ...args)
      require(binPath)
    } catch {}
  })

  function simulateExit(code) {
    server.ref()
    output.end({type: 'exit', data: code})

    process.stdout.write = originalStdoutWrite
    process.stderr.write = originalStderrWrite

    process.exit = () => {}
    process.off('beforeExit', simulateExit)

    handleNextConnection()
  }

  process.exit = simulateExit
  process.on('beforeExit', simulateExit)
}

handleNextConnection()
