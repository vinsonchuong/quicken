const {promises: fs} = require('fs')
const path = require('path')
const {promisify} = require('util')
const npm = require('npm')
const {stripIndent} = require('common-tags')

module.exports = async function () {
  await promisify(npm.load)()

  const packageJson = JSON.parse(
    await fs.readFile(path.resolve('package.json'), 'utf-8')
  )
  for (const [binName] of Object.entries(packageJson.quicken)) {
    try {
      const binPath = path.resolve(npm.bin, binName)
      const actualBinPath = path.resolve(npm.bin, await fs.readlink(binPath))

      await fs.unlink(binPath)
      await fs.writeFile(
        binPath,
        stripIndent`
          #!/usr/bin/env node
          'use strict'
          require('quicken').run('${binName}', '${actualBinPath}', process.argv.slice(2))
        `
      )
      await fs.chmod(binPath, 0o755)
    } catch (error) {
      if (error.code !== 'EINVAL') {
        throw error
      }
    }
  }
}
