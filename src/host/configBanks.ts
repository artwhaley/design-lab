/**
 * Per-Design saved config banks (A15, Bible §9). Lab-prefixed, versioned
 * localStorage only — never emulates production database persistence.
 */
export const LAB_BANK_PREFIX = 'lab.configBank.v1'

export type SavedBank = {
  version: number
  config: unknown
}

export function bankKey(designKey: string): string {
  return `${LAB_BANK_PREFIX}.${designKey}`
}

export function loadBank(designKey: string): SavedBank | null {
  try {
    const raw = localStorage.getItem(bankKey(designKey))
    if (!raw) return null
    const parsed = JSON.parse(raw) as SavedBank
    if (typeof parsed?.version !== 'number' || parsed.config === undefined) return null
    return parsed
  } catch {
    return null
  }
}

export function saveBank(designKey: string, bank: SavedBank): void {
  localStorage.setItem(bankKey(designKey), JSON.stringify(bank))
}

export function clearBank(designKey: string): void {
  localStorage.removeItem(bankKey(designKey))
}

export function clearAllBanks(): void {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith(LAB_BANK_PREFIX)) localStorage.removeItem(key)
  }
}