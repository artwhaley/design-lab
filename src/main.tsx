import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { LabApp } from './host/LabApp'
import './designs' // registers all first-class Designs (side effects)
import './lab.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LabApp />
  </StrictMode>,
)