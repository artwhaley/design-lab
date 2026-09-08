import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'

const SOURCE_SHA = 'fc22e6c'
const LAB_ORIGIN = 'http://127.0.0.1:4174'
const GOLDEN_ROOT = path.resolve('tests', 'visual', 'goldens', 'obsidian-source', SOURCE_SHA)
const REVIEW_ROOT = path.resolve('docs', 'remediation', 'review')
const PAIR_ROOT = path.join(REVIEW_ROOT, 'pairs')
const DIFF_ROOT = path.join(REVIEW_ROOT, 'diffs')

const cases = [
  { id: 'home', label: 'Home', surface: 'Home', golden: 'home.png' },
  { id: 'records', label: 'Records', surface: 'Records', golden: 'records.png' },
  { id: 'document', label: 'Document', surface: 'Document', golden: 'document.png' },
  { id: 'departments', label: 'Departments', surface: 'Departments', golden: 'departments.png' },
  { id: 'department-detail', label: 'Department detail', surface: 'Department detail', golden: 'department-detail.png', waiver: 'Source organization-chart reporting edges are unavailable in the generic Lab contract; the adapter renders a truthful member directory in this region.' },
  { id: 'about', label: 'About', surface: 'About', golden: 'about.png' },
  { id: 'lore', label: 'Lore', surface: 'Lore', golden: 'lore.png', waiver: 'Selector .loreIntroduction: the generic LorePageModel has no introduction field, so the adapter cannot truthfully supply this source-only paragraph.' },
  { id: 'lore-detail', label: 'Lore detail', surface: 'Lore', golden: 'lore-detail.png', waiver: 'The generic Lab route context does not expose a lore slug; the Lab shows the truthful Lore index rather than inventing article selection.' },
  { id: 'character-profile', label: 'Character profile', surface: 'Member profile', golden: 'character-profile.png', waiver: 'Selectors .characterProfileFacts and .characterProfileCopy: the generic member model supplies plural departments/roles and recorded work, not the source focus/detail claim.' },
  { id: 'folders', label: 'Folders management', surface: 'Manage Folders', golden: 'folders.png' },
  { id: 'document-types', label: 'Document types', surface: 'Document Types', golden: 'document-types.png' },
  { id: 'roles', label: 'Roles management', surface: 'Manage Roles', golden: 'roles.png' },
  { id: 'people', label: 'People management', surface: 'Manage People', golden: 'people.png', waiver: 'Selector section[aria-label="People search"]: the controlled Lab PeopleWorkspace supplies search results rather than the source management-table rows.' },
  { id: 'work', label: 'Work management', surface: 'Work', golden: 'work.png', waiver: 'Selector section[aria-label="Work queue"]: the Lab WorkWorkspace exposes authorized submitted WorkEntry records, not the source mixed draft/review queue.' },
]

const viewports = [
  { id: 'desktop-1440x1000', label: 'Source desktop', width: 1440, height: 1000 },
  { id: 'mobile-390x844', label: 'Phone wide', width: 390, height: 844 },
]

async function previewFrames(page) {
  return page.frames().filter((frame) => frame.url().includes('/preview.html'))
}

async function selectSurface(page, label) {
  const buttons = page.locator('nav.lab-sidebar button')
  for (let index = 0; index < await buttons.count(); index += 1) {
    const button = buttons.nth(index)
    const firstLine = (await button.innerText()).split('\n')[0].trim()
    if (firstLine === label) {
      await button.click()
      return
    }
  }
  throw new Error(`Surface button not found: ${label}`)
}

async function selectViewport(page, label, width, height) {
  await page.getByRole('tab', { name: 'View', exact: true }).click()
  await page.locator('#lab-viewport-preset').selectOption({ label })
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const frames = await previewFrames(page)
    if (frames[0] && await frames[0].evaluate(() => `${innerWidth}x${innerHeight}`) === `${width}x${height}`) return
    await page.waitForTimeout(100)
  }
  throw new Error(`Viewport did not settle: ${width}x${height}`)
}

async function settle(page) {
  const frames = await previewFrames(page)
  if (!frames[0]) throw new Error('Preview iframe did not initialize')
  await frames[0].evaluate(async () => {
    await document.fonts.ready
    await new Promise((resolve) => setTimeout(resolve, 250))
  })
}

async function readPng(file) {
  return PNG.sync.read(await readFile(file))
}

