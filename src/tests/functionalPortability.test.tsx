import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useFolderManagementWorkspace } from '@/components/functional/folders/useFolderManagementWorkspace'
import { usePeopleManagementWorkspace } from '@/components/functional/people/usePeopleManagementWorkspace'
import { useRoleManagementWorkspace } from '@/components/functional/roles/useRoleManagementWorkspace'
import { productionFoldersManagementModel, productionRolesManagementModel } from '../fixtures/productionModels'
import { buildScenario } from '../fixtures'
import { FakeBackend } from '../workspaces'
import { installProductionActionEmulator } from '../preview/actionApiEmulator'
import { createTypeAction, updateTypeAction, duplicateTypeAction } from '@/lib/actions/documentTypes'
import { productionDocumentTypesManagementModel } from '../fixtures/productionModels'

let uninstall: (()=>void)|undefined
afterEach(()=>{uninstall?.(); uninstall=undefined})
function setup(){const backend=new FakeBackend(buildScenario({persona:'admin',dataState:'populated'}));uninstall=installProductionActionEmulator(backend,()=>{});return backend}
describe('production-shaped interactive workspaces',()=>{
 it('round-trips document type changes and returns real created IDs',async()=>{
  const backend=setup()
  const created=await createTypeAction({domainSlug:'aster-reach',name:'Portable report',departmentId:1,templateSelection:'markdown',lifecycleStages:[{stage:'draft',enabled:true,folderId:1,readRoleIds:[1]}]})
  expect(created.ok).toBe(true)
  expect(created.typeId).toBeGreaterThan(0)
  await updateTypeAction({domainSlug:'aster-reach',typeId:created.typeId!,name:'Updated report'})
  const model=productionDocumentTypesManagementModel(backend.builder)
  expect(model.tree.types.find(type=>type.id===created.typeId)?.name).toBe('Updated report')
  expect(model.inspector.stagesByType[created.typeId!].draft?.folder).toBe(1)
  const copied=await duplicateTypeAction({domainSlug:'aster-reach',typeId:created.typeId!})
  expect(copied.typeId).toBeGreaterThan(created.typeId!)
 })
 it('searches actual projected people instead of a no-op',async()=>{
  setup()
  const {result}=renderHook(()=>usePeopleManagementWorkspace('aster-reach'))
  act(()=>result.current.handleQueryChange({target:{value:'Ilyas'}} as React.ChangeEvent<HTMLInputElement>))
  await waitFor(()=>expect(result.current.results.some(person=>person.name.includes('Ilyas'))).toBe(true))
  expect(result.current.results[0].roles.length).toBeGreaterThan(0)
  act(()=>result.current.handleQueryChange({target:{value:''}} as React.ChangeEvent<HTMLInputElement>))
  expect(result.current.results).toEqual([])
 })
 it('exposes production folder sort/search/move targets and creates a folder',async()=>{
  const backend=setup(),model=productionFoldersManagementModel(backend.builder)
  const {result}=renderHook(()=>useFolderManagementWorkspace(model))
  expect(result.current.sortedFolders.length).toBeGreaterThan(0)
  const target=model.nodes[0]
  expect(result.current.moveTargets(target).every(item=>item.node.id!==target.id)).toBe(true)
  await act(()=>result.current.createFolder('Portability folder',null))
  expect(backend.builder.universe.folders.some(folder=>folder.name==='Portability folder')).toBe(true)
 })
 it('creates nested roles and assigns multiple holders through the real hook',async()=>{
  const backend=setup(),model=productionRolesManagementModel(backend.builder)
  const parent=backend.builder.universe.roles.find(role=>model.manageableDepartmentIds.includes(role.departmentId))!
  const {result}=renderHook(()=>useRoleManagementWorkspace(model))
  await act(()=>result.current.createRole('Portability role',parent.id,null))
  const role=backend.builder.universe.roles.find(role=>role.name==='Portability role')!
  expect(role.parentRoleId).toBe(parent.id)
  const ids=backend.builder.universe.members.slice(0,2).map(member=>member.id)
  await act(()=>result.current.assignRole(role.id,ids))
  expect(backend.builder.universe.members.filter(member=>ids.includes(member.id)).every(member=>member.roleIds.includes(role.id))).toBe(true)
 })
 it('paginates records without repeating rows',async()=>{
  setup()
  const first=await (await fetch('/api/records-search?pageSize=6')).json()
  expect(first.results).toHaveLength(6)
  expect(first.nextCursor).toBeTruthy()
  const second=await (await fetch(`/api/records-search?pageSize=6&cursor=${first.nextCursor}`)).json()
  expect(second.results.every((row:{id:number})=>!first.results.some((prior:{id:number})=>prior.id===row.id))).toBe(true)
 })
 it('rejects People search for unauthorized personas',async()=>{
  const backend=new FakeBackend(buildScenario({persona:'visitor',dataState:'populated'}))
  uninstall=installProductionActionEmulator(backend,()=>{})
  expect((await fetch('/api/people-search?q=Ilyas')).status).toBe(403)
 })
})
