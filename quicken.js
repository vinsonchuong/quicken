#!/usr/bin/env node
const {wrap, stop} = require('./index.js')

if (process.argv[2] === 'stop') {
  stop()
} else {
  wrap()
}
