/**
 * Obsidian-only preview environment. This module is loaded dynamically by the
 * iframe runtime so the protected reset, source CSS, and fonts never enter the
 * Lab host document or another Design's preview.
 */
import '@fontsource-variable/manrope'
import '@fontsource/instrument-serif/latin-400.css'
import '@fontsource/instrument-serif/latin-400-italic.css'
import './source/preview-reset.css'
import './source/obsidian.module.css'

export const OBSIDIAN_PREVIEW_ENVIRONMENT = 'obsidian-source-v1'
