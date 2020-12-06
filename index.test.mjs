import test from 'ava'
import * as path from 'path'
import * as childProcess from 'child_process'
import {promisify} from 'util'
import fs from 'fs-extra'
import tempy from 'tempy'
import commonTags from 'common-tags'

const exec = promisify(childProcess.exec)

test('speeding up xo', async (t) => {
  const projectDir = tempy.directory()

  await fs.outputJson(
    path.join(projectDir, 'package.json'),
    {
      quicken: {
        xo: [
          'xo/cli-main.js'
        ]
      }
    }
  )

  await fs.outputFile(
    path.join(projectDir, 'index.js'),
    commonTags.stripIndent`
    console.log('Hello World!')
    `
  )

  await exec(`yarn add xo file:${path.resolve()}`, {cwd: projectDir})

  await exec('yarn quicken', {cwd: projectDir})

  const firstRunStart = Date.now()
  try {
    await exec('yarn xo', {cwd: projectDir})
    t.fail()
  } catch (error) {
    t.log(`First run: ${Date.now() - firstRunStart}ms`)
    t.log(error.stdout)

    t.true(error.stdout.includes('eol-last'))
    t.true(error.stdout.includes('semi'))
    t.true(error.stdout.includes('2 errors'))
  }

  const secondRunStart = Date.now()
  try {
    await exec('yarn xo', {cwd: projectDir})
    t.fail()
  } catch (error) {
    t.log(`Second run: ${Date.now() - secondRunStart}ms`)
    t.log(error.stdout)

    t.true(error.stdout.includes('eol-last'))
    t.true(error.stdout.includes('semi'))
    t.true(error.stdout.includes('2 errors'))
  }

  await exec('yarn quicken stop', {cwd: projectDir})
})
