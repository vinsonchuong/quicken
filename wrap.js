const {promisify} = require('util')
const {promises: fs} = require('fs')
const path = require('path')
const childProcess = require('child_process')
const {stripIndent} = require('common-tags')

const exec = promisify(childProcess.exec)

module.exports = async function () {
  const {stdout} = await exec('npm bin')
  const npmBinDir = stdout.trim()

  const packageJson = JSON.parse(
    await fs.readFile(path.resolve('package.json'), 'utf-8')
  )
  for (const [binName] of Object.entries(packageJson.quicken)) {
    try {
      const binPath = path.resolve(npmBinDir, binName)
      const actualBinPath = path.resolve(npmBinDir, await fs.readlink(binPath))

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