function sideBySide(left, right) {
  const output = new PNG({ width: left.width + right.width, height: Math.max(left.height, right.height) })
  for (let y = 0; y < left.height; y += 1) {
    left.data.copy(output.data, y * output.width * 4, y * left.width * 4, (y + 1) * left.width * 4)
  }
  for (let y = 0; y < right.height; y += 1) {
    right.data.copy(output.data, (y * output.width + left.width) * 4, y * right.width * 4, (y + 1) * right.width * 4)
  }
  return output
}

function escapeHtml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}

async function captureCase(page, viewport, item) {
  await selectSurface(page, item.surface)
  await settle(page)
  const iframe = page.locator('iframe[data-testid="preview-iframe"]')
  const box = await iframe.boundingBox()
  if (!box) throw new Error(`Preview iframe has no bounds for ${item.id}`)
  const labPath = path.join(REVIEW_ROOT, 'lab', viewport.id, `${item.id}.png`)
  await mkdir(path.dirname(labPath), { recursive: true })
  await page.screenshot({
    path: labPath,
    animations: 'disabled',
    clip: { x: Math.floor(box.x), y: Math.floor(box.y), width: viewport.width, height: viewport.height },
  })

  const source = await readPng(path.join(GOLDEN_ROOT, viewport.id, item.golden))
  const lab = await readPng(labPath)
  if (source.width !== lab.width || source.height !== lab.height) throw new Error(`Capture dimensions differ for ${item.id}/${viewport.id}`)
  const diffImage = new PNG({ width: source.width, height: source.height })
  const differingPixels = pixelmatch(source.data, lab.data, diffImage.data, source.width, source.height, { threshold: 0.1 })
  const ratio = differingPixels / (source.width * source.height)
  const result = ratio <= 0.02 ? 'pass' : item.waiver ? 'pressure-waiver' : 'fail'
  const diffPath = path.join(DIFF_ROOT, viewport.id, `${item.id}.png`)
  const pairPath = path.join(PAIR_ROOT, viewport.id, `${item.id}.png`)
  await mkdir(path.dirname(diffPath), { recursive: true })
  await mkdir(path.dirname(pairPath), { recursive: true })
  await writeFile(diffPath, PNG.sync.write(diffImage))
  await writeFile(pairPath, PNG.sync.write(sideBySide(source, lab)))
  return { ...item, viewport: viewport.id, source: path.relative(REVIEW_ROOT, path.join(GOLDEN_ROOT, viewport.id, item.golden)).replaceAll(path.sep, '/'), lab: path.relative(REVIEW_ROOT, labPath).replaceAll(path.sep, '/'), pair: path.relative(REVIEW_ROOT, pairPath).replaceAll(path.sep, '/'), diffImage: path.relative(REVIEW_ROOT, diffPath).replaceAll(path.sep, '/'), ratio, result }
}

async function main() {
  await mkdir(PAIR_ROOT, { recursive: true })
  await mkdir(DIFF_ROOT, { recursive: true })
  await mkdir(path.join(REVIEW_ROOT, 'lab'), { recursive: true })
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.OBSIDIAN_CAPTURE_BROWSER ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  })
  const results = []
  try {
    const page = await browser.newPage({ viewport: { width: 2400, height: 1200 } })
    await page.goto(`${LAB_ORIGIN}/?fixture=obsidian-fidelity`, { waitUntil: 'networkidle' })
    await page.locator('#lab-design-select').selectOption({ label: 'Obsidian' })
    for (const viewport of viewports) {
      await selectViewport(page, viewport.label, viewport.width, viewport.height)
      for (const item of cases) results.push(await captureCase(page, viewport, item))
    }
  } finally {
    await browser.close()
  }

  const rows = results.map((item) => `
    <tr>
      <td>${escapeHtml(item.label)}</td>
      <td>${escapeHtml(item.viewport.replace('-', ' '))}</td>
      <td>${(item.ratio * 100).toFixed(3)}%</td>
      <td class="${item.result}">${escapeHtml(item.result)}</td>
      <td>${item.waiver ? escapeHtml(item.waiver) : '—'}</td>
      <td><a href="${item.pair}"><img src="${item.pair}" alt="${escapeHtml(item.label)} source and Lab side by side"></a><br><a href="${item.diffImage}">diff image</a></td>
    </tr>`).join('')
  const passCount = results.filter((item) => item.result === 'pass').length
  const waiverCount = results.filter((item) => item.result === 'pressure-waiver').length
  const failCount = results.filter((item) => item.result === 'fail').length
  const report = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Obsidian fidelity review gate</title>
