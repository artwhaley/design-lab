/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))

function parityScopedName(name: string, filename: string): string {
  const normalized = filename.replaceAll('\\', '/')
  if (normalized.endsWith('/src/designs/obsidian/obsidian.module.css')) return `obsidian-module__FBweVW__${name}`
  if (normalized.endsWith('/src/components/platform/operating.module.css')) return `operating-module-scss-module__x0PMsq__${name}`
  if (normalized.endsWith('/src/components/people/PersonAccessTrees.module.css')) return `PersonAccessTrees-module-scss-module__Ff57VW__${name}`
  if (normalized.endsWith('/src/components/people/PersonWorkspace.module.css')) return `PersonWorkspace-module-scss-module__tXSYga__${name}`

  let hash = 0
  for (const character of `${normalized}:${name}`) hash = (hash * 31 + character.charCodeAt(0)) | 0
  return `_${name}_${Math.abs(hash).toString(36)}_0`
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
    globals: true,
  },
})
