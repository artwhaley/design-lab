import {describe,it,expect} from 'vitest'
import {atelierConfig,atelierDefaults,palettes,typographyPairs,validateAtelier} from '../designs/atelier/config'
describe('Atelier brand controls',()=>{
 it('accepts five readable palettes and six font pairs',()=>{
  for(const [palette,{paper,ink,accent}] of Object.entries(palettes))for(const typography of Object.keys(typographyPairs))expect(validateAtelier({...atelierDefaults,palette,paper,ink,accent,typography}).ok).toBe(true)
 })
 it('allows custom colors without blocking picker updates',()=>{expect(validateAtelier({...atelierDefaults,ink:atelierDefaults.paper}).ok).toBe(true)})
 it('migrates saved version-one settings',()=>{const r=atelierConfig.migrate(1,{paper:'clay',accent:'#924c38',typography:'classical',density:'compact',ruleWeight:2});expect(r.ok).toBe(true);if(r.ok)expect(r.value.paper).toBe('#e5d6c5')})
 it('changes spacing, body type, and dividers in the resolved tokens',()=>{
  const a=atelierConfig.resolveTheme(atelierDefaults)
  const b=atelierConfig.resolveTheme({...atelierDefaults,density:'airy',typography:'humanist',ruleWeight:3})
  expect(a.vars?.['--atelier-space']).not.toBe(b.vars?.['--atelier-space'])
  expect(a.base.bodyFont).not.toBe(b.base.bodyFont)
  expect(b.vars?.['--atelier-rule']).toBe('3px')
 })
})
