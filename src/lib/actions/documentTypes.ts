import { invokeLabAction, duplicateTypeAction as duplicate, setActiveTypeAction as setActive } from '@/lib/design/hostActionBridges'
import type { Lifecycle } from '@/lib/documents/lifecycle'
export type LifecycleStageConfigInput = { stage: Lifecycle; enabled?: boolean; allowOnCreation?: boolean; folderId?: number|null; privateDraftsAllowed?: boolean; readRoleIds?: number[]; writeRoleIds?: number[]; editOthersRoleIds?: number[]; manageRoleIds?: number[] }
export type TypeTreeActionResult = { ok:boolean; error?:string; typeId?:number; templateId?:number }
export type TypeInput = { domainSlug:string; typeId?:number|string; name?:string; description?:string|null; active?:boolean; departmentId?:number|null; typeFolderId?:number|null; templateSelection?:'blank'|'markdown'|'form'; lifecycleStages?:LifecycleStageConfigInput[] }
export async function createTypeAction(input:TypeInput & {name:string}):Promise<TypeTreeActionResult>{return invokeLabAction({kind:'saveType',args:input})}
export async function updateTypeAction(input:TypeInput & {typeId:number|string}):Promise<TypeTreeActionResult>{return invokeLabAction({kind:'saveType',args:input})}
export async function duplicateTypeAction(input:{domainSlug:string;typeId:number|string}):Promise<TypeTreeActionResult>{return duplicate({...input,typeId:Number(input.typeId)})}
export async function setActiveTypeAction(input:{domainSlug:string;typeId:number|string;active:boolean}):Promise<TypeTreeActionResult>{return setActive({...input,typeId:Number(input.typeId)})}
export async function scaffoldTypeTemplateAction(_input:{domainSlug:string;typeId:number|string;kind:'markdown'|'form'}):Promise<TypeTreeActionResult>{return {ok:false,error:'Template authoring is a shared production editor; this Lab does not create template documents.'}}
