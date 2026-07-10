import { describe, expect, it } from 'vitest'

import { applyLinuxCommandLineSwitches, buildLinuxFeatureFlags, featureSwitchKey, normalizeFeatureFlags } from './linux-command-line'

class FakeCommandLine {
  readonly values = new Map<string, string>()
  readonly appended: Array<{ key: string, value?: string }> = []
  readonly removed: string[] = []

  constructor(values?: Record<string, string>) {
    for (const [key, value] of Object.entries(values ?? {})) {
      this.values.set(key, value)
    }
  }

  appendSwitch(key: string, value?: string): void {
    this.appended.push({ key, value })
    this.values.set(key, value ?? '')
  }

  getSwitchValue(key: string): string {
    return this.values.get(key) ?? ''
  }

  hasSwitch(key: string): boolean {
    return this.values.has(key)
  }

  removeSwitch(key: string): void {
    this.removed.push(key)
    this.values.delete(key)
  }
}

describe('linux command line setup', () => {
  it('normalizes feature flags while keeping the first occurrence order', () => {
    expect(normalizeFeatureFlags([' Vulkan ', '', 'UseOzonePlatform', 'Vulkan'])).toEqual([
      'Vulkan',
      'UseOzonePlatform',
    ])
  })

  it('adds Wayland feature flags only for Wayland sessions', () => {
    expect(buildLinuxFeatureFlags({ XDG_SESSION_TYPE: 'Wayland' })).toEqual([
      'SharedArrayBuffer',
      'Vulkan',
      'GlobalShortcutsPortal',
      'UseOzonePlatform',
      'WaylandWindowDecorations',
    ])

    expect(buildLinuxFeatureFlags({ XDG_SESSION_TYPE: 'x11' })).toEqual([
      'SharedArrayBuffer',
      'Vulkan',
    ])
  })

  it('writes one complete enable-features switch for KDE Wayland Flatpak startup', () => {
    const commandLine = new FakeCommandLine({
      [featureSwitchKey]: 'ExistingFeature,Vulkan',
    })

    applyLinuxCommandLineSwitches(commandLine, { XDG_SESSION_TYPE: 'wayland' })

    expect(commandLine.removed).toEqual([featureSwitchKey])
    expect(commandLine.values.get(featureSwitchKey)).toBe('ExistingFeature,Vulkan,SharedArrayBuffer,GlobalShortcutsPortal,UseOzonePlatform,WaylandWindowDecorations')
    expect(commandLine.appended).toEqual([
      {
        key: featureSwitchKey,
        value: 'ExistingFeature,Vulkan,SharedArrayBuffer,GlobalShortcutsPortal,UseOzonePlatform,WaylandWindowDecorations',
      },
      {
        key: 'enable-unsafe-webgpu',
      },
    ])
  })
})