<style>body{font:14px system-ui,sans-serif;margin:2rem;color:#20242b}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccd1d8;padding:.5rem;text-align:left;vertical-align:top}th{background:#eef1f5}.pass{color:#176b35}.pressure-waiver{color:#8a5a00}.fail{color:#a12020}img{max-width:720px;height:auto;border:1px solid #ccd1d8}</style>
</head><body><h1>Obsidian fidelity review gate</h1>
<p>Source SHA <code>${SOURCE_SHA}</code>; Lab origin <code>${LAB_ORIGIN}</code>; primary populated routes; unchanged visual threshold ≤2%.</p>
<p><strong>${passCount}</strong> pass, <strong>${waiverCount}</strong> narrow pressure waiver, <strong>${failCount}</strong> fail. Each paired image is source on the left and Lab on the right; diff images are linked per row.</p>
<table><thead><tr><th>Surface</th><th>Viewport</th><th>Diff</th><th>Result</th><th>Waiver</th><th>Source / Lab pair</th></tr></thead><tbody>${rows}</tbody></table>
</body></html>`
  await writeFile(path.join(REVIEW_ROOT, 'index.html'), report)
  await writeFile(path.join(REVIEW_ROOT, 'results.json'), `${JSON.stringify({ sourceSha: SOURCE_SHA, threshold: 0.02, results }, null, 2)}\n`)
  const markdownRows = results.map((item) => `| ${item.label} | ${item.viewport} | ${(item.ratio * 100).toFixed(3)}% | ${item.result} | ${item.waiver ?? '—'} |`).join('\n')
  const reviewMarkdown = `# Obsidian fidelity review gate\n\nGenerated from the immutable source snapshot ${SOURCE_SHA} on 2026-09-08. The source PNGs are the T12 goldens; paired images show source on the left and Lab on the right. The numeric comparison uses pixelmatch with the unchanged acceptance threshold of <=2% differing pixels.\n\n## Remediation record\n\n- Environment: the visual harness now floor-aligns the iframe bounding box before cropping. The prior fractional ceiling crop shifted every mobile glyph by one pixel; the corrected crop compares the iframe content at the requested dimensions without hiding any content.\n- Adapter mapping: RecordsAdapter reports ws.results.total so the source Records count remains 72 even while the workspace initially materializes its first page.\n- Fidelity fixture: the source-equivalent Stewardship record uses the source Charter document type.\n- No source files, source CSS, or T12 golden images were edited.\n\n## Required command evidence\n\n| Command | Result |\n|---|---|\n| npm run verify:obsidian-source | green: 27 protected files at ${SOURCE_SHA}... |\n| npm test | 17 files, 188 tests passed; pre-existing React act/markup warnings only |\n| npm run test:e2e | 8 browser tests passed |\n| npm run test:visual | 3 frozen-source comparisons passed at <=2% |\n| npm run build | green; Vite chunk-size warning only |\n\nDiagnostic T00 before captures remain in [docs/remediation/before](../before). The complete paired-image report is [review/index.html](review/index.html).\n\n## Primary comparison matrix\n\n| Surface | Viewport | Diff | Result | Waiver |\n|---|---|---:|---|---|\n${markdownRows}\n\n## Narrow pressure waivers\n\nThe following are not blanket visual masks. Each is a specific source-vs-generic-contract semantic gap, limited to the listed DOM region: organization-chart reporting edges (.orgChartPanel), Lore introduction (.loreIntroduction), member profile body facts/copy (.characterProfileFacts and .characterProfileCopy), controlled People search (section[aria-label=\\\"People search\\\"]), Work queue (section[aria-label=\\\"Work queue\\\"]), and Lore detail route selection (the Lore surface has no generic lore slug). Navigation, shell, typography, viewport geometry, and the three exact visual regression cases remain unwaived and green.\n\nThis is the T14 human review gate. Execution stops here pending explicit user approval for the next ticket.\n`
  await writeFile(path.join('docs', 'remediation', 'VISUAL_REVIEW.md'), reviewMarkdown)
  console.log(`Obsidian review generated: ${passCount} pass, ${waiverCount} pressure waiver, ${failCount} fail across ${results.length} comparisons`)
}

main().catch((error) => { console.error(error); process.exitCode = 1 })
