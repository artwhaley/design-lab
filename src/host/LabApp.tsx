/**
 * LoreForge Design Lab host — top-level application shell.
 *
 * T01: placeholder only. The real host (Design selector, surface navigator,
 * scenario controls, config/Studio banks, viewport + compare mode) is built
 * from T06 onward. The Lab chrome is deliberately utilitarian (A19).
 */
export function LabApp() {
  return (
    <div className="lab-chrome">
      <header className="lab-toolbar">
        <h1>
          LoreForge Design Lab
          <small>contract emulator + presentation workbench</small>
        </h1>
      </header>
      <main className="lab-body">
        <div className="lab-main">
          <div className="lab-preview-frame">
            <p style={{ color: '#9aa3b2', padding: 24 }}>
              Design Lab scaffold is up. Host features arrive in T06–T09.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}