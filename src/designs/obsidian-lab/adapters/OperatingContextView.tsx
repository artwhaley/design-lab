import { ArrowUpRight, ChevronDown } from 'lucide-react'

import type { DomainShellModel as SourceDomainShellModel } from '../source/contracts/shell'
import { ActionMenu } from '../source/controls'
import s from '../source/obsidian.module.css'

function initials(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2)
}

export function OperatingContextView({ model }: { model: SourceDomainShellModel }) {
  const { operatingContext } = model
  const acting = operatingContext.activeCharacterId == null
    ? undefined
    : operatingContext.availableCharacters.find((character) => character.id === operatingContext.activeCharacterId)

  return (
    <div className={s.operatingContext}>
      <span className={s.contextDomain}>
        Domain <b>{model.domain.name}</b>
      </span>
      <span className={s.contextSeparator} />
      {!operatingContext.account ? (
        <button type="button">
          Sign in <ArrowUpRight size={13} />
        </button>
      ) : (
        <ActionMenu
          label="Operating context"
          trigger={(
            <>
              <span className={s.avatar}>{initials(acting?.name ?? operatingContext.account.name)}</span>
              <span>
                {acting ? <>Acting as <b>{acting.name}</b></> : <>Account <b>{operatingContext.account.name}</b></>}
              </span>
              <ChevronDown size={12} />
            </>
          )}
          items={[
            ...(acting ? [{ key: 'character', label: `${acting.name} · current character` }] : []),
            { key: 'domain', label: `${model.domain.name} · current domain` },
            { key: 'account', label: `${operatingContext.account.name} · account` },
            { key: 'dashboard', label: 'LoreForge dashboard', href: '/' },
          ]}
        />
      )}
    </div>
  )
}
