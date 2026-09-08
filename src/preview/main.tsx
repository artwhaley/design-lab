import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../designs'
import { PreviewRuntimeApp } from './PreviewRuntimeApp'
import './preview.css'

createRoot(document.getElementById('preview-root')!).render(
  <StrictMode>
    <PreviewRuntimeApp />
  </StrictMode>,
)
