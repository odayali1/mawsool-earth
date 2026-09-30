import { execFileSync } from 'node:child_process'
import { createWriteStream, existsSync, mkdirSync } from 'node:fs'
import { arch, platform, version } from 'node:process'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

const NODE_VERSION = '22.23.3'
const ROLLDOWN_VERSION = '1.2.11'

function supported(nodeVersion) {
  const match = /^v(\d+)\.(\d+)/.exec(nodeVersion)
  if (!match) return true
  const major = Number(match[1])
  const minor = Number(match[2])
  if (major === 20) return minor >= 19
  if (major === 22) return minor >= 12
  return major > 22
}

function run(command, args, env = process.env) {
  execFileSync(command, args, { stdio: 'inherit', env })
}

function compile(nodeBin, env = process.env) {
  run(nodeBin, ['node_modules/typescript/bin/tsc', '--noEmit'], env)
  run(nodeBin, ['node_modules/vite/bin/vite.js', 'build'], env)
}

function cpu() {
  if (arch === 'arm64') return 'arm64'
  if (arch === 'x64') return 'x64'
  return null
}

async function installNode(targetCpu) {
  const dest = '/opt/node'
  const bin = `${dest}/bin/node`
  if (existsSync(bin)) return bin
  mkdirSync(dest, { recursive: true })
  const url = `https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-${targetCpu}.tar.gz`
  console.log(`Installing Node ${NODE_VERSION} for linux-${targetCpu}`)
  const response = await fetch(url)
  if (!response.ok) {
    console.error(`Could not download Node ${NODE_VERSION}: ${response.status}`)
    process.exit(1)
  }
  const archive = '/tmp/node-v22.tar.gz'
  await pipeline(Readable.fromWeb(response.body), createWriteStream(archive))
  execFileSync('tar', ['-xzf', archive, '-C', dest, '--strip-components=1'], { stdio: 'inherit' })
  return bin
}

const targetCpu = cpu()
const binding = targetCpu ? `@rolldown/binding-linux-${targetCpu}-gnu` : null
const bindingMissing = platform === 'linux' && binding && !existsSync(`node_modules/${binding}`)

if (platform === 'linux' && (!supported(version) || bindingMissing)) {
  if (!targetCpu) {
    console.error(`Unsupported architecture: ${arch}`)
    process.exit(1)
  }
  const nodeBin = supported(version) ? process.execPath : await installNode(targetCpu)
  const npm = nodeBin.replace(/[/\\]node$/, '/npm')
  const env = {
    ...process.env,
    PATH: `${nodeBin.slice(0, nodeBin.lastIndexOf('/'))}:${process.env.PATH ?? ''}`,
  }
  console.log(`Using ${execFileSync(nodeBin, ['-v'], { env }).toString().trim()}`)
  if (binding && !existsSync(`node_modules/${binding}`)) {
    run(npm, ['install', '--no-save', '--include=optional', `${binding}@${ROLLDOWN_VERSION}`], env)
  }
  compile(nodeBin, env)
} else {
  compile(process.execPath)
}
