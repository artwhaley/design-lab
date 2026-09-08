import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'
import { JSDOM } from 'jsdom'

const productionOrigin = process.env.LOREFORGE_PRODUCTION_URL ?? 'http://127.0.0.1:3055'
const labOrigin = process.env.LOREFORGE_LAB_URL ?? 'http://127.0.0.1:4174'
const productionRoot = path.resolve(process.env.LOREFORGE_PRODUCTION_ROOT ?? '../sl-civic-archive')
const outputRoot = path.resolve('docs', 'parity', 'cross-host')
const reviewRoot = path.resolve('docs', 'parity', 'parity-review')
const browserExecutable = process.env.OBSIDIAN_CAPTURE_BROWSER ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const pixelThreshold = 0.005

const cases = [
  ['home', 'home', 'Home'],
  ['records', 'records', 'Records'],
  ['document', 'document', 'Document'],
  ['departments', 'departments', 'Departments'],
  ['department', 'department', 'Department detail'],
  ['about', 'about', 'About'],
  ['lore', 'lore', 'Lore'],
  ['members', 'members', 'Members'],
  ['work', 'work', 'Work'],
  ['management.departments', 'management-departments', 'Manage Departments'],
  ['management.folders', 'management-folders', 'Manage Folders'],
  ['management.roles', 'management-roles', 'Manage Roles'],
  ['management.documentTypes', 'management-document-types', 'Document Types'],
  ['management.people', 'management-people', 'Manage People'],
  ['management.person', 'management-person', 'Person workspace'],
  ['management.invitations', 'management-invitations', 'Manage Invitations'],
]
const viewports = [
  ['desktop-1440x1000', 1440, 1000, 'Source desktop'],
  ['compact-1024x900', 1024, 900, 'Tablet landscape'],
  ['mobile-390x844', 390, 844, 'Phone wide'],
]
const selectedCases = process.env.PARITY_SURFACE ? cases.filter(([surfaceKey]) => surfaceKey === process.env.PARITY_SURFACE) : cases
const selectedViewports = process.env.PARITY_VIEWPORT ? viewports.filter(([viewportName]) => viewportName === process.env.PARITY_VIEWPORT) : viewports

