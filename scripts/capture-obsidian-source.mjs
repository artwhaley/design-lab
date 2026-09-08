import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import process from 'node:process'
import { chromium } from 'playwright'

const SOURCE_REPOSITORY = path.resolve('..', 'obsidian-incubation')
const SOURCE_SHA = 'fc22e6c7db7da05b6166e2f126c5e6c9e6a20223'
const SOURCE_ORIGIN = 'http://127.0.0.1:3066'
const BASE_PATH = '/domain/aster-reach'
const GOLDEN_ROOT = path.resolve('tests', 'visual', 'goldens', 'obsidian-source', SOURCE_SHA.slice(0, 7))

const viewports = [
  { name: 'desktop-1440x1000', width: 1440, height: 1000 },
  { name: 'mobile-390x844', width: 390, height: 844 },
]

const routes = [
  { name: 'home', path: BASE_PATH },
  { name: 'records', path: `${BASE_PATH}/records` },
  { name: 'document', path: `${BASE_PATH}/documents/1` },
  { name: 'departments', path: `${BASE_PATH}/departments` },
  { name: 'department-detail', path: `${BASE_PATH}/departments/northwatch-council` },
  { name: 'about', path: `${BASE_PATH}/about` },
  { name: 'lore', path: `${BASE_PATH}/lore` },
  { name: 'lore-detail', path: `${BASE_PATH}/lore/northwatch` },
  { name: 'character-profile', path: `${BASE_PATH}/characters/elara` },
  { name: 'folders', path: `${BASE_PATH}/manage/folders` },
  { name: 'document-types', path: `${BASE_PATH}/document-types` },
  { name: 'roles', path: `${BASE_PATH}/roles` },
  { name: 'people', path: `${BASE_PATH}/manage/people` },
  { name: 'work', path: `${BASE_PATH}/work` },
]

const fixtureRoutes = [
  { state: 'visitor', query: 'fixture=visitor', routes: ['home', 'records'] },
  { state: 'empty', query: 'fixture=empty', routes: ['home', 'records'] },
]

function gitHead() {
  return execFileSync('git', ['-c', `safe.directory=${SOURCE_REPOSITORY}`, '-C', SOURCE_REPOSITORY, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
}

function fileHash(buffer) {
  return createHash('sha256').update(buffer).digest('hex')
}

async function settle(page) {
  await page.waitForLoadState('networkidle')
  await page.evaluate(async () => {
    await document.fonts.ready
    document.documentElement.dataset.capture = 'settled'
  })
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        caret-color: transparent !important;
      }
    `,
  })
  await page.waitForTimeout(250)
}

async function capture(page, route, state, viewport) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height })
  const suffix = state === 'default' ? '' : `?${state === 'visitor' ? 'fixture=visitor' : 'fixture=empty'}`
  const url = `${SOURCE_ORIGIN}${route.path}${suffix}`
  await page.goto(url, { waitUntil: 'networkidle' })
  await settle(page)
  const outputDirectory = path.join(GOLDEN_ROOT, viewport.name)
  const outputPath = path.join(outputDirectory, `${route.name}${state === 'default' ? '' : `-${state}`}.png`)
  await mkdir(outputDirectory, { recursive: true })
  await page.screenshot({ path: outputPath, animations: 'disabled' })
  const buffer = await readFile(outputPath)
  return {
    file: path.relative(GOLDEN_ROOT, outputPath).replaceAll(path.sep, '/'),
    sha256: fileHash(buffer),
    route: route.path,
    state,
    viewport: `${viewport.width}x${viewport.height}`,
    url,
  }
}

async function main() {
  const head = gitHead()
  if (head !== SOURCE_SHA) {
    throw new Error(`Source checkout is not frozen at ${SOURCE_SHA}; found ${head}`)
  }
  await mkdir(GOLDEN_ROOT, { recursive: true })
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.OBSIDIAN_CAPTURE_BROWSER ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  })
  const browserVersion = browser.version()
  const results = []
  try {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()
    for (const viewport of viewports) {
      for (const route of routes) results.push(await capture(page, route, 'default', viewport))
      for (const fixture of fixtureRoutes) {
        for (const routeName of fixture.routes) {
          const route = routes.find((candidate) => candidate.name === routeName)
          results.push(await capture(page, route, fixture.state, viewport))
        }
      }
    }
    await context.close()
  } finally {
    await browser.close()
  }
  await writeFile(
    path.join(GOLDEN_ROOT, 'manifest.json'),
    `${JSON.stringify({ sourceSha: SOURCE_SHA, sourceOrigin: SOURCE_ORIGIN, browser: `Chrome ${browserVersion}`, reducedMotion: true, waitFor: ['networkidle', 'document.fonts.ready', '250ms settle'], captures: results }, null, 2)}\n`,
  )
  console.log(`Captured ${results.length} source goldens under ${GOLDEN_ROOT}`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
