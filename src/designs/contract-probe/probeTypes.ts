/**
 * Contract Probe — production-shaped prop types (T10 conformance fixture).
 *
 * The probe implements the same portable `DesignDefinition` contract as a real
 * first-class Design (16 Class A slots, no `member`), so the conformance suite
 * exercises the identical surface set production requires. These local types
 * are probe-internal and are NOT a second Design API.
 */
import type { DesignConfigProps, DesignShellProps, DesignVariantProps } from '@/lib/design/types'
import type { ProbeConfigV1 } from './config'

export type ProbePageProps<TModel> = TModel & DesignVariantProps & DesignConfigProps<ProbeConfigV1>
export type ProbeShellProps = DesignShellProps<ProbeConfigV1>