function gitHead(root) {
  try { return execFileSync('git', ['-c', `safe.directory=${root}`, '-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim() } catch { return null }
}

function treeHash(root) {
  const crypto = createHash('sha256')
  const files = execFileSync('node', [path.resolve('scripts', 'tree-hash.mjs'), root], { encoding: 'utf8' }).trim()
  crypto.update(files)
  return crypto.digest('hex')
}

async function settle(target) {
  await target.addStyleTag({
    content: `
      *, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }
    `,
  })
  await target.evaluate(async () => {
    await document.fonts.ready
    await new Promise((resolve) => setTimeout(resolve, 180))
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  })
}

function formatDom(html) {
  const document = new JSDOM(`<body>${html}</body>`).window.document
  const voidElements = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'])
  const escapeText = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  const escapeAttribute = (value) => escapeText(value).replaceAll('"', '&quot;')
  const skipGeneratedAttribute = (name, value, element) => {
    if (name === 'data-reactroot' || name === 'data-reactid' || name === 'nonce') return true
    if (['id', 'for', 'aria-controls', 'aria-labelledby', 'aria-describedby'].includes(name) && /^(radix-|:r)/.test(value)) return true
    if (name === 'name' && /^_R_|^_r_/.test(value)) return true
    if (name === 'draggable' && element.className.includes('arboristRow')) return true
    return false
  }
  const serialize = (node) => {
    if (node.nodeType === 3) return escapeText(node.nodeValue ?? '')
    if (node.nodeType !== 1) return ''
    const element = node
    const tag = element.tagName.toLowerCase()
    if (tag === 'input' && (element.getAttribute('name') ?? '').startsWith('$ACTION_')) return ''
    const hasServerActionFields = tag === 'form' && Boolean(element.querySelector('input[name^="$ACTION_"]'))
    const attributes = [...element.attributes]
      .filter((attribute) => !skipGeneratedAttribute(attribute.name, attribute.value, element))
      .filter((attribute) => !(tag === 'option' && attribute.name === 'selected'))
      .filter((attribute) => !(hasServerActionFields && (attribute.name === 'enctype' || attribute.name === 'method')))
      .map((attribute) => {
        let value = attribute.value
        if (attribute.name === 'style') {
          value = element.style.cssText
            .replace(/\b0px\b/g, '0')
            .replace(/-webkit-overflow-scrolling:\s*touch;?\s*/g, '')
        }
        if (attribute.name === 'action' && value.startsWith('javascript:throw new Error(')) value = ''
        if (attribute.name === 'tabindex' && (element.getAttribute('role') === 'tablist' || (element.getAttribute('role') === 'radiogroup' && element.className.includes('viewToggle')))) value = '-1'
        return [attribute.name, value]
      })
    if (tag === 'option' && element.selected) attributes.push(['selected', ''])
    attributes.sort(([left], [right]) => left.localeCompare(right))
    const opening = `<${tag}${attributes.map(([name, value]) => ` ${name}="${escapeAttribute(value)}"`).join('')}>`
    if (voidElements.has(tag)) return opening
    return `${opening}${[...element.childNodes].map(serialize).join('')}</${tag}>`
  }
  return [...document.body.childNodes].map(serialize).join('')
    .replace(/></g, '>\n<')
    .trim()
}

function domComparison(productionHtml, labHtml) {
  const productionLines = formatDom(productionHtml).split('\n')
  const labLines = formatDom(labHtml).split('\n')
  const differing = []
  const max = Math.max(productionLines.length, labLines.length)
  for (let index = 0; index < max; index += 1) {
    if (productionLines[index] !== labLines[index]) differing.push({ line: index + 1, production: productionLines[index] ?? '', lab: labLines[index] ?? '' })
  }
  return { equal: differing.length === 0, differingLines: differing.length, firstDifference: differing[0] ?? null, production: productionLines.length, lab: labLines.length }
}

function compareImages(expectedBuffer, actualBuffer) {
  const expected = PNG.sync.read(expectedBuffer)
  const actual = PNG.sync.read(actualBuffer)
  if (expected.width !== actual.width || expected.height !== actual.height) throw new Error(`Screenshot dimensions differ: ${expected.width}x${expected.height} vs ${actual.width}x${actual.height}`)
  const diff = new PNG({ width: expected.width, height: expected.height })
  const differingPixels = pixelmatch(expected.data, actual.data, diff.data, expected.width, expected.height, { threshold: 0.1 })
  return { width: expected.width, height: expected.height, ratio: differingPixels / (expected.width * expected.height), diffBuffer: PNG.sync.write(diff) }
}

async function screenshotLab(page, width, height) {
  const iframe = page.locator('iframe[data-testid="preview-iframe"]')
  const box = await iframe.boundingBox()
  if (!box) throw new Error('Lab preview iframe has no bounding box')
  const actualViewport = await page.frames().find((frame) => frame.url().includes('/preview.html'))?.evaluate(() => `${window.innerWidth}x${window.innerHeight}`)
  if (actualViewport !== `${width}x${height}`) throw new Error(`Lab viewport mismatch: expected ${width}x${height}, found ${actualViewport}`)
  return page.screenshot({ animations: 'disabled', clip: { x: Math.floor(box.x), y: Math.floor(box.y), width, height } })
}

async function rootHtml(target) {
  return target.locator('[data-template="obsidian"]').evaluate((element) => element.outerHTML)
}

async function parityInput(target) {
  const node = target.locator('[data-parity-input]')
  const attribute = await node.getAttribute('data-parity-input')
  const text = attribute && attribute.trim().startsWith('{') ? attribute : await node.textContent()
  if (!text) throw new Error('Parity input payload is missing')
  return JSON.parse(text)
}

async function fontGate(target) {
  return target.evaluate(() => {
    const root = document.querySelector('[data-template="obsidian"]')
    const heading = root?.querySelector('h1, h2, h3')
    const body = root?.querySelector('p, span, a')
    return {
      manrope: document.fonts.check('16px "Manrope Variable"'),
      instrument: document.fonts.check('32px "Instrument Serif"'),
      headingFamily: heading ? getComputedStyle(heading).fontFamily : null,
      bodyFamily: body ? getComputedStyle(body).fontFamily : null,
    }
  })
}

async function assetGate(target) {
  return target.evaluate(async () => {
    const root = document.querySelector('[data-template="obsidian"]')
    const paths = new Set()
    for (const image of [...document.images]) {
      if (image.currentSrc || image.src) paths.add(new URL(image.currentSrc || image.src, window.location.href).href)
    }
    for (const element of [root, document.documentElement, ...document.querySelectorAll('[style]')]) {
      if (!element) continue
      const style = getComputedStyle(element)
      for (const value of [style.backgroundImage, style.getPropertyValue('--obsidian-atmosphere')]) {
        const match = value.match(/url\(["']?([^"')]+)["']?\)/)
        if (match) paths.add(new URL(match[1], window.location.href).href)
      }
    }
    const result = {}
    for (const href of [...paths].filter((value) => new URL(value).pathname.startsWith('/design-assets/')).sort()) {
      const response = await fetch(href)
      if (!response.ok) throw new Error(`Bundled asset request failed: ${response.status} ${href}`)
      const bytes = await response.arrayBuffer()
      const digest = await crypto.subtle.digest('SHA-256', bytes)
      result[new URL(href).pathname] = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
    }
    return result
  })
}

function expectedProductionUrl(slug) {
  return slug === 'home' ? `${productionOrigin}/design-parity` : `${productionOrigin}/design-parity/${slug}`
}

async function main() {
  await rm(outputRoot, { recursive: true, force: true })
  await rm(reviewRoot, { recursive: true, force: true })
  await mkdir(outputRoot, { recursive: true })
  for (const viewport of selectedViewports) await mkdir(path.join(reviewRoot, viewport[0]), { recursive: true })
  await mkdir(path.join(reviewRoot, 'dom'), { recursive: true })
  await mkdir(path.join(reviewRoot, 'inputs'), { recursive: true })

  const browser = await chromium.launch({ headless: true, executablePath: browserExecutable })
  const browserVersion = browser.version()
  const productionContext = await browser.newContext({ locale: 'en-US', timezoneId: 'UTC', deviceScaleFactor: 1 })
  const labContext = await browser.newContext({ locale: 'en-US', timezoneId: 'UTC', deviceScaleFactor: 1 })
  const productionPage = await productionContext.newPage()
  const labPage = await labContext.newPage()
  await labPage.setViewportSize({ width: 2400, height: 1600 })
  const results = []
  try {
    await labPage.goto(`${labOrigin}/?fixture=production-preview`, { waitUntil: 'networkidle' })
    await labPage.locator('#lab-design-select').selectOption('obsidian')
    await labPage.getByRole('tab', { name: 'View', exact: true }).click()
    for (const [viewportName, width, height, viewportLabel] of selectedViewports) {
      await labPage.locator('#lab-viewport-preset').selectOption({ label: viewportLabel })
      for (const [surfaceKey, surfaceSlug, labLabel] of selectedCases) {
        await productionPage.setViewportSize({ width, height })
        const productionResponse = await productionPage.goto(expectedProductionUrl(surfaceSlug), { waitUntil: 'networkidle' })
        if (!productionResponse || productionResponse.status() !== 200) throw new Error(`Production parity route ${surfaceSlug} returned ${productionResponse?.status() ?? 'no response'}`)
        await settle(productionPage)

        const frame = labPage.frames().find((candidate) => candidate.url().includes('/preview.html'))
        if (!frame) throw new Error('Lab preview frame is missing')
        await labPage.locator('nav[aria-label="Design Lab surfaces"] button').filter({ hasText: labLabel }).first().click()
        await frame.locator('[data-testid="preview-renderer"]').waitFor()
        await settle(frame)

        const productionInput = await parityInput(productionPage)
        const labInput = await parityInput(frame)
        const inputEqual = JSON.stringify(productionInput) === JSON.stringify(labInput)
        if (!inputEqual) {
          console.error(JSON.stringify({ surfaceKey, viewportName, productionInput, labInput }, null, 2))
          throw new Error(`Semantic input mismatch for ${surfaceKey} at ${viewportName}`)
        }

        const productionHtml = await rootHtml(productionPage)
        const labHtml = await rootHtml(frame)
        const dom = domComparison(productionHtml, labHtml)
        const productionRaw = await productionPage.screenshot({ animations: 'disabled' })
        const labRaw = await screenshotLab(labPage, width, height)
        const raw = compareImages(productionRaw, labRaw)
        const productionFonts = await fontGate(productionPage)
        const labFonts = await fontGate(frame)
        const productionAssets = await assetGate(productionPage)
        const labAssets = await assetGate(frame)
        const assetsEqual = JSON.stringify(productionAssets) === JSON.stringify(labAssets)

        const baseName = `${viewportName}-${surfaceSlug}`
        await writeFile(path.join(outputRoot, `${baseName}-production.png`), productionRaw)
        await writeFile(path.join(outputRoot, `${baseName}-lab.png`), labRaw)
        await writeFile(path.join(outputRoot, `${baseName}-diff.png`), raw.diffBuffer)
        await writeFile(path.join(reviewRoot, viewportName, `${surfaceSlug}-production.png`), productionRaw)
        await writeFile(path.join(reviewRoot, viewportName, `${surfaceSlug}-lab.png`), labRaw)
        await writeFile(path.join(reviewRoot, viewportName, `${surfaceSlug}-diff.png`), raw.diffBuffer)
        await writeFile(path.join(reviewRoot, 'dom', `${viewportName}-${surfaceSlug}-production.html`), `${formatDom(productionHtml)}\n`)
        await writeFile(path.join(reviewRoot, 'dom', `${viewportName}-${surfaceSlug}-lab.html`), `${formatDom(labHtml)}\n`)
        await writeFile(path.join(reviewRoot, 'dom', `${viewportName}-${surfaceSlug}.diff`), dom.equal ? 'No normalized DOM differences.\n' : `${JSON.stringify(dom, null, 2)}\n`)
        await writeFile(path.join(reviewRoot, 'inputs', `${viewportName}-${surfaceSlug}-production.json`), `${JSON.stringify(productionInput, null, 2)}\n`)
        await writeFile(path.join(reviewRoot, 'inputs', `${viewportName}-${surfaceSlug}-lab.json`), `${JSON.stringify(labInput, null, 2)}\n`)

        results.push({
          viewport: viewportName,
          surface: surfaceKey,
          productionUrl: expectedProductionUrl(surfaceSlug),
          labSurface: surfaceSlug,
          inputEqual,
          dom,
          raw: { width: raw.width, height: raw.height, ratio: raw.ratio },
          fonts: { production: productionFonts, lab: labFonts },
          assets: { production: productionAssets, lab: labAssets, equal: assetsEqual },
          pass: dom.equal && assetsEqual && raw.ratio <= pixelThreshold,
        })
        await productionPage.goto(`${productionOrigin}/design-parity`, { waitUntil: 'networkidle' })
        await labPage.reload({ waitUntil: 'networkidle' })
        await labPage.locator('#lab-design-select').selectOption('obsidian')
        await labPage.getByRole('tab', { name: 'View', exact: true }).click()
        await labPage.locator('#lab-viewport-preset').selectOption({ label: viewportLabel })
      }
    }
  } finally {
    await productionContext.close()
    await labContext.close()
    await browser.close()
  }

  const failures = results.filter((result) => !result.pass)
  const manifest = {
    generatedAt: new Date().toISOString(),
    browser: { engine: 'Chromium', version: browserVersion, executable: browserExecutable, deviceScaleFactor: 1, locale: 'en-US', timezone: 'UTC', reducedMotion: false },
    production: { origin: productionOrigin, root: productionRoot, head: gitHead(productionRoot) },
    lab: { origin: labOrigin, root: path.resolve('.'), head: gitHead(path.resolve('.')) },
    design: { key: 'obsidian', fixture: 'production-preview', folderTreeHash: treeHash(path.resolve('src', 'designs', 'obsidian')) },
    thresholds: {
      changedPixelRatio: pixelThreshold,
      dom: 'exact after the explicit runtime-noise normalization listed below',
      domNormalization: [
        'CSS module scopes are matched by Lab Vite production-shaped namespaces; authored classes remain part of the comparison.',
        'DOM attributes are sorted and inline-style serialization is canonicalized (including 0px to 0); authored text, classes, and values remain part of the comparison.',
        'Only generated runtime noise is normalized: React hydration attributes and nonce, React useId names, Radix focus tabindex, React server-action hidden scaffolding/placeholders, and react-arborist draggable/scroll markers.',
      ],
    },
    surfaces: cases.map(([key, slug]) => ({ key, slug })),
    viewports: viewports.map(([name, width, height]) => ({ name, width, height })),
    results,
    summary: { cases: results.length, failures: failures.length, maxChangedPixelRatio: Math.max(...results.map((result) => result.raw.ratio)), domMismatches: results.filter((result) => !result.dom.equal).length, inputMismatches: results.filter((result) => !result.inputEqual).length, assetMismatches: results.filter((result) => !result.assets.equal).length },
  }
  await writeFile(path.join(outputRoot, 'results.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  await writeFile(path.join(reviewRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  await writeFile(path.join(reviewRoot, 'README.md'), `# Obsidian parity review packet

This packet is the Phase 2 automated evidence for the production Obsidian oracle versus the Design Lab.

## Automated result

- 16 Class A surfaces × 3 viewports = 48 deterministic comparisons.
- Desktop: 1440×1000; compact: 1024×900; mobile: 390×844.
- Pixel threshold: 0.5%; observed maximum: ${(manifest.summary.maxChangedPixelRatio * 100).toFixed(3)}%.
- DOM mismatches: ${manifest.summary.domMismatches} after the explicit runtime-noise normalization listed in manifest.json.
- Semantic input mismatches: ${manifest.summary.inputMismatches}.
- Asset mismatches: ${manifest.summary.assetMismatches}.

Use manifest.json for the machine-readable result, the viewport directories for side-by-side production/Lab/diff images, dom/ for canonicalized DOM captures, and inputs/ for production-oracle input records.

## Required human review

P2-GATE is not satisfied by automation alone. Review the packet side by side with the running production and Lab hosts for the packet's Class A list, including one shared editor/tool inside Shell and the Site Studio preview. Check navigation order and active state, OperatingContext, typography, atmosphere/default imagery, geometry, dialogs/menus/portals, Records controls, management workbenches, empty states, Studio override/reset, and mobile media-query behavior.

Also review the folder-tree parity output, production-oracle JSON comparison, and the P2-T13 Lab-to-production portability note before approving the gate.

The exact owner approval sentence is in LoreForge_CompileTime_Design_Parity_Patch_Packet/tickets/PHASE_2_DESIGN_LAB_EXACT_PARITY/P2-GATE_HUMAN_PARITY.md.
`)
  console.log(`Cross-host parity complete: ${results.length} deterministic route/viewport pairs; failures: ${failures.length}; max changed pixels: ${(manifest.summary.maxChangedPixelRatio * 100).toFixed(3)}%`)
  for (const result of results) console.log(`${result.viewport} ${result.surface}: pixels=${(result.raw.ratio * 100).toFixed(3)}% dom=${result.dom.equal ? 'PASS' : 'FAIL'} assets=${result.assets.equal ? 'PASS' : 'FAIL'}`)
  if (failures.length > 0) {
    for (const result of failures) console.error(`FAIL ${result.viewport} ${result.surface}: pixels=${result.raw.ratio} dom=${result.dom.equal} assets=${result.assets.equal}`)
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error))
  process.exitCode = 1
})
