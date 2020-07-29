# quicken
[![npm](https://img.shields.io/npm/v/quicken.svg)](https://www.npmjs.com/package/quicken)
[![CI Status](https://github.com/vinsonchuong/quicken/workflows/CI/badge.svg)](https://github.com/vinsonchuong/quicken/actions?query=workflow%3ACI)
[![dependencies Status](https://david-dm.org/vinsonchuong/quicken/status.svg)](https://david-dm.org/vinsonchuong/quicken)
[![devDependencies Status](https://david-dm.org/vinsonchuong/quicken/dev-status.svg)](https://david-dm.org/vinsonchuong/quicken?type=dev)

Speed up slow-to-start CLI commands

CLI tools like ESLint, and its many wrappers, are slow mainly due to how long it
takes to load all of the configured plugins. This loading cost is incurred every
time the command is run.

`quicken` caches the loaded code in a long-running process so that the loading
cost is incurred exactly once.

## Usage
Install [`quicken`](https://www.npmjs.com/package/quicken)
by running:

```sh
yarn add quicken
```

`quicken` assumes that the command is a bin provided by a package installed in
the current project, e.g., `./node_modules/.bin/xo` provided the by `xo`
package. It also assumes that the bin is a JavaScript file.

Node.js caches all imported files; so, after running a command once, running it
again requires first clearing from cache the files that need to be re-evaluated.
`quicken` will clear the executable file but will not know about other files
that need to be cleared. Let `quicken` know about these files, by module path,
by adding to `package.json`:

```
{
  "quicken": {
    "xo": [
      "xo/cli-main.js"
    ]
  }
}
```

If no additional files need to be cleared, leave the array empty.

Then, create wrappers for the configured commands by running:

```
quicken
```

The wrapped commands should behave exactly like the original commands.

The wrapped commands spawn a background process. To stop that process, run:

```
quicken stop
```
