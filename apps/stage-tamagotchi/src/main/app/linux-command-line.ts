import type { CommandLine } from 'electron'

export const featureSwitchKey = 'enable-features'

/**
 * Normalizes Chromium feature flags.
 *
 * Before:
 * - "Vulkan,,UseOzonePlatform,Vulkan"
 *
 * After:
 * - "Vulkan,UseOzonePlatform"
 */
export function normalizeFeatureFlags(flags: string[]): string[] {
  const seen = new Set<string>()

  return flags
    .map(flag => flag.trim())
    .filter((flag) => {
      if (!flag || seen.has(flag)) {
        return false
      }

      seen.add(flag)
      return true
    })
}

/**
 * Builds Linux Chromium feature flags before Electron starts.
 *
 * Wayland needs Ozone and portal-backed shortcut support early enough that
 * later command-line rewrites, such as screen-capture initialization, preserve
 * one complete comma-separated `enable-features` switch.
 */
export function buildLinuxFeatureFlags(env: NodeJS.ProcessEnv): string[] {
  const featureFlags = ['SharedArrayBuffer', 'Vulkan']

  if (env.XDG_SESSION_TYPE?.toLowerCase() === 'wayland') {
    featureFlags.push('GlobalShortcutsPortal')
    featureFlags.push('UseOzonePlatform')
    featureFlags.push('WaylandWindowDecorations')
  }

  return featureFlags
}

/**
 * Applies Linux-only Chromium switches in the shape Electron and Chromium
 * expect before app readiness.
 */
export function applyLinuxCommandLineSwitches(
  commandLine: Pick<CommandLine, 'appendSwitch' | 'getSwitchValue' | 'hasSwitch' | 'removeSwitch'>,
  env: NodeJS.ProcessEnv,
): void {
  const existingFeatureFlags = commandLine.getSwitchValue(featureSwitchKey).split(',')
  const featureFlags = normalizeFeatureFlags([
    ...existingFeatureFlags,
    ...buildLinuxFeatureFlags(env),
  ])

  if (commandLine.hasSwitch(featureSwitchKey)) {
    commandLine.removeSwitch(featureSwitchKey)
  }

  commandLine.appendSwitch(featureSwitchKey, featureFlags.join(','))
  commandLine.appendSwitch('enable-unsafe-webgpu')
}
