/**
 * Design registry side-effect entry. Importing this module registers every
 * first-class Design (contract-probe T10, obsidian-lab T12). New Designs add
 * one import here (see ADDING_A_DESIGN.md). The host never imports Designs
 * directly — only via the registry (Guardrail 3).
 */
import './contract-probe'

export * from './registry'