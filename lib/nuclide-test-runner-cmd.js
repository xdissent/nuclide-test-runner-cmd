'use babel'

const fs = require('fs')
const path = require('path')
const {spawn} = require('child_process')

const PASSED  = 1
const FAILED  = 2

class CmdTestRunner {
  constructor (uri, cmd, args, sentinel) {
    this.uri = uri
    this.cmd = cmd
    this.args = args
    this.sentinel = sentinel
  }

  do (fn) {
    this.msg = fn
    return this
  }

  finally (fn) {
    this.done = fn
    return this
  }

  subscribe () {
    this.run()
    return this
  }

  unsubscribe = () => this

  cwd (dir = path.dirname(this.uri)) {
    return new Promise((resolve, reject) => {
      fs.stat(path.join(dir, this.sentinel), (err, stat) => {
        if (!err) return resolve(dir)
        const dir_ = path.dirname(dir)
        if (dir === dir_) return reject(err)
        resolve(this.cwd(dir_))
      })
    })
  }

  exec = (cwd) => {
    this.msg({kind: 'start'})
    const start = Date.now()
    return new Promise((resolve, reject) => {
      let errored = false
      let stdout = ''
      let stderr = ''
      const flush = () => stderr && this.msg({kind: 'stderr', data: stderr})
      const child = spawn(this.cmd, this.args, {cwd})
      child.stdout.on('data', d => stdout += d.toString())
      child.stderr.on('data', d => {
        const lines = (stderr + d.toString()).split('\n')
        stderr = lines.pop()
        lines.forEach(data => this.msg({kind: 'stderr', data}))
      })
      child.on('error', err => {
        errored = true
        flush()
        reject(err)
      })
      child.on('close', code => {
        if (errored) return
        flush()
        this.msg({
          kind: 'run-test',
          testInfo: {
            details: stdout,
            name: [this.cmd].concat(this.args).join(' '),
            durationSecs: (Date.now() - start) / 1000,
            status: code === 0 ? PASSED : FAILED
          }
        })
        resolve()
      })
    })
  }

  error = (err) => {
    this.msg({kind: 'error', error: err})
  }

  run () {
    return this.cwd()
      .then(this.exec)
      .catch(this.error)
      .then(this.done)
  }
}

export default {
  config: {
    command: {
      type: 'string',
      default: 'npm'
    },
    args: {
      type: 'array',
      default: ['test'],
      items: {
        type: 'string'
      }
    },
    label: {
      type: 'string',
      default: 'npm test'
    },
    sentinel: {
      type: 'string',
      default: 'package.json'
    }
  },
  provideTestRunner () {
    const cmd = atom.config.get('nuclide-test-runner-cmd.command')
    const args = atom.config.get('nuclide-test-runner-cmd.args')
    const label = atom.config.get('nuclide-test-runner-cmd.label')
    const sentinel = atom.config.get('nuclide-test-runner-cmd.sentinel')
    return {
      label: label,
      runTest (uri) {
        return new CmdTestRunner(uri, cmd, args, sentinel)
      }
    }
  }
}
