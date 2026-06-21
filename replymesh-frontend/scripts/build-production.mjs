import { existsSync, readdirSync, readFileSync, renameSync } from 'node:fs'
import { extname, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const localEnv = new URL('../.env.local', import.meta.url)
const heldEnv = new URL('../.env.local.production-hold', import.meta.url)
const productionApi = 'https://api.replymesh.cloud/api/v1'
const forbidden = [
  'http://localhost:3010/api/v1',
  'http://127.0.0.1:3010/api/v1',
  'qa-pizza',
]

const collectFiles = directory => readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const path = join(directory, entry.name)
  return entry.isDirectory() ? collectFiles(path) : [path]
})

if (existsSync(heldEnv)) {
  throw new Error('Arquivo temporario .env.local.production-hold ja existe. Verifique o build anterior.')
}

let envWasHeld = false

try {
  if (existsSync(localEnv)) {
    renameSync(localEnv, heldEnv)
    envWasHeld = true
  }

  const result = spawnSync(
    process.execPath,
    [fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url)), 'build'],
    {
      cwd: root,
      env: { ...process.env, VITE_API_URL: productionApi },
      stdio: 'inherit',
    },
  )

  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`Falha no Vite com codigo ${result.status || 1}.`)

  const files = collectFiles(fileURLToPath(new URL('../dist', import.meta.url)))
    .filter(file => ['.html', '.js', '.css', '.json'].includes(extname(file)))
  const contents = files.map(file => readFileSync(file, 'utf8')).join('\n')
  const leakedValue = forbidden.find(value => contents.includes(value))

  if (leakedValue) {
    throw new Error(`Build de producao bloqueado: configuracao proibida encontrada (${leakedValue}).`)
  }
  if (!contents.includes(productionApi)) {
    throw new Error('Build de producao bloqueado: URL oficial da API nao encontrada.')
  }

  console.log('Build Master validado: API de producao ativa e nenhuma configuracao DEV/QA encontrada.')
} finally {
  if (envWasHeld && existsSync(heldEnv)) renameSync(heldEnv, localEnv)
}
