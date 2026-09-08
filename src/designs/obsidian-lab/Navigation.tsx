/**
 * Obsidian Navigation — ported from obsidian-incubation HEAD
 * fc22e6c7db7da05b6166e2f126c5e6c9e6a20223 (src/Navigation.tsx), adapted to
 * the Lab DomainShellModel. The Lab contract does not supply the active
 * surface to the Shell (LabShellProps = model/runtime/children), so active
 * highlighting is omitted and recorded as an adapter note.
 */
import { useState } from 'react'
import { Dialog } from 'radix-ui'
import { Aperture, ArrowUpRight, Menu, X } from 'lucide-react'
import type { DomainShellModel } from '../../contracts'
import s from './obsidian.module.css'

export function Navigation({ model }: { model: DomainShellModel }) {
  const [open, setOpen] = useState(false)
  // Fixtures (and production) may already include Work in primaryNavigation;
  // only append the fallback link when it is absent (ProbeShell pattern).
  const items = model.primaryNavigation.some((item) => item.segment === 'work')
    ? model.primaryNavigation
    : [...model.primaryNavigation, { label: 'Work', href: model.routes.workUrl, segment: 'work' }]
  return (
    <div className={s.navigation}>
      <a href={model.routes.baseUrl} className={s.identity} aria-label={`${model.domain.name} home`}>
        <span className={s.emblem}>
          {model.domain.logoUrl ? <img src={model.domain.logoUrl} alt="" /> : <Aperture size={27} strokeWidth={1} />}
        </span>
        <span>{model.domain.name}</span>
      </a>
      <nav className={s.desktopNav} aria-label="Primary navigation">
        {items.map((item) => (
          <a key={item.segment} href={item.href}>{item.label}</a>
        ))}
      </nav>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger className={s.mobileMenu} aria-label="Open navigation"><Menu size={22} /></Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className={s.overlay} />
          <Dialog.Content className={s.navDrawer}>
            <Dialog.Title>{model.domain.name}</Dialog.Title>
            <Dialog.Description className={s.srOnly}>Domain navigation and management</Dialog.Description>
            <nav aria-label="Mobile navigation">
              {items.map((item) => (
                <a key={item.segment} href={item.href} onClick={() => setOpen(false)}>
                  {item.label}<ArrowUpRight size={19} />
                </a>
              ))}
            </nav>
            {model.managementNavigation.length > 0 && (
              <>
                <p className={s.eyebrow}>Manage domain</p>
                <nav aria-label="Mobile management">
                  {model.managementNavigation.map((item) => (
                    <a key={item.segment} href={item.href} onClick={() => setOpen(false)}>{item.label}</a>
                  ))}
                </nav>
              </>
            )}
            <Dialog.Close className={s.dialogClose} aria-label="Close navigation"><X size={22} /></Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}