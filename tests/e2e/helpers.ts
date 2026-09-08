import { expect, type Frame, type Locator, type Page } from '@playwright/test'

export const PREVIEW_SELECTOR = 'iframe[data-testid="preview-iframe"]'

export async function openLab(page: Page): Promise<Frame> {
  await page.goto('/?fixture=obsidian-fidelity', { waitUntil: 'networkidle' })
  await page.locator('#lab-design-select').selectOption({ label: 'Obsidian Lab' })
  await expect(page.locator('#lab-design-select')).toHaveValue('obsidian-lab')
  await expect(page.locator('nav[aria-label="Design Lab surfaces"]')).toBeVisible()
  await expect(page.locator(PREVIEW_SELECTOR)).toBeAttached()
  await expect.poll(() => page.frames().filter((frame) => frame.url().includes('/preview.html')).length).toBeGreaterThan(0)
  const frame = previewFrames(page)[0]
  await expect(frame.locator('[data-testid="preview-renderer"]')).toBeVisible()
  await settlePreview(frame)
  return frame
}

export function previewFrames(page: Page): Frame[] {
  return page.frames().filter((frame) => frame.url().includes('/preview.html'))
}

export async function settlePreview(frame: Frame): Promise<void> {
  await frame.evaluate(async () => {
    await document.fonts.ready
    await new Promise((resolve) => setTimeout(resolve, 150))
  })
}

export async function selectViewport(page: Page, label: string, width: number, height: number): Promise<void> {
  await page.getByRole('tab', { name: 'View', exact: true }).click()
  await page.locator('#lab-viewport-preset').selectOption({ label })
  await expect.poll(async () => {
    const frame = previewFrames(page)[0]
    return frame ? await frame.evaluate(() => `${window.innerWidth}x${window.innerHeight}`) : ''
  }).toBe(`${width}x${height}`)
}

export function surfaceButton(page: Page, name: string): Locator {
  return page.locator('nav[aria-label="Design Lab surfaces"] button').filter({ hasText: name }).first()
}

export async function selectSurface(page: Page, name: string): Promise<Frame> {
  await expect(surfaceButton(page, name)).toBeVisible()
  await surfaceButton(page, name).click()
  const frame = previewFrames(page)[0]
  await expect(frame.locator('[data-testid="preview-renderer"]')).toBeVisible()
  await settlePreview(frame)
  return frame
}
