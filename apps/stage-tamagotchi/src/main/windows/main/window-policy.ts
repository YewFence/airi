import type { BrowserWindow, BrowserWindowConstructorOptions } from 'electron'

export type MainWindowDisplayMode = 'special-panel' | 'ordinary-window'

function isKdeDesktop(env: NodeJS.ProcessEnv): boolean {
  return [
    env.XDG_CURRENT_DESKTOP,
    env.XDG_SESSION_DESKTOP,
    env.DESKTOP_SESSION,
  ].some(value => value?.toLowerCase().includes('kde') || value?.toLowerCase().includes('plasma'))
}

/**
 * Selects the main window display mode for the current desktop environment.
 *
 * Flatpak on KDE Wayland can hide a transparent panel-typed always-on-top
 * BrowserWindow from normal task switching. In that environment the user-facing
 * main window intentionally becomes an ordinary decorated window while overlay,
 * caption, widget, and spotlight windows keep their specialized surfaces.
 */
export function selectMainWindowDisplayMode(env: NodeJS.ProcessEnv): MainWindowDisplayMode {
  if (env.FLATPAK_ID && env.XDG_SESSION_TYPE?.toLowerCase() === 'wayland' && isKdeDesktop(env)) {
    return 'ordinary-window'
  }

  return 'special-panel'
}

/**
 * Builds BrowserWindow options for the ordinary fallback mode.
 *
 * The fallback avoids transparent frameless panel hints so KWin can expose the
 * AIRI main window as a normal Flatpak application window on KDE Wayland.
 */
export function ordinaryMainWindowConfig(): BrowserWindowConstructorOptions {
  return {
    frame: true,
    transparent: false,
    hasShadow: true,
  }
}

/**
 * Applies post-creation compositor hints for the selected main window mode.
 */
export function applyMainWindowDisplayMode(
  window: Pick<BrowserWindow, 'setAlwaysOnTop' | 'setFullScreenable' | 'setVisibleOnAllWorkspaces'>,
  mode: MainWindowDisplayMode,
): void {
  window.setFullScreenable(false)

  if (mode === 'ordinary-window') {
    return
  }

  window.setAlwaysOnTop(true, 'screen-saver', 1)
  window.setVisibleOnAllWorkspaces(true)
}
