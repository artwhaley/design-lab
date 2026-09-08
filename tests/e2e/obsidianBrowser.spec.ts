import { expect, test } from '@playwright/test'

import { openLab, previewFrames, selectSurface, selectViewport } from './helpers'

test.describe('Obsidian Lab browser behavior', () => {
  test('preset widths become real iframe viewports and drive source breakpoints', async ({ page }) => {
    const frame = await openLab(page)

    await selectViewport(page, 'Source desktop', 1440, 1000)
    await expect.poll(() => frame.evaluate(() => ({ width: innerWidth, height: innerHeight }))).toEqual({ width: 1440, height: 1000 })
    const desktopDisplay = await frame.locator('[class*="desktopNav"]').evaluate((node) => getComputedStyle(node).display)

    await selectViewport(page, 'Phone wide', 390, 844)
    await expect.poll(() => frame.evaluate(() => ({ width: innerWidth, height: innerHeight }))).toEqual({ width: 390, height: 844 })
    const mobileDisplay = await frame.locator('[class*="desktopNav"]').evaluate((node) => getComputedStyle(node).display)

    expect(desktopDisplay).not.toBe(mobileDisplay)
    expect(mobileDisplay).toBe('none')
  })

  test('Radix mobile navigation portal stays inside the iframe document', async ({ page }) => {
    const frame = await openLab(page)
    await selectViewport(page, 'Phone wide', 390, 844)

    await frame.getByRole('button', { name: 'Open navigation' }).click()
    await expect(frame.getByRole('dialog')).toBeVisible()
    expect(await frame.getByRole('dialog').evaluate((node) => node.ownerDocument === document && document.body.contains(node))).toBe(true)
    expect(await page.locator('[role="dialog"]').count()).toBe(0)
  })

  test('fixed/full-width Obsidian shell elements stay within iframe bounds', async ({ page }) => {
    const frame = await openLab(page)
    await selectViewport(page, 'Phone wide', 390, 844)

    const bounds = await frame.evaluate(() => {
      const root = document.querySelector('[class*="root"]')?.getBoundingClientRect()
      const context = document.querySelector('[class*="contextBar"]')?.getBoundingClientRect()
      return { root, context, width: innerWidth }
    })
    expect(bounds.root?.left).toBeGreaterThanOrEqual(0)
    expect(bounds.root?.right).toBeLessThanOrEqual(bounds.width)
    expect(bounds.context?.left).toBeGreaterThanOrEqual(0)
    expect(bounds.context?.right).toBeLessThanOrEqual(bounds.width)
  })

  test('active navigation and internal route requests stay in the preview iframe', async ({ page }) => {
    const frame = await openLab(page)
    await selectViewport(page, 'Source desktop', 1440, 1000)

    await frame.locator('nav[aria-label="Primary navigation"] a').filter({ hasText: 'Records' }).click()
    await expect(frame.getByRole('heading', { name: 'Records.' })).toBeVisible()
    await expect(frame.locator('nav[aria-label="Primary navigation"] a[aria-current="page"]')).toHaveText('Records')

    await frame.getByRole('link', { name: 'The Northwatch Accord', exact: true }).click()
    await expect(frame.getByRole('heading', { name: 'The Northwatch Accord', exact: true })).toBeVisible()
    await expect(frame.locator('nav[aria-label="Primary navigation"] a[aria-current="page"]')).toHaveText('Records')
    expect(previewFrames(page)[0].url()).toContain('/preview.html')

    await frame.locator('nav[aria-label="Primary navigation"] a').filter({ hasText: 'Departments' }).click()
    await expect(frame.getByRole('heading', { name: /Offices of/ })).toBeVisible()
    await expect(frame.locator('nav[aria-label="Primary navigation"] a[aria-current="page"]')).toHaveText('Departments')
  })

  test('external navigation is logged while the Lab host remains loaded', async ({ page }) => {
    const frame = await openLab(page)
    await selectViewport(page, 'Source desktop', 1440, 1000)
    const previewUrl = frame.url()
    await frame.getByRole('link', { name: 'LOREFORGE', exact: true }).click()
    await expect(page).toHaveURL(/fixture=obsidian-fidelity/)
    expect(page.url()).toContain('127.0.0.1:4174')
    expect(previewFrames(page)[0].url()).toBe(previewUrl)
  })

  test('compare panes receive a folder mutation from one iframe', async ({ page }) => {
    await openLab(page)
    await selectSurface(page, 'Manage Folders')
    await page.getByRole('button', { name: 'Compare', exact: true }).click()
    await expect(page.locator('[data-testid="lab-compare"]')).toBeVisible()
    await expect.poll(() => previewFrames(page).length).toBe(2)

    const frames = previewFrames(page)
    const sourceFrame = frames[0]
    await expect(sourceFrame.getByRole('heading', { name: 'Folders', exact: true })).toBeVisible()
    await sourceFrame.getByRole('button', { name: 'New folder', exact: true }).click()
    await sourceFrame.getByRole('dialog').getByLabel('Folder name').fill('Shared collection')
    await sourceFrame.getByRole('dialog').getByRole('button', { name: 'Create', exact: true }).click()

    await expect.poll(async () => Promise.all(frames.map((candidate) => candidate.locator('text=Shared collection').count()))).toEqual([1, 1])
  })

  test('computed Obsidian fonts include Manrope and Instrument Serif', async ({ page }) => {
    const frame = await openLab(page)
    const fonts = await frame.evaluate(() => ({
      body: getComputedStyle(document.querySelector('[class*="root"]')!).fontFamily,
      heading: getComputedStyle(document.querySelector('h1')!).fontFamily,
      serif: getComputedStyle(document.querySelector('h1 em')!).fontFamily,
    }))
    expect(fonts.body).toContain('Manrope')
    expect(fonts.heading).toContain('Manrope')
    expect(fonts.serif).toContain('Instrument Serif')
  })

  test('saved Obsidian config stays in its own Design bank', async ({ page }) => {
    const frame = await openLab(page)
    await page.getByRole('tab', { name: 'Studio', exact: true }).click()
    const background = page.getByLabel('background (hex)')
    await background.fill('#123456')
    await page.getByRole('button', { name: 'Save', exact: true }).click()
    await expect(background).toHaveValue('#123456')

    const designs = await page.locator('#lab-design-select option').evaluateAll((options) => options.map((option) => ({ value: (option as HTMLOptionElement).value, label: option.textContent })))
    const other = designs.find((design) => design.label !== 'Obsidian Lab')
    expect(other).toBeTruthy()
    await page.locator('#lab-design-select').selectOption(other!.value)
    await expect(page.locator('#lab-design-select')).toHaveValue(other!.value)
    await page.locator('#lab-design-select').selectOption({ label: 'Obsidian Lab' })
    await page.getByRole('tab', { name: 'Studio', exact: true }).click()
    await expect(page.getByLabel('background (hex)')).toHaveValue('#123456')
  })
})
