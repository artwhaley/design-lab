import { expect, test } from '@playwright/test'
import { openLab, selectSurface } from './helpers'

test('Atelier stays installed across surfaces, Studio changes, and iframe reload',async({page})=>{
 const frame=await openLab(page)
 await page.locator('#lab-design-select').selectOption('atelier')
 await expect(frame.locator('[data-template="atelier"]')).toBeVisible()
 await selectSurface(page,'Records')
 await frame.getByRole('textbox',{name:'Search records'}).fill('no-such-record-portability-check')
 await expect(frame.getByText('No records match this view.')).toBeVisible()
 await selectSurface(page,'Character profile')
 await expect(frame.locator('[data-template="atelier"] h1')).toBeVisible()
 await page.getByRole('tab',{name:'Studio',exact:true}).click()
 await page.getByRole('combobox',{name:'Paper',exact:true}).selectOption('clay')
 await expect.poll(()=>frame.locator('[data-template="atelier"]').evaluate(el=>getComputedStyle(el).getPropertyValue('--atelier-paper').trim())).toBe('#e5d6c5')
 await frame.goto(frame.url())
 await expect(frame.locator('[data-template="atelier"] h1')).toBeVisible()
 await expect(page.locator('#lab-design-select')).toHaveValue('atelier')
 await expect.poll(()=>frame.locator('[data-template="atelier"]').evaluate(el=>getComputedStyle(el).getPropertyValue('--atelier-paper').trim())).toBe('#e5d6c5')
})
