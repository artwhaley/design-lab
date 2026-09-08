import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'

import { openLab, previewFrames, selectSurface, selectViewport, settlePreview } from '../e2e/helpers'

const GOLDEN_ROOT = path.resolve('tests', 'visual', 'goldens', 'obsidian-source', 'fc22e6c')

async function compareViewportScreenshot(page: import('@playwright/test').Page, goldenFile: string): Promise<number> {
  const iframe = page.locator('iframe[data-testid="preview-iframe"]')
  const expected = PNG.sync.read(await readFile(path.join(GOLDEN_ROOT, goldenFile)))
  const box = await iframe.boundingBox()
  expect(box).not.toBeNull()
  const actual = PNG.sync.read(await page.screenshot({
    animations: 'disabled',
    clip: { x: Math.floor(box!.x), y: Math.floor(box!.y), width: expected.width, height: expected.height },
  }))
  expect({ width: actual.width, height: actual.height }).toEqual({ width: expected.width, height: expected.height })
  const diff = new PNG({ width: expected.width, height: expected.height })
  const differingPixels = pixelmatch(expected.data, actual.data, diff.data, expected.width, expected.height, { threshold: 0.1 })
  return differingPixels / (expected.width * expected.height)
}

test.describe('Obsidian source visual fidelity @visual', () => {
  test('matches the frozen source Home at 1440x1000', async ({ page }) => {
    await page.setViewportSize({ width: 1800, height: 1200 })
    await openLab(page)
    await selectViewport(page, 'Source desktop', 1440, 1000)
    await expect.poll(() => previewFrames(page).length).toBe(1)
    await settlePreview(previewFrames(page)[0])
    const diff = await compareViewportScreenshot(page, 'desktop-1440x1000/home.png')
    expect(diff, 'Home diff exceeds the frozen-source 2% pixel budget').toBeLessThanOrEqual(0.02)
  })

  test('matches the frozen source Records at 1440x1000', async ({ page }) => {
    await page.setViewportSize({ width: 1800, height: 1200 })
    await openLab(page)
    await selectViewport(page, 'Source desktop', 1440, 1000)
    await selectSurface(page, 'Records')
    const diff = await compareViewportScreenshot(page, 'desktop-1440x1000/records.png')
    expect(diff, 'Records diff exceeds the frozen-source 2% pixel budget').toBeLessThanOrEqual(0.02)
  })

  test('matches the frozen source Document at 390x844', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 1200 })
    await openLab(page)
    await selectViewport(page, 'Phone wide', 390, 844)
    await selectSurface(page, 'Document')
    const diff = await compareViewportScreenshot(page, 'mobile-390x844/document.png')
    expect(diff, 'Document diff exceeds the frozen-source 2% pixel budget').toBeLessThanOrEqual(0.02)
  })
})
