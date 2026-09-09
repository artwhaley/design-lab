/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))

function parityScopedName(name: string, filename: string): string {
  // Next.js CSS-module naming (the production oracle's scheme):
  // `{fileBase}-module__{hash}__{localName}`. The hash segment is stripped by
  // the cross-host DOM comparator, so any deterministic hash works here; the
  // shape must match so every Design's `.module.css` — not just Obsidian's —
  // compares cleanly between hosts without per-Design pins.
  const normalized = filename.replaceAll('\\', '/')
  const fileBase = normalized.split('/').pop()?.replace(/\.module\.(css|scss)$/i, '') ?? 'design'
  let hash = 0
  for (const character of `${normalized}:${name}`) hash = (hash * 31 + character.charCodeAt(0)) | 0
  return `${fileBase}-module__${Math.abs(hash).toString(36).padStart(6, '0')}__${name}`
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src'),
      '@lab': resolve(projectRoot, 'src'),
      'next/link': resolve(projectRoot, 'src/next/link.tsx'),
      'next/navigation': resolve(projectRoot, 'src/next/navigation.ts'),
    },
  },
  css: {
    modules: {
      generateScopedName: parityScopedName,
    },
  },
  server: {
    port: 4173,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(projectRoot, 'index.html'),
        preview: resolve(projectRoot, 'preview.html'),
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['**/.design-local/**', '**/node_modules/**'],
    globals: true,
  },
})
